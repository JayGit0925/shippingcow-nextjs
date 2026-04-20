'use client';

import { useState } from 'react';
import Link from 'next/link';

type TrackResult =
  | { found: true; tracking_number: string; status: string; origin: string; destination: string; est_delivery: string }
  | { found: false; tracking_number: string; message: string };

export default function TrackPage() {
  const [value, setValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TrackResult | null>(null);

  async function submit(e?: React.FormEvent) {
    e?.preventDefault();
    if (!value.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      const r = await fetch(`/api/track?number=${encodeURIComponent(value.trim())}`);
      const data = await r.json();
      setTimeout(() => {
        setResult(data);
        setLoading(false);
      }, 600);
    } catch {
      setLoading(false);
    }
  }

  return (
    <div className="form-page">
      <div className="form-card form-card--wide">
        <span className="cow-logo form-card__cow" role="img" aria-label="Shipping Cow" style={{ height: 70 }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
          <h1 style={{ margin: 0 }}>Track Your Package</h1>
          <span style={{ fontFamily: 'var(--font-pixel)', fontSize: '0.55rem', background: 'var(--yellow)', color: 'var(--dark)', padding: '0.2rem 0.5rem', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>
            DEMO MODE
          </span>
        </div>
        <p className="form-card__sub">
          Enter your Shipping Cow tracking number below. Try <strong>SC123456789</strong>, <strong>SC987654321</strong>, or <strong>SC111222333</strong> to see the demo.
        </p>

        <form onSubmit={submit}>
          <div className="form-field">
            <label htmlFor="number">Tracking Number</label>
            <input
              id="number"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="SC123456789"
              autoFocus
            />
          </div>
          <button type="submit" className="btn btn--blue btn--full" disabled={loading}>
            {loading ? <><span className="spinner" /> Sniffing out your package...</> : 'Moo-ve It! →'}
          </button>
        </form>

        {result && result.found && (
          <div style={{ marginTop: '2rem', padding: '1.5rem', background: 'var(--bg-light)', border: '3px solid var(--blue)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', textTransform: 'uppercase', color: 'var(--blue)' }}>
                  {result.tracking_number}
                </div>
                <div style={{ fontSize: '1rem', color: '#3a4454', marginTop: '0.3rem' }}>
                  <strong>{result.origin}</strong> → <strong>{result.destination}</strong>
                </div>
                <div style={{ fontSize: '0.95rem', color: '#3a4454', marginTop: '0.2rem' }}>
                  Estimated delivery: <strong>{result.est_delivery}</strong>
                </div>
              </div>
              <span className="cow-logo" role="img" aria-label="Happy cow" style={{ width: 70, height: 58 }} />
            </div>
            <div style={{ display: 'flex', gap: 2, height: 20, marginTop: '1rem' }}>
              <span style={{ flex: 1, background: 'var(--yellow)', border: '2px solid var(--dark)' }} />
              <span style={{ flex: 1, background: 'var(--yellow)', border: '2px solid var(--dark)' }} />
              <span style={{ flex: 1, background: result.status === 'out_for_delivery' || result.status === 'delivered' ? 'var(--yellow)' : 'var(--blue-light)', border: '2px solid var(--dark)' }} />
              <span style={{ flex: 1, background: result.status === 'delivered' ? 'var(--yellow)' : 'var(--blue-light)', border: '2px solid var(--dark)' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', flexWrap: 'wrap', gap: 4 }}>
              <span style={{ color: 'var(--blue)', fontWeight: 700 }}>✓ Confirmed</span>
              <span style={{ color: 'var(--blue)', fontWeight: 700 }}>✓ In Transit</span>
              <span style={{ color: result.status === 'out_for_delivery' || result.status === 'delivered' ? 'var(--blue)' : '#888', fontWeight: result.status === 'out_for_delivery' || result.status === 'delivered' ? 700 : 400 }}>
                {result.status === 'out_for_delivery' || result.status === 'delivered' ? '✓ ' : ''}Local Hub
              </span>
              <span style={{ color: result.status === 'delivered' ? 'var(--blue)' : '#888', fontWeight: result.status === 'delivered' ? 700 : 400 }}>
                {result.status === 'delivered' ? '✓ ' : ''}Delivered
              </span>
            </div>
          </div>
        )}

        {result && !result.found && (
          <div style={{ marginTop: '2rem', padding: '1.5rem', background: '#fff8e1', border: '3px solid var(--yellow)' }}>
            <strong>Nothing in the herd with that number.</strong>
            <p style={{ marginTop: '0.4rem', fontSize: '0.95rem' }}>{result.message}</p>
          </div>
        )}

        <div className="form-footer">
          Need to ship something? <Link href="/inquiry">Get a quote</Link>
        </div>
      </div>
    </div>
  );
}
