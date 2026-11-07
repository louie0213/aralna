// this file handles drag-and-drop file picking for uploads
import { useRef, useState } from 'react';

const ACCEPT = '.pdf,.docx,.pptx,.txt,.png,.jpg,.jpeg,.webp';
const FILE_TYPES = ['PDF', 'DOCX', 'PPTX', 'TXT', 'PNG', 'JPG', 'WEBP'];

function formatSize(bytes) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getType(name) {
  return name.split('.').pop()?.toUpperCase() || 'FILE';
}

export default function Dropzone({ onFiles, queue = [] }) {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [multipleNote, setMultipleNote] = useState('');
  const upload = selectedFile
    ? [...queue].reverse().find((item) => item.name === selectedFile.name && item.size === selectedFile.size)
    : null;
  const uploading = upload && upload.stage !== 'error';
  const failed = upload?.stage === 'error';
  const progress = upload?.progress ?? 0;

  function chooseFile() {
    inputRef.current?.click();
  }

  function handleFiles(fileList) {
    const files = Array.from(fileList || []);
    const file = files[0];
    if (!file) return;
    setSelectedFile(file);
    setMultipleNote(files.length > 1 ? 'Only one file at a time. Using the first one.' : '');
    onFiles([file], () => {
      setSelectedFile((current) => current === file ? null : current);
      setMultipleNote('');
    });
  }

  function handleDrop(event) {
    event.preventDefault();
    setDragging(false);
    handleFiles(event.dataTransfer.files);
  }

  return (
    <div
      className={`dropzone${dragging ? ' dropzone-active' : ''}${selectedFile ? ' dropzone-has-file' : ''}${uploading ? ' dropzone-uploading' : ''}${failed ? ' dropzone-error' : ''}`}
      onDragOver={(event) => { event.preventDefault(); setDragging(true); }}
      onDragLeave={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setDragging(false);
      }}
      onDrop={handleDrop}
      onClick={(event) => {
        if (!selectedFile && !event.target.closest('button')) chooseFile();
      }}
      aria-busy={Boolean(uploading)}
      aria-describedby={selectedFile ? undefined : 'dropzone-file-types dropzone-file-notes'}
    >
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        hidden
        aria-label="Choose a file to upload"
        onClick={(event) => event.stopPropagation()}
        onChange={(event) => {
          handleFiles(event.target.files);
          event.target.value = '';
        }}
      />

      {selectedFile ? (
        <div className="dropzone-file-card">
          <span className="dropzone-file-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24"><path d="M6 2.75h7l5 5v13.5H6z" /><path d="M13 2.75v5h5M9 13h6m-6 3.5h6" /></svg>
            <span>{getType(selectedFile.name)}</span>
          </span>
          <span className="dropzone-file-details">
            <span className="dropzone-file-name" title={selectedFile.name}>{selectedFile.name}</span>
            <span className="dropzone-file-size">
              {formatSize(selectedFile.size)}
              {uploading ? ` · ${upload.stage === 'reading' ? 'Processing' : `${progress}% uploaded`}` : failed ? ' · Upload failed' : ' · Upload complete'}
            </span>
            {uploading && (
              <span className="dropzone-file-progress" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow={progress}>
                <span style={{ '--queue-progress': `${progress}%` }} />
              </span>
            )}
            {failed && <span className="dropzone-file-error" role="alert">{upload.message}</span>}
          </span>
          <button className="dropzone-browse-button dropzone-replace-button" type="button" onClick={chooseFile}>
            Replace
          </button>
        </div>
      ) : (
        <>
          <span className="dropzone-icon" aria-hidden="true">
            <svg viewBox="0 0 32 32"><path d="M16 21V7m-5 5 5-5 5 5" /><path d="M7 19v7h18v-7" /></svg>
          </span>
          <p className="dropzone-title">
            {dragging ? 'Drop your file to upload' : <>Drag a file here, or <span className="dropzone-browse-link">click to browse</span></>}
          </p>
          <div className="dropzone-file-types" id="dropzone-file-types" aria-label="Accepted file types">
            {FILE_TYPES.map((type) => <span className="dropzone-file-type" key={type}>{type}</span>)}
          </div>
          <p className="dropzone-sub" id="dropzone-file-notes">Scanned PDFs and photos are read with OCR. Up to 100MB.</p>
          <button className="dropzone-browse-button" type="button" onClick={(event) => { event.stopPropagation(); chooseFile(); }}>
            Browse file
          </button>
        </>
      )}
      {multipleNote && <p className="dropzone-multiple-note" role="status">{multipleNote}</p>}
    </div>
  );
}
