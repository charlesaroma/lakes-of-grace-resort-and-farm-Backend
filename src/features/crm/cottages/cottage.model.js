import mongoose from 'mongoose';

const cottageSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, trim: true },
  label: { type: String, required: true, trim: true },
  capacity: { type: Number, required: true, min: 1 },
  pricePerNight: { type: Number, required: true, min: 0 },
  description: { type: String, default: '' },
}, { timestamps: true });

export const Cottage = mongoose.model('Cottage', cottageSchema);
