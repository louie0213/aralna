import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../AuthContext.jsx';
import ThemeToggle from './ThemeToggle.jsx';
import { Link } from 'react-router-dom';

export default function StudentLayout() {
  const { user, logout } = useAuth();
  return (
    <div className="shell">
      <header className="shell-bar">
        <Link className="shell-brand" to="/">
          <span className="shell-brand-mark" aria-hidden="true">A</span>
          <span className="shell-brand-name">AralNa</span>
          <span className="shell-role">Student</span>
        </Link>
        <nav className="nav" aria-label="Student">
          <NavLink to="/app" end>Home</NavLink>
          <NavLink to="/app/upload">Upload</NavLink>
          <NavLink to="/app/reviewers">Reviewers</NavLink>
        </nav>
        <div className="shell-actions">
          <span className="shell-user">
            <span className="shell-avatar" aria-hidden="true">{user.fullName?.trim()?.charAt(0).toUpperCase() || '?'}</span>
            <span className="shell-user-name">{user.fullName}</span>
          </span>
          <ThemeToggle />
          <button className="btn btn-ghost" onClick={logout}>Log out</button>
        </div>
      </header>
      <main className="shell-main">
        <Outlet />
      </main>
    </div>
  );
}
