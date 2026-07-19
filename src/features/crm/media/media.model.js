import mongoose from 'mongoose';

const mediaSchema = new mongoose.Schema({
  url: { type: String, required: true, trim: true },
  fileId: { type: String, trim: true },
  tag: { type: String, default: 'gallery', trim: true },
  size: { type: String, trim: true },
  alt: { type: String, trim: true },
}, { timestamps: true });

export const Media = mongoose.model('Media', mediaSchema);
