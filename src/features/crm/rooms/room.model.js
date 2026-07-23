import mongoose from 'mongoose';

const roomSchema = new mongoose.Schema({
  roomNumber: { type: String, required: true, unique: true, trim: true },
  roomType: { type: String, required: true, enum: ['Standard', 'Deluxe', 'Premium'] },
  status: { type: String, enum: ['Available', 'Booked', 'Maintenance', 'Cleaning'], default: 'Available' },
  pricePerNight: { type: Number, required: true, min: 0 },
  capacity: { type: Number, required: true, min: 1 },
  description: { type: String, default: '' },
  amenities: [{ type: String }],
  images: [{ type: String }],
}, { timestamps: true });

roomSchema.index({ roomType: 1, status: 1 });

export const Room = mongoose.model('Room', roomSchema);
