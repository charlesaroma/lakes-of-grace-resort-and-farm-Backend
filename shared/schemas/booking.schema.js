import { z } from 'zod';

export const createBookingSchema = z.object({
  guestName: z.string().min(1),
  guestEmail: z.string().email(),
  areaOfStay: z.enum(['Standard', 'Deluxe', 'Premium']),
  occupancy: z.enum(['Single', 'Double (Couple)', 'Double (Twin)', 'Other']).default('Single'),
  occupancyDetails: z.string().optional(),
  boardType: z.enum(['Full Board', 'Half Board', 'Bed & Breakfast']).default('Full Board'),
  checkIn: z.coerce.date(),
  checkOut: z.coerce.date(),
  guests: z.number().int().min(1),
  status: z.enum(['Pending', 'Confirmed', 'Checked-In', 'Checked-Out', 'Cancelled']).default('Pending'),
  totalAmount: z.number().min(0).optional(),
  paymentMethod: z.string().optional(),
  phone: z.string().optional(),
  specialRequests: z.string().optional(),
  bookingType: z.enum(['Individual', 'Company', 'Organization']).optional().default('Individual'),
  rooms: z.array(z.string()).optional().default([]),
});

export const updateBookingSchema = createBookingSchema.partial();
