import { z } from 'zod';

export const createDepartmentSchema = z.object({
  name: z.string().min(1, 'Department name is required'),
  color: z.string().default('bg-gray-100 text-gray-700'),
  description: z.string().optional(),
});

export const updateDepartmentSchema = z.object({
  name: z.string().min(1).optional(),
  color: z.string().optional(),
  description: z.string().optional(),
});
