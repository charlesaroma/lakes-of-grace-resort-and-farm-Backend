import mongoose from 'mongoose';

const leadSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  imageUrl: { type: String },
  status: { type: String, enum: ['new', 'contacted', 'converted'], default: 'new' },
}, { timestamps: true });

export const Lead = mongoose.model('Lead', leadSchema);
