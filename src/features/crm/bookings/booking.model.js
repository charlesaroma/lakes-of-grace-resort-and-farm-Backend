import mongoose from 'mongoose';

const bookingSchema = new mongoose.Schema({
  guestName: { type: String, required: true, trim: true },
  guestEmail: { type: String, required: true, trim: true, lowercase: true },
  cottage: { type: String, required: true, trim: true },
  checkIn: { type: Date, required: true },
  checkOut: { type: Date, required: true },
  guests: { type: Number, required: true, min: 1 },
  status: {
    type: String,
    enum: ['Pending', 'Confirmed', 'Checked-In', 'Checked-Out', 'Cancelled'],
    default: 'Pending',
  },
  totalAmount: { type: Number, required: true, min: 0 },
}, { timestamps: true });

export const Booking = mongoose.model('Booking', bookingSchema);
