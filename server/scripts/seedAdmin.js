import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';

const { MONGO_URI, ADMIN_NAME = 'AralNa Admin', ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;

if (!MONGO_URI || !ADMIN_EMAIL || !ADMIN_PASSWORD) {
  console.error('Set MONGO_URI, ADMIN_EMAIL and ADMIN_PASSWORD in .env first.');
  process.exit(1);
}

await mongoose.connect(MONGO_URI);
const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 12);
await User.findOneAndUpdate(
  { email: ADMIN_EMAIL.toLowerCase() },
  { fullName: ADMIN_NAME, email: ADMIN_EMAIL.toLowerCase(), passwordHash, role: 'admin', isActive: true },
  { upsert: true, new: true, setDefaultsOnInsert: true }
);
console.log(`Admin ready: ${ADMIN_EMAIL}`);
await mongoose.disconnect();
