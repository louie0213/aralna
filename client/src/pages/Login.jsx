import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext.jsx';
import AuthLayout from '../components/AuthLayout.jsx';
import Field from '../components/Field.jsx';
import { api } from '../api.js';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [resetForm, setResetForm] = useState({ code: '', password: '' });
  const [mode, setMode] = useState('login');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  function changeMode(nextMode) {
    setMode(nextMode);
    setError('');
    setNotice('');
  }

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    if (!form.email || !form.password) return setError('Enter your email and password.');
    setBusy(true);
    try {
      const user = await login(form.email, form.password);
      navigate(user.role === 'admin' ? '/admin' : '/app', { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function requestResetCode(e) {
    e.preventDefault();
    setError('');
    if (!form.email) return setError('Enter the email address for your account.');
    setBusy(true);
    try {
      const data = await api.post('/auth/forgot-password', { email: form.email });
      setNotice(data.message);
      setMode('reset');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function resetPassword(e) {
    e.preventDefault();
    setError('');
    if (!resetForm.code || !resetForm.password) {
      return setError('Enter the code from your email and a new password.');
    }
    setBusy(true);
    try {
      const data = await api.post('/auth/reset-password', {
        email: form.email,
        code: resetForm.code,
        password: resetForm.password,
      });
      setForm({ ...form, password: '' });
      setResetForm({ code: '', password: '' });
      setMode('login');
      setNotice(data.message);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthLayout>
      {mode === 'login' && (
        <>
          <h1>Log in</h1>
          <p className="auth-sub">Students and admins use the same form.</p>
          {error && <div className="alert" role="alert">{error}</div>}
          {notice && <div className="auth-notice" role="status">{notice}</div>}
          <form onSubmit={onSubmit} noValidate>
            <Field label="Email" name="email" type="email" autoComplete="email" value={form.email} onChange={onChange} />
            <Field label="Password" name="password" type="password" autoComplete="current-password" value={form.password} onChange={onChange} />
            <p className="auth-forgot"><button type="button" className="auth-link" onClick={() => changeMode('request')}>Forgot password?</button></p>
            <button className="btn btn-primary" disabled={busy}>{busy ? 'Logging in...' : 'Log in'}</button>
          </form>
          <p className="auth-switch">New student? <Link to="/register">Create an account</Link></p>
        </>
      )}
      {mode === 'request' && (
        <>
          <h1>Forgot password?</h1>
          <p className="auth-sub">Enter your account email and we’ll send a password reset code if an active account matches it.</p>
          {error && <div className="alert" role="alert">{error}</div>}
          <form onSubmit={requestResetCode} noValidate>
            <Field label="Email" name="email" type="email" autoComplete="email" value={form.email} onChange={onChange} />
            <button className="btn btn-primary" disabled={busy}>{busy ? 'Sending code...' : 'Send reset code'}</button>
          </form>
          <p className="auth-switch"><button type="button" className="auth-link" onClick={() => changeMode('login')}>Back to log in</button></p>
        </>
      )}
      {mode === 'reset' && (
        <>
          <h1>Reset your password</h1>
          <p className="auth-sub">If an active account matches that email, a reset code will arrive shortly. The code expires in 10 minutes.</p>
          {notice && <div className="auth-notice" role="status">{notice}</div>}
          {error && <div className="alert" role="alert">{error}</div>}
          <form onSubmit={resetPassword} noValidate>
            <Field
              label="6-digit code"
              name="reset-code"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              value={resetForm.code}
              onChange={(e) => setResetForm({ ...resetForm, code: e.target.value.replace(/\D/g, '') })}
            />
            <Field
              label="New password"
              name="reset-password"
              type="password"
              autoComplete="new-password"
              value={resetForm.password}
              onChange={(e) => setResetForm({ ...resetForm, password: e.target.value })}
            />
            <p className="auth-sub auth-password-help">Use at least 8 characters with a letter and a number.</p>
            <button className="btn btn-primary" disabled={busy}>{busy ? 'Resetting password...' : 'Reset password'}</button>
          </form>
          <p className="auth-switch">
            Didn’t receive a code? <button type="button" className="auth-link" onClick={() => changeMode('request')}>Try again</button>
          </p>
          <p className="auth-switch"><button type="button" className="auth-link" onClick={() => changeMode('login')}>Back to log in</button></p>
        </>
      )}
    </AuthLayout>
  );
}
