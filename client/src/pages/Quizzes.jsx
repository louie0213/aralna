import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../AuthContext.jsx';
import { api } from '../api.js';

export default function Quizzes() {
  const { user } = useAuth();
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [removingQuizId, setRemovingQuizId] = useState('');

  useEffect(() => {
    api.get('/quizzes')
      .then((data) => setQuizzes(data.quizzes))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  async function removeQuiz(quiz) {
    if (!window.confirm(`Remove "${quiz.title}" from your quiz list? Your attempt history for this quiz will also be deleted. The quiz and other students' scores will not be affected.`)) return;
    setError('');
    setRemovingQuizId(quiz.id);
    try {
      await api.delete(`/quizzes/${quiz.id}`);
      setQuizzes((current) => current.filter((item) => item.id !== quiz.id));
    } catch (err) {
      setError(err.message);
    } finally {
      setRemovingQuizId('');
    }
  }

  return (
    <div className="quiz-student-page">
      <header className="page-heading">
        <div>
          <p className="page-eyebrow">YOUR STUDY SPACE / ASSESSMENTS</p>
          <h1>Quizzes</h1>
          <p className="page-description">Take your assigned quizzes and track your attempts.</p>
        </div>
      </header>
      {error && <div className="alert" role="alert">{error}</div>}
      {loading ? <p className="page-status">Loading quizzes...</p> : quizzes.length === 0 ? (
        <section className="panel"><p className="muted">There are no quizzes assigned yet.</p></section>
      ) : (
        <ul className="quiz-student-list">
          {quizzes.map((quiz) => {
            const attempts = quiz.attempts || [];
            const latest = attempts[0];
            return (
              <li className="panel quiz-student-card" key={quiz.id}>
                <div>
                  <p className="page-eyebrow">{quiz.questionCount} QUESTIONS</p>
                  <h2>{quiz.title}</h2>
                  {quiz.description && <p className="muted">{quiz.description}</p>}
                  <p className="quiz-attempt-status">
                    {user.role !== 'student'
                      ? `${quiz.attemptsCount || 0} submitted attempts · ${quiz.assignedStudents} active students`
                      : latest
                        ? `Latest score: ${latest.score} / ${latest.total} · ${attempts.length} of 5 attempts used`
                        : 'Not attempted yet · 5 attempts available'}
                  </p>
                </div>
                <div className="quiz-student-actions">
                  <Link className="btn btn-primary quiz-card-action" to={`/app/quizzes/${quiz.id}`}>
                    {user.role !== 'student' ? 'Preview' : quiz.remainingAttempts > 0 ? 'Open quiz' : 'View scores'} <span aria-hidden="true">↗</span>
                  </Link>
                  {user.role === 'student' && attempts.length > 0 && (
                    <button
                      className="btn btn-ghost quiz-remove-action"
                      type="button"
                      disabled={removingQuizId === quiz.id}
                      onClick={() => removeQuiz(quiz)}
                    >
                      {removingQuizId === quiz.id ? 'Removing...' : 'Remove'}
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
