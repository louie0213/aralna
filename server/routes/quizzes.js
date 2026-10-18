import { Router } from 'express';
import { randomInt, randomUUID } from 'node:crypto';
import fs from 'fs';
import fsp from 'fs/promises';
import mongoose from 'mongoose';
import multer from 'multer';
import os from 'node:os';
import path from 'node:path';
import Quiz from '../models/Quiz.js';
import QuizAttempt from '../models/QuizAttempt.js';
import User from '../models/User.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { str } from '../utils/validate.js';
import { extractText, isSupportedExtension } from '../services/extractText.js';
import { generateQuizQuestions } from '../services/practiceQuizAI.js';

const router = Router();
const MAX_ATTEMPTS = 5;
const MAX_UPLOAD_SIZE = 100 * 1024 * 1024;
const QUESTION_TYPES = ['multiple-choice', 'identification', 'true-false'];
const QUIZ_SOURCE_DIR = path.join(os.tmpdir(), 'aralna-quiz-sources');
fs.mkdirSync(QUIZ_SOURCE_DIR, { recursive: true });
const quizSourceUpload = multer({
  storage: multer.diskStorage({
    destination: QUIZ_SOURCE_DIR,
    filename: (req, file, callback) => callback(null, `${randomUUID()}${path.extname(file.originalname).toLowerCase()}`),
  }),
  limits: { fileSize: MAX_UPLOAD_SIZE },
  fileFilter: (req, file, callback) => {
    const extension = path.extname(file.originalname).toLowerCase();
    if (!isSupportedExtension(extension)) return callback(new Error('UNSUPPORTED_TYPE'));
    callback(null, true);
  },
});
router.use(requireAuth);

function uploadQuizSource(req, res, next) {
  quizSourceUpload.single('file')(req, res, (err) => {
    if (!err) return next();
    const message = err.message === 'UNSUPPORTED_TYPE'
      ? 'That file type is not supported. Use PDF, DOCX, PPTX, TXT, PNG, JPG or WEBP.'
      : err.code === 'LIMIT_FILE_SIZE'
        ? 'That file is larger than the 100MB limit.'
        : 'Could not upload the quiz source file.';
    res.status(400).json({ message });
  });
}

function studentQuizFilter(userId) {
  return {
    $or: [
      {
        audience: 'assigned',
        $or: [
          { assignmentMode: 'all' },
          { assignmentMode: { $exists: false } },
        ],
      },
      { audience: 'assigned', assignmentMode: 'selected', assignedTo: userId },
      { audience: { $exists: false } },
      { audience: 'reviewer', owner: userId },
    ],
  };
}

function cleanQuestions(input) {
  if (!Array.isArray(input) || input.length < 1 || input.length > 50) return null;
  const questions = [];
  for (const item of input) {
    const type = str(item?.type);
    const prompt = str(item?.prompt);
    const answer = item?.answer;
    if (!QUESTION_TYPES.includes(type) || !prompt || prompt.length > 500) return null;

    if (type === 'multiple-choice') {
      if (!Array.isArray(item.choices) || item.choices.length < 2 || item.choices.length > 6) return null;
      const choices = item.choices.map(str);
      if (choices.some((choice) => !choice || choice.length > 200)) return null;
      if (new Set(choices.map((choice) => choice.toLowerCase())).size !== choices.length) return null;
      if (typeof answer !== 'string' || !choices.includes(answer)) return null;
      questions.push({ type, prompt, choices, answer });
    } else if (type === 'identification') {
      if (typeof answer !== 'string' || !str(answer) || answer.length > 200) return null;
      questions.push({ type, prompt, choices: [], answer: str(answer) });
    } else {
      if (answer !== true && answer !== false) return null;
      questions.push({ type, prompt, choices: [], answer: String(answer) });
    }
  }
  return questions;
}

function publicQuestions(quiz) {
  const questions = quiz.questions.map((question) => ({
    id: question.id,
    type: question.type,
    prompt: question.prompt,
    choices: shuffle(question.choices),
  }));
  return shuffle(questions);
}

function shuffle(items) {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = randomInt(index + 1);
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }
  return result;
}

function normalizeAnswer(value) {
  return value.trim().replace(/\s+/g, ' ').toLowerCase();
}

