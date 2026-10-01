import Generation from '../models/Generation.js';

export const topicKeyOf = (topic) => topic.trim().toLowerCase().replace(/\s+/g, ' ');

// Call this on the server, right after your AI call succeeds, for example:
//   await recordGeneration({ userId: req.user.id, type: 'quiz', topic: 'Database Normalization' });
// It is deliberately not an HTTP endpoint, so students cannot inflate the numbers.
export function recordGeneration({ userId, type = 'quiz', topic }) {
  const clean = String(topic || '').trim().slice(0, 120);
  if (!clean) throw new Error('recordGeneration needs a topic.');
  return Generation.create({ user: userId, type, topic: clean, topicKey: topicKeyOf(clean) });
}
