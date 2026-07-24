import { prisma } from '../lib/prisma.js';

export const connectDB = async () => {
  try {
    await prisma.$connect();
    console.log('✅ MongoDB connected');
  } catch (err) {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
  }
};
