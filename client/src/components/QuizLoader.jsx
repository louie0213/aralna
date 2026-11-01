import { useEffect, useRef, useState } from 'react';
import './QuizLoader.css';

export const QUIZ_LOADER_CONFIG = Object.freeze({
  loopMs: 4200,
  messageIntervalMs: 1800,
  slowMessageAfterMs: 15000,
  clockTickMs: 500,
  idleMs: 1200,
  antennaPulseMs: 900,
  sparkleMs: 1200,
  messageFadeMs: 520,
  errorTiltMs: 520,
  lineStaggerMs: 130,
  particleStaggerMs: 140,
  sparkleStaggerMs: 400,
  eyeStaggerMs: 80,
  successStaggerMs: 30,
  successMs: 520,
  successCompleteMs: 590,
  easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
  messages: [
    'Reading your document...',
    'Finding key ideas...',
    'Writing questions...',
    'Polishing your reviewer...',
  ],
  slowMessage: 'Still working on it, big documents take a bit longer.',
  successMessage: 'Your reviewer is ready!',
  errorMessage: "Oops, I couldn't read that one.",
  colors: {
    accent: 'var(--logo-tile)',
    pink: 'var(--logo-pink)',
    yellow: 'var(--logo-spark)',
    paper: 'var(--paper)',
    text: 'var(--text)',
    muted: 'var(--muted)',
    line: 'var(--line)',
  },
});

function RobotScene({ status }) {
  return (
    <svg className="quiz-loader__svg" viewBox="0 0 420 230" role="img" aria-label="A robot turns a document into a quiz card">
      <g className="ql-doc">
        <rect x="20" y="61" width="72" height="112" rx="8" className="ql-paper" />
        <path d="M20 70a9 9 0 0 1 9-9h54a9 9 0 0 1 9 9v5H20z" className="ql-accent-fill" />
        <path d="M34 91h43" className="ql-doc-line" />
        <path d="M34 101h36" className="ql-doc-line" />
        <path d="M34 111h39" className="ql-doc-line" />
        <path d="M32 119h43" className="ql-doc-highlight" />
        <path d="M34 130h43" className="ql-doc-line" />
        <path d="M34 140h29" className="ql-doc-line" />
        <path d="M34 150h37" className="ql-doc-line" />
        <circle cx="27" cy="90" r="2" className="ql-pink-fill" />
        <circle cx="27" cy="100" r="2" className="ql-accent-fill" />
        <circle cx="27" cy="110" r="2" className="ql-yellow-fill" />
      </g>

      <path className="ql-scanner" d="M94 118h68" />
      <g className="ql-particles">
        <circle className="ql-particle ql-particle-one" cx="105" cy="116" r="3" />
        <circle className="ql-particle ql-particle-two" cx="105" cy="124" r="2.5" />
        <circle className="ql-particle ql-particle-three" cx="105" cy="132" r="2" />
      </g>

      <g className="ql-robot">
        <g className="ql-head">
          <path d="M205 66V49" className="ql-antenna" />
          <circle cx="205" cy="43" r="10" className="ql-antenna-halo" />
          <circle cx="205" cy="43" r="6" className="ql-antenna-tip" />
          <rect x="163" y="69" width="84" height="70" rx="22" className="ql-robot-shell" />
          <rect x="170" y="76" width="70" height="56" rx="17" className="ql-robot-face" />
          <g className="ql-eyes">
            <g className="ql-eye ql-eye-left">
              <ellipse cx="189" cy="100" rx="8" ry="10" className="ql-eye-white" />
              <circle cx="191" cy="101" r="3.5" className="ql-eye-pupil" />
            </g>
            <g className="ql-eye ql-eye-right">
              <ellipse cx="221" cy="100" rx="8" ry="10" className="ql-eye-white" />
              <circle cx="223" cy="101" r="3.5" className="ql-eye-pupil" />
            </g>
          </g>
          <path d="M195 119q10 8 20 0" className="ql-mouth" />
          <circle cx="169" cy="107" r="4" className="ql-ear" />
          <circle cx="241" cy="107" r="4" className="ql-ear" />
        </g>
        <g className="ql-body">
          <rect x="174" y="143" width="62" height="61" rx="16" className="ql-robot-shell" />
          <rect x="186" y="155" width="38" height="29" rx="7" className="ql-chest" />
          <path d="M193 165h24M193 171h17" className="ql-chest-line" />
          <circle cx="205" cy="193" r="3" className="ql-yellow-fill" />
          <path d="M174 158h-8v22h8M236 158h8v22h-8" className="ql-limb" />
        </g>
      </g>

      <g className="ql-card-stack">
        <rect x="323" y="77" width="76" height="111" rx="8" className="ql-card-back" />
        <rect x="329" y="71" width="76" height="111" rx="8" className="ql-card-back ql-card-back-front" />
      </g>
      <g className="ql-card">
        <rect x="323" y="64" width="76" height="111" rx="8" className="ql-paper ql-card-border" />
        <path d="M323 72a8 8 0 0 1 8-8h60a8 8 0 0 1 8 8v5h-76z" className="ql-accent-fill" />
        <path d="M334 91h44M334 99h37" className="ql-card-title" />
        <circle cx="337" cy="115" r="3" className="ql-pink-fill" />
        <path d="M345 115h39" className="ql-card-line" />
        <circle cx="337" cy="128" r="3" className="ql-yellow-fill" />
        <path d="M345 128h34" className="ql-card-line" />
        <circle cx="337" cy="141" r="3" className="ql-accent-fill" />
        <path d="M345 141h39" className="ql-card-line" />
      </g>

      <g className="ql-sparkles" aria-hidden="true">
        <path className="ql-spark ql-spark-one" d="M281 58v10m-5-5h10" />
        <path className="ql-spark ql-spark-two" d="M279 161v8m-4-4h8" />
        <path className="ql-spark ql-spark-three" d="M392 47v9m-4.5-4.5h9" />
      </g>
      <title>{status === 'success' ? 'Quiz generation complete' : status === 'error' ? 'Quiz generation failed' : 'Generating your reviewer'}</title>
    </svg>
  );
}

