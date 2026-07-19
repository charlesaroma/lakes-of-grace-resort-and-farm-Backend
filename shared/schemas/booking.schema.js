import { z } from 'zod';

/**
 * @typedef {z.infer<typeof bookingSchema>} Booking
 */

export const bookingSchema = z.object({
  guestId: z.string(), // MongoDB ObjectId string
  checkIn: z.coerce.date(), // Automatically parses ISO strings to Date objects
  checkOut: z.coerce.date(),
  status: z.enum(['pending', 'confirmed', 'cancelled', 'completed']).default('pending'),
  roomType: z.string(),
  guests: z.number().int().min(1),
  totalAmount: z.number().min(0),
});
