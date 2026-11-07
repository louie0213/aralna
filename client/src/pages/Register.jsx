// this file handles new student account registration
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext.jsx';
import AuthLayout from '../components/AuthLayout.jsx';
import Field from '../components/Field.jsx';
import { MagneticButton, StaggerGroup, StaggerItem } from '../components/motion';
import ServerWaitingCard from '../components/ServerWaitingCard.jsx';
import { useServerStatus } from '../useServerStatus.js';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validate(f) {
  const e = {};
  if (!f.fullName.trim()) e.fullName = 'Enter your name.';
  if (!EMAIL_RE.test(f.email)) e.email = 'Enter a valid email address.';
  if (f.password.length < 8 || !/[A-Za-z]/.test(f.password) || !/\d/.test(f.password)) {
    e.password = 'Use at least 8 characters with a letter and a number.';
  }
  if (f.confirm !== f.password) e.confirm = 'Passwords do not match.';
  return e;
}

export default function Register() {
  const { register } = useAuth();
  const serverStatus = useServerStatus();
  const navigate = useNavigate();
  const [form, setForm] = useState({ fullName: '', program: '', email: '', password: '', confirm: '' });
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  async function submitRegistration() {
    if (serverStatus === 'waking') return;
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
      setError(err.status === undefined ? '' : err.message);
    } finally {
      setBusy(false);
    }
  }

  function onSubmit(e) {
    e.preventDefault();
    submitRegistration();
  }

  return (
    <AuthLayout wide>
      {(serverStatus === 'waking' || serverStatus === 'failed') && (
        <ServerWaitingCard status={serverStatus} onRetry={submitRegistration} />
      )}

      {/* Form body — supporting stagger inside the card scale-in */}
      <StaggerGroup staggerChildren={0.09} delayChildren={0.06}>
        <StaggerItem as="h1">Create your student account</StaggerItem>
        <StaggerItem as="p" className="auth-sub">
          Enter your details below to create your student account.
        </StaggerItem>
        {error && (
          <StaggerItem as="div" className="alert" role="alert">
            {error}
          </StaggerItem>
        )}
        <StaggerItem as="form" onSubmit={onSubmit} noValidate>
          <div className="grid-2">
            <Field label="Name" name="fullName" autoComplete="name" value={form.fullName} onChange={onChange} error={errors.fullName} />
            <Field label="Program (optional)" name="program" placeholder="BSIT" value={form.program} onChange={onChange} />
          </div>
          <Field label="Email" name="email" type="email" autoComplete="email" value={form.email} onChange={onChange} error={errors.email} />
          <div className="grid-2">
            <Field label="Password" name="password" type="password" autoComplete="new-password" value={form.password} onChange={onChange} error={errors.password} />
            <Field label="Confirm password" name="confirm" type="password" autoComplete="new-password" value={form.confirm} onChange={onChange} error={errors.confirm} />
          </div>
          <MagneticButton
            as="button"
            type="submit"
            className="btn btn-primary"
            disabled={busy || serverStatus === 'waking'}
          >
            {serverStatus === 'waking' ? 'Waiting for server...' : busy ? 'Creating account...' : 'Create account'}
          </MagneticButton>
        </StaggerItem>
        <StaggerItem as="p" className="auth-switch">
          Already registered? <Link to="/login">Log in</Link>
        </StaggerItem>
      </StaggerGroup>
    </AuthLayout>
  );
}
