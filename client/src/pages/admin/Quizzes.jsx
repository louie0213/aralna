import { useEffect, useState } from 'react';
import { api } from '../../api.js';

const newQuestion = () => ({ type: 'multiple-choice', prompt: '', choices: ['', ''], answer: '' });
const fmtDate = (date) => new Date(date).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });

function QuestionEditor({ question, index, onChange, onRemove, canRemove }) {
  function update(patch) {
    onChange(index, { ...question, ...patch });
  }

  return (
    <section className="panel quiz-question-editor">
      <div className="quiz-question-heading">
        <h3>Question {index + 1}</h3>
        {canRemove && <button className="btn btn-ghost btn-small" type="button" onClick={() => onRemove(index)}>Remove</button>}
      </div>
      <label className="quiz-label">
        Question type
        <select className="user-filter" value={question.type} onChange={(e) => update({ type: e.target.value, answer: '' })}>
          <option value="multiple-choice">Multiple choice</option>
          <option value="identification">Identification</option>
          <option value="true-false">True or false</option>
        </select>
      </label>
      <label className="quiz-label">
        Prompt
        <textarea className="quiz-textarea" maxLength={500} value={question.prompt} onChange={(e) => update({ prompt: e.target.value })} required />
      </label>
      {question.type === 'multiple-choice' && (
        <>
          <div className="quiz-choice-editor">
            {question.choices.map((choice, choiceIndex) => (
              <label className="quiz-label" key={choiceIndex}>
                Option {choiceIndex + 1}
                <input
                  className="quiz-input"
                  maxLength={200}
                  value={choice}
                  onChange={(e) => {
                    const choices = [...question.choices];
                    const previous = choices[choiceIndex];
                    choices[choiceIndex] = e.target.value;
                    update({ choices, answer: question.answer === previous ? '' : question.answer });
                  }}
                  required
                />
              </label>
            ))}
          </div>
          <button
            className="btn btn-ghost btn-small quiz-option-add"
            type="button"
            disabled={question.choices.length >= 6}
            onClick={() => update({ choices: [...question.choices, ''] })}
          >
            Add option
          </button>
          <label className="quiz-label">
            Correct option
            <select className="user-filter" value={question.answer} onChange={(e) => update({ answer: e.target.value })} required>
              <option value="">Choose the correct option</option>
              {question.choices.filter(Boolean).map((choice, choiceIndex) => (
                <option key={`${choiceIndex}-${choice}`} value={choice}>{choice}</option>
              ))}
            </select>
          </label>
        </>
      )}
      {question.type === 'identification' && (
        <label className="quiz-label">
          Correct answer
          <input className="quiz-input" maxLength={200} value={question.answer} onChange={(e) => update({ answer: e.target.value })} required />
        </label>
      )}
      {question.type === 'true-false' && (
        <label className="quiz-label">
          Correct answer
          <select className="user-filter" value={question.answer} onChange={(e) => update({ answer: e.target.value })} required>
            <option value="">Choose the correct answer</option>
            <option value="true">True</option>
            <option value="false">False</option>
          </select>
        </label>
      )}
    </section>
  );
}