router.get('/', async (req, res, next) => {
  try {
      if (req.user.role === 'admin') {
      const [quizzes, assignedStudents, attemptCounts] = await Promise.all([
        Quiz.find({ audience: 'assigned' }).select('title description questions createdBy createdAt assignmentMode assignedTo').populate('createdBy', 'fullName').sort({ createdAt: -1 }),
        User.countDocuments({ role: 'student', isActive: true }),
        QuizAttempt.aggregate([{ $group: { _id: '$quiz', count: { $sum: 1 } } }]),
      ]);
      const countByQuiz = new Map(attemptCounts.map(({ _id, count }) => [String(_id), count]));
      return res.json({
        quizzes: quizzes.map((quiz) => ({
          id: quiz.id,
          title: quiz.title,
          description: quiz.description,
          questionCount: quiz.questions.length,
          createdBy: quiz.createdBy?.fullName || '',
          createdAt: quiz.createdAt,
          assignedStudents: quiz.assignmentMode === 'selected' ? quiz.assignedTo.length : assignedStudents,
          attemptsCount: countByQuiz.get(String(quiz._id)) || 0,
        })),
      });
    }

    const [quizzes, attempts] = await Promise.all([
      Quiz.find(studentQuizFilter(req.user.id))
        .select('title description questions createdAt audience sourceReviewer assignmentMode assignedTo')
        .sort({ createdAt: -1 }),
      QuizAttempt.find({ user: req.user.id })
        .select('quiz attemptNumber score total createdAt')
        .sort({ attemptNumber: -1 }),
    ]);
    const attemptsByQuiz = new Map();
    for (const attempt of attempts) {
      const key = String(attempt.quiz);
      if (!attemptsByQuiz.has(key)) attemptsByQuiz.set(key, []);
      attemptsByQuiz.get(key).push({
        attemptNumber: attempt.attemptNumber,
        score: attempt.score,
        total: attempt.total,
        createdAt: attempt.createdAt,
      });
    }
    res.json({
      quizzes: quizzes.map((quiz) => {
        const quizAttempts = attemptsByQuiz.get(String(quiz._id)) || [];
        return {
          id: quiz.id,
          title: quiz.title,
          description: quiz.description,
          questionCount: quiz.questions.length,
          createdAt: quiz.createdAt,
          audience: quiz.audience || 'assigned',
          sourceReviewer: quiz.sourceReviewer,
          assignmentMode: quiz.assignmentMode || 'all',
          assignedStudents: quiz.assignmentMode === 'selected' ? quiz.assignedTo.length : undefined,
          attempts: quizAttempts,
          remainingAttempts: MAX_ATTEMPTS - quizAttempts.length,
        };
      }),
    });
  } catch (err) {
    next(err);
  }
});

router.post('/', requireRole('admin'), async (req, res, next) => {
  try {
    const title = str(req.body.title);
    const description = str(req.body.description);
    const questions = cleanQuestions(req.body.questions);
    if (req.body.assignmentMode !== undefined && !['all', 'selected'].includes(req.body.assignmentMode)) {
      return res.status(400).json({ message: 'Choose all active students or specific students for this quiz.' });
    }
    const assignmentMode = req.body.assignmentMode || 'all';
    const rawAssignedTo = req.body.assignedTo;
    if (!title || title.length > 120 || description.length > 600 || !questions) {
      return res.status(400).json({ message: 'Add a valid title and description, then check each question and answer.' });
    }

    let assignedTo = [];
    if (assignmentMode === 'selected') {
      if (!Array.isArray(rawAssignedTo) || rawAssignedTo.length === 0
        || rawAssignedTo.some((id) => !mongoose.isValidObjectId(id))) {
        return res.status(400).json({ message: 'Select at least one active student for this quiz.' });
      }
      assignedTo = [...new Set(rawAssignedTo.map(String))];
      const activeStudentCount = await User.countDocuments({
        _id: { $in: assignedTo },
        role: 'student',
        isActive: true,
      });
      if (activeStudentCount !== assignedTo.length) {
        return res.status(400).json({ message: 'One or more selected students are no longer active. Refresh the list and try again.' });
      }
    }

    const quiz = await Quiz.create({
      title,
      description,
      questions,
      createdBy: req.user.id,
      assignmentMode,
      assignedTo,
    });
    res.status(201).json({
      quiz: {
        id: quiz.id,
        title: quiz.title,
        description: quiz.description,
        questionCount: quiz.questions.length,
        createdAt: quiz.createdAt,
      },
    });
  } catch (err) {
    next(err);
  }
});

router.post('/generate-from-file', requireRole('admin'), uploadQuizSource, async (req, res, next) => {
  if (!req.file) return res.status(400).json({ message: 'Choose a source file to generate quiz questions.' });
  const questionCount = Number(req.body.questionCount);
  if (!Number.isSafeInteger(questionCount) || questionCount < 1 || questionCount > 50) {
    await fsp.unlink(req.file.path).catch((err) => console.error('Could not remove quiz source file:', err.message));
    return res.status(400).json({ message: 'Choose a question count from 1 to 50.' });
  }

  try {
    const extension = path.extname(req.file.originalname).toLowerCase();
    let text;
    try {
      text = await extractText(req.file.path, extension);
    } catch {
      return res.status(400).json({ message: 'Could not read this file. It may be corrupted, password protected, or contain text the extractor could not recognize.' });
    }
    if (!text.trim()) return res.status(400).json({ message: 'No readable text was found in this file.' });

    const questions = await generateQuizQuestions(text, req.file.originalname, questionCount);
    res.json({
      title: `${path.basename(req.file.originalname, extension).slice(0, 100)} Quiz`,
      questions,
    });
  } catch (err) {
    next(err);
  } finally {
    await fsp.unlink(req.file.path).catch((err) => console.error('Could not remove quiz source file:', err.message));
  }
});

