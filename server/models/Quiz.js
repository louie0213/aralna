import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ['multiple-choice', 'identification', 'true-false'], required: true },
    prompt: { type: String, required: true, trim: true, maxlength: 500 },
    choices: [{ type: String, trim: true, maxlength: 200 }],
    answer: { type: String, required: true, trim: true, maxlength: 200, select: false },
  },
  { _id: true }
);

const quizSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, trim: true, maxlength: 600, default: '' },
    questions: {
      type: [questionSchema],
      required: true,
      validate: { validator: (questions) => questions.length > 0 && questions.length <= 50 },
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    sourceReviewer: { type: mongoose.Schema.Types.ObjectId, ref: 'Reviewer' },
    audience: { type: String, enum: ['assigned', 'reviewer'], default: 'assigned', index: true },
    assignmentMode: { type: String, enum: ['all', 'selected'], default: 'all' },
    assignedTo: { type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], default: [] },
  },
  { timestamps: true }
);

quizSchema.index({ sourceReviewer: 1 }, { unique: true, sparse: true });

quizSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

export default mongoose.model('Quiz', quizSchema);
