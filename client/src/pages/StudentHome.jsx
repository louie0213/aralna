import { Link } from 'react-router-dom';
import { useAuth } from '../AuthContext.jsx';

export default function StudentHome() {
  const { user } = useAuth();
  return (
    <>
      <h1>Your reviewers</h1>
      <section className="panel">
        <h2>Your account</h2>
        <dl className="details">
          <dt>Name</dt><dd>{user.fullName}</dd>
          <dt>Program</dt><dd>{user.program || 'Not set'}</dd>
          <dt>Email</dt><dd>{user.email}</dd>
        </dl>
      </section>
      <section className="panel">
        <h2>Upload a document to get started</h2>
        <p>Go to <Link to="/app/upload">Upload</Link> to add PDFs, Word docs, slides, text files, or photos of notes. AralNa reads the text out so it can build your reviewers.</p>
      </section>
    </>
  );
}
