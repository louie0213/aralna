// this file shows a confirm popup instead of window.confirm
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import './ConfirmDialog.css';

/**
 * Accessible confirm popup — replaces window.confirm for destructive actions.
 */
export default function ConfirmDialog({
  open,
  eyebrow = 'PLEASE CONFIRM',
  title = 'Are you sure?',
  message,
  confirmLabel = 'Delete',
  cancelLabel = 'Cancel',
  busy = false,
  tone = 'danger',
  reverseActions = false,
  onConfirm,
  onCancel,
}) {
  const dialogRef = useRef(null);
  const cancelRef = useRef(null);
  const closeTimerRef = useRef(null);
  const busyRef = useRef(busy);
  const onCancelRef = useRef(onCancel);
  const [closing, setClosing] = useState(false);

  busyRef.current = busy;
  onCancelRef.current = onCancel;

  useEffect(() => {
    if (!open) {
      setClosing(false);
      if (closeTimerRef.current) {
        window.clearTimeout(closeTimerRef.current);
        closeTimerRef.current = null;
      }
      return undefined;
    }

    cancelRef.current?.focus();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKeyDown = (event) => {
      if (event.key === 'Escape' && !busyRef.current) requestClose();
      if (event.key !== 'Tab') return;
      const focusable = dialogRef.current?.querySelectorAll('button:not(:disabled)');
      if (!focusable?.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  function requestClose() {
    if (busyRef.current || closeTimerRef.current) return;
    setClosing(true);
    closeTimerRef.current = window.setTimeout(() => {
      closeTimerRef.current = null;
      setClosing(false);
      onCancelRef.current?.();
    }, 220);
  }

  if (!open && !closing) return null;

  return createPortal(
    <div
      className={`confirm-dialog-backdrop${closing ? ' is-closing' : ''}`}
      role="presentation"
      onClick={requestClose}
    >
      <div
        ref={dialogRef}
        className="confirm-dialog"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby={message ? 'confirm-dialog-message' : undefined}
        onClick={(event) => event.stopPropagation()}
      >
        <p className="page-eyebrow">{eyebrow}</p>
        <h2 id="confirm-dialog-title">{title}</h2>
        {message && <p id="confirm-dialog-message" className="confirm-dialog-message">{message}</p>}
        <div className={`confirm-dialog-actions${reverseActions ? ' is-reversed' : ''}`}>
          <button
            ref={cancelRef}
            className="btn btn-ghost"
            type="button"
            disabled={busy}
            onClick={requestClose}
          >
            {cancelLabel}
          </button>
          <button
            className={`btn ${tone === 'danger' ? 'btn-danger confirm-dialog-confirm' : 'btn-primary'}`}
            type="button"
            disabled={busy}
            onClick={onConfirm}
          >
            {busy ? 'Working...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
