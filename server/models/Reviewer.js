import mongoose from 'mongoose';

const formulaExampleSchema = new mongoose.Schema(
  {
    formula: { type: String, required: true, trim: true, maxlength: 180 },
    workedExample: { type: String, required: true, trim: true, maxlength: 600 },
  },
  { _id: false }
);

const topicSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    bulletPoints: [{ type: String, trim: true, maxlength: 280 }],
    formulaExamples: { type: [formulaExampleSchema], default: [] },
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

const timelineEntrySchema = new mongoose.Schema(
  {
    year: { type: String, required: true, trim: true, maxlength: 20 },
    summary: { type: String, required: true, trim: true, maxlength: 300 },
  },
  { _id: false }
);

const reviewerSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    document: { type: mongoose.Schema.Types.ObjectId, ref: 'Document', required: true, index: true },
    documentName: { type: String, required: true, trim: true },
    status: { type: String, enum: ['ready', 'failed'], default: 'ready' },
    topics: { type: [topicSchema], default: [] },
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
    timeline: { type: [timelineEntrySchema], default: [] },
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