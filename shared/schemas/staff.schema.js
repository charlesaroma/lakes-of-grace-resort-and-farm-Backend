import { z } from 'zod';

const departments = ['FrontDesk', 'Housekeeping', 'Kitchen', 'Management', 'Maintenance', 'Activities'];

export const createStaffSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  photo: z.string().optional(),
  department: z.enum(departments).default('FrontDesk'),
  position: z.string().optional(),
});

export const updateStaffSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  photo: z.string().optional(),
  department: z.enum(departments).optional(),
  position: z.string().optional(),
  isActive: z.boolean().optional(),
});
