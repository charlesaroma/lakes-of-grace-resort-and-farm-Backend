import mongoose from 'mongoose';

const menuItemSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  category: { type: String, required: true, trim: true },
  price: { type: String, trim: true },
  status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
  description: { type: String, trim: true },
  group: { type: String, trim: true },
  sortOrder: { type: Number, default: 0 },
}, { timestamps: true });

menuItemSchema.index({ category: 1, group: 1, sortOrder: 1 });

export const MenuItem = mongoose.model('MenuItem', menuItemSchema);
