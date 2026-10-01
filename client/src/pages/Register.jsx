import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext.jsx';
import AuthLayout from '../components/AuthLayout.jsx';
import Field from '../components/Field.jsx';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validate(f) {
  const e = {};
  if (!f.fullName.trim()) e.fullName = 'Enter your full name.';
  if (!EMAIL_RE.test(f.email)) e.email = 'Enter a valid email address.';
  if (f.password.length < 8 || !/[A-Za-z]/.test(f.password) || !/\d/.test(f.password)) {
    e.password = 'Use at least 8 characters with a letter and a number.';
  }
  if (f.confirm !== f.password) e.confirm = 'Passwords do not match.';
  return e;
}

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ fullName: '', program: '', email: '', password: '', confirm: '' });
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    const found = validate(form);
    setErrors(found);
    if (Object.keys(found).length) return;
    setBusy(true);
    try {
      const { confirm, ...payload } = form;
      await register(payload);
      navigate('/app', { replace: true });
    } catch (err) {
      setErrors(err.fieldErrors || {});
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthLayout wide>
      <h1>Create your student account</h1>
      <p className="auth-sub">Admin accounts are created by an existing administrator.</p>
      {error && <div className="alert" role="alert">{error}</div>}
      <form onSubmit={onSubmit} noValidate>
        <div className="grid-2">
          <Field label="Full name" name="fullName" autoComplete="name" value={form.fullName} onChange={onChange} error={errors.fullName} />
          <Field label="Program (optional)" name="program" placeholder="BSIT" value={form.program} onChange={onChange} />
        </div>
        <Field label="Email" name="email" type="email" autoComplete="email" value={form.email} onChange={onChange} error={errors.email} />
        <div className="grid-2">
          <Field label="Password" name="password" type="password" autoComplete="new-password" value={form.password} onChange={onChange} error={errors.password} />
          <Field label="Confirm password" name="confirm" type="password" autoComplete="new-password" value={form.confirm} onChange={onChange} error={errors.confirm} />
        </div>
        <button className="btn btn-primary" disabled={busy}>{busy ? 'Creating account...' : 'Create account'}</button>
      </form>
      <p className="auth-switch">Already registered? <Link to="/login">Log in</Link></p>
    </AuthLayout>
  );
}
