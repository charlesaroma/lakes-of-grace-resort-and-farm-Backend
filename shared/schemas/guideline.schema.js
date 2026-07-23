import { z } from 'zod';

export const createGuidelineSchema = z.object({
  category: z.string().min(1, 'Category is required'),
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  icon: z.string().optional().default(''),
  sortOrder: z.number().int().optional().default(0),
});

export const updateGuidelineSchema = createGuidelineSchema.partial();
