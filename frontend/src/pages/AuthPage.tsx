import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router';
import { useAuth } from '../useAuth';

export function AuthPage({ mode }: { mode: 'login' | 'register' }) {
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
    <section className="narrow">
      <h1>{isRegister ? 'Create an account' : 'Log in'}</h1>
      <form onSubmit={submit} className="form">
        {isRegister && (
          <>
            <label htmlFor="name">Name</label>
            <input id="name" value={form.name} onChange={set('name')} required autoComplete="name" />
          </>
        )}
        <label htmlFor="email">Email</label>
        <input id="email" type="email" value={form.email} onChange={set('email')} required autoComplete="email" />
        <label htmlFor="password">Password</label>
        <input
          id="password"
          type="password"
          minLength={6}
          value={form.password}
          onChange={set('password')}
          required
          autoComplete={isRegister ? 'new-password' : 'current-password'}
        />
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        <button type="submit" disabled={busy}>
          {busy ? 'Please wait…' : isRegister ? 'Sign up' : 'Log in'}
        </button>
      </form>
      <p className="muted">
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
