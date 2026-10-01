import mongoose from 'mongoose';

// The raw upload is deleted from disk right after text extraction (see routes/documents.js).
// Only the extracted text and metadata are kept, never the binary file.
const documentSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    originalName: { type: String, required: true, trim: true, maxlength: 200 },
    extension: { type: String, required: true },
    sizeBytes: { type: Number, required: true },
    status: { type: String, enum: ['ready', 'failed'], default: 'ready' },
    extractedText: { type: String, default: '' },
    charCount: { type: Number, default: 0 },
    error: { type: String },
  },
  { timestamps: true }
);

documentSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

export default mongoose.model('Document', documentSchema);
