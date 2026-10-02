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
          className={flipped ? 'stack-card stack-card-flipped' : 'stack-card'}
          onClick={() => setFlipped((v) => !v)}
        >
          <span className="flashcard-label">{flipped ? 'Answer' : 'Question'}</span>
          <span className="flashcard-text">{flipped ? card.answer : card.question}</span>
          <span className="flashcard-hint">Tap to flip</span>
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