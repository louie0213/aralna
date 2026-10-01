import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';

const fmt = (d) => new Date(d).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });

export default function Reviewers() {
  const [reviewers, setReviewers] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/reviewers')
      .then((d) => setReviewers(d.reviewers))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <h1>Your reviewers</h1>
      {error && <div className="alert" role="alert">{error}</div>}
      {loading ? (
        <p className="page-status">Loading...</p>
      ) : reviewers.length === 0 ? (
        <section className="panel">
          <p className="muted">
            Nothing here yet. Go to <Link to="/app/upload">Upload</Link>, upload a document, then click Generate reviewer on it.
          </p>
        </section>
      ) : (
        <ul className="doc-list">
          {reviewers.map((r) => (
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
