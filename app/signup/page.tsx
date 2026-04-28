'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function SignupPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', email: '', company: '', password: '' });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const r = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await r.json();
      if (!r.ok) {
        setError(data.error || 'Sign up failed');
        setLoading(false);
        return;
      }
      if (data.requires_verification) {
        // Store user info for the verify page
        sessionStorage.setItem('verify_email', form.email);
        router.push('/verify-email');
      } else {
        router.push('/dashboard');
      }
      router.refresh();
    } catch {
      setError('Network error. Please try again.');
      setLoading(false);
    }
  }

  return (
    <div className="form-page">
      <form className="form-card" onSubmit={submit}>
        <span className="cow-logo form-card__cow wiggle" role="img" aria-label="Shipping Cow" style={{ height: 70 }} />
        <h1>Join the Herd</h1>
        <p className="form-card__sub">Create your Shipping Cow account. Free Scout tier — no credit card needed.</p>

        {error && <div className="form-error">{error}</div>}

        <div className="form-field">
          <label htmlFor="name">Your Name</label>
          <input
            id="name"
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Jane Rancher"
          />
        </div>

        <div className="form-field">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            required
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="jane@yourstore.com"
          />
        </div>

        <div className="form-field">
          <label htmlFor="company">Company (optional)</label>
          <input
            id="company"
            value={form.company}
            onChange={(e) => setForm({ ...form, company: e.target.value })}
            placeholder="Your Store LLC"
          />
        </div>

        <div className="form-field">
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            required
            minLength={8}
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            placeholder="At least 8 characters"
          />
        </div>

        <button type="submit" className="btn btn--blue btn--full" disabled={loading}>
          {loading ? <><span className="spinner" /> Joining...</> : 'Create My Account →'}
        </button>

        <div className="form-footer">
          Already in the herd? <Link href="/login">Log in</Link>
        </div>
      </form>
    </div>
  );
}
