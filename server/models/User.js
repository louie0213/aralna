import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true, maxlength: 100 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    program: { type: String, trim: true, maxlength: 100 },
    profilePicture: { type: String, select: false, maxlength: 400_000 },
    passwordHash: { type: String, required: true, select: false },
    passwordResetCodeHash: { type: String, select: false },
    passwordResetExpiresAt: { type: Date, select: false },
    passwordResetRequestedAt: { type: Date, select: false },
    passwordResetAttempts: { type: Number, default: 0, select: false },
    passwordChangedAt: { type: Date, select: false },
    role: { type: String, enum: ['student', 'admin'], default: 'student' },
    isSuperAdmin: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    lastActiveAt: { type: Date },
    lastSeenAt: { type: Date },
    hiddenQuizIds: { type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Quiz' }], default: [], select: false },
  },
  { timestamps: true }
);

userSchema.index({ isActive: 1, lastSeenAt: 1 });

userSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    delete ret.passwordHash;
    delete ret.passwordResetCodeHash;
    delete ret.passwordResetExpiresAt;
    delete ret.passwordResetRequestedAt;
    delete ret.passwordResetAttempts;
    delete ret.passwordChangedAt;
    delete ret.hiddenQuizIds;
    delete ret.__v;
    return ret;
  },
});

export default mongoose.model('User', userSchema);
