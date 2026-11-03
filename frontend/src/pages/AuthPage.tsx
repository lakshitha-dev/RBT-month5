import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router';
import { useAuth } from '../useAuth';
import { useStage } from '../stage-context';

export function AuthPage({ mode }: { mode: 'login' | 'register' }) {
  useStage('lock');
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const isRegister = mode === 'register';

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      if (isRegister) await register(form);
      else await login(form.email, form.password);
      navigate('/');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [key]: e.target.value });

  return (
    <section className="page">
      <h1 className="page__title" data-reveal>
        {isRegister ? 'Create an account' : 'Log in'}
      </h1>
      <p className="page__lead" data-reveal>
        {isRegister ? 'An account lets you write posts and join the comments.' : 'Welcome back. Log in to write and comment.'}
      </p>
      <form onSubmit={submit} className="form">
        {isRegister && (
          <>
            <label data-reveal style={{ '--i': 1 } as React.CSSProperties} htmlFor="name">Name</label>
            <input data-reveal style={{ '--i': 2 } as React.CSSProperties} id="name" value={form.name} onChange={set('name')} required autoComplete="name" />
          </>
        )}
        <label data-reveal style={{ '--i': 3 } as React.CSSProperties} htmlFor="email">Email</label>
        <input data-reveal style={{ '--i': 4 } as React.CSSProperties} id="email" type="email" value={form.email} onChange={set('email')} required autoComplete="email" />
        <label data-reveal style={{ '--i': 5 } as React.CSSProperties} htmlFor="password">Password</label>
        <input data-reveal style={{ '--i': 6 } as React.CSSProperties}
          id="password"
          type="password"
          minLength={6}
          value={form.password}
          onChange={set('password')}
          required
          aria-describedby={isRegister ? 'password-rule' : undefined}
          autoComplete={isRegister ? 'new-password' : 'current-password'}
        />
        {isRegister && (
          <p id="password-rule" className="hint">
            At least 6 characters.
          </p>
        )}
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        <button type="submit" disabled={busy}>
          {busy ? 'Please wait…' : isRegister ? 'Sign up' : 'Log in'}
        </button>
      </form>
      <p className="note">
        {isRegister ? (
          <>
            Already have an account? <Link to="/login">Log in</Link>
          </>
        ) : (
          <>
            New here? <Link to="/register">Create an account</Link>
          </>
        )}
      </p>
    </section>
  );
}
