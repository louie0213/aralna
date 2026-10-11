import Groq from 'groq-sdk';

const MAX_INPUT_CHARS = 12000;
const MAX_TOPICS = 12;
const MAX_TOPIC_BULLETS = 5;
const MAX_TOPIC_NAME_CHARS = 100;
const MAX_BULLET_CHARS = 280;
const MAX_FORMULA_EXAMPLES = 4;
const MAX_FORMULA_CHARS = 180;
const MAX_WORKED_EXAMPLE_CHARS = 600;
const MAX_KEY_TERMS = 15;
const MAX_TERM_CHARS = 100;
const MAX_DEFINITION_CHARS = 400;
const MAX_TIMELINE_ENTRIES = 24;
const MAX_YEAR_CHARS = 20;
const MAX_TIMELINE_SUMMARY_CHARS = 300;

const SYSTEM_PROMPT = `You are an assistant that turns study material into a study guide for a student.
Base everything only on the text the student gives you. Do not invent facts that are not in the text.
Organize the material by topic. For each topic, include 2 to 5 concise bullet points, with exactly one sentence per bullet.
Also collect up to 15 important terms from the text, each with a concise definition based only on the text.
Do not make flashcards, questions, or an overview.

For topics whose source material contains a mathematical formula or a problem that uses one, include a "formulaExamples" array on that topic. Each entry must contain the formula and a short worked example showing values substituted into it and the result. Use formulas supported by the source; if you choose simple illustrative values not present in the source, label them as an example. Keep formulas in readable plain-text notation. If a topic has no formula or math problem, use an empty array. Do not add formula sections for non-math material.

Also look for specific years or dates tied to events in the text (for example a history, timeline, or chronology of developments).
If you find any, also build a "timeline": one entry per year that has an event in the text, with a 1-2 sentence summary of what happened that year according to the text.
If the text does not mention any specific years, return an empty array for "timeline". Do not invent years or events that are not in the text.

Reply with JSON only, no extra words, in exactly this shape:
{
  "topics": [
    {
      "name": "Topic name",
      "bulletPoints": ["One clear sentence about the topic.", "Another concise sentence about the topic."],
      "formulaExamples": [
        { "formula": "distance = speed x time", "workedExample": "Example: At 4 m/s for 3 seconds, distance = 4 x 3 = 12 m." }
      ]
    }
  ],
  "keyTerms": [
    { "term": "Term", "definition": "Concise definition based only on the text." }
  ],
  "timeline": [
    { "year": "1896", "summary": "One or two sentences on what happened that year, based only on the text." }
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
          formulaExamples: Array.isArray(topic.formulaExamples)
            ? topic.formulaExamples
                .filter((entry) => entry && typeof entry.formula === 'string' && typeof entry.workedExample === 'string')
                .slice(0, MAX_FORMULA_EXAMPLES)
                .map((entry) => ({
                  formula: clip(entry.formula, MAX_FORMULA_CHARS),
                  workedExample: clip(entry.workedExample, MAX_WORKED_EXAMPLE_CHARS),
                }))
                .filter((entry) => entry.formula && entry.workedExample)
            : [],
        }))
        .filter((topic) => topic.name && topic.bulletPoints.length)
    : [];

  const timeline = Array.isArray(raw.timeline)
    ? raw.timeline
        .filter((entry) => entry && typeof entry.year === 'string' && typeof entry.summary === 'string')
        .slice(0, MAX_TIMELINE_ENTRIES)
        .map((entry) => ({
          year: clip(entry.year, MAX_YEAR_CHARS),
          summary: clip(entry.summary, MAX_TIMELINE_SUMMARY_CHARS),
        }))
        .filter((entry) => entry.year && entry.summary)
    : [];

  const keyTerms = Array.isArray(raw.keyTerms)
    ? raw.keyTerms
        .filter((entry) => entry && typeof entry.term === 'string' && typeof entry.definition === 'string')
        .slice(0, MAX_KEY_TERMS)
        .map((entry) => ({
          term: clip(entry.term, MAX_TERM_CHARS),
          definition: clip(entry.definition, MAX_DEFINITION_CHARS),
        }))
        .filter((entry) => entry.term && entry.definition)
    : [];

  return { topics, keyTerms, timeline };
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