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
        <section className="auth-reset">
          <div className="auth-reset-progress" aria-label="Step 1 of 3">
            <span className="auth-reset-step auth-reset-step-active"><span>1</span> Email</span>
            <span className="auth-reset-progress-line" aria-hidden="true" />
            <span className="auth-reset-step"><span>2</span> Code</span>
            <span className="auth-reset-progress-line" aria-hidden="true" />
            <span className="auth-reset-step"><span>3</span> Password</span>
          </div>
          <p className="auth-reset-eyebrow">ACCOUNT RECOVERY</p>
          <h1>Forgot password?</h1>
          <p className="auth-sub">Enter your account email to get a reset code.</p>
          {error && <div className="alert" role="alert">{error}</div>}
          <form onSubmit={requestResetCode} noValidate>
            <Field label="Email" name="email" type="email" autoComplete="email" value={form.email} onChange={onChange} />
            <button className="btn btn-primary auth-reset-submit" disabled={busy}>
              {busy ? 'Sending code...' : <>Send reset code <span aria-hidden="true">→</span></>}
            </button>
          </form>
          <button type="button" className="auth-reset-back" onClick={() => changeMode('login')}>
            <span aria-hidden="true">←</span> Back to log in
          </button>
        </section>
      )}
      {mode === 'reset' && (
        <section className="auth-reset">
          <div className="auth-reset-progress" aria-label={resetForm.code.length === 6 ? 'Step 3 of 3' : 'Step 2 of 3'}>
            <span className="auth-reset-step auth-reset-step-complete"><span>✓</span> Email</span>
            <span className="auth-reset-progress-line auth-reset-progress-complete" aria-hidden="true" />
            <span className={`auth-reset-step ${resetForm.code.length < 6 ? 'auth-reset-step-active' : 'auth-reset-step-complete'}`}>
              <span>{resetForm.code.length < 6 ? '2' : '✓'}</span> Code
            </span>
            <span className={`auth-reset-progress-line ${resetForm.code.length === 6 ? 'auth-reset-progress-complete' : ''}`} aria-hidden="true" />
            <span className={`auth-reset-step ${resetForm.code.length === 6 ? 'auth-reset-step-active' : ''}`}>
              <span>3</span> Password
            </span>
          </div>
          <p className="auth-reset-eyebrow">ACCOUNT RECOVERY</p>
          <h1>{resetForm.code.length === 6 ? 'Choose a new password' : 'Enter your reset code'}</h1>
          <p className="auth-sub">
            {resetForm.code.length === 6
              ? <>Now create a new password for <strong>{form.email}</strong>.</>
              : <>If an active account matches <strong>{form.email}</strong>, enter the 6-digit code it received.</>}
          </p>
          {notice && <div className="auth-notice" role="status">{notice}</div>}
          {error && <div className="alert" role="alert">{error}</div>}
          <form onSubmit={resetPassword} noValidate>
            <Field
              label="6-digit code"
              name="reset-code"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              className="auth-code-input"
              placeholder="000000"
              maxLength={6}
              autoFocus
              value={resetForm.code}
              onChange={(e) => setResetForm({
                ...resetForm,
                code: e.target.value.replace(/\D/g, ''),
                password: '',
              })}
            />
            {resetForm.code.length === 6 && (
              <>
                <Field
                  label="New password"
                  name="reset-password"
                  type="password"
                  autoComplete="new-password"
                  autoFocus
                  value={resetForm.password}
                  onChange={(e) => setResetForm({ ...resetForm, password: e.target.value })}
                />
                <p className="auth-password-help">At least 8 characters, including a letter and a number.</p>
                <button className="btn btn-primary auth-reset-submit" disabled={busy}>
                  {busy ? 'Updating password...' : 'Reset password'}
                </button>
              </>
            )}
          </form>
          <div className="auth-reset-footer">
            <span>Didn’t get a code?</span>
            <button type="button" className="auth-link" onClick={() => changeMode('request')}>Send another</button>
          </div>
          <button type="button" className="auth-reset-back" onClick={() => changeMode('login')}>
            <span aria-hidden="true">←</span> Back to log in
          </button>
        </section>
      )}
    </AuthLayout>
  );
}
