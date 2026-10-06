import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Dropzone from '../components/Dropzone.jsx';
import { api } from '../api.js';

const ICONS = { '.pdf': '\ud83d\udcc4', '.docx': '\ud83d\udcdd', '.pptx': '\ud83d\udcca', '.txt': '\ud83d\udcc3', '.png': '\ud83d\uddbc\ufe0f', '.jpg': '\ud83d\uddbc\ufe0f', '.jpeg': '\ud83d\uddbc\ufe0f', '.webp': '\ud83d\uddbc\ufe0f' };
const iconFor = (name) => ICONS['.' + name.split('.').pop().toLowerCase()] || '\ud83d\udcc1';
const kb = (bytes) => `${Math.max(1, Math.round(bytes / 1024))} KB`;

export default function Upload() {
  const navigate = useNavigate();
  const [documents, setDocuments] = useState([]);
  const [queue, setQueue] = useState([]); // { id, name, progress, stage: 'uploading' | 'reading' | 'error', message }
  const [openId, setOpenId] = useState(null);
  const [generatingId, setGeneratingId] = useState(null);
  const [error, setError] = useState('');

  function load() {
    api.get('/documents').then((d) => setDocuments(d.documents)).catch((err) => setError(err.message));
  }

  useEffect(load, []);

  function onFiles(files) {
    files.forEach((file) => {
      const qid = `${Date.now()}-${Math.random()}`;
      setQueue((q) => [...q, { id: qid, name: file.name, progress: 0, stage: 'uploading' }]);
      api
        .upload('/documents/upload', file, {
          onProgress: (pct) =>
            setQueue((q) => q.map((item) => (item.id === qid ? { ...item, progress: pct, stage: pct >= 100 ? 'reading' : 'uploading' } : item))),
        })
        .then(() => {
          setQueue((q) => q.filter((item) => item.id !== qid));
          load();
        })
        .catch((err) => {
          setQueue((q) => q.map((item) => (item.id === qid ? { ...item, stage: 'error', message: err.message } : item)));
        });
    });
  }

  async function remove(id) {
    if (!window.confirm('Delete this document? This cannot be undone.')) return;
    setError('');
    try {
      await api.delete(`/documents/${id}`);
      setDocuments((list) => list.filter((d) => d.id !== id));
      if (openId === id) setOpenId(null);
    } catch (err) {
      setError(err.message);
    }
  }

  async function generateReviewer(documentId) {
    setError('');
    setGeneratingId(documentId);
    try {
      const { reviewer } = await api.post('/reviewers/generate', { documentId });
      navigate(`/app/reviewers/${reviewer.id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setGeneratingId(null);
    }
  }

  const generatingDocument = documents.find((document) => document.id === generatingId);

  return (
    <div className="upload-page" aria-busy={Boolean(generatingId)}>
      {generatingId && (
        <div className="generation-screen" role="status" aria-live="polite" aria-label="Generating study reviewer">
          <section className="generation-window">
            <span className="generation-spinner" aria-hidden="true" />
            <p className="page-eyebrow">BUILDING YOUR REVIEWER</p>
            <h2>Turning your notes into a study guide</h2>
            <p className="generation-filename" title={generatingDocument?.originalName}>
              {generatingDocument?.originalName || 'Your document'}
            </p>
            <div className="generation-progress" aria-hidden="true"><span /></div>
            <p className="generation-note">Analyzing your material. This can take a little while.</p>
          </section>
        </div>
      )}
      <h1>Upload documents</h1>
      {error && <div className="alert" role="alert">{error}</div>}
      <Dropzone onFiles={onFiles} />

      {queue.length > 0 && (
        <ul className="queue">
          {queue.map((item) => (
            <li key={item.id} className="queue-row">
              <span className="queue-name" title={item.name}>{item.name}</span>
              {item.stage === 'error' ? (
                <span className="queue-error">{item.message}</span>
              ) : (
                <>
                  <span className="queue-track"><span className="queue-fill" style={{ width: `${item.progress}%` }} /></span>
                  <span className="queue-stage">{item.stage === 'uploading' ? `${item.progress}%` : 'Reading text...'}</span>
                </>
              )}
            </li>
          ))}
        </ul>
      )}

      <section className="panel">
        <h2>Your documents</h2>
        {documents.length === 0 ? (
          <p className="muted">Nothing uploaded yet. Drop a file above to get started.</p>
        ) : (
          <ul className="doc-list">
            {documents.map((d) => (
              <li key={d.id} className="doc-row">
                <div className="doc-main" onClick={() => setOpenId(openId === d.id ? null : d.id)}>
                  <span className="doc-icon">{iconFor(d.originalName)}</span>
                  <span className="doc-name" title={d.originalName}>{d.originalName}</span>
                  <span className={d.status === 'ready' ? 'badge' : 'badge badge-off'}>{d.status === 'ready' ? 'Ready' : 'Failed'}</span>
                  <span className="doc-meta">{kb(d.sizeBytes)}</span>
                </div>
                <div className="doc-actions">
                  <button
                    className="btn btn-primary btn-small"
                    disabled={d.status !== 'ready' || generatingId !== null}
                    onClick={() => generateReviewer(d.id)}
                  >
                    {generatingId === d.id ? 'Generating...' : 'Generate reviewer'}
                  </button>
                  <button className="btn btn-ghost" onClick={() => remove(d.id)}>Delete</button>
                </div>
                {openId === d.id && (
                  <div className="doc-preview">
                    {d.status === 'failed' ? <p className="muted">{d.error}</p> : <pre>{d.extractedText?.slice(0, 4000) || 'No text extracted.'}</pre>}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
