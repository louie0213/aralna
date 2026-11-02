import { trackServerRequest } from './serverStatus.js';

async function request(path, { method = 'GET', body, signal } = {}) {
  const serverRequest = trackServerRequest();
  let res;
  try {
    res = await fetch(`/api${path}`, {
      method,
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
      signal,
    });
    serverRequest.response();
  } catch (error) {
    if (error.name === 'AbortError') serverRequest.cancel();
    else serverRequest.networkError();
    throw error;
  }
  let data = {};
  try {
    data = await res.json();
  } catch (err) {
    if (err.name === 'AbortError') throw err;
  }
  if (!res.ok) {
    const err = new Error(data.message || 'Request failed. Try again.');
    err.status = res.status;
    err.fieldErrors = data.errors || {};
    throw err;
  }
  return data;
}

export const api = {
  get: (path, options) => request(path, options),
  post: (path, body, options = {}) => request(path, { ...options, method: 'POST', body }),
  patch: (path, body) => request(path, { method: 'PATCH', body }),
  delete: (path) => request(path, { method: 'DELETE' }),
  // Uses XHR instead of fetch so upload progress can be reported.
  upload: (path, file, { onProgress, fields = {}, signal } = {}) =>
    new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      const serverRequest = trackServerRequest();
      let settled = false;
      const cleanup = () => {
        signal?.removeEventListener('abort', abortRequest);
        xhr.onload = null;
        xhr.onerror = null;
        xhr.onabort = null;
      };
      const settle = (handler, value) => {
        if (settled) return;
        settled = true;
        cleanup();
        handler(value);
      };
      const abortError = () => new DOMException('The operation was aborted.', 'AbortError');
      const abortRequest = () => {
        xhr.abort();
        settle(reject, abortError());
      };

      if (signal?.aborted) {
        serverRequest.cancel();
        reject(abortError());
        return;
      }

      xhr.open('POST', `/api${path}`);
      xhr.withCredentials = true;
      xhr.upload.onprogress = (e) => {
        if (onProgress && e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
      };
      xhr.onload = () => {
        serverRequest.response();
        let data = {};
        try {
          data = JSON.parse(xhr.responseText);
        } catch {
          // non-JSON response, fall through with an empty object
        }
        if (xhr.status >= 200 && xhr.status < 300) settle(resolve, data);
        else settle(reject, Object.assign(new Error(data.message || 'Upload failed. Try again.'), { status: xhr.status }));
      };
      xhr.onerror = () => {
        serverRequest.networkError();
        settle(reject, new Error('Upload failed. Check your connection.'));
      };
      xhr.onabort = () => {
        serverRequest.cancel();
        settle(reject, abortError());
      };
      signal?.addEventListener('abort', abortRequest, { once: true });
      const form = new FormData();
      form.append('file', file);
      Object.entries(fields).forEach(([name, value]) => form.append(name, value));
      try {
        xhr.send(form);
      } catch (error) {
        serverRequest.networkError();
        settle(reject, error);
      }
    }),
};
