import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../AuthContext.jsx';

export default function StudentLayout() {
  const { user, logout } = useAuth();
  return (
    <div className="shell">
      <header className="shell-bar">
        <strong className="shell-brand">AralNa</strong>
        <nav className="nav" aria-label="Student">
          <NavLink to="/app" end>Home</NavLink>
          <NavLink to="/app/upload">Upload</NavLink>
          <NavLink to="/app/reviewers">Reviewers</NavLink>
        </nav>
        <span className="shell-user">{user.fullName}</span>
        <button className="btn btn-ghost" onClick={logout}>Log out</button>
      </header>
      <main className="shell-main">
        <Outlet />
      </main>
    </div>
  );
}
