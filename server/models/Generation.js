import mongoose from 'mongoose';

export const GENERATION_TYPES = ['quiz', 'flashcards', 'summary'];

// One row per successful AI generation. The admin dashboard counts and groups these.
const generationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: { type: String, enum: GENERATION_TYPES, required: true, default: 'quiz' },
    topic: { type: String, required: true, trim: true, maxlength: 120 },
    // Lowercase copy of the topic, so "Data Structures" and "data  structures" count as one.
    topicKey: { type: String, required: true },
  },
  { timestamps: true }
);

generationSchema.index({ type: 1, createdAt: -1 });
generationSchema.index({ topicKey: 1 });

export default mongoose.model('Generation', generationSchema);
