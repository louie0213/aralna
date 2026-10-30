import { Outlet } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../AuthContext.jsx';
import ThemeToggle from './ThemeToggle.jsx';
import { Link } from 'react-router-dom';
import BrandMark from './BrandMark.jsx';
import ShellNavLink, { shellNavIcons } from './ShellNavLink.jsx';
import PageBack from './PageBack.jsx';
import ProfileAvatar from './ProfileAvatar.jsx';

export default function StudentLayout() {
  const { user, logout, activeQuizId } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  return (
    <div className={`shell shell-student${sidebarCollapsed ? ' shell-collapsed' : ''}${mobileMenuOpen ? ' shell-menu-open' : ''}`}>
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
        <button
          className="shell-menu-toggle"
          type="button"
          aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
          aria-controls="student-navigation"
          aria-expanded={mobileMenuOpen}
          onClick={() => setMobileMenuOpen((open) => !open)}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            {mobileMenuOpen ? <path d="m6 6 12 12M18 6 6 18" /> : <path d="M4 6h16M4 12h16M4 18h16" />}
          </svg>
        </button>
        <nav id="student-navigation" className="nav" aria-label="Student">
          {activeQuizId ? (
            <span className="quiz-locked-nav-item" aria-current="page" aria-label="Quiz in progress" title="Quiz in progress">
              <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{shellNavIcons.lock}</svg>
              <span className="nav-label">Quiz in progress</span>
            </span>
          ) : (
            <>
              <ShellNavLink to="/app" end icon="home" label="Home" onClick={() => setMobileMenuOpen(false)} />
              <ShellNavLink to="/app/upload" icon="upload" label="Upload" onClick={() => setMobileMenuOpen(false)} />
              <ShellNavLink to="/app/reviewers" icon="reviewers" label="Reviewers" onClick={() => setMobileMenuOpen(false)} />
              <ShellNavLink to="/app/quizzes" icon="quizzes" label="Quizzes" onClick={() => setMobileMenuOpen(false)} />
            </>
          )}
        </nav>
        <div className="shell-actions">
          <span className="shell-user">
            <ProfileAvatar user={user} />
            <span className="shell-user-name">{user.fullName}</span>
          </span>
          <ThemeToggle />
          <button className="btn btn-ghost shell-logout" onClick={logout} disabled={Boolean(activeQuizId)}>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10 17l5-5-5-5m5 5H3m9-9h7a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-7" /></svg>
            <span>Log out</span>
          </button>
        </div>
      </header>
      <button
        className="shell-collapse-toggle"
        type="button"
        aria-label={sidebarCollapsed ? 'Show navigation sidebar' : 'Hide navigation sidebar'}
        aria-controls="student-navigation"
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
