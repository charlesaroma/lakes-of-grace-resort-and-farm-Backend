import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema({
  firstName: { type: String, required: true, trim: true },
  lastName: { type: String, required: true, trim: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  title: { type: String, default: '', trim: true },
  comment: { type: String, required: true, trim: true },
  response: { type: String, default: '', trim: true },
  status: { type: String, enum: ['Published', 'Pending', 'Rejected'], default: 'Pending' },
  showOnHomePage: { type: Boolean, default: false },
  images: [{ type: String }],
}, { timestamps: true });

reviewSchema.index({ status: 1, createdAt: -1 });
reviewSchema.index({ rating: -1 });

export const Review = mongoose.model('Review', reviewSchema);
