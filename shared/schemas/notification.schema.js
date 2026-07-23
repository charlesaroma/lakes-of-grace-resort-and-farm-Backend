import { z } from 'zod';

export const createNotificationSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  message: z.string().min(1, 'Message is required'),
  type: z.enum(['Info', 'Success', 'Warning', 'Error']).default('Info'),
  category: z.enum(['Booking', 'Review', 'CheckIn', 'Stock', 'System', 'General']).default('General'),
  link: z.string().optional().default(''),
  expiresAt: z.string().optional().nullable().default(null),
});

export const updateNotificationSchema = createNotificationSchema.partial();
