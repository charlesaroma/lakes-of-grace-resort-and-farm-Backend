import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ['staff', 'admin', 'manager', 'system_developer'], default: 'staff' },
  lastLogin: { type: Date },
}, { timestamps: true });

export const User = mongoose.model('User', userSchema);