export default function AdminQuizzes() {
  const [quizzes, setQuizzes] = useState([]);
  const [questions, setQuestions] = useState([newQuestion()]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [sourceFile, setSourceFile] = useState(null);
  const [questionCount, setQuestionCount] = useState('10');
  const [generating, setGenerating] = useState(false);
  const [students, setStudents] = useState([]);
  const [assignmentMode, setAssignmentMode] = useState('all');
  const [assignedTo, setAssignedTo] = useState([]);
  const [studentSearch, setStudentSearch] = useState('');
  const [results, setResults] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  async function loadPageData() {
    const [quizData, studentData] = await Promise.all([
      api.get('/quizzes'),
      api.get('/admin/users?role=student&status=active'),
    ]);
    setQuizzes(quizData.quizzes);
    setStudents(studentData.users);
  }

  useEffect(() => {
    loadPageData()
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  function updateQuestion(index, question) {
    setQuestions((items) => items.map((item, itemIndex) => (itemIndex === index ? question : item)));
  }

  async function generateFromFile() {
    if (!sourceFile) {
      setError('Choose a source file first.');
      return;
    }
    setError('');
    setNotice('');
    setGenerating(true);
    try {
      const data = await api.upload('/quizzes/generate-from-file', sourceFile, {
        fields: { questionCount },
      });
      setTitle(data.title);
      setQuestions(data.questions);
      setNotice(`Generated ${data.questions.length} questions. Review and edit them before publishing.`);
    } catch (err) {
      setError(err.message);
    } finally {
      setGenerating(false);
    }
  }

  async function createQuiz(event) {
    event.preventDefault();
    setError('');
    setNotice('');
    setSaving(true);
    if (assignmentMode === 'selected' && assignedTo.length === 0) {
      setError('Select at least one active student, or choose all active students.');
      setSaving(false);
      return;
    }
    const normalizedQuestions = questions.map((question) => ({
      ...question,
      choices: question.type === 'multiple-choice' ? question.choices.map((choice) => choice.trim()) : [],
      answer: question.type === 'true-false' ? question.answer === 'true' : question.answer.trim(),
    }));
    try {
      await api.post('/quizzes', {
        title,
        description,
        questions: normalizedQuestions,
        assignmentMode,
        assignedTo: assignmentMode === 'selected' ? assignedTo : [],
      });
      setTitle('');
      setDescription('');
      setQuestions([newQuestion()]);
      setAssignmentMode('all');
      setAssignedTo([]);
      setNotice(assignmentMode === 'all'
        ? 'Quiz published to all active students.'
        : `Quiz published to ${assignedTo.length} selected student${assignedTo.length === 1 ? '' : 's'}.`);
      await loadPageData();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function toggleResults(quizId) {
    setError('');
    if (results[quizId]) {
      setResults((current) => {
        const updated = { ...current };
        delete updated[quizId];
        return updated;
      });
      return;
    }
    try {
      const data = await api.get(`/quizzes/${quizId}/results`);
      setResults((current) => ({ ...current, [quizId]: data.attempts }));
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="quiz-admin-page">
      <header className="page-heading">
        <div>
          <p className="page-eyebrow">ADMIN WORKSPACE / ASSESSMENTS</p>
          <h1>Quizzes</h1>
          <p className="page-description">Create and publish quizzes to active students, then review their scores.</p>
        </div>
      </header>
      {error && <div className="alert" role="alert">{error}</div>}
      {notice && <div className="auth-notice" role="status">{notice}</div>}

      <form className="panel quiz-create-form" onSubmit={createQuiz}>
        <div className="section-heading">
          <div><p className="page-eyebrow">NEW ASSESSMENT</p><h2>Create a quiz</h2></div>
          <span className="section-meta">Up to 50 questions</span>
        </div>
        <section className="quiz-file-generator">
          <p className="page-eyebrow">AI QUESTION GENERATOR</p>
          <h3>Generate questions from a file</h3>
          <p className="muted">Upload source material; generated questions and answers will be added below for review before publishing.</p>
          <div className="quiz-file-controls">
            <label className="quiz-label">
              Source file
              <input
                className="quiz-input"
                type="file"
                accept=".pdf,.docx,.pptx,.txt,.png,.jpg,.jpeg,.webp"
                onChange={(event) => setSourceFile(event.target.files?.[0] || null)}
              />
            </label>
            <label className="quiz-label">
              Number of questions
              <input
                className="quiz-input"
                type="number"
                min="1"
                max="50"
                value={questionCount}
                onChange={(event) => setQuestionCount(event.target.value)}
                required
              />
            </label>
          </div>
          <button className="btn btn-ghost" type="button" disabled={generating || !sourceFile} onClick={generateFromFile}>
            {generating ? 'Reading file and generating...' : 'Generate questions'}
          </button>
        </section>
        <label className="quiz-label">
          Quiz title
          <input className="quiz-input" maxLength={120} value={title} onChange={(e) => setTitle(e.target.value)} required />
        </label>
        <label className="quiz-label">
          Instructions or description <span className="muted">(optional)</span>
          <textarea className="quiz-textarea" maxLength={600} value={description} onChange={(e) => setDescription(e.target.value)} />
        </label>
        <fieldset className="quiz-assignment">
          <legend>Who can take this quiz?</legend>
          <label className="quiz-assignment-choice">
            <input type="radio" name="assignmentMode" value="all" checked={assignmentMode === 'all'} onChange={() => setAssignmentMode('all')} />
            <span>All active students ({students.length})</span>
          </label>
          <label className="quiz-assignment-choice">
            <input type="radio" name="assignmentMode" value="selected" checked={assignmentMode === 'selected'} onChange={() => setAssignmentMode('selected')} />
            <span>Select specific students</span>
          </label>
          {assignmentMode === 'selected' && (
            <div className="quiz-student-picker">
              <label className="quiz-label">
                Find a student
                <input className="quiz-input" type="search" placeholder="Search name or email" value={studentSearch} onChange={(e) => setStudentSearch(e.target.value)} />
              </label>
              <div className="quiz-student-options">
                {students
                  .filter((student) => `${student.fullName} ${student.email}`.toLowerCase().includes(studentSearch.trim().toLowerCase()))
                  .map((student) => (
                    <label className="quiz-assignment-choice" key={student.id}>
                      <input
                        type="checkbox"
                        checked={assignedTo.includes(student.id)}
                        onChange={(event) => setAssignedTo((current) => (
                          event.target.checked
                            ? [...current, student.id]
                            : current.filter((id) => id !== student.id)
                        ))}
                      />
                      <span>{student.fullName} <small>{student.email}</small></span>
                    </label>
                  ))}
                {students.length === 0 && <p className="muted">There are no active students to select.</p>}
              </div>
              <p className="quiz-selection-count">{assignedTo.length} student{assignedTo.length === 1 ? '' : 's'} selected</p>
            </div>
          )}
        </fieldset>
        {questions.map((question, index) => (
          <QuestionEditor
            key={index}
            question={question}
            index={index}
            onChange={updateQuestion}
            onRemove={(removeIndex) => setQuestions((items) => items.filter((_, itemIndex) => itemIndex !== removeIndex))}
            canRemove={questions.length > 1}
          />
        ))}
        <div className="quiz-form-actions">
          <button className="btn btn-ghost" type="button" disabled={questions.length >= 50} onClick={() => setQuestions((items) => [...items, newQuestion()])}>
            Add question
          </button>
          <button className="btn btn-primary" type="submit" disabled={saving}>{saving ? 'Publishing...' : 'Publish quiz'}</button>
        </div>
      </form>

      <section className="quiz-list-section">
        <div className="section-heading">
          <div><p className="page-eyebrow">ASSIGNED QUIZZES</p><h2>Published quizzes</h2></div>
          {!loading && <span className="section-meta">{quizzes.length} total</span>}
        </div>
        {loading ? <p className="page-status">Loading quizzes...</p> : quizzes.length === 0 ? (
          <section className="panel"><p className="muted">No quizzes yet. Create one above to assign it to active students.</p></section>
        ) : (
          <ul className="doc-list">
            {quizzes.map((quiz) => (
              <li className="quiz-admin-row" key={quiz.id}>
                <div className="quiz-admin-summary">
                  <div className="quiz-admin-title">{quiz.title}</div>
                  {quiz.description && <p className="muted">{quiz.description}</p>}
                  <span className="doc-meta">{quiz.questionCount} questions · {quiz.assignmentMode === 'selected' ? `${quiz.assignedStudents} selected students` : `${quiz.assignedStudents} active students`} · {quiz.attemptsCount} attempts · Published {fmtDate(quiz.createdAt)}</span>
                </div>
                <button className="btn btn-ghost btn-small" type="button" onClick={() => toggleResults(quiz.id)}>
                  {results[quiz.id] ? 'Hide scores' : 'View scores'}
                </button>
                {results[quiz.id] && (
                  <div className="table-wrap quiz-results">
                    <table className="users-table">
                      <thead><tr><th>Student</th><th>Email</th><th>Attempt</th><th>Score</th><th>Submitted</th></tr></thead>
                      <tbody>
                        {results[quiz.id].length === 0 ? <tr><td className="table-message" colSpan="5">No submissions yet.</td></tr> : results[quiz.id].map((attempt) => (
                          <tr key={attempt.id}>
                            <td>{attempt.student?.fullName || 'Unknown student'}</td>
                            <td>{attempt.student?.email || ''}</td>
                            <td>{attempt.attemptNumber} of 5</td>
                            <td>{attempt.score} / {attempt.total}</td>
                            <td>{fmtDate(attempt.createdAt)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
