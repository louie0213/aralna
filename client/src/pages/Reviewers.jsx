import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';

const fmt = (d) => new Date(d).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });
const yearOf = (d) => new Date(d).getFullYear();

export default function Reviewers() {
  const [reviewers, setReviewers] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [year, setYear] = useState('all');

  useEffect(() => {
    api
      .get('/reviewers')
      .then((d) => setReviewers(d.reviewers))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const years = useMemo(
    () => [...new Set(reviewers.map((r) => yearOf(r.createdAt)))].sort((a, b) => b - a),
    [reviewers]
  );

  const visible = useMemo(
    () => (year === 'all' ? reviewers : reviewers.filter((r) => yearOf(r.createdAt) === Number(year))),
    [reviewers, year]
  );

  return (
    <>
      <h1>Your reviewers</h1>
      {error && <div className="alert" role="alert">{error}</div>}
      {!loading && reviewers.length > 0 && (
        <div className="toolbar">
          <select aria-label="Filter by year" value={year} onChange={(e) => setYear(e.target.value)}>
            <option value="all">All years</option>
            {years.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <span className="count">
            {year === 'all'
              ? `${reviewers.length} ${reviewers.length === 1 ? 'reviewer' : 'reviewers'}`
              : `${visible.length} from ${year}`}
          </span>
        </div>
      )}
      {loading ? (
        <p className="page-status">Loading...</p>
      ) : reviewers.length === 0 ? (
        <section className="panel">
          <p className="muted">
            Nothing here yet. Go to <Link to="/app/upload">Upload</Link>, upload a document, then click Generate reviewer on it.
          </p>
        </section>
      ) : visible.length === 0 ? (
        <section className="panel">
          <p className="muted">No reviewers from {year}.</p>
        </section>
      ) : (
        <ul className="doc-list">
          {visible.map((r) => (
            <li key={r.id} className="doc-row">
              <Link className="doc-main" to={`/app/reviewers/${r.id}`}>
                <span className="doc-icon">📚</span>
                <span className="doc-name" title={r.documentName}>{r.documentName}</span>
                <span className={r.status === 'ready' ? 'badge' : 'badge badge-off'}>{r.status === 'ready' ? 'Ready' : 'Failed'}</span>
                <span className="doc-meta">{fmt(r.createdAt)}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}