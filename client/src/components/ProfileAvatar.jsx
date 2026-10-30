import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../AuthContext.jsx';

const MAX_FILE_BYTES = 5 * 1024 * 1024;
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const CROP_SIZE = 260;
const OUTPUT_SIZE = 512;

function clampOffset(offset, imageSize, zoom, cropSize) {
  if (!imageSize) return { x: 0, y: 0 };
  const scale = Math.max(cropSize / imageSize.width, cropSize / imageSize.height) * zoom;
  const maxX = Math.max(0, (imageSize.width * scale - cropSize) / 2);
  const maxY = Math.max(0, (imageSize.height * scale - cropSize) / 2);
  return {
    x: Math.max(-maxX, Math.min(maxX, offset.x)),
    y: Math.max(-maxY, Math.min(maxY, offset.y)),
  };
}

export default function ProfileAvatar({ user }) {
  const triggerRef = useRef(null);
  const closeRef = useRef(null);
  const dialogRef = useRef(null);
  const inputRef = useRef(null);
  const stageRef = useRef(null);
  const imageRef = useRef(null);
  const dragRef = useRef(null);
  const { updateProfilePicture, removeProfilePicture } = useAuth();
  const [open, setOpen] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [imageSize, setImageSize] = useState(null);
  const [cropSize, setCropSize] = useState(CROP_SIZE);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const initials = user.fullName?.trim()?.charAt(0).toUpperCase() || '?';

  useEffect(() => {
    if (!imageUrl) return undefined;
    return () => URL.revokeObjectURL(imageUrl);
  }, [imageUrl]);

  useEffect(() => {
    if (!imageUrl || !stageRef.current) return undefined;
    const updateCropSize = () => setCropSize(stageRef.current.getBoundingClientRect().width);
    updateCropSize();
    const observer = new ResizeObserver(updateCropSize);
    observer.observe(stageRef.current);
    return () => observer.disconnect();
  }, [imageUrl]);

  useEffect(() => {
    if (!open) return undefined;
    closeRef.current?.focus();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKeyDown = (event) => {
      if (event.key === 'Escape' && !uploading) setOpen(false);
      if (event.key === 'Tab') {
        const focusable = dialogRef.current?.querySelectorAll('button:not(:disabled), input:not(:disabled)');
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
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
      triggerRef.current?.focus();
    };
  }, [open, uploading]);

  function closeModal() {
    if (uploading) return;
    setOpen(false);
    setImageUrl('');
    setImageSize(null);
    setZoom(1);
    setOffset({ x: 0, y: 0 });
    setError('');
  }

  function handleFileChange(event) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    if (!ACCEPTED_TYPES.includes(file.type)) {
      setError('Choose a JPEG, PNG, or WebP image.');
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      setError('Choose an image smaller than 5 MB.');
      return;
    }

    setError('');
    setImageSize(null);
    setZoom(1);
    setOffset({ x: 0, y: 0 });
    setImageUrl(URL.createObjectURL(file));
  }

  function handlePointerDown(event) {
    if (!imageSize || uploading) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = { pointerId: event.pointerId, x: event.clientX, y: event.clientY, offset };
  }

  function handlePointerMove(event) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    setOffset(clampOffset({
      x: drag.offset.x + event.clientX - drag.x,
      y: drag.offset.y + event.clientY - drag.y,
    }, imageSize, zoom, cropSize));
  }

  function handlePointerUp(event) {
    if (dragRef.current?.pointerId === event.pointerId) dragRef.current = null;
  }

  function handleZoomChange(event) {
    const nextZoom = Number(event.target.value);
    setZoom(nextZoom);
    setOffset((currentOffset) => clampOffset(currentOffset, imageSize, nextZoom, cropSize));
  }

  async function handleSave() {
    const image = imageRef.current;
    if (!image || !imageSize || uploading) return;

    const scale = Math.max(cropSize / imageSize.width, cropSize / imageSize.height) * zoom;
    const sourceSize = cropSize / scale;
    const sourceX = imageSize.width / 2 - offset.x / scale - sourceSize / 2;
    const sourceY = imageSize.height / 2 - offset.y / scale - sourceSize / 2;
    const canvas = document.createElement('canvas');
    canvas.width = OUTPUT_SIZE;
    canvas.height = OUTPUT_SIZE;
    const context = canvas.getContext('2d');
    if (!context) {
      setError('Your browser could not prepare this picture. Try another browser.');
      return;
    }
    context.drawImage(
      image,
      sourceX,
      sourceY,
      sourceSize,
      sourceSize,
      0,
      0,
      OUTPUT_SIZE,
      OUTPUT_SIZE
    );

    setError('');
    setUploading(true);
    try {
      const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.9));
      if (!blob) throw new Error('Your browser could not prepare this picture. Try another image.');
      await updateProfilePicture(new File([blob], 'profile-picture.jpg', { type: 'image/jpeg' }));
      setOpen(false);
      setImageUrl('');
      setImageSize(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  }

  async function handleRemove() {
    setError('');
    setUploading(true);
    try {
      await removeProfilePicture();
      setOpen(false);
      setImageUrl('');
      setImageSize(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  }

  return (
    <span className="profile-avatar-control">
      <button
        ref={triggerRef}
        className="shell-avatar profile-avatar-button"
        type="button"
        aria-label="Customize profile picture"
        title="Customize profile picture"
        aria-busy={uploading}
        disabled={uploading}
        onClick={() => {
          setError('');
          setOpen(true);
        }}
      >
        {user.profilePicture ? <img src={user.profilePicture} alt="" /> : initials}
        {uploading && <span className="profile-avatar-loading" aria-hidden="true" />}
      </button>
      {error && !open && <span className="profile-avatar-error" role="alert">{error}</span>}
      {open && createPortal(
        <div
          className="profile-photo-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeModal();
          }}
        >
          <section
            ref={dialogRef}
            className="profile-photo-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="profile-photo-title"
          >
            <button
              ref={closeRef}
              className="profile-photo-close"
              type="button"
              aria-label="Close profile picture customization"
              disabled={uploading}
              onClick={closeModal}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" /></svg>
            </button>
            <p className="page-eyebrow">YOUR ACCOUNT</p>
            <h2 id="profile-photo-title">Customize profile picture</h2>
            <p className="profile-photo-help">
              {imageUrl
                ? 'Drag the photo to reposition it, then adjust the zoom to fit the circle.'
                : 'Choose a photo and adjust how it appears in your profile circle.'}
            </p>
            {imageUrl ? (
              <>
                <div
                  ref={stageRef}
                  className={`profile-photo-crop${imageSize ? ' is-ready' : ''}`}
                  aria-label="Circular crop preview. Drag the image to reposition it."
                  onPointerDown={handlePointerDown}
                  onPointerMove={handlePointerMove}
                  onPointerUp={handlePointerUp}
                  onPointerCancel={handlePointerUp}
                >
                  <img
                    ref={imageRef}
                    src={imageUrl}
                    alt="Photo crop preview"
                    draggable="false"
                    onLoad={(event) => {
                      setImageSize({
                        width: event.currentTarget.naturalWidth,
                        height: event.currentTarget.naturalHeight,
                      });
                    }}
                    onError={() => setError('That image could not be read. Choose a different file.')}
                    style={imageSize ? {
                      width: `${imageSize.width * Math.max(cropSize / imageSize.width, cropSize / imageSize.height) * zoom}px`,
                      height: `${imageSize.height * Math.max(cropSize / imageSize.width, cropSize / imageSize.height) * zoom}px`,
                      transform: `translate(-50%, -50%) translate(${offset.x}px, ${offset.y}px)`,
                    } : undefined}
                  />
                </div>
                <label className="profile-photo-zoom">
                  <span>Zoom</span>
                  <input
                    type="range"
                    min="1"
                    max="3"
                    step="0.01"
                    value={zoom}
                    aria-label="Zoom photo"
                    disabled={!imageSize || uploading}
                    onChange={handleZoomChange}
                  />
                </label>
              </>
            ) : (
              <div className="profile-photo-current">
                <span className="shell-avatar profile-photo-current-avatar">
                  {user.profilePicture ? <img src={user.profilePicture} alt="" /> : initials}
                </span>
                {user.profilePicture && <span>Current profile picture</span>}
              </div>
            )}
            {error && <p className="profile-photo-error" role="alert">{error}</p>}
            <input
              ref={inputRef}
              className="profile-avatar-input"
              type="file"
              accept={ACCEPTED_TYPES.join(',')}
              aria-label="Choose a profile picture"
              onChange={handleFileChange}
            />
            <div className="profile-photo-actions">
              <button
                className="btn btn-ghost"
                type="button"
                disabled={uploading}
                onClick={() => inputRef.current?.click()}
              >
                {imageUrl ? 'Choose another photo' : 'Choose photo'}
              </button>
              {user.profilePicture && (
                <button
                  className="btn btn-ghost profile-photo-remove"
                  type="button"
                  disabled={uploading}
                  onClick={handleRemove}
                >
                  {uploading ? 'Removing...' : 'Remove photo'}
                </button>
              )}
              {imageUrl && (
                <button
                  className="btn btn-primary"
                  type="button"
                  disabled={!imageSize || uploading}
                  onClick={handleSave}
                >
                  {uploading ? 'Saving...' : 'Save photo'}
                </button>
              )}
            </div>
          </section>
        </div>,
        document.body
      )}
    </span>
  );
}
