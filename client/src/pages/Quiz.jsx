// this file handles taking a quiz attempt and showing scores
import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, m } from 'motion/react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../AuthContext.jsx';
import { api } from '../api.js';
import ConfirmDialog from '../components/ConfirmDialog.jsx';
import { Reveal, MagneticButton } from '../components/motion';
import { useMotionConfig } from '../lib/motion.js';

const fmtDate = (date) => new Date(date).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });

export default function Quiz() {
  const { id } = useParams();
  const { user, activeQuizId, startQuizSession, endQuizSession } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { variants } = useMotionConfig();
  const [quiz, setQuiz] = useState(null);
  const [answers, setAnswers] = useState({});
  const [attempts, setAttempts] = useState([]);
  const [remainingAttempts, setRemainingAttempts] = useState(5);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [attemptStarted, setAttemptStarted] = useState(false);
  const [confirmStart, setConfirmStart] = useState(false);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [error, setError] = useState('');
  const [submission, setSubmission] = useState(null);
  const [navigationWarning, setNavigationWarning] = useState(false);
  const attemptFormRef = useRef(null);

  useEffect(() => {
    setAttemptStarted(user.role === 'student' && activeQuizId === id);
  }, [activeQuizId, id, user.role]);

  function updateAnswer(questionId, answer) {
    setAnswers((current) => {
      const updated = { ...current, [questionId]: answer };
      window.sessionStorage.setItem(`aralna_quiz_answers_${id}`, JSON.stringify(updated));
      return updated;
    });
  }

  function advanceQuestion() {
    if (!attemptFormRef.current?.reportValidity()) return;
    setQuestionIndex((current) => Math.min(current + 1, quiz.questions.length - 1));
  }

  useEffect(() => {
    setQuestionIndex(0);
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
        }
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id, user.role]);

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
      setSubmission({ ...result.attempt, answerResults: result.answerResults });
      setAttempts((current) => [...current, result.attempt]);
      setAnswers({});
      setQuestionIndex(0);
      window.sessionStorage.removeItem(`aralna_quiz_answers_${id}`);
      setRemainingAttempts(result.remainingAttempts);
      setAttemptStarted(false);
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

  function beginAttempt() {
    setConfirmStart(false);
    setError('');
    setSubmission(null);
    setAnswers({});
    setQuestionIndex(0);
    window.sessionStorage.removeItem(`aralna_quiz_answers_${id}`);
    setAttemptStarted(true);
    startQuizSession(id);
  }

  if (loading) return <p className="page-status">Loading quiz...</p>;
  if (error && !quiz) return <div className="alert" role="alert">{error}</div>;
  if (!quiz) return null;
  if (quiz.questions.length === 0) {
    return <div className="alert" role="alert">This quiz has no questions available.</div>;
  }

  const questionCount = quiz.questions.length;
  const question = quiz.questions[questionIndex];
  const isLastQuestion = questionIndex === questionCount - 1;
  const progress = Math.round(((questionIndex + 1) / questionCount) * 100);

  return (
    <div className="quiz-taking-page">
      {activeQuizId !== id && <Link className="text-action quiz-back-link" to="/app/quizzes">← All quizzes</Link>}
      <Reveal as="header" className="page-heading" variant="fadeUp">
        <div>
          <p className="page-eyebrow">ASSESSMENT · {quiz.questions.length} QUESTIONS</p>
          <h1>{quiz.title}</h1>
          {quiz.description && <p className="page-description">{quiz.description}</p>}
        </div>
        <span className="section-meta">{remainingAttempts} of 5 attempts left</span>
      </Reveal>
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
        <Reveal variant="scaleIn">
          <div className="auth-notice" role="status">
            Attempt {submission.attemptNumber} recorded: {submission.score} out of {submission.total}.
            {remainingAttempts > 0 ? ` You have ${remainingAttempts} attempt${remainingAttempts === 1 ? '' : 's'} remaining.` : ' You have used all attempts.'}
          </div>
          {submission.answerResults && (
            <ol className="quiz-answer-results" aria-label="Answer results">
              {submission.answerResults.map(({ questionId, isCorrect }) => {
                const resultQuestion = quiz.questions.find((item) => item.id === questionId);
                return (
                  <li className={isCorrect ? 'is-correct' : 'is-incorrect'} key={questionId}>
                    <span className="quiz-answer-result-icon" aria-hidden="true">{isCorrect ? '+' : '!'}</span>
                    <span>{resultQuestion?.prompt || 'Question result unavailable'}</span>
                    <strong className="quiz-answer-result-label">{isCorrect ? 'Correct' : 'Incorrect'}</strong>
                  </li>
                );
              })}
            </ol>
          )}
        </Reveal>
      )}
      {user.role !== 'student' ? (
        <Reveal as="section" className="panel" variant="fadeUp">
          <p className="muted">Admin preview: students can take this quiz from their study space.</p>
        </Reveal>
      ) : remainingAttempts > 0 && attemptStarted ? (
        <form ref={attemptFormRef} className="quiz-taking-form" onSubmit={submit}>
          {/* Question panel — focal: slide between questions */}
          <AnimatePresence mode="wait" initial={false}>
            <m.section
              key={question.id}
              className="panel quiz-student-question"
              variants={variants.slideInX}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              <p className="page-eyebrow">QUESTION {questionIndex + 1} · {question.type.replace('-', ' ').toUpperCase()}</p>
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
            </m.section>
          </AnimatePresence>
          <div className="quiz-step-bar">
            <div className="quiz-step-progress">
              <div className="quiz-step-progress-label">
                <span aria-live="polite">Question {questionIndex + 1} of {questionCount}</span>
                <span>{progress}%</span>
              </div>
              <div
                className="quiz-progress-track"
                role="progressbar"
                aria-label="Quiz progress"
                aria-valuemin={1}
                aria-valuemax={questionCount}
                aria-valuenow={questionIndex + 1}
                aria-valuetext={`Question ${questionIndex + 1} of ${questionCount}`}
              >
                <span style={{ '--quiz-progress': `${progress}%` }} />
              </div>
            </div>
            <div className="quiz-step-actions">
              <button
                className="btn btn-ghost quiz-step-button"
                type="button"
                onClick={() => setQuestionIndex((current) => Math.max(current - 1, 0))}
                disabled={questionIndex === 0 || submitting}
              >
                Previous
              </button>
              {isLastQuestion ? (
                <MagneticButton as="button" className="btn btn-primary quiz-step-button" type="submit" disabled={submitting}>
                  {submitting ? 'Submitting...' : 'Submit attempt'}
                </MagneticButton>
              ) : (
                <MagneticButton as="button" className="btn btn-primary quiz-step-button" type="button" onClick={advanceQuestion} disabled={submitting}>
                  Next
                </MagneticButton>
              )}
            </div>
          </div>
        </form>
      ) : remainingAttempts > 0 ? (
        <Reveal as="section" className="panel quiz-attempt-start" variant="scaleIn">
          <p className="muted">
            {submission
              ? `Your next attempt will be attempt ${attempts.length + 1} of 5. Confirm when you’re ready to begin.`
              : `You’re about to begin attempt ${attempts.length + 1} of 5. Your answers will be locked in until you submit.`}
          </p>
          <MagneticButton as="button" className="btn btn-primary quiz-submit" type="button" onClick={() => setConfirmStart(true)}>
            Start attempt {attempts.length + 1}
          </MagneticButton>
        </Reveal>
      ) : (
        <Reveal as="section" className="panel" variant="fadeUp">
          <p className="muted">You have used all five attempts for this quiz.</p>
        </Reveal>
      )}

      <Reveal as="section" className="quiz-history" variant="fadeUp">
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
      </Reveal>

      <ConfirmDialog
        open={confirmStart}
        eyebrow="ASSESSMENT"
        title={`Start attempt ${attempts.length + 1} of 5?`}
        message="Once you begin, navigation will be locked until you submit your answers."
        confirmLabel="Start attempt"
        cancelLabel="Not yet"
        tone="primary"
        reverseActions
        onCancel={() => setConfirmStart(false)}
        onConfirm={beginAttempt}
      />
    </div>
  );
}
