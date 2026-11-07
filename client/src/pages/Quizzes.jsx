// this file lists assigned quizzes and attempt history for students
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../AuthContext.jsx';
import { api } from '../api.js';
import ConfirmDialog from '../components/ConfirmDialog.jsx';
import {
  Reveal,
  StaggerGroup,
  StaggerItem,
  MagneticButton,
} from '../components/motion';
import { stagger } from '../lib/motion.js';

export default function Quizzes() {
  const { user } = useAuth();
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [removingQuizId, setRemovingQuizId] = useState('');
  const [pendingRemove, setPendingRemove] = useState(null);

  useEffect(() => {
    api.get('/quizzes')
      .then((data) => setQuizzes(data.quizzes))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  async function removeQuiz() {
    if (!pendingRemove) return;
    setError('');
    setRemovingQuizId(pendingRemove.id);
    try {
      await api.delete(`/quizzes/${pendingRemove.id}`);
      setQuizzes((current) => current.filter((item) => item.id !== pendingRemove.id));
      setPendingRemove(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setRemovingQuizId('');
    }
  }

  return (
    <div className="quiz-student-page">
      <Reveal as="header" className="page-heading" variant="fadeUp">
        <div>
          <p className="page-eyebrow">YOUR STUDY SPACE / ASSESSMENTS</p>
          <h1>Quizzes</h1>
          <p className="page-description">Take your assigned quizzes and track your attempts.</p>
        </div>
      </Reveal>
      {error && <div className="alert" role="alert">{error}</div>}
      {loading ? (
        <p className="page-status">Loading quizzes...</p>
      ) : quizzes.length === 0 ? (
        <Reveal as="section" className="panel" variant="fadeUp">
          <p className="muted">There are no quizzes assigned yet.</p>
        </Reveal>
      ) : (
        /* Cards — focal: staggered list */
        <StaggerGroup
          as="ul"
          className="quiz-student-list"
          staggerChildren={stagger.base}
          delayChildren={stagger.tight}
        >
          {quizzes.map((quiz) => {
            const attempts = quiz.attempts || [];
            const latest = attempts[0];
            return (
              <StaggerItem as="li" className="panel quiz-student-card" key={quiz.id}>
                <div className="quiz-student-copy">
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
                  <MagneticButton as={Link} className="btn btn-primary quiz-card-action" to={`/app/quizzes/${quiz.id}`}>
                    {user.role !== 'student' ? 'Preview' : quiz.remainingAttempts > 0 ? 'Open quiz' : 'View scores'}{' '}
                    <span aria-hidden="true">↗</span>
                  </MagneticButton>
                  {user.role === 'student' && attempts.length > 0 && (
                    <button
                      className="btn btn-ghost quiz-remove-action"
                      type="button"
                      disabled={removingQuizId === quiz.id}
                      onClick={() => setPendingRemove(quiz)}
                    >
                      {removingQuizId === quiz.id ? 'Removing...' : 'Remove'}
                    </button>
                  )}
                </div>
              </StaggerItem>
            );
          })}
        </StaggerGroup>
      )}
      <ConfirmDialog
        open={Boolean(pendingRemove)}
        eyebrow="QUIZ LIST"
        title={pendingRemove ? `Remove "${pendingRemove.title}"?` : 'Remove quiz?'}
        message="Your attempt history for this quiz will also be deleted. The quiz and other students' scores will not be affected."
        confirmLabel="Remove"
        busy={Boolean(removingQuizId)}
        onCancel={() => setPendingRemove(null)}
        onConfirm={removeQuiz}
      />
    </div>
  );
}
