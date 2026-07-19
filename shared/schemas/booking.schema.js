import { z } from 'zod';

export const createBookingSchema = z.object({
  guestName: z.string().min(1),
  guestEmail: z.string().email(),
  cottage: z.string().min(1),
  checkIn: z.coerce.date(),
  checkOut: z.coerce.date(),
  guests: z.number().int().min(1),
  status: z.enum(['Pending', 'Confirmed', 'Checked-In', 'Checked-Out', 'Cancelled']).default('Pending'),
  totalAmount: z.number().min(0),
});

export const updateBookingSchema = createBookingSchema.partial();
