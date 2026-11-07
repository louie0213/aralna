// this file checks auth tokens and protects private routes
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const COOKIE_NAME = 'aralna_token';
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const TOUCH_EVERY_MS = 15 * 60 * 1000;

// this function signs a JWT for the logged-in user
export function signToken(user) {
  return jwt.sign(
    { sub: user.id, passwordChangedAt: user.passwordChangedAt?.getTime() || 0 },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
}

// this function sets the httpOnly auth cookie
export function setAuthCookie(res, token) {
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: WEEK_MS,
  });
}

// this middleware checks the auth cookie and loads the user
export async function requireAuth(req, res, next) {
  const token = req.cookies[COOKIE_NAME];
  if (!token) return res.status(401).json({ message: 'Log in to continue.' });
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(payload.sub).select('+passwordChangedAt');
    if (!user || !user.isActive) {
      return res.status(401).json({ message: 'Your session is no longer valid. Log in again.' });
    }
    if ((payload.passwordChangedAt || 0) !== (user.passwordChangedAt?.getTime() || 0)) {
      return res.status(401).json({ message: 'Your password changed. Log in again.' });
    }

    // Track "last active" for the dashboard, at most once every 15 minutes per user.
    if (!user.lastActiveAt || Date.now() - user.lastActiveAt.getTime() > TOUCH_EVERY_MS) {
      user.lastActiveAt = new Date();
      await User.updateOne({ _id: user._id }, { lastActiveAt: user.lastActiveAt }, { timestamps: false });
    }

    req.user = user;
    next();
  } catch {
    res.status(401).json({ message: 'Your session expired. Log in again.' });
  }
}

// this middleware checks that the user has one of the allowed roles
export const requireRole = (...roles) => (req, res, next) =>
  roles.includes(req.user.role)
    ? next()
    : res.status(403).json({ message: 'You do not have access to this page.' });

// this middleware checks that the user is the super admin
export const requireSuperAdmin = (req, res, next) =>
  req.user.role === 'admin' && req.user.isSuperAdmin
    ? next()
    : res.status(403).json({ message: 'Only the super admin can perform this action.' });
