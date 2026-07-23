import { z } from 'zod';

export const createCheckInSchema = z.object({
  guestName: z.string().min(1, 'Guest name is required'),
  guestPhone: z.string().optional().default(''),
  roomNumber: z.string().min(1, 'Room number is required'),
  bookingId: z.string().optional(),
  expectedCheckOut: z.string().min(1, 'Expected check-out date is required'),
  idProof: z.string().optional().default(''),
  notes: z.string().optional().default(''),
  vehicleNumber: z.string().optional().default(''),
  numberOfGuests: z.number().int().min(1).optional().default(1),
});

export const updateCheckInSchema = z.object({
  actualCheckOut: z.string().optional(),
  status: z.enum(['Checked-In', 'Checked-Out']).optional(),
  notes: z.string().optional(),
  vehicleNumber: z.string().optional(),
  roomNumber: z.string().optional(),
  guestPhone: z.string().optional(),
  expectedCheckOut: z.string().optional(),
});
