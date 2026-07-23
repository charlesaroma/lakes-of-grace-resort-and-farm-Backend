import { z } from 'zod';

export const createConferenceHallSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  capacity: z.number().int().min(1, 'Capacity must be at least 1'),
  description: z.string().optional().default(''),
  amenities: z.array(z.string()).optional().default([]),
  images: z.array(z.string()).optional().default([]),
  pricePerDay: z.number().min(0).optional().default(0),
  status: z.enum(['Available', 'Booked', 'Maintenance']).default('Available'),
});

export const updateConferenceHallSchema = createConferenceHallSchema.partial();
