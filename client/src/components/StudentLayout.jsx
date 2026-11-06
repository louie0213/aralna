import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../AuthContext.jsx';
import Logo from './Logo.jsx';
import PageBack from './PageBack.jsx';
import ProfileAvatar from './ProfileAvatar.jsx';
import ThemeToggle from './ThemeToggle.jsx';
import { shellNavIcons } from './ShellNavLink.jsx';
import './AdminLayout.css';

const STUDENT_NAV_ITEMS = [
  { label: 'Home', icon: 'home', path: '/app', end: true },
  { label: 'Upload', icon: 'upload', path: '/app/upload' },
  { label: 'Reviewers', icon: 'reviewers', path: '/app/reviewers' },
  { label: 'Quizzes', icon: 'quizzes', path: '/app/quizzes' },
];

function StudentNavigationLink({ item, onSelect }) {
  return (
    <NavLink
      to={item.path}
      end={item.end}
      aria-label={item.label}
      title={item.label}
      data-label={item.label}
      onClick={onSelect}
    >
      <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        {shellNavIcons[item.icon]}
      </svg>
      <span className="nav-label">{item.label}</span>
    </NavLink>
  );
}

export default function StudentLayout() {
  const { user, logout, activeQuizId } = useAuth();
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const sidebarRef = useRef(null);
  const menuButtonRef = useRef(null);
  const location = useLocation();
  const previousPathnameRef = useRef(location.pathname);
  const profileRole = user.isSuperAdmin ? 'Super admin' : user.role === 'admin' ? 'Admin' : 'Student';

  useEffect(() => {
    if (!mobileMenuOpen) return undefined;
    const firstFocusFrame = window.requestAnimationFrame(() => {
      sidebarRef.current?.querySelector('button, a[href]')?.focus();
    });
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        setMobileMenuOpen(false);
        menuButtonRef.current?.focus();
        return;
      }
      if (event.key !== 'Tab' || !sidebarRef.current) return;
      const focusable = [...sidebarRef.current.querySelectorAll(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )];
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      window.cancelAnimationFrame(firstFocusFrame);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [mobileMenuOpen]);

  useEffect(() => {
    if (previousPathnameRef.current === location.pathname) return;
    previousPathnameRef.current = location.pathname;
    if (mobileMenuOpen) {
      setMobileMenuOpen(false);
      menuButtonRef.current?.focus();
    }
  }, [location.pathname, mobileMenuOpen]);

  useEffect(() => {
    const updateViewport = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile) setMobileMenuOpen(false);
    };
    window.addEventListener('resize', updateViewport);
    return () => window.removeEventListener('resize', updateViewport);
  }, []);

  function closeMenu() {
    setMobileMenuOpen(false);
    if (isMobile) menuButtonRef.current?.focus();
  }

  return (
    <div className={`shell shell-student${sidebarCollapsed ? ' shell-collapsed' : ''}${mobileMenuOpen ? ' shell-menu-open' : ''}`}>
      <header className="admin-mobile-bar">
        <button
          ref={menuButtonRef}
          className="admin-mobile-menu-toggle"
          type="button"
          aria-label={mobileMenuOpen ? 'Close app navigation' : 'Open app navigation'}
          aria-controls="student-sidebar"
          aria-expanded={mobileMenuOpen}
          onClick={() => setMobileMenuOpen((open) => !open)}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            {mobileMenuOpen ? <path d="m6 6 12 12M18 6 6 18" /> : <path d="M4 6h16M4 12h16M4 18h16" />}
          </svg>
        </button>
        <Link className="admin-mobile-brand" to="/" aria-label="AralNa home">
          <Logo size="md" />
        </Link>
      </header>

      <aside
        ref={sidebarRef}
        id="student-sidebar"
        className="admin-sidebar"
        aria-label="App sidebar"
        role={mobileMenuOpen ? 'dialog' : undefined}
        aria-modal={mobileMenuOpen ? 'true' : undefined}
        aria-hidden={isMobile && !mobileMenuOpen}
        inert={isMobile && !mobileMenuOpen ? '' : undefined}
      >
        <div className="admin-sidebar-heading">
          <Link className="admin-sidebar-brand" to="/" onClick={closeMenu} aria-label="AralNa home">
            <Logo size="lg" />
          </Link>
          <button className="admin-sidebar-close" type="button" aria-label="Close app navigation" onClick={closeMenu}>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" /></svg>
          </button>
        </div>

        <nav className="admin-navigation" aria-label="App navigation">
          <ul>
            {activeQuizId ? (
              <li>
                <span className="quiz-locked-nav-item" aria-current="page" aria-label="Quiz in progress" title="Quiz in progress" data-label="Quiz in progress">
                  <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    {shellNavIcons.lock}
                  </svg>
                  <span className="nav-label">Quiz in progress</span>
                </span>
              </li>
            ) : STUDENT_NAV_ITEMS.map((item) => (
              <li key={item.path}><StudentNavigationLink item={item} onSelect={closeMenu} /></li>
            ))}
          </ul>
        </nav>

        <div className="admin-sidebar-bottom">
          <div className="admin-theme-row">
            <span className="admin-sidebar-section-label">Theme</span>
            <ThemeToggle />
          </div>
          <div className="admin-profile">
            <ProfileAvatar user={user} />
            <div className="admin-profile-details">
              <span className="admin-profile-name" title={user.fullName}>{user.fullName}</span>
              <span className="admin-profile-role admin-profile-role--admin">{profileRole}</span>
            </div>
          </div>
          <button className="btn btn-ghost admin-logout" type="button" onClick={logout} disabled={Boolean(activeQuizId)}>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10 17l5-5-5-5m5 5H3m9-9h7a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-7" /></svg>
            <span>Log out</span>
          </button>
        </div>
      </aside>

      {mobileMenuOpen && (
        <button className="admin-sidebar-backdrop" type="button" aria-label="Close app navigation" tabIndex="-1" onClick={closeMenu} />
      )}
      <button
        className="shell-sidebar-collapse-toggle"
        type="button"
        aria-label={sidebarCollapsed ? 'Show navigation sidebar' : 'Hide navigation sidebar'}
        aria-controls="student-sidebar"
        aria-expanded={!sidebarCollapsed}
        title={sidebarCollapsed ? 'Show navigation sidebar' : 'Hide navigation sidebar'}
        onClick={() => setSidebarCollapsed((collapsed) => !collapsed)}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d={sidebarCollapsed ? 'm9 18 6-6-6-6' : 'm15 18-6-6 6-6'} /></svg>
      </button>
      <main className="shell-main app-sidebar-main">
        <PageBack />
        <Outlet />
      </main>
    </div>
  );
}
