import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../AuthContext.jsx';
import ThemeToggle from './ThemeToggle.jsx';
import { Link } from 'react-router-dom';
import BrandMark from './BrandMark.jsx';

export default function StudentLayout() {
  const { user, logout, activeQuizId } = useAuth();
  return (
    <div className="shell shell-student">
      <header className="shell-bar">
        {activeQuizId ? (
          <span className="shell-brand" aria-label="AralNa">
            <BrandMark className="shell-brand-mark" />
            <span className="shell-brand-name">AralNa</span>
            <span className="shell-role">Quiz in progress</span>
          </span>
        ) : (
          <Link className="shell-brand" to="/">
          <BrandMark className="shell-brand-mark" />
          <span className="shell-brand-name">AralNa</span>
          <span className="shell-role">Student</span>
          </Link>
        )}
        <nav className="nav" aria-label="Student">
          {activeQuizId ? (
            <span className="quiz-locked-nav-item" aria-current="page">Quiz in progress</span>
          ) : (
            <>
              <NavLink to="/app" end>Home</NavLink>
              <NavLink to="/app/upload">Upload</NavLink>
              <NavLink to="/app/reviewers">Reviewers</NavLink>
              <NavLink to="/app/quizzes">Quizzes</NavLink>
            </>
          )}
        </nav>
        <div className="shell-actions">
          <span className="shell-user">
            <span className="shell-avatar" aria-hidden="true">{user.fullName?.trim()?.charAt(0).toUpperCase() || '?'}</span>
            <span className="shell-user-name">{user.fullName}</span>
          </span>
          <ThemeToggle />
          <button className="btn btn-ghost" onClick={logout} disabled={Boolean(activeQuizId)}>Log out</button>
        </div>
      </header>
      <main className="shell-main">
        <Outlet />
      </main>
    </div>
  );
}
