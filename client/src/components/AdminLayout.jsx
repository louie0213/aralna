import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../AuthContext.jsx';
import ThemeToggle from './ThemeToggle.jsx';
import { Link } from 'react-router-dom';

export default function AdminLayout() {
  const { user, logout } = useAuth();
  return (
    <div className="shell">
      <header className="shell-bar">
        <Link className="shell-brand" to="/">
          <span className="shell-brand-mark" aria-hidden="true">A</span>
          <span className="shell-brand-name">AralNa</span>
          <span className="shell-role">{user.isSuperAdmin ? 'Super admin' : 'Admin'}</span>
        </Link>
        <nav className="nav" aria-label="Admin">
          <NavLink to="/admin" end>Overview</NavLink>
          <NavLink to="/admin/users">Users</NavLink>
          <NavLink to="/admin/files">Files</NavLink>
          {user.isSuperAdmin && <NavLink to="/admin/admins/new">Add admin</NavLink>}
          <NavLink to="/app">Student app</NavLink>
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
