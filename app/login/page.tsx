'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ email: '', password: '' });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const r = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await r.json();
      if (!r.ok) {
        setError(data.error || 'Login failed');
        setLoading(false);
        return;
      }
      router.push('/dashboard');
      router.refresh();
    } catch {
      setError('Network error. Please try again.');
      setLoading(false);
    }
  }

  return (
    <div className="form-page">
      <form className="form-card" onSubmit={submit}>
        <span className="cow-logo form-card__cow" role="img" aria-label="Shipping Cow" style={{ height: 70 }} />
        <h1>Welcome Back</h1>
        <p className="form-card__sub">Log in to your Shipping Cow dashboard.</p>

        {error && <div className="form-error">{error}</div>}

        <div className="form-field">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            required
            autoFocus
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="jane@yourstore.com"
          />
        </div>

        <div className="form-field">
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            required
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
        </div>

        <button type="submit" className="btn btn--blue btn--full" disabled={loading}>
          {loading ? <><span className="spinner" /> Logging in...</> : 'Log In →'}
        </button>

        <div className="form-footer">
          New to Shipping Cow? <Link href="/signup">Create an account</Link>
        </div>
      </form>
    </div>
  );
}
