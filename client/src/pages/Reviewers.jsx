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
  const [query, setQuery] = useState('');

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

  const visible = useMemo(() => {
    const search = query.trim().toLowerCase();
    return reviewers.filter((reviewer) => (
      (year === 'all' || yearOf(reviewer.createdAt) === Number(year))
      && (!search || reviewer.documentName.toLowerCase().includes(search))
    ));
  }, [reviewers, year, query]);

  const readyCount = reviewers.filter((reviewer) => reviewer.status === 'ready').length;

  return (
    <section className="reviewer-library">
      <header className="reviewer-library-header">
        <div>
          <p className="page-eyebrow">YOUR STUDY LIBRARY</p>
          <h1>Your reviewers</h1>
          <p className="reviewer-library-description">Your notes, transformed into study-ready guides.</p>
        </div>
        {!loading && reviewers.length > 0 && (
          <div className="reviewer-library-stats" aria-label={`${readyCount} ready reviewers out of ${reviewers.length}`}>
            <span className="reviewer-library-stat-number">{reviewers.length}</span>
            <span className="reviewer-library-stat-label">saved</span>
            <span className="reviewer-library-stat-divider" aria-hidden="true" />
            <span className="reviewer-library-stat-ready">{readyCount} ready</span>
          </div>
        )}
      </header>
      {error && <div className="alert" role="alert">{error}</div>}
      {!loading && reviewers.length > 0 && (
        <div className="reviewer-library-toolbar">
          <label className="reviewer-search">
            <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.8" cy="10.8" r="6.8" /><path d="m16 16 4.5 4.5" /></svg>
            <input
              type="search"
              aria-label="Search reviewers"
              placeholder="Search your reviewers..."
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>
          <label className="reviewer-year-filter">
            <span>Created</span>
            <select aria-label="Filter by year" value={year} onChange={(e) => setYear(e.target.value)}>
              <option value="all">Any year</option>
              {years.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </label>
          <span className="reviewer-library-result-count">
            {visible.length} {visible.length === 1 ? 'reviewer' : 'reviewers'}
          </span>
        </div>
      )}
      {loading ? (
        <p className="page-status">Loading...</p>
      ) : reviewers.length === 0 ? (
        <section className="reviewer-library-empty">
          <span className="reviewer-empty-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24"><path d="M5 4.5A2.5 2.5 0 0 1 7.5 2H20v18H7.5A2.5 2.5 0 0 1 5 17.5z" /><path d="M5 17.5A2.5 2.5 0 0 1 7.5 15H20M9 7h7m-7 4h7" /></svg>
          </span>
          <h2>Your library starts here</h2>
          <p>Upload a document and turn your notes into a study-ready reviewer.</p>
          <Link className="btn btn-primary reviewer-empty-action" to="/app/upload">Upload a document</Link>
        </section>
      ) : visible.length === 0 ? (
        <section className="reviewer-library-empty reviewer-library-empty-compact">
          <h2>No matches found</h2>
          <p>Try another title or change the year filter.</p>
          <button className="btn btn-ghost reviewer-empty-action" type="button" onClick={() => { setQuery(''); setYear('all'); }}>
            Clear filters
          </button>
        </section>
      ) : (
        <ul className="reviewer-library-list">
          {visible.map((r) => (
            <li key={r.id} className="reviewer-library-item">
              <Link className="reviewer-library-card" to={`/app/reviewers/${r.id}`}>
                <span className="reviewer-library-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24"><path d="M5 4.5A2.5 2.5 0 0 1 7.5 2H20v18H7.5A2.5 2.5 0 0 1 5 17.5z" /><path d="M5 17.5A2.5 2.5 0 0 1 7.5 15H20M9 7h7m-7 4h7" /></svg>
                </span>
                <span className="reviewer-library-content">
                  <span className="reviewer-library-card-heading">
                    <span className="reviewer-library-title" title={r.documentName}>{r.documentName}</span>
                    <span className={`reviewer-library-status${r.status === 'ready' ? ' is-ready' : ' is-failed'}`}>
                      <span aria-hidden="true" />
                      {r.status === 'ready' ? 'Ready' : 'Failed'}
                    </span>
                  </span>
                  <span className="reviewer-library-topics">
                    {r.status === 'ready' && r.topics?.length
                      ? r.topics.slice(0, 3).map((topic) => topic.name).join(' · ')
                      : r.status === 'ready' ? 'Study guide ready to review' : 'This reviewer could not be generated'}
                  </span>
                  <span className="reviewer-library-date">
                    <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4M8 3v4M3 10h18" /></svg>
                    Created {fmt(r.createdAt)}
                  </span>
                </span>
                <svg className="reviewer-library-arrow" viewBox="0 0 24 24" aria-hidden="true"><path d="m9 18 6-6-6-6" /></svg>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}