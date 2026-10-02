import mongoose from 'mongoose';

const flashcardSchema = new mongoose.Schema(
  {
    question: { type: String, required: true, trim: true, maxlength: 300 },
    answer: { type: String, required: true, trim: true, maxlength: 500 },
  },
  { _id: false }
);

const keyTermSchema = new mongoose.Schema(
  {
    term: { type: String, required: true, trim: true, maxlength: 100 },
    definition: { type: String, required: true, trim: true, maxlength: 400 },
  },
  { _id: false }
);

const reviewerSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    document: { type: mongoose.Schema.Types.ObjectId, ref: 'Document', required: true, index: true },
    documentName: { type: String, required: true, trim: true },
    status: { type: String, enum: ['ready', 'failed'], default: 'ready' },
    overview: { type: String, default: '' },
    learningObjectives: { type: [String], default: [] },
    keyTakeaways: { type: [String], default: [] },
    importantTopics: { type: [String], default: [] },
    minorTopics: { type: [String], default: [] },
    keyTerms: { type: [keyTermSchema], default: [] },
    conceptRelationships: { type: [String], default: [] },
    examples: { type: [String], default: [] },
    commonMisconceptions: { type: [String], default: [] },
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