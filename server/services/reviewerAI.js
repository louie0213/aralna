import Groq from 'groq-sdk';

const MAX_INPUT_CHARS = 12000;
const MAX_OVERVIEW_CHARS = 1200;
const MAX_LIST = 8;
const MAX_MINOR_TOPICS = 12;
const MAX_KEY_TERMS = 15;
const MAX_FLASHCARDS = 15;

const SYSTEM_PROMPT = `You are an assistant that turns study material into a study guide for a student.
Base everything only on the text the student gives you. Do not invent facts that are not in the text.
Reply with JSON only, no extra words, in exactly this shape:
{
  "overview": "a short overview of what the whole document covers",
  "learningObjectives": ["what the student should be able to do or know after studying this"],
  "keyTakeaways": ["the most important point to remember"],
  "importantTopics": ["a major topic covered in depth"],
  "minorTopics": ["a smaller supporting topic"],
  "keyTerms": [{"term": "a word or phrase from the text", "definition": "a short, clear definition"}],
  "conceptRelationships": ["how two ideas in the text connect or affect each other"],
  "examples": ["a concrete example or case drawn from the text"],
  "commonMisconceptions": ["something students often get wrong about this material, and the correct idea"],
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

  const keyTerms = Array.isArray(raw.keyTerms)
    ? raw.keyTerms
        .filter((t) => t && typeof t.term === 'string' && typeof t.definition === 'string')
        .slice(0, MAX_KEY_TERMS)
        .map((t) => ({ term: clip(t.term, 100), definition: clip(t.definition, 400) }))
    : [];

  return {
    overview: clip(raw.overview, MAX_OVERVIEW_CHARS) || `No overview could be generated for ${documentName}.`,
    learningObjectives: cleanArray(raw.learningObjectives, MAX_LIST),
    keyTakeaways: cleanArray(raw.keyTakeaways, MAX_LIST),
    importantTopics: cleanArray(raw.importantTopics, MAX_LIST),
    minorTopics: cleanArray(raw.minorTopics, MAX_MINOR_TOPICS),
    keyTerms,
    conceptRelationships: cleanArray(raw.conceptRelationships, MAX_LIST),
    examples: cleanArray(raw.examples, MAX_LIST),
    commonMisconceptions: cleanArray(raw.commonMisconceptions, MAX_LIST),
    funFacts: cleanArray(raw.funFacts, MAX_LIST),
    flashcards,
  };
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
  return sanitize(parsed, documentName);
}