export default function QuizLoader({ status, message, onComplete, onRetry }) {
  const [elapsedMs, setElapsedMs] = useState(0);
  const [isHidden, setIsHidden] = useState(() => document.hidden);
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    if (status !== 'loading') {
      setElapsedMs(0);
      return undefined;
    }

    const startedAt = Date.now();
    setElapsedMs(0);
    const timer = window.setInterval(() => setElapsedMs(Date.now() - startedAt), QUIZ_LOADER_CONFIG.clockTickMs);
    return () => window.clearInterval(timer);
  }, [status]);

  useEffect(() => {
    const updateVisibility = () => setIsHidden(document.hidden);
    document.addEventListener('visibilitychange', updateVisibility);
    return () => document.removeEventListener('visibilitychange', updateVisibility);
  }, []);

  useEffect(() => {
    if (status !== 'success') return undefined;
    const timer = window.setTimeout(() => onCompleteRef.current?.(), QUIZ_LOADER_CONFIG.successCompleteMs);
    return () => window.clearTimeout(timer);
  }, [status]);

  const messageIndex = Math.floor(elapsedMs / QUIZ_LOADER_CONFIG.messageIntervalMs) % QUIZ_LOADER_CONFIG.messages.length;
  const label = message || (
    status === 'error'
      ? QUIZ_LOADER_CONFIG.errorMessage
      : status === 'success'
        ? QUIZ_LOADER_CONFIG.successMessage
        : elapsedMs >= QUIZ_LOADER_CONFIG.slowMessageAfterMs
          ? QUIZ_LOADER_CONFIG.slowMessage
          : QUIZ_LOADER_CONFIG.messages[messageIndex]
  );
  const style = {
    '--ql-loop': `${QUIZ_LOADER_CONFIG.loopMs}ms`,
    '--ql-success': `${QUIZ_LOADER_CONFIG.successMs}ms`,
    '--ql-idle': `${QUIZ_LOADER_CONFIG.idleMs}ms`,
    '--ql-antenna': `${QUIZ_LOADER_CONFIG.antennaPulseMs}ms`,
    '--ql-sparkle': `${QUIZ_LOADER_CONFIG.sparkleMs}ms`,
    '--ql-message-fade': `${QUIZ_LOADER_CONFIG.messageFadeMs}ms`,
    '--ql-error-tilt': `${QUIZ_LOADER_CONFIG.errorTiltMs}ms`,
    '--ql-line-stagger': `${QUIZ_LOADER_CONFIG.lineStaggerMs}ms`,
    '--ql-particle-stagger': `${QUIZ_LOADER_CONFIG.particleStaggerMs}ms`,
    '--ql-sparkle-stagger': `${QUIZ_LOADER_CONFIG.sparkleStaggerMs}ms`,
    '--ql-success-stagger': `${QUIZ_LOADER_CONFIG.successStaggerMs}ms`,
    '--ql-eye-stagger': `${QUIZ_LOADER_CONFIG.eyeStaggerMs}ms`,
    '--ql-easing': QUIZ_LOADER_CONFIG.easing,
    '--ql-accent': QUIZ_LOADER_CONFIG.colors.accent,
    '--ql-pink': QUIZ_LOADER_CONFIG.colors.pink,
    '--ql-yellow': QUIZ_LOADER_CONFIG.colors.yellow,
    '--ql-paper': QUIZ_LOADER_CONFIG.colors.paper,
    '--ql-text': QUIZ_LOADER_CONFIG.colors.text,
    '--ql-muted': QUIZ_LOADER_CONFIG.colors.muted,
    '--ql-line': QUIZ_LOADER_CONFIG.colors.line,
  };

  return (
    <section
      className={`quiz-loader quiz-loader--${status}${isHidden ? ' quiz-loader--paused' : ''}`}
      style={style}
      aria-busy={status === 'loading'}
    >
      <div className="quiz-loader__scene">
        <RobotScene status={status} />
      </div>
      <p className="quiz-loader__status" role="status" aria-live="polite" aria-atomic="true">
        <span key={label} className="quiz-loader__message">{label}</span>
      </p>
      {status === 'error' && onRetry && (
        <button className="btn btn-primary quiz-loader__retry" type="button" onClick={onRetry}>
          Retry
        </button>
      )}
    </section>
  );
}
