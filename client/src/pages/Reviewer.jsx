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
  const [view, setView] = useState('topics');
  const [selectedYear, setSelectedYear] = useState('all');
  const [selectedTerm, setSelectedTerm] = useState('');

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
  const timeline = (reviewer.timeline || []).filter(
    (entry) => entry && typeof entry.year === 'string' && typeof entry.summary === 'string'
  );
  const years = [...new Set(timeline.map((entry) => entry.year))]
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  const keyTerms = (reviewer.keyTerms || []).filter(
    (entry) => entry && typeof entry.term === 'string' && typeof entry.definition === 'string'
  );
  const availableViews = [
    ...(topics.length > 0 ? ['topics'] : []),
    ...(years.length > 0 ? ['years'] : []),
    ...(keyTerms.length > 0 ? ['terms'] : []),
  ];
  const selectedView = availableViews.includes(view) ? view : availableViews[0] || 'topics';
  const selectedTimeline = selectedYear === 'all'
    ? timeline
    : timeline.filter((entry) => entry.year === selectedYear);
  const selectedKeyTerm = keyTerms.find((entry) => entry.term === selectedTerm);

  return (
    <>
      <h1>{reviewer.documentName}</h1>

      {(topics.length > 0 || years.length > 0 || keyTerms.length > 0) && (
        <div className="toolbar reviewer-filter">
          <label htmlFor="reviewer-view">Show</label>
          <select id="reviewer-view" value={selectedView} onChange={(e) => setView(e.target.value)}>
            {topics.length > 0 && <option value="topics">Topics</option>}
            {years.length > 0 && <option value="years">Years</option>}
            {keyTerms.length > 0 && <option value="terms">Terms</option>}
          </select>
          {selectedView === 'years' && years.length > 0 && (
            <select aria-label="Choose a year" value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)}>
              <option value="all">All years</option>
              {years.map((year) => <option key={year} value={year}>{year}</option>)}
            </select>
          )}
          {selectedView === 'terms' && keyTerms.length > 0 && (
            <select aria-label="Choose a term" value={selectedTerm} onChange={(e) => setSelectedTerm(e.target.value)}>
              <option value="">Choose a term</option>
              {keyTerms.map((entry, index) => <option key={`${entry.term}-${index}`} value={entry.term}>{entry.term}</option>)}
            </select>
          )}
        </div>
      )}

      <div className="reviewer-topics">
        {selectedView === 'topics' && topics.map((topic, index) => (
          <section className="reviewer-topic" key={`${topic.name}-${index}`}>
            <h2>{topic.name}</h2>
            <ul>
              {topic.bulletPoints.map((point, pointIndex) => <li key={pointIndex}>{point}</li>)}
            </ul>
            {topic.formulaExamples?.length > 0 && (
              <div className="reviewer-formulas">
                {topic.formulaExamples.map((entry, formulaIndex) => (
                  <article className="reviewer-formula" key={`${entry.formula}-${formulaIndex}`}>
                    <p className="reviewer-formula-label">Formula</p>
                    <code>{entry.formula}</code>
                    <p className="reviewer-formula-label">Worked example</p>
                    <p className="reviewer-worked-example">{entry.workedExample}</p>
                  </article>
                ))}
              </div>
            )}
          </section>
        ))}
        {selectedView === 'years' && selectedTimeline.map((entry, index) => (
          <section className="reviewer-topic" key={`${entry.year}-${index}`}>
            <h2>{entry.year}</h2>
            <p>{entry.summary}</p>
          </section>
        ))}
        {selectedView === 'terms' && selectedKeyTerm && (
          <section className="reviewer-topic">
            <h2>{selectedKeyTerm.term}</h2>
            <p>{selectedKeyTerm.definition}</p>
          </section>
        )}
        {selectedView === 'topics' && topics.length === 0 && <p className="muted">No topic notes were generated for this document.</p>}
      </div>

      <button className="btn btn-ghost" onClick={remove}>Delete reviewer</button>
    </>
  );
}