import { z } from 'zod';

export const createImageCategorySchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional().default(''),
});

export const updateImageCategorySchema = createImageCategorySchema.partial();

export const reorderImageCategoriesSchema = z.object({
  categories: z.array(z.object({
    id: z.string(),
    sortOrder: z.number().int().min(0),
  })),
});
