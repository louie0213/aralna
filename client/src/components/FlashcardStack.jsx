import { useEffect, useRef, useState } from 'react';

export default function FlashcardStack({ cards }) {
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [dragX, setDragX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [leaving, setLeaving] = useState('');
  const [entering, setEntering] = useState('');
  const [isAnimating, setIsAnimating] = useState(false);
  const pointerRef = useRef(null);
  const suppressClickRef = useRef(false);
  const animationLockRef = useRef(false);
  const animationTimerRef = useRef(null);
  const card = cards[index];

  useEffect(() => () => window.clearTimeout(animationTimerRef.current), []);

  function go(next, direction) {
    if (animationLockRef.current || next < 0 || next >= cards.length) return;
    animationLockRef.current = true;
    setIsAnimating(true);
    setLeaving(direction);
    setEntering('');
    setDragX(0);
    setDragging(false);
    animationTimerRef.current = window.setTimeout(() => {
      setIndex(next);
      setFlipped(false);
      setLeaving('');
      setEntering(direction === 'left' ? 'right' : 'left');
      animationTimerRef.current = window.setTimeout(() => {
        setEntering('');
        animationLockRef.current = false;
        setIsAnimating(false);
      }, 360);
    }, window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 160 : 420);
  }

  function onPointerDown(event) {
    if (animationLockRef.current || event.button > 0) return;
    pointerRef.current = {
      id: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      lastX: event.clientX,
      lastTime: performance.now(),
      velocity: 0,
      dragging: false,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function onPointerMove(event) {
    const pointer = pointerRef.current;
    if (!pointer || pointer.id !== event.pointerId) return;
    const deltaX = event.clientX - pointer.startX;
    const deltaY = event.clientY - pointer.startY;
    if (!pointer.dragging && Math.abs(deltaX) > 7 && Math.abs(deltaX) > Math.abs(deltaY)) {
      pointer.dragging = true;
      setDragging(true);
    }
    if (!pointer.dragging) return;
    const now = performance.now();
    pointer.velocity = (event.clientX - pointer.lastX) / Math.max(now - pointer.lastTime, 1);
    pointer.lastX = event.clientX;
    pointer.lastTime = now;
    setDragX(deltaX);
  }

  function onPointerUp(event) {
    const pointer = pointerRef.current;
    if (!pointer || pointer.id !== event.pointerId) return;
    pointerRef.current = null;
    if (!pointer.dragging) return;
    suppressClickRef.current = true;
    const distance = event.clientX - pointer.startX;
    const width = event.currentTarget.getBoundingClientRect().width;
    const swiped = Math.abs(distance) >= width * 0.35
      || (Math.abs(pointer.velocity) >= 0.6 && Math.abs(distance) >= 30);
    const nextIndex = distance > 0 ? index + 1 : index - 1;
    if (swiped && nextIndex >= 0 && nextIndex < cards.length) {
      setDragging(false);
      go(nextIndex, distance < 0 ? 'left' : 'right');
      return;
    }
    setDragX(0);
    setDragging(false);
  }

  function onPointerCancel() {
    pointerRef.current = null;
    setDragX(0);
    setDragging(false);
  }

  function onCardClick() {
    if (suppressClickRef.current) {
      suppressClickRef.current = false;
      return;
    }
    if (!animationLockRef.current) setFlipped((value) => !value);
  }

  function onCardKeyDown(event) {
    if (event.key === 'ArrowLeft' && index > 0) {
      event.preventDefault();
      go(index - 1, 'left');
    } else if (event.key === 'ArrowRight' && index < cards.length - 1) {
      event.preventDefault();
      go(index + 1, 'right');
    }
  }

  const dragStrength = Math.min(Math.abs(dragX) / 140, 1);
  const cardClass = [
    'stack-card',
    flipped ? 'is-revealed' : '',
    dragging ? (dragX < 0 ? 'is-swiping-left' : 'is-swiping-right') : '',
    leaving ? `is-leaving-${leaving}` : '',
    entering ? `is-entering-${entering}` : '',
  ].filter(Boolean).join(' ');

  return (
    <div className="stack-wrap">
      <div className={`stack${dragging || leaving || entering ? ' is-moving' : ''}`}>
        {[2, 1].map((offset) => {
          const peekCard = cards[index + offset];
          return peekCard ? (
            <div className={`stack-ghost stack-ghost-${offset}`} key={offset} aria-hidden="true">
              <span>{peekCard.question}</span>
            </div>
          ) : null;
        })}
        <button
          type="button"
          className={cardClass}
          style={{
            '--drag-strength': dragStrength,
            transform: dragX ? `translate3d(${dragX}px, 0, 0) rotate(${dragX * 0.045}deg) scale(1.025)` : undefined,
          }}
          onClick={onCardClick}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerCancel}
          onKeyDown={onCardKeyDown}
          aria-pressed={flipped}
          aria-label={flipped ? 'Show question' : 'Show answer'}
          disabled={Boolean(leaving || entering)}
        >
          <span className="stack-swipe-glow" aria-hidden="true" />
          <span className="stack-swipe-label stack-swipe-label-left" aria-hidden="true">Previous</span>
          <span className="stack-swipe-label stack-swipe-label-right" aria-hidden="true">Next</span>
          <span className="stack-card-inner">
            <span className="stack-card-face stack-card-front" aria-hidden={flipped}>
              <span className="flashcard-label">Question</span>
              <span className="flashcard-text">{card.question}</span>
              <span className="flashcard-hint">Tap it</span>
            </span>
            <span className="stack-card-face stack-card-back" aria-hidden={!flipped}>
              <span className="flashcard-label">Answer</span>
              <span className="flashcard-text">{card.answer}</span>
              <span className="flashcard-hint">Tap it</span>
            </span>
          </span>
        </button>
      </div>

      <div className="stack-nav">
        <button
          className="btn btn-ghost flashcard-nav-button"
          type="button"
          onClick={() => go(index - 1, 'left')}
          disabled={index === 0 || isAnimating}
        >
          Previous
        </button>
        <span className="stack-count">Card {index + 1} of {cards.length}</span>
        <button
          className="btn btn-primary flashcard-nav-button"
          type="button"
          onClick={() => go(index + 1, 'right')}
          disabled={index === cards.length - 1 || isAnimating}
        >
          Next
        </button>
      </div>
    </div>
  );
}
