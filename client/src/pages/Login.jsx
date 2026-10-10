import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth.jsx';
import { Button, Field, Input } from '../components/ui/index.jsx';
import { IconAlert, IconLock } from '../lib/icons.jsx';

export default function Login() {
  const { login, status } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (status === 'authenticated') {
    return <Navigate to={location.state?.from ?? '/'} replace />;
  }

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      await login(form);
      navigate(location.state?.from ?? '/', { replace: true });
    } catch (err) {
      setError(err.friendlyMessage ?? 'Unable to sign in');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="login">
      <section className="login__panel">
        <div className="login__panel-inner">
          <div className="login__brand">
            <img
              className="login__logo"
              src="/brand/vive-logo-white.png"
              alt="Vive Dental Clinic"
            />
            <span className="login__tagline">One Place. One Team. One Smile.</span>
          </div>

          <blockquote className="login__quote">
            <p className="display">
              “Everything the practice knows about a patient, on one screen, before they sit down.”
            </p>
          </blockquote>

          <ul className="login__points">
            <li>
              <span className="numeric">01</span> Chairside charting and clinical notes
            </li>
            <li>
              <span className="numeric">02</span> Lab work tracked from impression to fit
            </li>
            <li>
              <span className="numeric">03</span> Recalls, invoices and reporting in one place
            </li>
          </ul>
        </div>
      </section>

      <section className="login__form-side">
        <form className="login__form" onSubmit={submit}>
          <h1 className="login__title display">Welcome back</h1>
          <p className="login__sub">Sign in to open today's list.</p>

          {error && (
            <div className="login__error" role="alert">
              <IconAlert />
              <span>{error}</span>
            </div>
          )}

          <Field label="Email address">
            <Input
              type="email"
              value={form.email}
              autoComplete="username"
              autoFocus
              placeholder="you@vive.dental"
              onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
              required
            />
          </Field>

          <Field label="Password">
            <Input
              type="password"
              value={form.password}
              autoComplete="current-password"
              placeholder="••••••••"
              onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
              required
            />
          </Field>

          <Button variant="primary" type="submit" loading={busy} className="btn--block" style={{ marginTop: 'var(--sp-2)' }}>
            Sign in
          </Button>

          <p className="login__foot">
            <IconLock />
            Patient data is confidential — never share your sign-in.
          </p>
        </form>
      </section>
    </div>
  );
}
