import mongoose from 'mongoose';

const conferenceHallSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, trim: true },
  capacity: { type: Number, required: true, min: 1 },
  description: { type: String, default: '' },
  amenities: [{ type: String }],
  images: [{ type: String }],
  pricePerDay: { type: Number, default: 0, min: 0 },
  status: { type: String, enum: ['Available', 'Booked', 'Maintenance'], default: 'Available' },
}, { timestamps: true });

export const ConferenceHall = mongoose.model('ConferenceHall', conferenceHallSchema);
