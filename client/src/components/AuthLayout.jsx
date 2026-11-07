// this file wraps login and register pages with branded layout
import { Link } from 'react-router-dom';
import ThemeToggle from './ThemeToggle.jsx';
import Logo from './Logo.jsx';
import { Reveal, StaggerGroup, StaggerItem } from './motion';
import { useMotionConfig } from '../lib/motion.js';

export default function AuthLayout({ children, wide = false }) {
  const { narrow, lite } = useMotionConfig();
  const staggerChildren = narrow || lite ? 0.07 : 0.12;
  const delayChildren = narrow || lite ? 0.04 : 0.06;
  const footerDelay = narrow || lite ? 0.09 : 0.16;

  return (
    <div className="auth">
      {/* Side panel — focal: staggered story */}
      <aside className="auth-side">
        <StaggerGroup
          className="auth-side-content"
          immediate
          staggerChildren={staggerChildren}
          delayChildren={delayChildren}
        >
          <StaggerItem as={Link} className="auth-brand" to="/" aria-label="AralNa home">
            <Logo size="lg" />
          </StaggerItem>
          <StaggerItem className="auth-story">
            <p className="auth-story-label">A BETTER WAY TO STUDY</p>
            <h2>Make what you learn <span>stay with you.</span></h2>
            <p className="auth-pitch">
              Turn class notes into focused study tools, so you can spend less time organizing and more time understanding.
            </p>
          </StaggerItem>
          <StaggerItem as="p" className="auth-side-footer">
            YOUR NOTES, READY TO STUDY
          </StaggerItem>
        </StaggerGroup>
        <span className="auth-doodle-stamp" aria-hidden="true">✳ FIELD NOTES</span>
      </aside>

      <div className="auth-theme"><ThemeToggle /></div>

      <main className="auth-main">
        <div className="auth-main-inner">
          {/* Card — soft scale-in (replaces CSS auth-card-enter) */}
          <Reveal
            className={wide ? 'auth-card auth-card-wide' : 'auth-card'}
            variant="scaleIn"
            immediate
          >
            {children}
          </Reveal>
          <Reveal as="p" className="auth-main-footer" variant="fadeUp" delay={footerDelay}>
            A calmer space for focused learning.
          </Reveal>
        </div>
      </main>
    </div>
  );
}
