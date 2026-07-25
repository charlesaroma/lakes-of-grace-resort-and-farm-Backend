import { z } from 'zod';

export const createStaffSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  photo: z.string().optional(),
  department: z.string().min(1, 'Department is required'),
  position: z.string().optional(),
});

export const updateStaffSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  photo: z.string().optional(),
  department: z.string().min(1).optional(),
  position: z.string().optional(),
  isActive: z.boolean().optional(),
});
