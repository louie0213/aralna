import { useEffect, useState } from 'react';
import { api } from '../../api.js';

const PAGE_SIZE = 40;
const fmtDate = (date) => new Date(date).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });
const fmtSize = (bytes) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export default function Files() {
  const [files, setFiles] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.get(`/admin/files?page=${page}`)
      .then((data) => {
        setFiles(data.files);
        setTotal(data.total);
        setError('');
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [page]);

  const pageCount = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="files-page">
      <header className="page-heading">
        <div>
          <p className="page-eyebrow">ADMIN WORKSPACE / UPLOADS</p>
          <h1>Files</h1>
          <p className="page-description">Review uploaded document details and who uploaded them.</p>
        </div>
        <span className="results-count">{total} {total === 1 ? 'file' : 'files'}</span>
      </header>

      {error && <div className="alert" role="alert">{error}</div>}

      <div className="table-wrap files-table-wrap">
        <table className="files-table">
          <thead>
            <tr><th>File</th><th>Uploaded by</th><th>Uploaded</th><th>Size</th><th>Status</th></tr>
          </thead>
          <tbody>
            {loading && <tr><td className="table-message" colSpan="5">Loading files...</td></tr>}
            {!loading && files.length === 0 && <tr><td className="table-message" colSpan="5">No files have been uploaded yet.</td></tr>}
            {!loading && files.map((file) => (
              <tr key={file.id}>
                <td data-label="File">
                  <span className="file-detail">
                    <span className="file-name" title={file.originalName}>{file.originalName}</span>
                    <span className="file-extension">{file.extension}</span>
                  </span>
                </td>
                <td data-label="Uploaded by">
                  <span className="file-detail">
                    <span className="file-uploader">{file.user?.fullName || 'Unknown user'}</span>
                    {file.user?.email && <span className="file-email">{file.user.email}</span>}
                  </span>
                </td>
                <td data-label="Uploaded">{fmtDate(file.createdAt)}</td>
                <td data-label="Size">{fmtSize(file.sizeBytes)}</td>
                <td data-label="Status">
                  <span className={file.status === 'ready' ? 'badge badge-on' : 'badge badge-off'}>
                    {file.status === 'ready' ? 'Ready' : 'Failed'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pageCount > 1 && (
        <div className="files-pagination" aria-label="File pages">
          <button className="btn btn-ghost" disabled={page === 1 || loading} onClick={() => setPage((current) => current - 1)}>
            Previous
          </button>
          <span>Page {page} of {pageCount}</span>
          <button className="btn btn-ghost" disabled={page >= pageCount || loading} onClick={() => setPage((current) => current + 1)}>
            Next
          </button>
        </div>
      )}

      <p className="files-note">Uploaded originals are removed after processing. This page shows saved file details only.</p>
    </div>
  );
}
