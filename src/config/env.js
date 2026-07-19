import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
  MONGO_URI: z.string().min(1, 'MONGO_URI is required'),
  PORT: z.string().default('5001'),
  JWT_ACCESS_SECRET: z.string().min(20, 'JWT_ACCESS_SECRET too short'),
  JWT_REFRESH_SECRET: z.string().min(20, 'JWT_REFRESH_SECRET too short'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  FRONTEND_URL: z.string().url(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment variables:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
