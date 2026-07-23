import mongoose from 'mongoose';

const checkInSchema = new mongoose.Schema({
  guestName: { type: String, required: true, trim: true },
  guestPhone: { type: String, default: '', trim: true },
  roomNumber: { type: String, required: true, trim: true },
  bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking' },
  checkInTime: { type: Date, default: Date.now },
  expectedCheckOut: { type: Date, required: true },
  actualCheckOut: { type: Date },
  status: { type: String, enum: ['Checked-In', 'Checked-Out'], default: 'Checked-In' },
  idProof: { type: String, default: '' },
  notes: { type: String, default: '' },
  vehicleNumber: { type: String, default: '' },
  numberOfGuests: { type: Number, default: 1, min: 1 },
}, { timestamps: true });

checkInSchema.index({ status: 1, checkInTime: -1 });
checkInSchema.index({ roomNumber: 1, status: 1 });

export const CheckIn = mongoose.model('CheckIn', checkInSchema);
