import { z } from 'zod';

export const createRoomSchema = z.object({
  roomNumber: z.string().min(1, 'Room number is required'),
  roomType: z.enum(['Standard', 'Deluxe', 'Premium']),
  status: z.enum(['Available', 'Booked', 'Maintenance', 'Cleaning']).default('Available'),
  pricePerNight: z.number().min(0, 'Price must be >= 0'),
  capacity: z.number().int().min(1, 'Capacity must be at least 1'),
  description: z.string().optional().default(''),
  amenities: z.array(z.string()).optional().default([]),
  images: z.array(z.string()).optional().default([]),
});

export const updateRoomSchema = createRoomSchema.partial();
