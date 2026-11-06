import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, m } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import ConfirmDialog from '../components/ConfirmDialog.jsx';
import Dropzone from '../components/Dropzone.jsx';
import QuizLoader from '../components/QuizLoader.jsx';
import {
  Reveal,
  StaggerGroup,
  StaggerItem,
} from '../components/motion';
import { useMotionConfig } from '../lib/motion.js';
import { api } from '../api.js';

const ICONS = { '.pdf': '\ud83d\udcc4', '.docx': '\ud83d\udcdd', '.pptx': '\ud83d\udcca', '.txt': '\ud83d\udcc3', '.png': '\ud83d\uddbc\ufe0f', '.jpg': '\ud83d\uddbc\ufe0f', '.jpeg': '\ud83d\uddbc\ufe0f', '.webp': '\ud83d\uddbc\ufe0f' };
const iconFor = (name) => ICONS['.' + name.split('.').pop().toLowerCase()] || '\ud83d\udcc1';
const kb = (bytes) => `${Math.max(1, Math.round(bytes / 1024))} KB`;

export default function Upload() {
  const navigate = useNavigate();
  const { variants } = useMotionConfig();
  const [documents, setDocuments] = useState([]);
  const [queue, setQueue] = useState([]); // { id, name, progress, stage: 'uploading' | 'reading' | 'error', message }
  const [openId, setOpenId] = useState(null);
  const [generation, setGeneration] = useState(null);
  const generationController = useRef(null);
  const [error, setError] = useState('');
  const [pendingDelete, setPendingDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  function load() {
    api.get('/documents').then((d) => setDocuments(d.documents)).catch((err) => setError(err.message));
  }

  useEffect(load, []);
  useEffect(() => () => generationController.current?.abort(), []);

  function onFiles(files, onUploadComplete) {
    files.forEach((file) => {
      const qid = `${Date.now()}-${Math.random()}`;
      setQueue((q) => [...q, { id: qid, name: file.name, size: file.size, progress: 0, stage: 'uploading' }]);
      api
        .upload('/documents/upload', file, {
          onProgress: (pct) =>
            setQueue((q) => q.map((item) => (item.id === qid ? { ...item, progress: pct, stage: pct >= 100 ? 'reading' : 'uploading' } : item))),
        })
        .then(() => {
          setQueue((q) => q.filter((item) => item.id !== qid));
          onUploadComplete?.();
          load();
        })
        .catch((err) => {
          setQueue((q) => q.map((item) => (item.id === qid ? { ...item, stage: 'error', message: err.message } : item)));
        });
    });
  }

  async function remove() {
    if (!pendingDelete) return;
    setError('');
    setDeleting(true);
    try {
      await api.delete(`/documents/${pendingDelete.id}`);
      setDocuments((list) => list.filter((d) => d.id !== pendingDelete.id));
      if (openId === pendingDelete.id) setOpenId(null);
      setPendingDelete(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setDeleting(false);
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
    setOpenId((current) => (current === documentId ? null : documentId));
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

      <Reveal as="h1" className="upload-page-title" variant="fadeUp">
        Upload documents
      </Reveal>
      {error && <div className="alert" role="alert">{error}</div>}

      {/* Dropzone — focal: soft scale-in */}
      <Reveal className="upload-dropzone-reveal" variant="scaleIn">
        <Dropzone onFiles={onFiles} queue={queue} />
      </Reveal>

      {/* Document list — supporting stagger; preview uses AnimatePresence */}
      <Reveal as="section" className="panel upload-documents-panel" variant="fadeUp" delay={0.12}>
        <h2>Your documents</h2>
        {documents.length === 0 ? (
          <p className="muted">Nothing uploaded yet. Drop a file above to get started.</p>
        ) : (
          <StaggerGroup as="ul" className="doc-list" staggerChildren={0.09} delayChildren={0.06}>
            {documents.map((d) => (
              <StaggerItem as="li" key={d.id} className="doc-row">
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
                  <button className="btn btn-ghost" onClick={() => setPendingDelete(d)}>Delete</button>
                </div>
                <AnimatePresence initial={false}>
                  {openId === d.id && (
                    <m.div
                      key={`preview-${d.id}`}
                      className="doc-preview"
                      variants={variants.slideIn}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                    >
                      {d.status === 'failed'
                        ? <p className="muted">{d.error}</p>
                        : <pre>{d.extractedText?.slice(0, 4000) || 'No text extracted.'}</pre>}
                    </m.div>
                  )}
                </AnimatePresence>
              </StaggerItem>
            ))}
          </StaggerGroup>
        )}
      </Reveal>
      <ConfirmDialog
        open={Boolean(pendingDelete)}
        eyebrow="DOCUMENTS"
        title={pendingDelete ? `Delete "${pendingDelete.originalName}"?` : 'Delete document?'}
        message="This cannot be undone."
        confirmLabel="Delete"
        busy={deleting}
        onCancel={() => setPendingDelete(null)}
        onConfirm={remove}
      />
    </div>
  );
}
