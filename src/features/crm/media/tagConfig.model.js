import mongoose from 'mongoose';

// ─── Schema ───
const tagConfigSchema = new mongoose.Schema({
  tags: { type: [String], default: ['cottages', 'rooms', 'dining', 'activities'] },
}, { timestamps: true });

// ─── Export ───
export const TagConfig = mongoose.model('TagConfig', tagConfigSchema);
