import mongoose from 'mongoose';

const menuItemSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  category: { type: String, required: true, trim: true },
  price: { type: String, required: true, trim: true },
  status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
  description: { type: String, trim: true },
}, { timestamps: true });

export const MenuItem = mongoose.model('MenuItem', menuItemSchema);
