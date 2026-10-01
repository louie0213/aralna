import Groq from 'groq-sdk';

// Keep the request small and the response bounded, both for cost and so a run-away AI
// response never gets stored as-is.
const MAX_INPUT_CHARS = 12000;
const MAX_PRIMARY_TOPICS = 8;
const MAX_MINOR_TOPICS = 12;
const MAX_FUN_FACTS = 8;
const MAX_FLASHCARDS = 15;
const MAX_SUMMARY_CHARS = 2000;

const SYSTEM_PROMPT = `You are an assistant that turns study material into an exam reviewer for a student.
Base everything only on the text the student gives you. Do not invent facts that are not in the text.
Reply with JSON only, no extra words, in exactly this shape:
{
  "summary": "a clear few-paragraph summary of the whole document",
  "primaryTopics": ["main topic 1", "main topic 2"],
  "minorTopics": ["smaller supporting topic 1", "smaller supporting topic 2"],
  "funFacts": ["a short interesting fact drawn from the text"],
  "flashcards": [{"question": "a study question", "answer": "a short direct answer"}]
}`;

const clip = (str, max) => {
  const s = String(str || '').trim();
  return s.length > max ? s.slice(0, max) : s;
};

const cleanArray = (v, max) => (Array.isArray(v) ? v.filter((x) => typeof x === 'string' && x.trim()).slice(0, max) : []);

function sanitize(raw, documentName) {
  const flashcards = Array.isArray(raw.flashcards)
    ? raw.flashcards
        .filter((f) => f && typeof f.question === 'string' && typeof f.answer === 'string')
        .slice(0, MAX_FLASHCARDS)
        .map((f) => ({ question: clip(f.question, 300), answer: clip(f.answer, 500) }))
    : [];

  return {
    summary: clip(raw.summary, MAX_SUMMARY_CHARS) || `No summary could be generated for ${documentName}.`,
    primaryTopics: cleanArray(raw.primaryTopics, MAX_PRIMARY_TOPICS),
    minorTopics: cleanArray(raw.minorTopics, MAX_MINOR_TOPICS),
    funFacts: cleanArray(raw.funFacts, MAX_FUN_FACTS),
    flashcards,
  };
}

// Throws with a short message that is safe to show directly to the student.
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
    max_tokens: 3000,
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
  return sanitize(parsed, documentName);
}
