import mongoose from 'mongoose';

// ─── Schema ───
const inquirySchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, trim: true, lowercase: true },
  phone: { type: String, trim: true },
  subject: { type: String, required: true, trim: true },
  message: { type: String, trim: true },
  status: { type: String, enum: ['New', 'Read', 'Replied', 'Closed'], default: 'New' },
}, { timestamps: true });

// ─── Export ───
export const Inquiry = mongoose.model('Inquiry', inquirySchema);
