import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { createHmac, randomInt, timingSafeEqual } from 'node:crypto';
import rateLimit from 'express-rate-limit';
import User from '../models/User.js';
import { COOKIE_NAME, signToken, setAuthCookie, requireAuth } from '../middleware/auth.js';
import { EMAIL_RE, str, validateAccount } from '../utils/validate.js';
import { sendPasswordResetEmail } from '../services/passwordResetEmail.js';

const router = Router();
// Compared against when the email is unknown, so response time does not reveal which emails exist.
const DUMMY_HASH = bcrypt.hashSync('not-a-real-password', 12);
const RESET_CODE_TTL_MS = 10 * 60 * 1000;
const RESET_CODE_COOLDOWN_MS = 60 * 1000;
const MAX_RESET_CODE_ATTEMPTS = 5;
const RESET_NOTICE = 'If an active account matches that email, follow the reset instructions sent to it. If no email arrives, check the address and try again later.';
const INVALID_RESET_NOTICE = 'That code is invalid or expired. Request a new code and try again.';

function logPasswordResetStatus(status) {
  if (process.env.NODE_ENV !== 'production') {
    console.info(`[password-reset] ${status}`);
  }
}

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many attempts. Try again in a few minutes.' },
});

const forgotPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many reset requests. Try again in a few minutes.' },
});

const resetPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many reset attempts. Try again in a few minutes.' },
});

function hashResetCode(userId, code) {
  return createHmac('sha256', process.env.JWT_SECRET)
    .update(`${userId}:${code}`)
    .digest('hex');
}

router.post('/register', limiter, async (req, res, next) => {
  try {
    const body = {
      fullName: str(req.body.fullName),
      email: str(req.body.email).toLowerCase(),
      program: str(req.body.program),
      password: typeof req.body.password === 'string' ? req.body.password : '',
    };
    const errors = validateAccount(body);
    if (Object.keys(errors).length) {
      return res.status(400).json({ message: 'Fix the highlighted fields.', errors });
    }

    const existingName = await User.exists({ fullName: body.fullName }).collation({ locale: 'en', strength: 2 });
    if (existingName) {
      return res.status(409).json({
        message: 'An account with this name already exists.',
        errors: { fullName: 'This name is already registered.' },
      });
    }

    const passwordHash = await bcrypt.hash(body.password, 12);
    // Role is fixed to "student". Public sign-up can never create an admin.
    const user = await User.create({
      fullName: body.fullName,
      email: body.email,
      program: body.program,
      passwordHash,
      role: 'student',
      lastActiveAt: new Date(),
    });

    setAuthCookie(res, signToken(user));
    res.status(201).json({ user });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({
        message: 'Account already exists.',
        errors: { email: 'This email is already registered.' },
      });
    }
    next(err);
  }
});

router.post('/login', limiter, async (req, res, next) => {
  try {
    const email = str(req.body.email).toLowerCase();
    const password = typeof req.body.password === 'string' ? req.body.password : '';

    const user = await User.findOne({ email }).select('+passwordHash +passwordChangedAt');
    const matches = await bcrypt.compare(password, user?.passwordHash || DUMMY_HASH);
    if (!user || !matches) {
      return res.status(401).json({ message: 'Incorrect email or password.' });
    }
    if (!user.isActive) {
      return res.status(403).json({ message: 'This account is disabled. Contact your administrator.' });
    }

    user.lastActiveAt = new Date();
    await User.updateOne({ _id: user._id }, { lastActiveAt: user.lastActiveAt }, { timestamps: false });

    setAuthCookie(res, signToken(user));
    res.json({ user });
  } catch (err) {
    next(err);
  }
});