router.get('/:id/results', requireRole('admin'), async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid quiz ID.' });
    const [quiz, attempts] = await Promise.all([
      Quiz.findOne({ _id: req.params.id, audience: { $in: ['assigned', null] } }).select('title questions'),
      QuizAttempt.find({ quiz: req.params.id })
        .populate('user', 'fullName email')
        .sort({ createdAt: -1, attemptNumber: 1 }),
    ]);
    if (!quiz) return res.status(404).json({ message: 'Quiz not found.' });
    res.json({
      quiz: { id: quiz.id, title: quiz.title },
      attempts: attempts.map((attempt) => ({
        id: attempt.id,
        student: attempt.user ? { fullName: attempt.user.fullName, email: attempt.user.email } : null,
        attemptNumber: attempt.attemptNumber,
        score: attempt.score,
        total: attempt.total,
        createdAt: attempt.createdAt,
      })),
    });
  } catch (err) {
    next(err);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid quiz ID.' });
    const quizFilter = req.user.role === 'admin'
      ? { _id: req.params.id, $or: [{ audience: 'assigned' }, { audience: { $exists: false } }] }
      : { _id: req.params.id, ...studentQuizFilter(req.user.id) };
    const quiz = await Quiz.findOne(quizFilter).select('title description questions createdAt');
    if (!quiz) return res.status(404).json({ message: 'Quiz not found.' });
    const attempts = await QuizAttempt.find({ quiz: quiz.id, user: req.user.id })
      .select('attemptNumber score total createdAt')
      .sort({ attemptNumber: 1 });
    res.json({
      quiz: {
        id: quiz.id,
        title: quiz.title,
        description: quiz.description,
        questions: publicQuestions(quiz),
        createdAt: quiz.createdAt,
      },
      attempts,
      remainingAttempts: MAX_ATTEMPTS - attempts.length,
    });
  } catch (err) {
    next(err);
  }
});

router.post('/:id/attempts', requireRole('student'), async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid quiz ID.' });
    const quiz = await Quiz.findOne({ _id: req.params.id, ...studentQuizFilter(req.user.id) }).select('+questions.answer');
    if (!quiz) return res.status(404).json({ message: 'Quiz not found.' });
    if (!Array.isArray(req.body.answers) || req.body.answers.length !== quiz.questions.length) {
      return res.status(400).json({ message: 'Answer every question before submitting.' });
    }

    const submittedById = new Map();
    for (const item of req.body.answers) {
      if (!item || typeof item.questionId !== 'string' || typeof item.answer !== 'string') {
        return res.status(400).json({ message: 'One or more answers are invalid.' });
      }
      if (item.answer.length > 2000 || !item.answer.trim() || submittedById.has(item.questionId)) {
        return res.status(400).json({ message: 'One or more answers are invalid.' });
      }
      submittedById.set(item.questionId, item.answer.trim());
    }

    let score = 0;
    const answers = [];
    for (const question of quiz.questions) {
      const questionId = String(question._id);
      if (!submittedById.has(questionId)) return res.status(400).json({ message: 'One or more answers are invalid.' });
      const answer = submittedById.get(questionId);
      const isCorrect = question.type === 'identification'
        ? normalizeAnswer(answer) === normalizeAnswer(question.answer)
        : question.type === 'true-false'
          ? normalizeAnswer(answer) === question.answer
          : answer === question.answer;
      if (isCorrect) score += 1;
      answers.push({ questionId, answer, isCorrect });
    }

    const attemptNumber = (await QuizAttempt.countDocuments({ quiz: quiz.id, user: req.user.id })) + 1;
    if (attemptNumber > MAX_ATTEMPTS) {
      return res.status(409).json({ message: 'You have used all 5 attempts for this quiz.' });
    }
    const attempt = await QuizAttempt.create({
      quiz: quiz.id,
      user: req.user.id,
      attemptNumber,
      answers,
      score,
      total: quiz.questions.length,
    });
    res.status(201).json({
      attempt: { id: attempt.id, attemptNumber, score, total: attempt.total, createdAt: attempt.createdAt },
      remainingAttempts: MAX_ATTEMPTS - attemptNumber,
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: 'Another attempt was submitted at the same time. Refresh and try again.' });
    }
    next(err);
  }
});

export default router;
