'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState('');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const r = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await r.json();
      if (!r.ok) {
        setError(data.error || 'Something went wrong');
        setLoading(false);
        return;
      }
      setSubmitted(true);
    } catch {
      setError('Network error. Please try again.');
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <div className="form-page">
        <div className="form-card" style={{ textAlign: 'center' }}>
          <span className="cow-logo form-card__cow" role="img" aria-label="Shipping Cow" style={{ height: 70 }} />
          <h1>Check Your Email</h1>
          <p className="form-card__sub">
            If an account exists for <strong>{email}</strong>, we sent a password reset link. Check your inbox — it expires in 1 hour.
          </p>
          <div className="form-footer" style={{ marginTop: 24 }}>
            <Link href="/login">Back to Login</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="form-page">
      <form className="form-card" onSubmit={submit}>
        <span className="cow-logo form-card__cow" role="img" aria-label="Shipping Cow" style={{ height: 70 }} />
        <h1>Forgot Password?</h1>
        <p className="form-card__sub">
          Enter your email and we&apos;ll send you a link to reset your password.
        </p>

        {error && <div className="form-error">{error}</div>}

        <div className="form-field">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            required
            autoFocus
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="jane@yourstore.com"
          />
        </div>

        <button type="submit" className="btn btn--blue btn--full" disabled={loading}>
          {loading ? <><span className="spinner" /> Sending...</> : 'Send Reset Link →'}
        </button>

        <div className="form-footer">
          Remember it? <Link href="/login">Back to Login</Link>
        </div>
      </form>
    </div>
  );
}
