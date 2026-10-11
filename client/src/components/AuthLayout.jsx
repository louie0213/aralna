import { Link } from 'react-router-dom';
import ThemeToggle from './ThemeToggle.jsx';

export default function AuthLayout({ children, wide = false }) {
  return (
    <div className="auth">
      <aside className="auth-side">
        <Link className="auth-brand" to="/" aria-label="AralNa home">
          <span className="brand-mark" aria-hidden="true">a.</span>
          <span>AralNa</span>
        </Link>
        <p className="auth-pitch">Upload your notes. Get summaries, flashcards and quizzes you can review anywhere.</p>
      </aside>
      <div className="auth-theme"><ThemeToggle /></div>
      <main className="auth-main">
        <div className={wide ? 'auth-card auth-card-wide' : 'auth-card'}>{children}</div>
      </main>
    </div>
  );
}
