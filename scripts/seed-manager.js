import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import { env } from '../src/config/env.js';
import { User } from '../src/features/users/user.model.js';

const MANAGER_EMAIL = 'manager@lakesofgrace.com';
const MANAGER_PASSWORD = process.env.MANAGER_SEED_PASSWORD || 'Manager@2025!';

async function seed() {
  try {
    await mongoose.connect(env.MONGO_URI);
    console.log('Connected to MongoDB');

    const existing = await User.findOne({ email: MANAGER_EMAIL });
    if (existing) {
      console.log(`Manager account already exists (${MANAGER_EMAIL}), updating password…`);
      existing.passwordHash = await bcrypt.hash(MANAGER_PASSWORD, 12);
      existing.role = 'manager';
      await existing.save();
      console.log('Manager password updated');
    } else {
      const passwordHash = await bcrypt.hash(MANAGER_PASSWORD, 12);
      await User.create({
        name: 'Manager',
        email: MANAGER_EMAIL,
        passwordHash,
        role: 'manager',
      });
      console.log(`Manager account created (${MANAGER_EMAIL})`);
    }

    await mongoose.disconnect();
    console.log('Done');
    process.exit(0);
  } catch (err) {
    console.error('Seed failed:', err);
    process.exit(1);
  }
}

seed();
