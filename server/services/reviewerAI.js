import Groq from 'groq-sdk';

const MAX_INPUT_CHARS = 12000;
const MAX_TOPICS = 12;
const MAX_TOPIC_BULLETS = 5;
const MAX_TOPIC_NAME_CHARS = 100;
const MAX_BULLET_CHARS = 280;

const SYSTEM_PROMPT = `You are an assistant that turns study material into a study guide for a student.
Base everything only on the text the student gives you. Do not invent facts that are not in the text.
Organize the material by topic. For each topic, include 2 to 5 concise bullet points, with exactly one sentence per bullet.
Do not make flashcards, questions, an overview, or separate lists outside the topics.
Reply with JSON only, no extra words, in exactly this shape:
{
  "topics": [
    {
      "name": "Topic name",
      "bulletPoints": ["One clear sentence about the topic.", "Another concise sentence about the topic."]
    }
  ]
}`;

const clip = (str, max) => {
  const s = String(str || '').trim();
  return s.length > max ? s.slice(0, max) : s;
};

function sanitize(raw) {
  const topics = Array.isArray(raw.topics)
    ? raw.topics
        .filter((topic) => topic && typeof topic.name === 'string' && Array.isArray(topic.bulletPoints))
        .slice(0, MAX_TOPICS)
        .map((topic) => ({
          name: clip(topic.name, MAX_TOPIC_NAME_CHARS),
          bulletPoints: topic.bulletPoints
            .filter((point) => typeof point === 'string' && point.trim())
            .slice(0, MAX_TOPIC_BULLETS)
            .map((point) => clip(point, MAX_BULLET_CHARS)),
        }))
        .filter((topic) => topic.name && topic.bulletPoints.length)
    : [];

  return { topics };
}

export async function generateReviewer(text, documentName) {
  if (!process.env.GROQ_API_KEY) {
    throw new Error('GROQ_API_KEY is not set on the server. Add it to server/.env.');
  }
  const clean = String(text || '').trim();
  if (clean.length < 30) {
    throw new Error('This document does not have enough readable text to build a reviewer.');
  }

  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  const completion = await groq.chat.completions.create({
    model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
    temperature: 0.3,
    max_tokens: 4000,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: `Document: ${documentName}\n\n${clip(clean, MAX_INPUT_CHARS)}` },
    ],
  });

  const raw = completion.choices?.[0]?.message?.content;
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error('The AI did not return a usable result. Try again.');
  }
  return sanitize(parsed);
}