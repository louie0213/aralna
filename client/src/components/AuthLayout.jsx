export default function AuthLayout({ children, wide = false }) {
  return (
    <div className="auth">
      <aside className="auth-side">
        <div className="auth-brand">AralNa</div>
        <p className="auth-pitch">Upload your notes. Get summaries, flashcards and quizzes you can review anywhere.</p>
      </aside>
      <main className="auth-main">
        <div className={wide ? 'auth-card auth-card-wide' : 'auth-card'}>{children}</div>
      </main>
    </div>
  );
}
