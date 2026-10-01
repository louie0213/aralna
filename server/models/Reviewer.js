import mongoose from 'mongoose';

const flashcardSchema = new mongoose.Schema(
  {
    question: { type: String, required: true, trim: true, maxlength: 300 },
    answer: { type: String, required: true, trim: true, maxlength: 500 },
  },
  { _id: false }
);

// One reviewer per generation run on a document. A student can regenerate, which creates a new row.
const reviewerSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    document: { type: mongoose.Schema.Types.ObjectId, ref: 'Document', required: true, index: true },
    documentName: { type: String, required: true, trim: true },
    status: { type: String, enum: ['ready', 'failed'], default: 'ready' },
    summary: { type: String, default: '' },
    primaryTopics: { type: [String], default: [] },
    minorTopics: { type: [String], default: [] },
    funFacts: { type: [String], default: [] },
    flashcards: { type: [flashcardSchema], default: [] },
    error: { type: String },
  },
  { timestamps: true }
);

reviewerSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

export default mongoose.model('Reviewer', reviewerSchema);
