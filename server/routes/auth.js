import { Router } from 'express';
import bcrypt from 'bcryptjs';
import rateLimit from 'express-rate-limit';
import User from '../models/User.js';
import { COOKIE_NAME, signToken, setAuthCookie, requireAuth } from '../middleware/auth.js';
import { str, validateAccount } from '../utils/validate.js';

const router = Router();
// Compared against when the email is unknown, so response time does not reveal which emails exist.
const DUMMY_HASH = bcrypt.hashSync('not-a-real-password', 12);

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many attempts. Try again in a few minutes.' },
});

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

    const user = await User.findOne({ email }).select('+passwordHash');
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

router.post('/logout', (req, res) => {
  res.clearCookie(COOKIE_NAME);
  res.json({ message: 'Logged out.' });
});

router.get('/me', requireAuth, (req, res) => res.json({ user: req.user }));

export default router;
