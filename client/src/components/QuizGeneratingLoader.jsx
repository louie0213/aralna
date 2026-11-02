import './QuizGeneratingLoader.css';

const QUESTION_ROWS = [0, 1, 2, 3];

function TestPaper({ fileName }) {
  const title = fileName || '';

  return (
    <svg
      className="quiz-generating-loader__art"
      viewBox="0 0 400 340"
      aria-hidden="true"
      focusable="false"
    >
      <path className="qgl-paper-shadow" d="M46 20q0-5 6-5h294q6 0 6 6v302q0 6-6 6H52q-6 0-6-6z" />
      <path className="qgl-paper" d="M40 14q0-5 6-5h294q6 0 6 6v302q0 6-6 6H46q-6 0-6-6z" />

      <text className="qgl-header-label" x="61" y="39">Name</text>
      <path className="qgl-header-rule" d="M98 41h118" />
      <text className="qgl-header-label" x="237" y="39">Date</text>
      <path className="qgl-header-rule" d="M267 41h58" />
      <text className="qgl-title" x="61" y="69" textLength="263" lengthAdjust="spacingAndGlyphs">{title}</text>
      <path className="qgl-title-rule" d="M61 75q64 2 128 0t130 0" />

      {QUESTION_ROWS.map((row) => {
        const top = 94 + row * 53;
        const timing = { '--q-delay': `${row * 1.9}s` };
        return (
          <g className="qgl-question" style={timing} key={row}>
            <text className="qgl-question-number" x="60" y={top + 8}>{row + 1}.</text>
            <path
              className="qgl-question-line"
              d={`M82 ${top + 5}q22-3 43 0t40 0 42 0`}
            />
            <g className="qgl-answers" transform={`translate(83 ${top + 24})`}>
              {['A', 'B', 'C', 'D'].map((answer, answerIndex) => {
                const x = answerIndex * 48;
                return (
                  <g className={`qgl-answer${answerIndex === (row % 4) ? ' qgl-answer--chosen' : ''}`} key={answer}>
                    <circle className="qgl-bubble" cx={x} cy="0" r="7" />
                    <text className="qgl-answer-label" x={x + 11} y="4">{answer}</text>
                  </g>
                );
              })}
            </g>
            <path className="qgl-finished-mark" d={`M292 ${top + 1}l5 5 10-12`} />
          </g>
        );
      })}

      <g className="qgl-pencil">
        <path d="m0 0 9-21 7 3-9 21z" />
        <path className="qgl-pencil-lead" d="m0 0 5-2" />
        <path className="qgl-pencil-band" d="m5-12 7 3" />
      </g>
      <path className="qgl-coral-star" d="m332 89 3 7 7 3-7 3-3 7-3-7-7-3 7-3z" />
    </svg>
  );
}

export default function QuizGeneratingLoader({
  status = 'loading',
  fileName = '',
  onCancel,
  onRetry,
}) {
  const isError = status === 'error';

  return (
    <section
      className={`quiz-generating-loader${isError ? ' is-error' : ''}`}
      aria-busy={!isError}
    >
      <div className="quiz-generating-loader__art-wrap">
        <TestPaper fileName={fileName} />
      </div>
      {isError ? (
        <>
          <p className="quiz-generating-loader__status" role="alert">Something went wrong</p>
          <button className="btn btn-primary quiz-generating-loader__action" type="button" onClick={onRetry}>
            Try again
          </button>
        </>
      ) : (
        <>
          <p className="quiz-generating-loader__status" role="status" aria-live="polite" aria-atomic="true">
            Generating your questions
            <span className="qgl-dots" aria-hidden="true"><i>.</i><i>.</i><i>.</i></span>
          </p>
          <p className="quiz-generating-loader__hint">This can take a few seconds.</p>
          <button className="btn btn-ghost quiz-generating-loader__action" type="button" onClick={onCancel}>
            Cancel
          </button>
        </>
      )}
    </section>
  );
}
