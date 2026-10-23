import { useState } from 'react';

export default function FlashcardStack({ cards }) {
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const card = cards[index];

  function go(next) {
    setFlipped(false);
    setIndex(next);
  }

  return (
    <div className="stack-wrap">
      <div className="stack">
        <div className="stack-ghost stack-ghost-2" aria-hidden="true" />
        <div className="stack-ghost stack-ghost-1" aria-hidden="true" />
        <button
          type="button"
          className="stack-card"
          onClick={() => setFlipped((v) => !v)}
          aria-pressed={flipped}
          aria-label={flipped ? 'Show question' : 'Show answer'}
        >
          <span className={flipped ? 'stack-card-inner stack-card-flipped' : 'stack-card-inner'}>
            <span className="stack-card-face stack-card-front" aria-hidden={flipped}>
              <span className="flashcard-label">Question</span>
              <span className="flashcard-text">{card.question}</span>
              <span className="flashcard-hint">Tap to flip</span>
            </span>
            <span className="stack-card-face stack-card-back" aria-hidden={!flipped}>
              <span className="flashcard-label">Answer</span>
              <span className="flashcard-text">{card.answer}</span>
              <span className="flashcard-hint">Tap to flip back</span>
            </span>
          </span>
        </button>
      </div>

      <div className="stack-nav">
        <button className="btn btn-ghost" disabled={index === 0} onClick={() => go(index - 1)}>Previous</button>
        <span className="stack-count">Card {index + 1} of {cards.length}</span>
        <button className="btn btn-ghost" disabled={index === cards.length - 1} onClick={() => go(index + 1)}>Next</button>
      </div>
    </div>
  );
}