router.post('/forgot-password', forgotPasswordLimiter, async (req, res, next) => {
  const email = str(req.body.email).toLowerCase();
  if (email.length > 254 || !EMAIL_RE.test(email)) return res.json({ message: RESET_NOTICE });

  try {
    const user = await User.findOne({ email, isActive: true }).select('_id');
    if (!user) {
      logPasswordResetStatus('no active account matched the submitted address');
      return res.json({ message: RESET_NOTICE });
    }

    const code = String(randomInt(100000, 1000000));
    const codeHash = hashResetCode(user._id, code);
    const now = new Date();
    const canRequestAfter = new Date(now.getTime() - RESET_CODE_COOLDOWN_MS);
    const updated = await User.findOneAndUpdate(
      {
        _id: user._id,
        isActive: true,
        $or: [
          { passwordResetRequestedAt: { $exists: false } },
          { passwordResetRequestedAt: { $lte: canRequestAfter } },
        ],
      },
      {
        $set: {
          passwordResetCodeHash: codeHash,
          passwordResetExpiresAt: new Date(now.getTime() + RESET_CODE_TTL_MS),
          passwordResetRequestedAt: now,
          passwordResetAttempts: 0,
        },
      }
    );
    if (!updated) {
      logPasswordResetStatus('reset request is still within the per-account cooldown');
      return res.json({ message: RESET_NOTICE });
    }

    try {
      const provider = await sendPasswordResetEmail(email, code);
      logPasswordResetStatus(`${provider} accepted the reset email`);
    } catch (err) {
      console.error('Password reset email delivery failed:', err.message);
      try {
        await User.updateOne(
          { _id: user._id, passwordResetCodeHash: codeHash },
          {
            $unset: {
              passwordResetCodeHash: 1,
              passwordResetExpiresAt: 1,
              passwordResetRequestedAt: 1,
              passwordResetAttempts: 1,
            },
          }
        );
      } catch (cleanupError) {
        console.error('Could not invalidate an undelivered password reset code:', cleanupError.message);
      }
      return res.status(503).json({
        message: 'Could not send the reset email right now. Check the email provider settings and try again.',
      });
    }

    // Keep the response identical whether or not this email belongs to an account.
    return res.json({ message: RESET_NOTICE });
  } catch (err) {
    next(err);
  }
});

router.post('/reset-password', resetPasswordLimiter, async (req, res, next) => {
  try {
    const email = str(req.body.email).toLowerCase();
    const code = str(req.body.code);
    const password = typeof req.body.password === 'string' ? req.body.password : '';

    if (password.length < 8 || !/[A-Za-z]/.test(password) || !/\d/.test(password)) {
      return res.status(400).json({ message: 'Use at least 8 characters with a letter and a number.' });
    }
    if (email.length > 254 || !EMAIL_RE.test(email) || !/^\d{6}$/.test(code)) {
      return res.status(400).json({ message: INVALID_RESET_NOTICE });
    }

    const user = await User.findOne({ email, isActive: true }).select(
      '+passwordResetCodeHash +passwordResetExpiresAt +passwordResetAttempts'
    );
    if (
      !user?.passwordResetCodeHash ||
      !user.passwordResetExpiresAt ||
      user.passwordResetExpiresAt.getTime() <= Date.now() ||
      (user.passwordResetAttempts || 0) >= MAX_RESET_CODE_ATTEMPTS
    ) {
      return res.status(400).json({ message: INVALID_RESET_NOTICE });
    }

    const actualHash = Buffer.from(user.passwordResetCodeHash, 'hex');
    const suppliedHash = Buffer.from(hashResetCode(user._id, code), 'hex');
    if (actualHash.length !== suppliedHash.length || !timingSafeEqual(actualHash, suppliedHash)) {
      const updated = await User.findOneAndUpdate(
        {
          _id: user._id,
          passwordResetCodeHash: user.passwordResetCodeHash,
          passwordResetAttempts: { $lt: MAX_RESET_CODE_ATTEMPTS },
        },
        { $inc: { passwordResetAttempts: 1 } },
        { new: true }
      ).select('+passwordResetAttempts');
      if (updated && updated.passwordResetAttempts >= MAX_RESET_CODE_ATTEMPTS) {
        await User.updateOne(
          { _id: user._id, passwordResetCodeHash: user.passwordResetCodeHash },
          { $unset: { passwordResetCodeHash: 1, passwordResetExpiresAt: 1 } }
        );
      }
      return res.status(400).json({ message: INVALID_RESET_NOTICE });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const changedAt = new Date();
    const result = await User.updateOne(
      {
        _id: user._id,
        passwordResetCodeHash: user.passwordResetCodeHash,
        passwordResetExpiresAt: { $gt: changedAt },
        passwordResetAttempts: { $lt: MAX_RESET_CODE_ATTEMPTS },
      },
      {
        $set: { passwordHash, passwordChangedAt: changedAt },
        $unset: {
          passwordResetCodeHash: 1,
          passwordResetExpiresAt: 1,
          passwordResetRequestedAt: 1,
          passwordResetAttempts: 1,
        },
      }
    );
    if (!result.modifiedCount) {
      return res.status(400).json({ message: INVALID_RESET_NOTICE });
    }

    res.json({ message: 'Password reset. You can now log in.' });
  } catch (err) {
    next(err);
  }
});

router.post('/logout', (req, res) => {
  res.clearCookie(COOKIE_NAME);
  res.json({ message: 'Logged out.' });
});

router.post('/presence', requireAuth, async (req, res, next) => {
  try {
    await User.updateOne(
      { _id: req.user.id, isActive: true },
      { $set: { lastSeenAt: new Date() } },
      { timestamps: false }
    );
    res.json({ message: 'Presence updated.' });
  } catch (err) {
    next(err);
  }
});

router.get('/me', requireAuth, (req, res) => res.json({ user: req.user }));

export default router;
