import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../api.js';

function getTopics(reviewer) {
  if (Array.isArray(reviewer.topics) && reviewer.topics.length) return reviewer.topics;

  const bulletPoints = [
    reviewer.overview,
    ...(reviewer.keyTakeaways || []),
    ...(reviewer.learningObjectives || []),
    ...(reviewer.conceptRelationships || []),
    ...(reviewer.examples || []),
    ...(reviewer.commonMisconceptions || []),
    ...(reviewer.funFacts || []),
    ...(reviewer.keyTerms || []).map(({ term, definition }) => `${term}: ${definition}`),
  ].filter((point) => typeof point === 'string' && point.trim());

  return bulletPoints.length ? [{ name: 'Study notes', bulletPoints }] : [];
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

  const topics = getTopics(reviewer);

  return (
    <>
      <h1>{reviewer.documentName}</h1>
      <div className="reviewer-topics">
        {topics.map((topic, index) => (
          <section className="reviewer-topic" key={`${topic.name}-${index}`}>
            <h2>{topic.name}</h2>
            <ul>
              {topic.bulletPoints.map((point, pointIndex) => <li key={pointIndex}>{point}</li>)}
            </ul>
          </section>
        ))}
        {topics.length === 0 && <p className="muted">No topic notes were generated for this document.</p>}
      </div>

      <button className="btn btn-ghost" onClick={remove}>Delete reviewer</button>
    </>
  );
}