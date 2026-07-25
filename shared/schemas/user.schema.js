import { z } from 'zod';

const roles = ['staff', 'admin', 'manager', 'system_developer', 'front_desk', 'kitchen_view', 'housekeeper_mobile'] ;

export const createUserSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.enum(roles).default('staff'),
});

export const updateUserSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
  email: z.string().email('Invalid email address').optional(),
  role: z.enum(roles).optional(),
});

export const promoteStaffSchema = z.object({
  role: z.enum(['front_desk', 'kitchen_view', 'housekeeper_mobile', 'admin', 'manager']),
});
