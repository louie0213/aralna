import { Router } from 'express';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import User from '../models/User.js';
import Generation from '../models/Generation.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { str, validateAccount } from '../utils/validate.js';

const router = Router();
router.use(requireAuth, requireRole('admin'));

const DAY_MS = 24 * 60 * 60 * 1000;
const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Dashboard numbers. "Active student" = enabled account that used the app in the last 7 days.
router.get('/stats', async (req, res, next) => {
  try {
    const weekAgo = new Date(Date.now() - 7 * DAY_MS);
    const [students, admins, disabled, activeStudents, total, quizzes, quizzesLast7Days, topTopics] =
      await Promise.all([
        User.countDocuments({ role: 'student' }),
        User.countDocuments({ role: 'admin' }),
        User.countDocuments({ isActive: false }),
        User.countDocuments({ role: 'student', isActive: true, lastActiveAt: { $gte: weekAgo } }),
        Generation.countDocuments(),
        Generation.countDocuments({ type: 'quiz' }),
        Generation.countDocuments({ type: 'quiz', createdAt: { $gte: weekAgo } }),
        Generation.aggregate([
          { $group: { _id: '$topicKey', topic: { $first: '$topic' }, count: { $sum: 1 } } },
          { $sort: { count: -1, _id: 1 } },
          { $limit: 5 },
          { $project: { _id: 0, topic: 1, count: 1 } },
        ]),
      ]);

    res.json({
      users: { students, admins, disabled, activeStudents },
      generations: { total, quizzes, quizzesLast7Days },
      topTopics,
    });
  } catch (err) {
    next(err);
  }
});

router.get('/users', async (req, res, next) => {
  try {
    const filter = {};
    if (['student', 'admin'].includes(req.query.role)) filter.role = req.query.role;
    if (['active', 'disabled'].includes(req.query.status)) filter.isActive = req.query.status === 'active';
    const q = str(req.query.q);
    if (q) {
      const rx = new RegExp(escapeRegex(q), 'i');
      filter.$or = [{ fullName: rx }, { email: rx }];
    }
    const users = await User.find(filter).sort({ createdAt: -1 });
    res.json({ users });
  } catch (err) {
    next(err);
  }
});

router.patch('/users/:id/active', async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) return res.status(400).json({ message: 'Invalid user ID.' });
    if (typeof req.body.isActive !== 'boolean') {
      return res.status(400).json({ message: 'isActive must be true or false.' });
    }
    if (id === req.user.id) {
      return res.status(400).json({ message: 'You cannot disable your own account.' });
    }
    const user = await User.findByIdAndUpdate(id, { isActive: req.body.isActive }, { new: true });
    if (!user) return res.status(404).json({ message: 'User not found.' });
    res.json({ user });
  } catch (err) {
    next(err);
  }
});

// An existing admin creates another admin. This is the only way to make one besides the seed script.
router.post('/admins', async (req, res, next) => {
  try {
    const body = {
      fullName: str(req.body.fullName),
      email: str(req.body.email).toLowerCase(),
      password: typeof req.body.password === 'string' ? req.body.password : '',
    };
    const errors = validateAccount(body);
    if (Object.keys(errors).length) {
      return res.status(400).json({ message: 'Fix the highlighted fields.', errors });
    }
    const passwordHash = await bcrypt.hash(body.password, 12);
    const user = await User.create({ fullName: body.fullName, email: body.email, passwordHash, role: 'admin' });
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

export default router;
