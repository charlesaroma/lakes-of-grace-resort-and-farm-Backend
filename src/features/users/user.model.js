import mongoose from 'mongoose';

const VALID_ROLES = ['staff', 'admin', 'manager', 'system_developer'];

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: VALID_ROLES, default: 'staff' },
  lastLogin: { type: Date },
}, { timestamps: true });

userSchema.pre('save', function (next) {
  if (typeof this.role === 'string' && !VALID_ROLES.includes(this.role)) {
    this.role = this.role.toLowerCase().replace(/\s+/g, '_');
  }
  next();
});

export const User = mongoose.model('User', userSchema);
