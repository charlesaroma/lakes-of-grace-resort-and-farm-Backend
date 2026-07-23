import { z } from 'zod';

export const createReviewSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  rating: z.number().int().min(1).max(5),
  title: z.string().optional().default(''),
  comment: z.string().min(1, 'Comment is required'),
  images: z.array(z.string()).optional().default([]),
});

export const updateReviewSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  rating: z.number().int().min(1).max(5).optional(),
  title: z.string().optional(),
  comment: z.string().min(1).optional(),
  response: z.string().optional(),
  status: z.enum(['Published', 'Pending', 'Rejected']).optional(),
  showOnHomePage: z.boolean().optional(),
  images: z.array(z.string()).optional(),
});
