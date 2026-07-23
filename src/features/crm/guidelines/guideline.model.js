import mongoose from 'mongoose';

const guidelineSchema = new mongoose.Schema({
  category: { type: String, required: true, trim: true },
  title: { type: String, required: true, trim: true },
  description: { type: String, required: true, trim: true },
  icon: { type: String, default: '' },
  sortOrder: { type: Number, default: 0 },
}, { timestamps: true });

guidelineSchema.index({ category: 1, sortOrder: 1 });

export const Guideline = mongoose.model('Guideline', guidelineSchema);
