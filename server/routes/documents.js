import { Router } from 'express';
import multer from 'multer';
import fs from 'fs';
import fsp from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import mongoose from 'mongoose';
import Document from '../models/Document.js';
import { requireAuth } from '../middleware/auth.js';
import { extractText, isSupportedExtension } from '../services/extractText.js';

const router = Router();
const UPLOAD_ROOT = path.resolve('uploads');
const MAX_SIZE = 100 * 1024 * 1024; // 100MB

// Files land here only long enough to be read for text, then get deleted (see the upload route).
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(UPLOAD_ROOT, String(req.user.id));
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${Date.now()}-${crypto.randomUUID()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: MAX_SIZE },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (!isSupportedExtension(ext)) return cb(new Error('UNSUPPORTED_TYPE'));
    cb(null, true);
  },
});

router.use(requireAuth);

router.post('/upload', (req, res, next) => {
  upload.single('file')(req, res, async (err) => {
    if (err) {
      const message =
        err.message === 'UNSUPPORTED_TYPE'
          ? 'That file type is not supported. Use PDF, DOCX, PPTX, TXT, PNG, JPG or WEBP.'
          : err.code === 'LIMIT_FILE_SIZE'
          ? 'That file is larger than the 100MB limit.'
          : 'Upload failed. Try again.';
      return res.status(400).json({ message });
    }
    if (!req.file) return res.status(400).json({ message: 'Choose a file to upload.' });

    const ext = path.extname(req.file.originalname).toLowerCase();
    const doc = new Document({
      user: req.user.id,
      originalName: req.file.originalname,
      extension: ext,
      sizeBytes: req.file.size,
    });

    try {
      const text = await extractText(req.file.path, ext);
      doc.extractedText = text;
      doc.charCount = text.length;
      if (!text) {
        doc.status = 'failed';
        doc.error = 'No readable text was found in this file.';
      }
    } catch {
      doc.status = 'failed';
      doc.error = 'Could not read this file. It may be corrupted, password protected, or a scanned PDF with no text layer.';
    } finally {
      await fsp.unlink(req.file.path).catch(() => {});
    }

    try {
      await doc.save();
      res.status(201).json({ document: doc });
    } catch (saveErr) {
      next(saveErr);
    }
  });
});

router.get('/', async (req, res, next) => {
  try {
    const docs = await Document.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.json({ documents: docs });
  } catch (err) {
    next(err);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid document ID.' });
    const doc = await Document.findOne({ _id: req.params.id, user: req.user.id });
    if (!doc) return res.status(404).json({ message: 'Document not found.' });
    res.json({ document: doc });
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid document ID.' });
    const doc = await Document.findOneAndDelete({ _id: req.params.id, user: req.user.id });
    if (!doc) return res.status(404).json({ message: 'Document not found.' });
    res.json({ message: 'Document deleted.' });
  } catch (err) {
    next(err);
  }
});

export default router;
