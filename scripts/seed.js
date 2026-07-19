import mongoose from 'mongoose';
import { connectDB } from '../src/config/db.js';
import { User } from '../src/features/users/user.model.js';
import bcrypt from 'bcrypt';

const email = process.argv[2];
const password = process.argv[3];
const name = process.argv[4] || 'Admin';
const role = process.argv[5] || 'admin';

if (!email || !password) {
  console.error('Usage: node scripts/seed.js <email> <password> [name] [role]');
  process.exit(1);
}

if (!['admin', 'staff'].includes(role)) {
  console.error('Role must be "admin" or "staff"');
  process.exit(1);
}

try {
  await connectDB();

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    console.log(`User ${email} already exists with role "${existing.role}"`);
    await mongoose.disconnect();
    process.exit(0);
  }

  const passwordHash = await bcrypt.hash(password, 12);
  await User.create({ name, email: email.toLowerCase(), passwordHash, role });

  console.log(`✅ Created ${role} user: ${email}`);
  await mongoose.disconnect();
} catch (err) {
  console.error('❌ Seed failed:', err.message);
  process.exit(1);
}
