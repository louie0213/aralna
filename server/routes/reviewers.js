import { Router } from 'express';
import mongoose from 'mongoose';
import Document from '../models/Document.js';
import Reviewer from '../models/Reviewer.js';
import { requireAuth } from '../middleware/auth.js';
import { generateReviewer } from '../services/reviewerAI.js';
import { recordGeneration } from '../services/generations.js';

const router = Router();
router.use(requireAuth);

router.post('/generate', async (req, res, next) => {
  try {
    const { documentId } = req.body;
    if (!mongoose.isValidObjectId(documentId)) return res.status(400).json({ message: 'Choose a document to generate from.' });

    const document = await Document.findOne({ _id: documentId, user: req.user.id });
    if (!document) return res.status(404).json({ message: 'Document not found.' });
    if (document.status !== 'ready') return res.status(400).json({ message: 'This document has no readable text to work with.' });

    const reviewer = new Reviewer({ user: req.user.id, document: document.id, documentName: document.originalName });

    try {
      const result = await generateReviewer(document.extractedText, document.originalName);
      Object.assign(reviewer, result);
      reviewer.status = 'ready';
    } catch (aiErr) {
      reviewer.status = 'failed';
      reviewer.error = aiErr.message || 'Could not generate a reviewer for this document.';
    }

    await reviewer.save();

    // Feeds the admin dashboard's "quizzes generated" / "most generated topics" numbers.
    // Never let a logging failure break the response the student is waiting on.
    if (reviewer.status === 'ready') {
      const topic = reviewer.primaryTopics[0] || document.originalName;
      await recordGeneration({ userId: req.user.id, type: 'summary', topic }).catch(() => {});
      if (reviewer.flashcards.length) {
        await recordGeneration({ userId: req.user.id, type: 'flashcards', topic }).catch(() => {});
      }
    }

    res.status(201).json({ reviewer });
  } catch (err) {
    next(err);
  }
});

router.get('/', async (req, res, next) => {
  try {
    const filter = { user: req.user.id };
    if (mongoose.isValidObjectId(req.query.documentId)) filter.document = req.query.documentId;
    const reviewers = await Reviewer.find(filter).sort({ createdAt: -1 });
    res.json({ reviewers });
  } catch (err) {
    next(err);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid reviewer ID.' });
    const reviewer = await Reviewer.findOne({ _id: req.params.id, user: req.user.id });
    if (!reviewer) return res.status(404).json({ message: 'Reviewer not found.' });
    res.json({ reviewer });
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid reviewer ID.' });
    const reviewer = await Reviewer.findOneAndDelete({ _id: req.params.id, user: req.user.id });
    if (!reviewer) return res.status(404).json({ message: 'Reviewer not found.' });
    res.json({ message: 'Reviewer deleted.' });
  } catch (err) {
    next(err);
  }
});

export default router;
