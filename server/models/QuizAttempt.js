import mongoose from 'mongoose';

const submittedAnswerSchema = new mongoose.Schema(
  {
    questionId: { type: String, required: true },
    answer: { type: String, required: true, maxlength: 2000 },
    isCorrect: { type: Boolean, required: true },
  },
  { _id: false }
);

const quizAttemptSchema = new mongoose.Schema(
  {
    quiz: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz', required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    attemptNumber: { type: Number, required: true, min: 1, max: 5 },
    answers: { type: [submittedAnswerSchema], required: true },
    score: { type: Number, required: true, min: 0 },
    total: { type: Number, required: true, min: 1 },
  },
  { timestamps: true }
);

quizAttemptSchema.index({ quiz: 1, user: 1, attemptNumber: 1 }, { unique: true });
quizAttemptSchema.index({ quiz: 1, submittedAt: -1 });

export default mongoose.model('QuizAttempt', quizAttemptSchema);
