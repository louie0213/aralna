import { Link } from 'react-router-dom';
import { useAuth } from '../AuthContext.jsx';

export default function StudentHome() {
  const { user } = useAuth();
  const firstName = user.fullName.trim().split(/\s+/)[0];
  const accountLabel = user.isSuperAdmin ? 'Super admin account' : user.role === 'admin' ? 'Admin account' : 'Student account';

  return (
    <div className="student-dashboard">
      <header className="page-heading student-page-heading">
        <div>
          <p className="page-eyebrow">YOUR STUDY SPACE</p>
          <h1>Welcome back, {firstName}</h1>
          <p className="page-description">Your notes are the starting point. Pick up where your next study session begins.</p>
        </div>
        <span className="account-chip"><span aria-hidden="true" /> {accountLabel}</span>
      </header>

      <section className="student-start">
        <div className="student-start-copy">
          <p className="page-eyebrow">A GOOD PLACE TO START</p>
          <h2>Turn your class notes into a study guide.</h2>
          <p>Upload a document and build a focused reviewer with summaries, key terms, flashcards, and practice questions.</p>
          <Link className="btn btn-primary student-start-action" to="/app/upload">Upload notes <span aria-hidden="true">↗</span></Link>
        </div>
        <div className="student-start-index" aria-hidden="true"><span>01</span><i /></div>
      </section>

      <div className="student-dashboard-grid">
        <section className="student-info-card">
          <div className="student-info-heading">
            <div><p className="page-eyebrow">YOUR LIBRARY</p><h2>Study reviewers</h2></div>
            <span className="student-info-mark" aria-hidden="true">02</span>
          </div>
          <p>Generated summaries, flashcards, and quizzes stay together here, ready for your next review.</p>
          <Link className="text-action" to="/app/reviewers">Browse reviewers <span aria-hidden="true">↗</span></Link>
        </section>

        <section className="student-info-card account-card">
          <div className="student-info-heading">
            <div><p className="page-eyebrow">ACCOUNT DETAILS</p><h2>Your profile</h2></div>
            <span className="student-info-mark" aria-hidden="true">03</span>
          </div>
          <dl className="profile-details">
            <div><dt>Name</dt><dd>{user.fullName}</dd></div>
            <div><dt>Program</dt><dd>{user.program || 'Not set'}</dd></div>
            <div><dt>Email</dt><dd>{user.email}</dd></div>
          </dl>
        </section>
      </div>
    </div>
  );
}
