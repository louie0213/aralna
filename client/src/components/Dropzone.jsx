import { useRef, useState } from 'react';

const ACCEPT = '.pdf,.docx,.pptx,.txt,.png,.jpg,.jpeg,.webp';

export default function Dropzone({ onFiles }) {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);

  function handleFiles(fileList) {
    const files = Array.from(fileList || []);
    if (files.length) onFiles(files);
  }

  return (
    <div
      className={dragging ? 'dropzone dropzone-active' : 'dropzone'}
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => { e.preventDefault(); setDragging(false); handleFiles(e.dataTransfer.files); }}
      onClick={() => inputRef.current?.click()}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); inputRef.current?.click(); } }}
    >
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        multiple
        hidden
        onChange={(e) => { handleFiles(e.target.files); e.target.value = ''; }}
      />
      <p className="dropzone-title">Drag files here, or click to browse</p>
      <p className="dropzone-sub">PDF, DOCX, PPTX, TXT, PNG, JPG or WEBP. Scanned PDFs and photos are read with OCR. Up to 100MB each.</p>
    </div>
  );
}
