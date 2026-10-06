import { Link } from 'react-router-dom';
import { useAuth } from '../AuthContext.jsx';
import { useTheme } from '../ThemeContext.jsx';
import ThemeToggle from '../components/ThemeToggle.jsx';

const homeFor = (user) => user.role === 'admin' ? '/admin' : '/app';

export default function Landing() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const dashboardPath = user ? homeFor(user) : '/register';

  return (
    <div className="landing" data-theme={theme}>
      <header className="landing-nav">
        <Link className="landing-brand" to="/" aria-label="AralNa home">
          <span className="brand-mark">a.</span> AralNa
        </Link>
        <nav className="landing-links" aria-label="Main navigation">
          <a href="#how-it-works">How it works</a>
          <a href="#study-tools">Study tools</a>
        </nav>
        <div className="landing-actions">
          <ThemeToggle />
          {user ? (
            <Link className="btn btn-primary landing-cta" to={dashboardPath}>Open dashboard <span aria-hidden="true">↗</span></Link>
          ) : (
            <>
              <Link className="landing-login" to="/login">Log in</Link>
              <Link className="btn btn-primary landing-cta" to="/register">Get started <span aria-hidden="true">↗</span></Link>
            </>
          )}
        </div>
      </header>

      <main>
        <section className="landing-hero">
          <div className="landing-copy">
            <p className="eyebrow"><span className="eyebrow-dot" /> YOUR NOTES, READY TO STUDY</p>
            <h1>Make your next<br />study session <em>count.</em></h1>
            <p className="landing-intro">Turn class notes into clear summaries, flashcards, and quizzes. Spend less time organizing and more time understanding.</p>
            <div className="landing-buttons">
              <Link className="btn btn-primary landing-cta" to={dashboardPath}>{user ? 'Go to your dashboard' : 'Start studying'} <span aria-hidden="true">↗</span></Link>
              {!user && <Link className="landing-secondary" to="/login">I already have an account</Link>}
            </div>
            <p className="landing-note">Built for focused study, one document at a time.</p>
          </div>

          <div className="study-preview" aria-label="Preview of a study guide made from class notes">
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
          </div>
        </section>

        <section className="landing-method" id="how-it-works">
          <div className="method-heading"><p className="eyebrow">A SMALLER STUDY LOOP</p><h2>From notes to <em>know-how.</em></h2></div>
          <div className="method-steps">
            <article><span className="step-number">01</span><h3>Bring your notes</h3><p>Upload the material you already use for class.</p></article>
            <article><span className="step-number">02</span><h3>Get the essentials</h3><p>Review a clear summary, key terms, and concepts.</p></article>
            <article><span className="step-number">03</span><h3>Practice retrieval</h3><p>Reinforce what you learned with cards and quizzes.</p></article>
          </div>
        </section>

        <section className="landing-tools" id="study-tools">
          <p className="eyebrow">ONE PLACE TO REVIEW</p>
          <div className="tools-row"><h2>Study materials that work together.</h2><p>Keep your uploads, generated reviewers, and progress together in one calm workspace.</p><Link to={dashboardPath}>Explore your workspace <span aria-hidden="true">↗</span></Link></div>
        </section>
      </main>
      <footer className="landing-footer"><Link className="landing-brand" to="/"><span className="brand-mark">a.</span> AralNa</Link><span>Make room for understanding.</span><Link to={user ? dashboardPath : '/login'}>{user ? 'Dashboard' : 'Log in'} <span aria-hidden="true">↗</span></Link></footer>
    </div>
  );
}