import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../api.js';

function Flashcard({ q, a }) {
  const [flipped, setFlipped] = useState(false);
  return (
    <button type="button" className={flipped ? 'flashcard flashcard-flipped' : 'flashcard'} onClick={() => setFlipped((v) => !v)}>
      <span className="flashcard-label">{flipped ? 'Answer' : 'Question'}</span>
      <span className="flashcard-text">{flipped ? a : q}</span>
      <span className="flashcard-hint">Tap to flip</span>
    </button>
  );
}

export default function Reviewer() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [reviewer, setReviewer] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get(`/reviewers/${id}`).then((d) => setReviewer(d.reviewer)).catch((err) => setError(err.message));
  }, [id]);

  async function remove() {
    if (!window.confirm('Delete this reviewer? This cannot be undone.')) return;
    try {
      await api.delete(`/reviewers/${id}`);
      navigate('/app/reviewers', { replace: true });
    } catch (err) {
      setError(err.message);
    }
  }

  if (error) return <div className="alert" role="alert">{error}</div>;
  if (!reviewer) return <p className="page-status">Loading...</p>;

  if (reviewer.status === 'failed') {
    return (
      <>
        <h1>{reviewer.documentName}</h1>
        <div className="alert" role="alert">{reviewer.error || 'This reviewer could not be generated.'}</div>
        <button className="btn btn-ghost" onClick={remove}>Delete</button>
      </>
    );
  }

  return (
    <>
      <h1>{reviewer.documentName}</h1>

      <section className="panel">
        <h2>Summary</h2>
        <p className="reviewer-summary">{reviewer.summary}</p>
      </section>

      {reviewer.primaryTopics.length > 0 && (
        <section className="panel">
          <h2>Primary topics</h2>
          <ul className="chips">
            {reviewer.primaryTopics.map((t) => (
              <li key={t} className="chip chip-primary">{t}</li>
            ))}
          </ul>
        </section>
      )}

      {reviewer.minorTopics.length > 0 && (
        <section className="panel">
          <h2>Minor topics</h2>
          <ul className="chips">
            {reviewer.minorTopics.map((t) => (
              <li key={t} className="chip">{t}</li>
            ))}
          </ul>
        </section>
      )}

      {reviewer.funFacts.length > 0 && (
        <section className="panel">
          <h2>Fun facts</h2>
          <ul className="fun-facts">
            {reviewer.funFacts.map((f, i) => (
              <li key={i}>{f}</li>
            ))}
          </ul>
        </section>
      )}

      {reviewer.flashcards.length > 0 && (
        <section className="panel">
          <h2>Flashcards</h2>
          <div className="flashcard-grid">
            {reviewer.flashcards.map((f, i) => (
              <Flashcard key={i} q={f.question} a={f.answer} />
            ))}
          </div>
        </section>
      )}

      <button className="btn btn-ghost" onClick={remove}>Delete reviewer</button>
    </>
  );
}
