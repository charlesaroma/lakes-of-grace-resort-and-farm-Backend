import mongoose from 'mongoose';

const tagConfigSchema = new mongoose.Schema({
  tags: { type: [String], default: ['cottages', 'rooms', 'dining', 'activities'] },
}, { timestamps: true });

export const TagConfig = mongoose.model('TagConfig', tagConfigSchema);
