import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const COOKIE_NAME = 'aralna_token';
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const TOUCH_EVERY_MS = 15 * 60 * 1000;

export function signToken(user) {
  return jwt.sign({ sub: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });
}

export function setAuthCookie(res, token) {
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: WEEK_MS,
  });
}

// The role is always read from the database, never trusted from the token or the client.
// A disabled account is rejected here on its very next request.
export async function requireAuth(req, res, next) {
  const token = req.cookies[COOKIE_NAME];
  if (!token) return res.status(401).json({ message: 'Log in to continue.' });
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(payload.sub);
    if (!user || !user.isActive) {
      return res.status(401).json({ message: 'Your session is no longer valid. Log in again.' });
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

export const requireRole = (...roles) => (req, res, next) =>
  roles.includes(req.user.role)
    ? next()
    : res.status(403).json({ message: 'You do not have access to this page.' });
