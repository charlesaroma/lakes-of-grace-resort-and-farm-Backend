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
  totalAmount: { type: Number, min: 0 },
  phone: { type: String, trim: true },
  specialRequests: { type: String, trim: true },
}, { timestamps: true });

export const Booking = mongoose.model('Booking', bookingSchema);
