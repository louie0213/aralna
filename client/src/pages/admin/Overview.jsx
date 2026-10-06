import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api.js';

function Stat({ label, value, note }) {
  return (
    <article className="metric-card">
      <div className="metric-label">{label}</div>
      <div className="metric-value">{value}</div>
      {note && <p className="metric-note">{note}</p>}
    </article>
  );
}

export default function Overview() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/admin/stats').then(setStats).catch((err) => setError(err.message));
  }, []);

  if (error) return <div className="alert" role="alert">{error}</div>;
  if (!stats) return <p className="page-status">Loading...</p>;

  const { users, generations, topTopics } = stats;
  const max = topTopics[0]?.count || 1;

  return (
    <div className="admin-dashboard">
      <header className="page-heading">
        <div>
          <p className="page-eyebrow">ADMIN WORKSPACE</p>
          <h1>Overview</h1>
          <p className="page-description">A clear view of account activity and what students are studying.</p>
        </div>
        <Link className="btn btn-ghost page-heading-action" to="/admin/users">Manage users <span aria-hidden="true">↗</span></Link>
      </header>

      <div className="metrics-grid">
        <Stat label="Quizzes generated" value={generations.quizzes} note={`${generations.quizzesLast7Days} in the last 7 days`} />
        <Stat label="Active students" value={users.activeStudents} note="Used the app in the last 7 days" />
        <Stat label="Registered students" value={users.students} note={`${users.admins} admin${users.admins === 1 ? '' : 's'}`} />
        <Stat label="Disabled accounts" value={users.disabled} />
      </div>

      <section className="panel topics-panel">
        <div className="section-heading">
          <div>
            <p className="page-eyebrow">STUDY ACTIVITY</p>
            <h2>Most generated topics</h2>
          </div>
          <span className="section-meta">All time</span>
        </div>
        {topTopics.length === 0 ? (
          <div className="empty-state">
            <span className="empty-state-mark" aria-hidden="true">01</span>
            <p>No study activity yet</p>
            <span>Topics will appear here after students create quizzes, flashcards, or summaries.</span>
          </div>
        ) : (
          <ol className="topic-list">
            {topTopics.map((t) => (
              <li key={t.topic} className="topic-row">
                <span className="topic-name" title={t.topic}>{t.topic}</span>
                <span className="topic-track"><span className="topic-fill" style={{ width: `${(t.count / max) * 100}%` }} /></span>
                <span className="topic-count">{t.count}</span>
              </li>
            ))}
          </ol>
        )}
        <p className="topic-footnote">Counts quizzes, flashcards, and summaries.</p>
      </section>
    </div>
  );
}
