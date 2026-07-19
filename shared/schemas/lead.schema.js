import { z } from 'zod';

export const leadSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  imageUrl: z.string().url().optional(),
});
