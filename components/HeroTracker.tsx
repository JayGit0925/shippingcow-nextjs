'use client';

import { useState } from 'react';

type TrackResult =
  | { found: true; tracking_number: string; status: string; origin: string; destination: string; est_delivery: string }
  | { found: false; tracking_number: string; status: string; message: string };

export default function HeroTracker() {
  const [value, setValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TrackResult | null>(null);

  async function submit() {
    if (!value.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      const r = await fetch(`/api/track?number=${encodeURIComponent(value.trim())}`);
      const data = await r.json();
      // Brief moo-loading so it feels alive
      setTimeout(() => {
        setResult(data);
        setLoading(false);
      }, 800);
    } catch {
      setLoading(false);
    }
  }

  return (
    <div className="tracker" id="tracker">
      <div className="tracker__label">Tracking Number</div>
      <div className="tracker__row">
        <input
          type="text"
          className="tracker__input"
          placeholder="Try SC123456789 for a demo"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
          maxLength={30}
        />
        <button className="btn" onClick={submit} disabled={loading}>
          {loading ? <><span className="spinner" /> Sniffing...</> : <>Moo-ve It! →</>}
        </button>
      </div>

      {loading && (
        <div className="tracker__result">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
            <span className="cow-logo cow-logo--track wiggle" role="img" aria-label="Shipping Cow" />
            <span><strong>Our cow is sniffing out your package...</strong></span>
          </div>
        </div>
      )}

      {!loading && result && result.found && (
        <div className="tracker__result">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', textTransform: 'uppercase', color: 'var(--blue)' }}>
                Package {result.tracking_number}
              </div>
              <div style={{ fontSize: '0.9rem', color: '#3a4454', marginTop: '0.3rem' }}>
                {result.origin} → {result.destination} · Est: {result.est_delivery}
              </div>
            </div>
            <span className="cow-logo cow-logo--track" role="img" aria-label="Happy cow" />
          </div>
          <div className="tracker__bar">
            <span className="done" /><span className="done" /><span className={result.status === 'delivered' ? 'done' : result.status === 'out_for_delivery' ? 'done' : ''} /><span className={result.status === 'delivered' ? 'done' : ''} />
          </div>
          <div className="tracker__status">
            <span style={{ color: 'var(--blue)', fontWeight: 700 }}>✓ Order Confirmed</span>
            <span style={{ color: 'var(--blue)', fontWeight: 700 }}>✓ In Transit</span>
            <span style={{ color: result.status === 'out_for_delivery' || result.status === 'delivered' ? 'var(--blue)' : '#888', fontWeight: result.status === 'out_for_delivery' || result.status === 'delivered' ? 700 : 400 }}>
              {result.status === 'out_for_delivery' || result.status === 'delivered' ? '✓' : ''} Local Hub
            </span>
            <span style={{ color: result.status === 'delivered' ? 'var(--blue)' : '#888', fontWeight: result.status === 'delivered' ? 700 : 400 }}>
              {result.status === 'delivered' ? '✓' : ''} Delivered
            </span>
          </div>
        </div>
      )}

      {!loading && result && !result.found && (
        <div className="tracker__result">
          <strong>Hmm — nothing in the herd with that number.</strong>
          <p style={{ marginTop: '0.4rem', fontSize: '0.9rem' }}>{result.message}</p>
        </div>
      )}
    </div>
  );
}
