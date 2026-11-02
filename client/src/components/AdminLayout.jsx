import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../AuthContext.jsx';
import BrandMark from './BrandMark.jsx';
import BrandWordmark from './BrandWordmark.jsx';
import PageBack from './PageBack.jsx';
import ProfileAvatar from './ProfileAvatar.jsx';
import ThemeToggle from './ThemeToggle.jsx';
import { shellNavIcons } from './ShellNavLink.jsx';
import { ADMIN_NAV_ITEMS, STUDENT_APP_NAV_ITEM } from './adminNavigation.js';
import './AdminLayout.css';

function AdminNavigationLink({ item, onSelect }) {
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

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const sidebarRef = useRef(null);
  const menuButtonRef = useRef(null);
  const location = useLocation();
  const previousPathnameRef = useRef(location.pathname);
  const role = user.isSuperAdmin ? 'super_admin' : 'admin';
  const roleLabel = role === 'super_admin' ? 'Super admin' : 'Admin';
  const visibleNavItems = ADMIN_NAV_ITEMS.filter((item) => item.roles.includes(role));

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
    <div className={`shell shell-admin${sidebarCollapsed ? ' shell-collapsed' : ''}${mobileMenuOpen ? ' shell-menu-open' : ''}`}>
      <header className="admin-mobile-bar">
        <button
          ref={menuButtonRef}
          className="admin-mobile-menu-toggle"
          type="button"
          aria-label={mobileMenuOpen ? 'Close admin navigation' : 'Open admin navigation'}
          aria-controls="admin-sidebar"
          aria-expanded={mobileMenuOpen}
          onClick={() => setMobileMenuOpen((open) => !open)}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            {mobileMenuOpen ? <path d="m6 6 12 12M18 6 6 18" /> : <path d="M4 6h16M4 12h16M4 18h16" />}
          </svg>
        </button>
        <Link className="admin-mobile-brand" to="/">
          <BrandMark className="admin-brand-mark" />
          <BrandWordmark className="admin-brand-wordmark" />
        </Link>
      </header>

      <aside
        ref={sidebarRef}
        id="admin-sidebar"
        className="admin-sidebar"
        aria-label="Admin sidebar"
        role={mobileMenuOpen ? 'dialog' : undefined}
        aria-modal={mobileMenuOpen ? 'true' : undefined}
        aria-hidden={isMobile && !mobileMenuOpen}
        inert={isMobile && !mobileMenuOpen ? '' : undefined}
      >
        <div className="admin-sidebar-heading">
          <Link className="admin-sidebar-brand" to="/" onClick={closeMenu}>
            <BrandMark className="admin-brand-mark" />
            <BrandWordmark className="admin-brand-wordmark" />
            <svg className="admin-brand-doodle" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 2.5c1.2 4.2 2.1 5.1 6.5 6.3-4.4 1.2-5.3 2.1-6.5 6.4-1.2-4.3-2.1-5.2-6.5-6.4 4.4-1.2 5.3-2.1 6.5-6.3Z" />
            </svg>
          </Link>
          <button className="admin-sidebar-close" type="button" aria-label="Close admin navigation" onClick={closeMenu}>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" /></svg>
          </button>
        </div>

        <nav className="admin-navigation" aria-label="Admin navigation">
          <ul>
            {visibleNavItems.map((item) => (
              <li key={item.path}><AdminNavigationLink item={item} onSelect={closeMenu} /></li>
            ))}
          </ul>
          <div className="admin-student-link">
            <ul>
              <li><AdminNavigationLink item={STUDENT_APP_NAV_ITEM} onSelect={closeMenu} /></li>
            </ul>
          </div>
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
              <span className={`admin-profile-role admin-profile-role--${role}`}>{roleLabel}</span>
            </div>
          </div>
          <button className="btn btn-ghost admin-logout" type="button" onClick={logout}>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10 17l5-5-5-5m5 5H3m9-9h7a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-7" /></svg>
            <span>Log out</span>
          </button>
        </div>
      </aside>

      {mobileMenuOpen && (
        <button
          className="admin-sidebar-backdrop"
          type="button"
          aria-label="Close admin navigation"
          tabIndex="-1"
          onClick={closeMenu}
        />
      )}
      <button
        className="shell-sidebar-collapse-toggle"
        type="button"
        aria-label={sidebarCollapsed ? 'Show navigation sidebar' : 'Hide navigation sidebar'}
        aria-controls="admin-sidebar"
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
