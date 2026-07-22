import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import { env } from '../src/config/env.js';
import { User } from '../src/features/users/user.model.js';

const SYSTEM_DEV_ACCOUNTS = [
  {
    name: 'System Developer One',
    email: 'dev1@lakesofgrace.com',
    password: process.env.SYSTEM_DEV1_PASSWORD || 'Dev@2025!',
  },
  {
    name: 'System Developer Two',
    email: 'dev2@lakesofgrace.com',
    password: process.env.SYSTEM_DEV2_PASSWORD || 'Dev@2025!',
  },
];

async function seed() {
  try {
    await mongoose.connect(env.MONGO_URI);
    console.log('Connected to MongoDB');

    for (const account of SYSTEM_DEV_ACCOUNTS) {
      const existing = await User.findOne({ email: account.email });
      if (existing) {
        console.log(`Account already exists (${account.email}), updating password and role…`);
        existing.passwordHash = await bcrypt.hash(account.password, 12);
        existing.role = 'system_developer';
        await existing.save();
        console.log(`${account.email} updated`);
      } else {
        const passwordHash = await bcrypt.hash(account.password, 12);
        await User.create({
          name: account.name,
          email: account.email,
          passwordHash,
          role: 'system_developer',
        });
        console.log(`Account created (${account.email})`);
      }
    }

    await mongoose.disconnect();
    console.log('Done — system developer accounts ready');
    process.exit(0);
  } catch (err) {
    console.error('Seed failed:', err);
    process.exit(1);
  }
}

seed();
