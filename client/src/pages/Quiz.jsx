import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../AuthContext.jsx';
import { api } from '../api.js';

const fmtDate = (date) => new Date(date).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });

export default function Quiz() {
  const { id } = useParams();
  const { user, activeQuizId, startQuizSession, endQuizSession } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState(null);
  const [answers, setAnswers] = useState({});
  const [attempts, setAttempts] = useState([]);
  const [remainingAttempts, setRemainingAttempts] = useState(5);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [submission, setSubmission] = useState(null);
  const [navigationWarning, setNavigationWarning] = useState(false);

  function updateAnswer(questionId, answer) {
    setAnswers((current) => {
      const updated = { ...current, [questionId]: answer };
      window.sessionStorage.setItem(`aralna_quiz_answers_${id}`, JSON.stringify(updated));
      return updated;
    });
  }

  useEffect(() => {
    api.get(`/quizzes/${id}`)
      .then((data) => {
        setQuiz(data.quiz);
        setAttempts(data.attempts);
        setRemainingAttempts(data.remainingAttempts);
        if (user.role === 'student' && data.remainingAttempts > 0) {
          try {
            const saved = JSON.parse(window.sessionStorage.getItem(`aralna_quiz_answers_${id}`) || '{}');
            const validIds = new Set(data.quiz.questions.map((question) => question.id));
            setAnswers(Object.fromEntries(
              Object.entries(saved).filter(([questionId, answer]) => validIds.has(questionId) && typeof answer === 'string')
            ));
          } catch {
            window.sessionStorage.removeItem(`aralna_quiz_answers_${id}`);
          }
          startQuizSession(id);
        }
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id, startQuizSession, user.role]);

  useEffect(() => {
    if (location.state?.quizNavigationBlocked) {
      setNavigationWarning(true);
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [location.pathname, location.state, navigate]);

  useEffect(() => {
    if (user.role !== 'student' || activeQuizId !== id) return undefined;
    const warnBeforeLeaving = (event) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', warnBeforeLeaving);
    return () => window.removeEventListener('beforeunload', warnBeforeLeaving);
  }, [activeQuizId, id, user.role]);

  async function submit(event) {
    event.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const result = await api.post(`/quizzes/${id}/attempts`, {
        answers: quiz.questions.map((question) => ({ questionId: question.id, answer: answers[question.id] ?? '' })),
      });
      setSubmission(result.attempt);
      setAnswers({});
      window.sessionStorage.removeItem(`aralna_quiz_answers_${id}`);
      setRemainingAttempts(result.remainingAttempts);
      endQuizSession();
      const refreshed = await api.get(`/quizzes/${id}`);
      setQuiz(refreshed.quiz);
      setAttempts(refreshed.attempts);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <p className="page-status">Loading quiz...</p>;
  if (error && !quiz) return <div className="alert" role="alert">{error}</div>;
  if (!quiz) return null;

  return (
    <div className="quiz-taking-page">
      {activeQuizId !== id && <Link className="text-action quiz-back-link" to="/app/quizzes">← All quizzes</Link>}
      <header className="page-heading">
        <div>
          <p className="page-eyebrow">ASSESSMENT · {quiz.questions.length} QUESTIONS</p>
          <h1>{quiz.title}</h1>
          {quiz.description && <p className="page-description">{quiz.description}</p>}
        </div>
        <span className="section-meta">{remainingAttempts} of 5 attempts left</span>
      </header>
      {activeQuizId === id && (
        <div className="quiz-lock-notice" role="status">
          Quiz in progress. Submit your answers before leaving this page; navigating elsewhere is locked.
        </div>
      )}
      {navigationWarning && (
        <div className="alert" role="alert">
          You can’t leave while this quiz is in progress. Submit your answers first.
        </div>
      )}
      {error && <div className="alert" role="alert">{error}</div>}
      {submission && (
        <div className="auth-notice" role="status">
          Attempt {submission.attemptNumber} recorded: {submission.score} out of {submission.total}.
          {remainingAttempts > 0 ? ` You have ${remainingAttempts} attempt${remainingAttempts === 1 ? '' : 's'} remaining.` : ' You have used all attempts.'}
        </div>
      )}
      {user.role !== 'student' ? (
        <section className="panel"><p className="muted">Admin preview: students can take this quiz from their study space.</p></section>
      ) : remainingAttempts > 0 ? (
        <form className="quiz-taking-form" onSubmit={submit}>
          {quiz.questions.map((question, index) => (
            <section className="panel quiz-student-question" key={question.id}>
              <p className="page-eyebrow">QUESTION {index + 1} · {question.type.replace('-', ' ').toUpperCase()}</p>
              <h2>{question.prompt}</h2>
              {question.type === 'multiple-choice' && (
                <div className="quiz-answer-options">
                  {question.choices.map((choice) => (
                    <label className="quiz-answer-option" key={choice}>
                      <input type="radio" name={`question-${question.id}`} value={choice} checked={answers[question.id] === choice} onChange={() => updateAnswer(question.id, choice)} required />
                      <span>{choice}</span>
                    </label>
                  ))}
                </div>
              )}
              {question.type === 'identification' && (
                <label className="quiz-label">
                  Your answer
                  <input className="quiz-input" maxLength={2000} value={answers[question.id] || ''} onChange={(e) => updateAnswer(question.id, e.target.value)} required />
                </label>
              )}
              {question.type === 'true-false' && (
                <div className="quiz-answer-options quiz-true-false">
                  {['true', 'false'].map((value) => (
                    <label className="quiz-answer-option" key={value}>
                      <input type="radio" name={`question-${question.id}`} value={value} checked={answers[question.id] === value} onChange={() => updateAnswer(question.id, value)} required />
                      <span>{value === 'true' ? 'True' : 'False'}</span>
                    </label>
                  ))}
                </div>
              )}
            </section>
          ))}
          <button className="btn btn-primary quiz-submit" type="submit" disabled={submitting}>
            {submitting ? 'Submitting...' : 'Submit attempt'}
          </button>
        </form>
      ) : (
        <section className="panel"><p className="muted">You have used all five attempts for this quiz.</p></section>
      )}

      <section className="quiz-history">
        <div className="section-heading"><div><p className="page-eyebrow">YOUR RECORD</p><h2>Attempt history</h2></div></div>
        {attempts.length === 0 ? <p className="muted">No attempts submitted yet.</p> : (
          <ol className="quiz-history-list">
            {attempts.map((attempt) => (
              <li key={attempt.id || attempt.attemptNumber}>
                <span>Attempt {attempt.attemptNumber}</span>
                <strong>{attempt.score} / {attempt.total}</strong>
                <time dateTime={attempt.createdAt}>{fmtDate(attempt.createdAt)}</time>
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}
