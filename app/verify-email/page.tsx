'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

export default function VerifyEmailPage() {
  const router = useRouter();
  const [code, setCode] = useState(['', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [email, setEmail] = useState('');
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    const stored = sessionStorage.getItem('verify_email');
    if (stored) setEmail(stored);
    // Focus first input
    inputsRef.current[0]?.focus();
  }, []);

  function handleChange(index: number, value: string) {
    if (value.length > 1) return; // Only one digit at a time

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    // Auto-advance to next input
    if (value && index < 3) {
      inputsRef.current[index + 1]?.focus();
    }
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent) {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const fullCode = code.join('');
    if (fullCode.length !== 4) {
      setError('Please enter the full 4-digit code.');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const r = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: fullCode }),
      });
      const data = await r.json();

      if (!r.ok) {
        setError(data.error || 'Verification failed');
        setLoading(false);
        return;
      }

      setSuccess(true);
      sessionStorage.removeItem('verify_email');
      setTimeout(() => router.push('/dashboard'), 1500);
    } catch {
      setError('Network error. Please try again.');
      setLoading(false);
    }
  }

  async function resend() {
    setResending(true);
    setError(null);
    try {
      const r = await fetch('/api/auth/resend-verification', { method: 'POST' });
      const data = await r.json();
      if (!r.ok) {
        setError(data.error || 'Failed to resend');
      } else {
        setError(null);
        // Clear inputs
        setCode(['', '', '', '']);
        inputsRef.current[0]?.focus();
      }
    } catch {
      setError('Network error.');
    }
    setResending(false);
  }

  if (success) {
    return (
      <div className="form-page">
        <div className="form-card" style={{ textAlign: 'center' }}>
          <span className="cow-logo form-card__cow wiggle" role="img" aria-label="Shipping Cow" style={{ height: 70 }} />
          <h1>Email Verified! 🐄</h1>
          <p style={{ color: '#059669', fontSize: '1.1rem', marginTop: '1rem' }}>
            Redirecting you to your dashboard...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="form-page">
      <form className="form-card" onSubmit={submit}>
        <span className="cow-logo form-card__cow wiggle" role="img" aria-label="Shipping Cow" style={{ height: 70 }} />
        <h1>Check Your Email</h1>
        <p className="form-card__sub">
          We sent a 4-digit code to <strong>{email || 'your email'}</strong>.
          Enter it below to verify your account.
        </p>

        {error && <div className="form-error">{error}</div>}

        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', margin: '1.5rem 0' }}>
          {code.map((digit, i) => (
            <input
              key={i}
              ref={(el) => { inputsRef.current[i] = el; }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              required
              value={digit}
              onChange={(e) => handleChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              style={{
                width: '52px',
                height: '60px',
                textAlign: 'center',
                fontSize: '1.6rem',
                fontFamily: "'Courier New', monospace",
                fontWeight: 700,
                border: '3px solid var(--dark)',
                borderRadius: '4px',
                background: digit ? 'var(--blue-light, #EEF2FF)' : '#fff',
                color: 'var(--dark)',
                outline: 'none',
              }}
              aria-label={`Digit ${i + 1}`}
            />
          ))}
        </div>

        <button type="submit" className="btn btn--blue btn--full" disabled={loading}>
          {loading ? <><span className="spinner" /> Verifying...</> : 'Verify Email →'}
        </button>

        <div style={{ textAlign: 'center', marginTop: '1.2rem' }}>
          <button
            type="button"
            onClick={resend}
            disabled={resending}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--blue)',
              textDecoration: 'underline',
              cursor: 'pointer',
              fontSize: '0.88rem',
            }}
          >
            {resending ? 'Sending...' : 'Resend code'}
          </button>
        </div>

        <div className="form-footer" style={{ marginTop: '0.8rem' }}>
          Wrong email? <a href="/signup" style={{ color: 'var(--blue)' }}>Sign up again</a>
        </div>
      </form>
    </div>
  );
}
