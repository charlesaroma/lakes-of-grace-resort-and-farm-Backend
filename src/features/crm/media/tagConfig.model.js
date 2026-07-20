import mongoose from 'mongoose';

const tagConfigSchema = new mongoose.Schema({
  tags: { type: [String], default: ['gallery', 'cottages', 'rooms', 'dining', 'spa', 'events', 'amenities'] },
}, { timestamps: true });

export const TagConfig = mongoose.model('TagConfig', tagConfigSchema);
