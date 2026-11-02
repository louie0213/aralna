import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../AuthContext.jsx';
import { useTheme } from '../ThemeContext.jsx';
import ThemeToggle from '../components/ThemeToggle.jsx';
import BrandMark from '../components/BrandMark.jsx';
import BrandWordmark from '../components/BrandWordmark.jsx';
import Reveal from '../components/Reveal.jsx';
import { api } from '../api.js';

const homeFor = (user) => user.role === 'admin' ? '/admin' : '/app';

export default function Landing() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const healthPingStarted = useRef(false);
  const dashboardPath = user ? homeFor(user) : '/register';

  useEffect(() => {
    if (healthPingStarted.current) return;
    healthPingStarted.current = true;
    api.get('/health').catch(() => {});
  }, []);

  return (
    <div className="landing" data-theme={theme}>
      <header className="landing-nav" data-motion-ambient>
        <Reveal as={Link} className="landing-brand" to="/" aria-label="AralNa home">
          <BrandMark className="brand-mark" /><BrandWordmark />
        </Reveal>
        <Reveal as="nav" className="landing-links" aria-label="Main navigation" delay="80ms">
          <a href="#how-it-works">How it works</a>
          <a href="#study-tools">Study tools</a>
        </Reveal>
        <Reveal className="landing-actions" delay="140ms">
          <ThemeToggle />
          {user ? (
            <Link className="btn btn-primary landing-cta" to={dashboardPath}>Open dashboard <span aria-hidden="true">↗</span></Link>
          ) : (
            <>
              <Link className="landing-login" to="/login">Log in</Link>
              <Link className="btn btn-primary landing-cta" to="/register">Get started <span aria-hidden="true">↗</span></Link>
            </>
          )}
        </Reveal>
      </header>

      <main>
        <section className="landing-hero" data-motion-ambient>
          <span className="landing-hero-star" aria-hidden="true">✳</span>
          <div className="landing-copy" data-reveal-group>
            <Reveal as="p" className="eyebrow"><span className="eyebrow-dot" /> YOUR NOTES, READY TO STUDY</Reveal>
            <Reveal as="h1" delay="70ms">Make your next<br />study session <em>count.</em></Reveal>
            <Reveal as="p" className="landing-intro" delay="140ms">Turn class notes into clear summaries, flashcards, and quizzes. Spend less time organizing and more time understanding.</Reveal>
            <Reveal className="landing-buttons" delay="210ms">
              <Link className="btn btn-primary landing-cta" to={dashboardPath}>{user ? 'Go to your dashboard' : 'Start studying'} <span aria-hidden="true">↗</span></Link>
              {!user && <Link className="landing-secondary" to="/login">I already have an account</Link>}
            </Reveal>
            <Reveal as="p" className="landing-note" delay="280ms">Built for focused study, one document at a time.</Reveal>
          </div>

          <Reveal className="study-preview" aria-label="Preview of a study guide made from class notes" data-motion-ambient delay="120ms">
            <div className="preview-topbar">
              <span className="preview-dots" aria-hidden="true"><i /><i /><i /></span>
              <span>STUDY SPACE <span className="preview-slash">/</span> BIOLOGY 101</span>
              <span className="preview-status"><i /> READY</span>
            </div>
            <div className="preview-content">
              <div className="preview-document">
                <div className="preview-document-label">YOUR UPLOAD</div>
                <div className="preview-file"><span className="file-icon">PDF</span><span><strong>cell-division-notes.pdf</strong><small>12 pages · uploaded just now</small></span></div>
                <div className="preview-lines" aria-hidden="true"><i /><i /><i /><i /><i /></div>
                <div className="preview-highlight">Mitosis creates two genetically identical daughter cells.</div>
              </div>
              <div className="preview-guide">
                <div className="preview-guide-head"><span className="preview-spark">✳</span><span>YOUR STUDY GUIDE</span><span className="preview-ready">READY</span></div>
                <h2>Cell division</h2>
                <p>How one cell grows into two. A quick guide to the stages and what to remember.</p>
                <div className="preview-tool-row"><span><b>01</b> Summary</span><span>5 key points</span></div>
                <div className="preview-tool-row"><span><b>02</b> Flashcards</span><span>12 cards</span></div>
                <div className="preview-tool-row"><span><b>03</b> Practice quiz</span><span>8 questions</span></div>
              </div>
            </div>
            <div className="preview-footer"><span>MADE FOR YOUR MATERIAL</span><span>01 <i /> 03</span></div>
          </Reveal>
        </section>

        <Reveal as="section" className="landing-method" id="how-it-works">
            <div className="method-heading"><p className="eyebrow">A SMALLER STUDY LOOP</p><h2>From notes to <em>know-how.</em></h2></div>
          <div className="method-steps" data-reveal-group>
            <Reveal as="article"><span className="step-number">01</span><h3>Bring your notes</h3><p>Upload the material you already use for class.</p></Reveal>
            <Reveal as="article"><span className="step-number">02</span><h3>Get the essentials</h3><p>Review a clear summary, key terms, and concepts.</p></Reveal>
            <Reveal as="article"><span className="step-number">03</span><h3>Practice retrieval</h3><p>Reinforce what you learned with cards and quizzes.</p></Reveal>
          </div>
        </Reveal>

        <Reveal as="section" className="landing-tools" id="study-tools">
          <Reveal as="p" className="eyebrow">ONE PLACE TO REVIEW</Reveal>
          <div className="tools-row" data-reveal-group><Reveal as="h2">Study materials that work together.</Reveal><Reveal as="p">Keep your uploads, generated reviewers, and progress together in one calm workspace.</Reveal><Reveal as={Link} to={dashboardPath}>Explore your workspace <span aria-hidden="true">↗</span></Reveal></div>
        </Reveal>
      </main>
      <footer className="landing-footer"><Reveal as={Link} className="landing-brand" to="/"><BrandMark className="brand-mark" /><BrandWordmark /></Reveal><Reveal as="span" delay="60ms">Make room for understanding.</Reveal><Reveal as={Link} to={user ? dashboardPath : '/login'} delay="110ms">{user ? 'Dashboard' : 'Log in'} <span aria-hidden="true">↗</span></Reveal></footer>
    </div>
  );
}