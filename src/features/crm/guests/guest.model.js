import mongoose from 'mongoose';

// ─── Schema ───
const guestSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, trim: true, lowercase: true },
  phone: { type: String, trim: true },
  totalBookings: { type: Number, default: 0 },
  lastStay: { type: String, trim: true },
  totalSpend: { type: Number, default: 0 },
  notes: { type: String, trim: true },
}, { timestamps: true });

// ─── Export ───
export const Guest = mongoose.model('Guest', guestSchema);
