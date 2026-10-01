import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../AuthContext.jsx';

export default function AdminLayout() {
  const { user, logout } = useAuth();
  return (
    <div className="shell">
      <header className="shell-bar">
        <strong className="shell-brand">AralNa</strong>
        <nav className="nav" aria-label="Admin">
          <NavLink to="/admin" end>Overview</NavLink>
          <NavLink to="/admin/users">Users</NavLink>
          <NavLink to="/admin/admins/new">Add admin</NavLink>
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
