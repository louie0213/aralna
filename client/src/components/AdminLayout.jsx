import { Outlet } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../AuthContext.jsx';
import ThemeToggle from './ThemeToggle.jsx';
import { Link } from 'react-router-dom';
import BrandMark from './BrandMark.jsx';
import ShellNavLink from './ShellNavLink.jsx';
import PageBack from './PageBack.jsx';
import ProfileAvatar from './ProfileAvatar.jsx';

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  return (
    <div className={`shell shell-admin${sidebarCollapsed ? ' shell-collapsed' : ''}${mobileMenuOpen ? ' shell-menu-open' : ''}`}>
      <header className="shell-bar">
        <Link className="shell-brand" to="/">
          <BrandMark className="shell-brand-mark" />
          <span className="shell-brand-name">AralNa</span>
          <span className="shell-role">{user.isSuperAdmin ? 'Super admin' : 'Admin'}</span>
        </Link>
        <button
          className="shell-menu-toggle"
          type="button"
          aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
          aria-controls="admin-navigation"
          aria-expanded={mobileMenuOpen}
          onClick={() => setMobileMenuOpen((open) => !open)}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            {mobileMenuOpen ? <path d="m6 6 12 12M18 6 6 18" /> : <path d="M4 6h16M4 12h16M4 18h16" />}
          </svg>
        </button>
        <nav id="admin-navigation" className="nav" aria-label="Admin">
          <ShellNavLink to="/admin" end icon="overview" label="Overview" onClick={() => setMobileMenuOpen(false)} />
          <ShellNavLink to="/admin/users" icon="users" label="Users" onClick={() => setMobileMenuOpen(false)} />
          <ShellNavLink to="/admin/files" icon="files" label="Files" onClick={() => setMobileMenuOpen(false)} />
          <ShellNavLink to="/admin/quizzes" icon="quizzes" label="Quizzes" onClick={() => setMobileMenuOpen(false)} />
          {user.isSuperAdmin && <ShellNavLink to="/admin/admins/new" icon="addAdmin" label="Add admin" onClick={() => setMobileMenuOpen(false)} />}
          <ShellNavLink to="/app" icon="studentApp" label="Student app" onClick={() => setMobileMenuOpen(false)} />
        </nav>
        <div className="shell-actions">
          <span className="shell-user">
            <ProfileAvatar user={user} />
            <span className="shell-user-name">{user.fullName}</span>
          </span>
          <ThemeToggle />
          <button className="btn btn-ghost shell-logout" onClick={logout}>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10 17l5-5-5-5m5 5H3m9-9h7a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-7" /></svg>
            <span>Log out</span>
          </button>
        </div>
      </header>
      <button
        className="shell-collapse-toggle"
        type="button"
        aria-label={sidebarCollapsed ? 'Show navigation sidebar' : 'Hide navigation sidebar'}
        aria-controls="admin-navigation"
        aria-expanded={!sidebarCollapsed}
        title={sidebarCollapsed ? 'Show navigation sidebar' : 'Hide navigation sidebar'}
        onClick={() => setSidebarCollapsed((collapsed) => !collapsed)}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d={sidebarCollapsed ? 'm9 18 6-6-6-6' : 'm15 18-6-6 6-6'} /></svg>
      </button>
      <main className="shell-main">
        <PageBack />
        <Outlet />
      </main>
    </div>
  );
}
