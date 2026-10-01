import { useEffect, useState } from 'react';
import { api } from '../../api.js';

function Stat({ label, value, note }) {
  return (
    <div className="stat">
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
      {note && <div className="stat-note">{note}</div>}
    </div>
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
    <>
      <h1>Overview</h1>
      <div className="stats">
        <Stat label="Quizzes generated" value={generations.quizzes} note={`${generations.quizzesLast7Days} in the last 7 days`} />
        <Stat label="Active students" value={users.activeStudents} note="Used the app in the last 7 days" />
        <Stat label="Registered students" value={users.students} note={`${users.admins} admin${users.admins === 1 ? '' : 's'}`} />
        <Stat label="Disabled accounts" value={users.disabled} />
      </div>

      <section className="panel">
        <h2>Most generated topics</h2>
        {topTopics.length === 0 ? (
          <p className="muted">No generations yet. Topics appear here after students generate quizzes, flashcards or summaries.</p>
        ) : (
          <ol className="bars">
            {topTopics.map((t) => (
              <li key={t.topic} className="bar-row">
                <span className="bar-name" title={t.topic}>{t.topic}</span>
                <span className="bar-track"><span className="bar-fill" style={{ width: `${(t.count / max) * 100}%` }} /></span>
                <span className="bar-count">{t.count}</span>
              </li>
            ))}
          </ol>
        )}
        <p className="muted small">Counts every kind of generation: quizzes, flashcards and summaries.</p>
      </section>
    </>
  );
}
