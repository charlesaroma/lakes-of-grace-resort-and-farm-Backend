import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

// ─── Load Environment ───

const envSchema = z.object({
  DATABASE_URL: z.string().optional(),
  MONGO_URI: z.string().min(1, 'MONGO_URI is required'),
  PORT: z.string().default('5001'),
  JWT_ACCESS_SECRET: z.string().min(20, 'JWT_ACCESS_SECRET too short'),
  JWT_REFRESH_SECRET: z.string().min(20, 'JWT_REFRESH_SECRET too short'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  FRONTEND_URL: z.string().min(1, 'FRONTEND_URL is required'),
  IMAGEKIT_PUBLIC_KEY: z.string().min(1, 'IMAGEKIT_PUBLIC_KEY is required'),
  IMAGEKIT_PRIVATE_KEY: z.string().min(1, 'IMAGEKIT_PRIVATE_KEY is required'),
  IMAGEKIT_URL_ENDPOINT: z.string().url('IMAGEKIT_URL_ENDPOINT must be a valid URL'),
  IMAGEKIT_WEBHOOK_SECRET: z.string().min(1, 'IMAGEKIT_WEBHOOK_SECRET is required'),

  // ─── Optional: Payment & Email (Pesapal + SMTP) ───
  // PESAPAL_CONSUMER_KEY: z.string().optional(),
  // PESAPAL_CONSUMER_SECRET: z.string().optional(),
  // PESAPAL_ENV: z.enum(['live', 'sandbox']).default('sandbox'),
  // SMTP_HOST: z.string().optional(),
  // SMTP_PORT: z.coerce.number().optional(),
  // SMTP_USER: z.string().optional(),
  // SMTP_PASS: z.string().optional(),
  // EMAIL_FROM: z.string().optional(),
});

// ─── Validate & Export ───
const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment variables:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
