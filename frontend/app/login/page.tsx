'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api, saveSession, User } from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      const result = await api<{ token: string; user: User }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      saveSession(result.token, result.user);
      router.push('/workspace');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to sign in');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="notion-auth-container">
      <div className="notion-auth-box">
        <Link className="notion-auth-home-link" href="/">← Back to NOTE OS</Link>
        <Link href="/" className="notion-auth-brand" aria-label="NoteOS home"><span className="noteos-brand-lockup"><span className="noteos-brand-symbol">✦</span><span className="noteos-brand-word">NoteOS</span></span></Link>

        <h1 className="notion-auth-title">Log in</h1>
        <p className="notion-auth-subtitle">Continue to your personal workspace</p>

        {error && <div className="notion-auth-error" role="alert">{error}</div>}

        <form onSubmit={submit} className="notion-auth-form">
          <label className="notion-auth-field">
            <span>Email</span>
            <input
              type="email"
              autoFocus
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="Enter your email…"
              required
            />
          </label>

          <label className="notion-auth-field">
            <span>Password</span>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Enter your password…"
              required
            />
          </label>

          <button
            type="submit"
            className="notion-auth-submit"
            disabled={loading || !email || !password}
          >
            {loading ? 'Signing in…' : 'Continue'}
          </button>
        </form>

        <div className="notion-auth-footer">
          Don&apos;t have an account? <Link href="/register">Sign up</Link>
        </div>
      </div>
    </main>
  );
}
