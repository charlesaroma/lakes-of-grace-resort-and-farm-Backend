import { z } from 'zod';

export const createReviewSchema = z.object({
  guestName: z.string().min(1, 'Guest name is required'),
  rating: z.number().int().min(1).max(5),
  title: z.string().optional().default(''),
  comment: z.string().min(1, 'Comment is required'),
  images: z.array(z.string()).optional().default([]),
});

export const updateReviewSchema = z.object({
  guestName: z.string().min(1).optional(),
  rating: z.number().int().min(1).max(5).optional(),
  title: z.string().optional(),
  comment: z.string().min(1).optional(),
  response: z.string().optional(),
  status: z.enum(['Published', 'Pending', 'Rejected']).optional(),
  images: z.array(z.string()).optional(),
});
