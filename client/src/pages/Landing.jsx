import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../AuthContext.jsx';
import { useTheme } from '../ThemeContext.jsx';
import ThemeToggle from '../components/ThemeToggle.jsx';
import Logo from '../components/Logo.jsx';
import {
  Reveal,
  StaggerGroup,
  StaggerItem,
  MagneticButton,
} from '../components/motion';
import { useMotionConfig } from '../lib/motion.js';
import { api } from '../api.js';

const homeFor = (user) => user.role === 'admin' ? '/admin' : '/app';

export default function Landing() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const { narrow, lite } = useMotionConfig();
  const healthPingStarted = useRef(false);
  const dashboardPath = user ? homeFor(user) : '/register';
  const compactMotion = narrow || lite;
  const navStagger = compactMotion ? 0.06 : 0.09;
  const heroStagger = compactMotion ? 0.07 : 0.11;
  const methodStagger = compactMotion ? 0.08 : 0.14;
  // Stable fadeUp only — no clip/scale remounts that re-trigger and shake on refresh
  const previewVariant = 'fadeUp';

  useEffect(() => {
    if (healthPingStarted.current) return;
    healthPingStarted.current = true;
    api.get('/health').catch(() => {});
  }, []);

  return (
    <div className="landing" data-theme={theme}>
      {/* Same flex host as baseline (<header.landing-nav>) with Motion stagger */}
      <StaggerGroup
        as="header"
        className="landing-nav"
        data-motion-ambient
        immediate
        staggerChildren={navStagger}
        delayChildren={compactMotion ? 0.02 : 0.04}
      >
        <StaggerItem as={Link} className="landing-brand" to="/" aria-label="AralNa home">
          <Logo size="lg" />
        </StaggerItem>
        <StaggerItem as="nav" className="landing-links" aria-label="Main navigation">
          <a href="#how-it-works">How it works</a>
          <a href="#study-tools">Study tools</a>
        </StaggerItem>
        <StaggerItem className="landing-actions">
          <ThemeToggle />
          {user ? (
            <MagneticButton as={Link} className="btn btn-primary landing-cta" to={dashboardPath}>
              Open dashboard <span aria-hidden="true">↗</span>
            </MagneticButton>
          ) : (
            <>
              <Link className="landing-login" to="/login">Log in</Link>
              <MagneticButton as={Link} className="btn btn-primary landing-cta" to="/register">
                Get started <span aria-hidden="true">↗</span>
              </MagneticButton>
            </>
          )}
        </StaggerItem>
      </StaggerGroup>

      <main>
        <section className="landing-hero" data-motion-ambient>
          <span className="landing-hero-star" aria-hidden="true">✳</span>
          <StaggerGroup
            className="landing-copy"
            immediate
            staggerChildren={heroStagger}
            delayChildren={compactMotion ? 0.04 : 0.08}
          >
            <StaggerItem as="p" className="eyebrow">
              <span className="eyebrow-dot" /> YOUR NOTES, READY TO STUDY
            </StaggerItem>
            <StaggerItem as="h1">
              Make your next<br />study session <em>count.</em>
            </StaggerItem>
            <StaggerItem as="p" className="landing-intro">
              Turn class notes into clear summaries, flashcards, and quizzes. Spend less time organizing and more time understanding.
            </StaggerItem>
            <StaggerItem className="landing-buttons">
              <MagneticButton as={Link} className="btn btn-primary landing-cta" to={dashboardPath}>
                {user ? 'Go to your dashboard' : 'Start studying'} <span aria-hidden="true">↗</span>
              </MagneticButton>
              {!user && <Link className="landing-secondary" to="/login">I already have an account</Link>}
            </StaggerItem>
            <StaggerItem as="p" className="landing-note">
              Built for focused study, one document at a time.
            </StaggerItem>
          </StaggerGroup>

          {/* Native card shell keeps border/shadow; motion runs on the inner panel only */}
          <div
            className="study-preview"
            aria-label="Preview of a study guide made from class notes"
            data-motion-ambient
          >
            <Reveal
              variant={previewVariant}
              immediate
              amount={0.1}
              style={{ height: 'auto', overflow: 'visible' }}
            >
              <div className="preview-topbar">
                <span className="preview-dots" aria-hidden="true"><i /><i /><i /></span>
                <span>STUDY SPACE <span className="preview-slash">/</span> BIOLOGY 101</span>
                <span className="preview-status"><i /> READY</span>
              </div>
              <div className="preview-content">
                <div className="preview-document">
                  <div className="preview-document-label">YOUR UPLOAD</div>
                  <div className="preview-file">
                    <span className="file-icon">PDF</span>
                    <span>
                      <strong>cell-division-notes.pdf</strong>
                      <small>12 pages · uploaded just now</small>
                    </span>
                  </div>
                  <div className="preview-lines" aria-hidden="true"><i /><i /><i /><i /><i /></div>
                  <div className="preview-highlight">Mitosis creates two genetically identical daughter cells.</div>
                </div>
                <div className="preview-guide">
                  <div className="preview-guide-head">
                    <span className="preview-spark">✳</span>
                    <span>YOUR STUDY GUIDE</span>
                    <span className="preview-ready">READY</span>
                  </div>
                  <h2>Cell division</h2>
                  <p>How one cell grows into two. A quick guide to the stages and what to remember.</p>
                  <div className="preview-tool-row"><span><b>01</b> Summary</span><span>5 key points</span></div>
                  <div className="preview-tool-row"><span><b>02</b> Flashcards</span><span>12 cards</span></div>
                  <div className="preview-tool-row"><span><b>03</b> Practice quiz</span><span>8 questions</span></div>
                </div>
              </div>
              <div className="preview-footer">
                <span>MADE FOR YOUR MATERIAL</span>
                <span>01 <i /> 03</span>
              </div>
            </Reveal>
          </div>
        </section>

        {/* Section host restored — Motion wraps the same landing-method block */}
        <Reveal as="section" className="landing-method" id="how-it-works" variant="fadeUp">
          <div className="method-heading">
            <p className="eyebrow">A SMALLER STUDY LOOP</p>
            <h2>From notes to <em>know-how.</em></h2>
          </div>
          <StaggerGroup
            className="method-steps"
            staggerChildren={methodStagger}
            delayChildren={compactMotion ? 0.06 : 0.11}
          >
            <StaggerItem as="article">
              <span className="step-number">01</span>
              <h3>Bring your notes</h3>
              <p>Upload the material you already use for class.</p>
            </StaggerItem>
            <StaggerItem as="article">
              <span className="step-number">02</span>
              <h3>Get the essentials</h3>
              <p>Review a clear summary, key terms, and concepts.</p>
            </StaggerItem>
            <StaggerItem as="article">
              <span className="step-number">03</span>
              <h3>Practice retrieval</h3>
              <p>Reinforce what you learned with cards and quizzes.</p>
            </StaggerItem>
          </StaggerGroup>
        </Reveal>

        <Reveal as="section" className="landing-tools" id="study-tools" variant="slideIn">
          <p className="eyebrow">ONE PLACE TO REVIEW</p>
          <div className="tools-row">
            <h2>Study materials that work together.</h2>
            <p>Keep your uploads, generated reviewers, and progress together in one calm workspace.</p>
            <MagneticButton as={Link} to={dashboardPath}>
              Explore your workspace <span aria-hidden="true">↗</span>
            </MagneticButton>
          </div>
        </Reveal>
      </main>

      {/* Native footer restored — children wrapped with Motion */}
      <footer className="landing-footer">
        <Reveal as={Link} className="landing-brand" to="/" immediate variant="fadeUp">
          <Logo size="md" />
        </Reveal>
        <Reveal as="span" immediate variant="fadeUp" delay={compactMotion ? 0.05 : 0.09}>
          Make room for understanding.
        </Reveal>
        <Reveal immediate variant="fadeUp" delay={compactMotion ? 0.09 : 0.15}>
          <MagneticButton as={Link} to={user ? dashboardPath : '/login'}>
            {user ? 'Dashboard' : 'Log in'} <span aria-hidden="true">↗</span>
          </MagneticButton>
        </Reveal>
      </footer>
    </div>
  );
}
