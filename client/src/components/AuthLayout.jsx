import { Link } from 'react-router-dom';
import ThemeToggle from './ThemeToggle.jsx';
import BrandMark from './BrandMark.jsx';

export default function AuthLayout({ children, wide = false }) {
  return (
    <div className="auth">
      <aside className="auth-side">
        <div className="auth-side-content">
          <Link className="auth-brand" to="/" aria-label="AralNa home">
            <BrandMark className="brand-mark" />
            <span>AralNa</span>
          </Link>
          <div className="auth-story">
            <p className="auth-story-label">A BETTER WAY TO STUDY</p>
            <h2>Make what you learn <span>stay with you.</span></h2>
            <p className="auth-pitch">Turn class notes into focused study tools, so you can spend less time organizing and more time understanding.</p>
          </div>
          <p className="auth-side-footer">YOUR NOTES, READY TO STUDY</p>
        </div>
      </aside>
      <div className="auth-theme"><ThemeToggle /></div>
      <main className="auth-main">
        <div className="auth-main-inner">
          <div className={wide ? 'auth-card auth-card-wide' : 'auth-card'}>{children}</div>
          <p className="auth-main-footer">A calmer space for focused learning.</p>
        </div>
      </main>
    </div>
  );
}
