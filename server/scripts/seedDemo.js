// Fills the dashboard with sample data so you can see it working.
//   npm run seed:demo    adds 6 demo students and about 30 generations
//   npm run clear:demo   removes them again
// Demo students use emails ending in @demo.aralna and the password Demo12345.
import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import Generation from '../models/Generation.js';
import { topicKeyOf } from '../services/generations.js';

const DAY = 24 * 60 * 60 * 1000;
await mongoose.connect(process.env.MONGO_URI);

const old = await User.find({ email: /@demo\.aralna$/ }).select('_id');
const oldIds = old.map((u) => u._id);
await Generation.deleteMany({ user: { $in: oldIds } });
await User.deleteMany({ _id: { $in: oldIds } });

if (process.argv.includes('--clear')) {
  console.log(`Removed ${oldIds.length} demo students and their generations.`);
  await mongoose.disconnect();
  process.exit(0);
}

const names = ['Maria Santos', 'Juan Dela Cruz', 'Ana Reyes', 'Carlo Bautista', 'Liza Mendoza', 'Paolo Garcia'];
const daysSinceActive = [0.2, 1, 2, 5, 9, 20];
const passwordHash = await bcrypt.hash('Demo12345', 12);

const students = await User.insertMany(
  names.map((name, i) => ({
    fullName: name,
    email: `${name.split(' ')[0].toLowerCase()}@demo.aralna`,
    program: 'BSIT',
    passwordHash,
    role: 'student',
    lastActiveAt: new Date(Date.now() - daysSinceActive[i] * DAY),
  }))
);

const topics = ['Database Normalization', 'Data Structures', 'Philippine History', 'Network Security', 'Operating Systems', 'Calculus Limits'];
const counts = [9, 7, 6, 4, 3, 2];
const types = ['quiz', 'quiz', 'quiz', 'flashcards', 'summary'];

const docs = [];
counts.forEach((count, t) => {
  for (let k = 0; k < count; k++) {
    docs.push({
      user: students[(t + k) % students.length]._id,
      type: types[(t + k) % types.length],
      topic: topics[t],
      topicKey: topicKeyOf(topics[t]),
      createdAt: new Date(Date.now() - ((t * 3 + k * 2) % 14) * DAY - k * 3600000),
    });
  }
});
await Generation.insertMany(docs);

console.log(`Added ${students.length} demo students and ${docs.length} generations.`);
await mongoose.disconnect();
