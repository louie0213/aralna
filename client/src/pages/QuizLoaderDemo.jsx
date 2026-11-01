import { useState } from 'react';
import QuizLoader from '../components/QuizLoader.jsx';

const FETCH_EXAMPLE = `// Inside a React page component; imports omitted.
const [status, setStatus] = useState('loading');
const [quiz, setQuiz] = useState(null);
const controllerRef = useRef(null);

async function generateQuiz() {
  const controller = new AbortController();
  controllerRef.current = controller;
  setStatus('loading');
  try {
    const response = await fetch(\`/api/reviewers/\${reviewerId}/quiz\`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
      signal: controller.signal,
    });
    if (!response.ok) throw new Error('Quiz generation failed.');
    setQuiz(await response.json());
    setStatus('success');
  } catch (error) {
    if (!controller.signal.aborted) setStatus('error');
  }
}

useEffect(() => () => controllerRef.current?.abort(), []);
return (
  <QuizLoader
    status={status}
    onRetry={generateQuiz}
    onComplete={() => quiz && navigate(\`/app/quizzes/\${quiz.id}\`)}
  />
);`;

export default function QuizLoaderDemo() {
  const [status, setStatus] = useState('loading');
  const [message, setMessage] = useState('');
  const [completed, setCompleted] = useState(false);

  function chooseStatus(nextStatus) {
    setStatus(nextStatus);
    setMessage('');
    setCompleted(false);
  }

  return (
    <main className="quiz-loader-demo">
      <header className="page-heading">
        <div>
          <p className="page-eyebrow">MOTION PREVIEW</p>
          <h1>Quiz generation loader</h1>
          <p className="page-description">Preview the loading, success, and retry states.</p>
        </div>
      </header>
      <section className="quiz-loader-demo__panel" aria-label="Quiz loader demo">
        <QuizLoader
          status={status}
          message={message || undefined}
          onComplete={() => setCompleted(true)}
          onRetry={() => chooseStatus('loading')}
        />
        {completed && <p className="auth-notice" role="status">Success animation complete.</p>}
        <div className="quiz-loader-demo__controls" aria-label="Choose loader state">
          {['loading', 'success', 'error'].map((state) => (
            <button
              key={state}
              className="btn btn-ghost"
              type="button"
              aria-pressed={status === state}
              onClick={() => chooseStatus(state)}
            >
              Show {state}
            </button>
          ))}
          <button
            className="btn btn-ghost"
            type="button"
            onClick={() => {
              setStatus('loading');
              setMessage('Custom status message...');
              setCompleted(false);
            }}
          >
            Custom message
          </button>
        </div>
      </section>
      <p className="quiz-loader-demo__note">To tune the animation, colors, and messages, edit <code>QUIZ_LOADER_CONFIG</code> at the top of <code>QuizLoader.jsx</code>.</p>
      <details className="quiz-loader-demo__details">
        <summary>Fetch integration example</summary>
        <pre><code>{FETCH_EXAMPLE}</code></pre>
      </details>
      <p className="quiz-loader-demo__note">
        Performance check: open Chrome DevTools, set CPU throttling to 4× slowdown in the Performance panel, record about 8 seconds of the loading state, and inspect the Frames track for missed frames.
      </p>
    </main>
  );
}
