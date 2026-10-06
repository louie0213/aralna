import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../AuthContext.jsx';
import ThemeToggle from './ThemeToggle.jsx';
import { Link } from 'react-router-dom';

export default function AdminLayout() {
  const { user, logout } = useAuth();
  return (
    <div className="shell">
      <header className="shell-bar">
        <Link className="shell-brand" to="/">AralNa</Link>
        <nav className="nav" aria-label="Admin">
          <NavLink to="/admin" end>Overview</NavLink>
          <NavLink to="/admin/users">Users</NavLink>
          <NavLink to="/admin/admins/new">Add admin</NavLink>
        </nav>
        <span className="shell-user">{user.fullName}</span>
        <ThemeToggle />
        <button className="btn btn-ghost" onClick={logout}>Log out</button>
      </header>
      <main className="shell-main">
        <Outlet />
      </main>
    </div>
  );
}
