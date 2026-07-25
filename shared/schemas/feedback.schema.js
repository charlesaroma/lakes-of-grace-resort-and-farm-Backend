import { z } from 'zod';

const ratingField = z.string().regex(/^[1-5]$/, 'Please rate this category');

export const createFeedbackSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email().optional().or(z.literal('')),
  rating: z.number().int().min(1).max(5),
  title: z.string().optional().default(''),
  comment: z.string().min(1, 'Comment is required'),
  staffPerformance: ratingField.optional(),
  accommodations: ratingField.optional(),
  propertyEnvironment: ratingField.optional(),
  diningCatering: ratingField.optional(),
  recreationSafety: ratingField.optional(),
  frontDeskOperations: ratingField.optional(),
  suggestions: z.string().optional().default(''),
});
