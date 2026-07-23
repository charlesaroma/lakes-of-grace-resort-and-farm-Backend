import mongoose from 'mongoose';

const evaluationSchema = new mongoose.Schema({
  firstName: { type: String, required: true, trim: true },
  lastName: { type: String, required: true, trim: true },
  gender: { type: String, enum: ['Female', 'Male'], default: '' },
  phone: { type: String, default: '', trim: true },
  email: { type: String, default: '', trim: true },
  physicalAddress: { type: String, default: '', trim: true },
  country: { type: String, default: '', trim: true },
  arrivalDate: { type: String, default: '', trim: true },
  arrivalTime: { type: String, default: '', trim: true },
  departureDate: { type: String, default: '', trim: true },
  departureTime: { type: String, default: '', trim: true },
  occupancy: {
    type: String,
    enum: ['Single', 'Double Couple', 'Double Twin', 'Couple with Children', 'Single with Children'],
    default: '',
  },
  numberOfChildren: { type: Number, default: 0, min: 0 },
  referralSource: { type: String, default: '', trim: true },
  staffPerformance: { type: String, enum: ['Very Happy', 'Happy', 'Satisfied', 'Sad'], default: '' },
  accommodations: { type: String, enum: ['Very Happy', 'Happy', 'Satisfied', 'Sad'], default: '' },
  propertyEnvironment: { type: String, enum: ['Very Happy', 'Happy', 'Satisfied', 'Sad'], default: '' },
  diningCatering: { type: String, enum: ['Very Happy', 'Happy', 'Satisfied', 'Sad'], default: '' },
  recreationSafety: { type: String, enum: ['Very Happy', 'Happy', 'Satisfied', 'Sad'], default: '' },
  frontDeskOperations: { type: String, enum: ['Very Happy', 'Happy', 'Satisfied', 'Sad'], default: '' },
  generalComments: { type: String, default: '', trim: true },
  suggestions: { type: String, default: '', trim: true },
}, { timestamps: true });

export const Evaluation = mongoose.model('Evaluation', evaluationSchema);
