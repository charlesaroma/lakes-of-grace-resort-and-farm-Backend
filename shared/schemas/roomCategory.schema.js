import { z } from 'zod';

export const createRoomCategorySchema = z.object({
  roomType: z.enum(['Standard', 'Deluxe', 'Premium']),
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional().default(''),
});

export const updateRoomCategorySchema = createRoomCategorySchema.partial();
