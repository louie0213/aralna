import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../api.js';
import FlashcardStack from '../components/FlashcardStack.jsx';

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

  const list = (title, emoji, items) => {
    if (!items || items.length === 0) return null;
    return (
      <section className="panel">
        <h2>{emoji} {title}</h2>
        <ul className="guide-list">
          {items.map((item, i) => <li key={i}>{item}</li>)}
        </ul>
      </section>
    );
  };

  return (
    <>
      <h1>{reviewer.documentName}</h1>

      <section className="panel">
        <h2>📌 Overview</h2>
        <p className="reviewer-summary">{reviewer.overview}</p>
      </section>

      {list('Learning Objectives', '🎯', reviewer.learningObjectives)}
      {list('Key Takeaways', '⭐', reviewer.keyTakeaways)}

      {reviewer.importantTopics.length > 0 && (
        <section className="panel">
          <h2>🔥 Important Topics</h2>
          <ul className="chips">{reviewer.importantTopics.map((t) => <li key={t} className="chip chip-primary">{t}</li>)}</ul>
        </section>
      )}

      {reviewer.minorTopics.length > 0 && (
        <section className="panel">
          <h2>📚 Minor Topics</h2>
          <ul className="chips">{reviewer.minorTopics.map((t) => <li key={t} className="chip">{t}</li>)}</ul>
        </section>
      )}

      {reviewer.keyTerms.length > 0 && (
        <section className="panel">
          <h2>📖 Key Terms</h2>
          <dl className="term-list">
            {reviewer.keyTerms.map((t, i) => (
              <div key={i} className="term-row">
                <dt>{t.term}</dt>
                <dd>{t.definition}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      {list('Concept Relationships', '🔗', reviewer.conceptRelationships)}
      {list('Examples', '📝', reviewer.examples)}
      {list('Common Misconceptions', '⚠️', reviewer.commonMisconceptions)}
      {list('Fun Facts', '💡', reviewer.funFacts)}

      {reviewer.flashcards.length > 0 && (
        <section className="panel">
          <h2>🗂️ Flashcards</h2>
          <FlashcardStack cards={reviewer.flashcards} />
        </section>
      )}

      <button className="btn btn-ghost" onClick={remove}>Delete reviewer</button>
    </>
  );
}