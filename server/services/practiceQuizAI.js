import Groq from 'groq-sdk';

const MAX_INPUT_CHARS = 12000;
const DEFAULT_QUESTION_COUNT = 20;

const clip = (value, max) => String(value || '').trim().slice(0, max);

function reviewerStudyText(reviewer) {
  const sections = [];
  for (const topic of reviewer.topics || []) {
    const lines = [`Topic: ${topic.name}`, ...(topic.bulletPoints || [])];
    for (const example of topic.formulaExamples || []) {
      lines.push(`Formula: ${example.formula}`, `Worked example: ${example.workedExample}`);
    }
    sections.push(lines.join('\n'));
  }
  if (reviewer.keyTerms?.length) {
    sections.push(`Key terms:\n${reviewer.keyTerms.map(({ term, definition }) => `${term}: ${definition}`).join('\n')}`);
  }
  if (reviewer.timeline?.length) {
    sections.push(`Timeline:\n${reviewer.timeline.map(({ year, summary }) => `${year}: ${summary}`).join('\n')}`);
  }
  if (reviewer.overview) sections.push(`Overview:\n${reviewer.overview}`);
  if (reviewer.keyTakeaways?.length) sections.push(`Key takeaways:\n${reviewer.keyTakeaways.join('\n')}`);
  return clip(sections.join('\n\n'), MAX_INPUT_CHARS);
}

function sanitizeQuestion(question) {
  if (!question || typeof question !== 'object') return null;
  const type = question.type;
  const prompt = clip(question.prompt, 500);
  if (!prompt) return null;

  if (type === 'multiple-choice' && Array.isArray(question.choices)) {
    const choices = question.choices.slice(0, 4).map((choice) => clip(choice, 200));
    const answer = clip(question.answer, 200);
    if (choices.length !== 4 || choices.some((choice) => !choice)
      || new Set(choices.map((choice) => choice.toLowerCase())).size !== choices.length
      || !choices.includes(answer)) return null;
    return { type, prompt, choices, answer };
  }
  if (type === 'identification') {
    const answer = clip(question.answer, 200);
    return answer ? { type, prompt, choices: [], answer } : null;
  }
  if (type === 'true-false' && typeof question.answer === 'boolean') {
    return { type, prompt, choices: [], answer: String(question.answer) };
  }
  return null;
}

export async function generateQuizQuestions(text, sourceName, questionCount = DEFAULT_QUESTION_COUNT) {
  if (!process.env.GROQ_API_KEY) {
    throw new Error('GROQ_API_KEY is not set on the server. Add it to server/.env.');
  }
  const studyText = clip(text, MAX_INPUT_CHARS);
  if (studyText.length < 30) {
    throw new Error('This source does not have enough readable text to create a quiz.');
  }

  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  const completion = await groq.chat.completions.create({
    model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
    temperature: 0.3,
    max_tokens: Math.min(8000, Math.max(2000, questionCount * 250)),
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content: `Create exactly ${questionCount} quiz questions using only the provided study material. Do not add facts or answers not supported by that material. Include a mix of multiple-choice, identification, and true-false questions when the source supports them. Every multiple-choice question must have exactly four distinct choices and its answer must exactly match one choice. Identification answers must be short and canonical. True-false answers must be JSON booleans. Return JSON only in this shape: {"questions":[{"type":"multiple-choice","prompt":"...","choices":["...","...","...","..."],"answer":"..."},{"type":"identification","prompt":"...","choices":[],"answer":"..."},{"type":"true-false","prompt":"...","choices":[],"answer":true}]}`,
      },
      { role: 'user', content: `Source: ${clip(sourceName, 200)}\n\n${studyText}` },
    ],
  });
  const raw = completion.choices?.[0]?.message?.content;
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error('The AI did not return a usable quiz. Try again.');
  }
  if (!Array.isArray(parsed.questions) || parsed.questions.length !== questionCount) {
    throw new Error('The AI returned an incomplete quiz. Try again.');
  }
  const questions = parsed.questions.map(sanitizeQuestion);
  if (questions.some((question) => !question)) {
    throw new Error('The AI returned invalid quiz questions. Try again.');
  }
  return questions;
}

export async function generatePracticeQuestions(reviewer) {
  return generateQuizQuestions(reviewerStudyText(reviewer), reviewer.documentName);
}
