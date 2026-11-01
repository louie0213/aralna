import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import Dropzone from '../components/Dropzone.jsx';
import Reveal from '../components/Reveal.jsx';
import QuizLoader from '../components/QuizLoader.jsx';
import { api } from '../api.js';

const ICONS = { '.pdf': '\ud83d\udcc4', '.docx': '\ud83d\udcdd', '.pptx': '\ud83d\udcca', '.txt': '\ud83d\udcc3', '.png': '\ud83d\uddbc\ufe0f', '.jpg': '\ud83d\uddbc\ufe0f', '.jpeg': '\ud83d\uddbc\ufe0f', '.webp': '\ud83d\uddbc\ufe0f' };
const iconFor = (name) => ICONS['.' + name.split('.').pop().toLowerCase()] || '\ud83d\udcc1';
const kb = (bytes) => `${Math.max(1, Math.round(bytes / 1024))} KB`;

export default function Upload() {
  const navigate = useNavigate();
  const [documents, setDocuments] = useState([]);
  const [queue, setQueue] = useState([]); // { id, name, progress, stage: 'uploading' | 'reading' | 'error', message }
  const [openId, setOpenId] = useState(null);
  const [closingPreviewId, setClosingPreviewId] = useState(null);
  const [generation, setGeneration] = useState(null);
  const generationController = useRef(null);
  const [error, setError] = useState('');

  function load() {
    api.get('/documents').then((d) => setDocuments(d.documents)).catch((err) => setError(err.message));
  }

  useEffect(load, []);
  useEffect(() => () => generationController.current?.abort(), []);

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
      setClosingPreviewId((current) => (current === id ? null : current));
    } catch (err) {
      setError(err.message);
    }
  }

  async function generateReviewer(documentId) {
    generationController.current?.abort();
    const controller = new AbortController();
    generationController.current = controller;
    setError('');
    setGeneration({ documentId, status: 'loading' });
    try {
      const { reviewer } = await api.post('/reviewers/generate', { documentId }, { signal: controller.signal });
      if (!controller.signal.aborted) {
        setGeneration({ documentId, status: 'success', reviewerId: reviewer.id });
      }
    } catch (err) {
      if (!controller.signal.aborted && err.name !== 'AbortError') {
        setGeneration({ documentId, status: 'error', message: err.message });
      }
    } finally {
      if (generationController.current === controller) generationController.current = null;
    }
  }

  function completeGeneration() {
    if (generation?.status === 'success') navigate(`/app/reviewers/${generation.reviewerId}`);
  }

  function togglePreview(documentId) {
    if (openId === documentId) {
      setOpenId(null);
      setClosingPreviewId(documentId);
      return;
    }

    setClosingPreviewId(null);
    setOpenId(documentId);
  }

  return (
    <div className="upload-page" aria-busy={generation?.status === 'loading'}>
      {generation && createPortal(
        <div className="quiz-loader-overlay">
          <QuizLoader
            status={generation.status}
            message={generation.status === 'error' ? `Oops, I couldn't read that one. ${generation.message}` : undefined}
            onComplete={completeGeneration}
            onRetry={() => generateReviewer(generation.documentId)}
          />
        </div>,
        document.body
      )}
      <Reveal as="h1">Upload documents</Reveal>
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
                  <span className="queue-track"><span className="queue-fill" style={{ '--queue-progress': item.progress / 100 }} /></span>
                  <span className="queue-stage">{item.stage === 'uploading' ? `${item.progress}%` : 'Reading text...'}</span>
                </>
              )}
            </li>
          ))}
        </ul>
      )}

      <Reveal as="section" className="panel">
        <h2>Your documents</h2>
        {documents.length === 0 ? (
          <p className="muted">Nothing uploaded yet. Drop a file above to get started.</p>
        ) : (
          <ul className="doc-list" data-reveal-group>
            {documents.map((d) => (
              <Reveal as="li" key={d.id} className="doc-row">
                <button
                  type="button"
                  className="doc-main"
                  aria-expanded={openId === d.id}
                  onClick={() => togglePreview(d.id)}
                >
                  <span className="doc-icon">{iconFor(d.originalName)}</span>
                  <span className="doc-name" title={d.originalName}>{d.originalName}</span>
                  <span className={d.status === 'ready' ? 'badge' : 'badge badge-off'}>{d.status === 'ready' ? 'Ready' : 'Failed'}</span>
                  <span className="doc-meta">{kb(d.sizeBytes)}</span>
                </button>
                <div className="doc-actions">
                  <button
                    className="btn btn-primary btn-small"
                    disabled={d.status !== 'ready' || generation?.status === 'loading'}
                    onClick={() => generateReviewer(d.id)}
                  >
                    {generation?.status === 'loading' && generation.documentId === d.id ? 'Generating...' : 'Generate reviewer'}
                  </button>
                  <button className="btn btn-ghost" onClick={() => remove(d.id)}>Delete</button>
                </div>
                {(openId === d.id || closingPreviewId === d.id) && (
                  <div
                    className={`doc-preview${closingPreviewId === d.id ? ' is-closing' : ''}`}
                    aria-hidden={openId !== d.id}
                    onAnimationEnd={(event) => {
                      if (event.target === event.currentTarget && closingPreviewId === d.id) {
                        setClosingPreviewId(null);
                      }
                    }}
                  >
                    {d.status === 'failed' ? <p className="muted">{d.error}</p> : <pre>{d.extractedText?.slice(0, 4000) || 'No text extracted.'}</pre>}
                  </div>
                )}
              </Reveal>
            ))}
          </ul>
        )}
      </Reveal>
    </div>
  );
}
