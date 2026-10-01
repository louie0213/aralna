import { useState } from 'react';
import Field from '../../components/Field.jsx';
import { api } from '../../api.js';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const EMPTY = { fullName: '', email: '', password: '', confirm: '' };

function validate(f) {
  const e = {};
  if (!f.fullName.trim()) e.fullName = 'Enter the full name.';
  if (!EMAIL_RE.test(f.email)) e.email = 'Enter a valid email address.';
  if (f.password.length < 8 || !/[A-Za-z]/.test(f.password) || !/\d/.test(f.password)) {
    e.password = 'Use at least 8 characters with a letter and a number.';
  }
  if (f.confirm !== f.password) e.confirm = 'Passwords do not match.';
  return e;
}

export default function AddAdmin() {
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [done, setDone] = useState('');
  const [busy, setBusy] = useState(false);

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    setDone('');
    const found = validate(form);
    setErrors(found);
    if (Object.keys(found).length) return;
    setBusy(true);
    try {
      const { confirm, ...payload } = form;
      const { user } = await api.post('/admin/admins', payload);
      setDone(`Admin account created for ${user.email}. Share the password with them privately.`);
      setForm(EMPTY);
    } catch (err) {
      setErrors(err.fieldErrors || {});
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <h1>Add admin</h1>
      <section className="panel form-panel">
        <p className="muted">The new admin can log in right away with this email and password.</p>
        {error && <div className="alert" role="alert">{error}</div>}
        {done && <div className="notice" role="status">{done}</div>}
        <form onSubmit={onSubmit} noValidate>
          <Field label="Full name" name="fullName" value={form.fullName} onChange={onChange} error={errors.fullName} />
          <Field label="Email" name="email" type="email" value={form.email} onChange={onChange} error={errors.email} />
          <div className="grid-2">
            <Field label="Password" name="password" type="password" autoComplete="new-password" value={form.password} onChange={onChange} error={errors.password} />
            <Field label="Confirm password" name="confirm" type="password" autoComplete="new-password" value={form.confirm} onChange={onChange} error={errors.confirm} />
          </div>
          <button className="btn btn-primary" disabled={busy}>{busy ? 'Creating admin...' : 'Create admin'}</button>
        </form>
      </section>
    </>
  );
}
