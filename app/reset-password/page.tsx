'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';

  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ password: '', confirm: '' });

  useEffect(() => {
    if (!token) setError('Missing or invalid reset link. Please request a new one.');
  }, [token]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (form.password !== form.confirm) {
      setError("Passwords don't match.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const r = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password: form.password }),
      });
      const data = await r.json();
      if (!r.ok) {
        setError(data.error || 'Reset failed');
        setLoading(false);
        return;
      }
      setDone(true);
      setTimeout(() => router.push('/login'), 3000);
    } catch {
      setError('Network error. Please try again.');
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="form-page">
        <div className="form-card" style={{ textAlign: 'center' }}>
          <span className="cow-logo form-card__cow" role="img" aria-label="Shipping Cow" style={{ height: 70 }} />
          <h1>Password Updated!</h1>
          <p className="form-card__sub">
            Your password has been changed. Redirecting you to login&hellip;
          </p>
          <div className="form-footer" style={{ marginTop: 24 }}>
            <Link href="/login">Go to Login →</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="form-page">
      <form className="form-card" onSubmit={submit}>
        <span className="cow-logo form-card__cow" role="img" aria-label="Shipping Cow" style={{ height: 70 }} />
        <h1>Set New Password</h1>
        <p className="form-card__sub">Choose a strong password for your account.</p>

        {error && <div className="form-error">{error}</div>}

        <div className="form-field">
          <label htmlFor="password">New Password</label>
          <input
            id="password"
            type="password"
            required
            minLength={8}
            autoFocus
            disabled={!token}
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            placeholder="At least 8 characters"
          />
        </div>

        <div className="form-field">
          <label htmlFor="confirm">Confirm New Password</label>
          <input
            id="confirm"
            type="password"
            required
            minLength={8}
            disabled={!token}
            value={form.confirm}
            onChange={(e) => setForm({ ...form, confirm: e.target.value })}
            placeholder="Repeat your new password"
          />
        </div>

        <button type="submit" className="btn btn--blue btn--full" disabled={loading || !token}>
          {loading ? <><span className="spinner" /> Updating...</> : 'Update Password →'}
        </button>

        <div className="form-footer">
          <Link href="/login">Back to Login</Link>
        </div>
      </form>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  );
}
