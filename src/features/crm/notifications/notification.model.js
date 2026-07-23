import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  message: { type: String, required: true, trim: true },
  type: { type: String, enum: ['Info', 'Success', 'Warning', 'Error'], default: 'Info' },
  category: { type: String, enum: ['Booking', 'Review', 'CheckIn', 'Stock', 'System', 'General'], default: 'General' },
  link: { type: String, default: '' },
  isRead: { type: Boolean, default: false },
  expiresAt: { type: Date, default: null },
}, { timestamps: true });

notificationSchema.index({ createdAt: -1 });
notificationSchema.index({ isRead: 1, createdAt: -1 });
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const Notification = mongoose.model('Notification', notificationSchema);
