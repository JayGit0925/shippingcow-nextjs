'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  DIM_DIVISOR_STANDARD,
  DIM_DIVISOR_3PL,
  DIM_DIVISOR_SHIPPINGCOW,
  ESTIMATED_COST_PER_LB,
  FUEL_SURCHARGE_RATE,
} from '@/lib/constants';

// ---- Math helpers ----
function dimWeight(l: number, w: number, h: number, divisor: number) {
  return (l * w * h) / divisor;
}
function billable(actual: number, dim: number) {
  return Math.max(actual, dim);
}

type Results = {
  dim139: number; dim166: number; dim225: number;
  bill139: number; bill166: number; bill225: number;
  savingsPerPkg: number;
  fuelWaiverPerPkg: number;
  totalSavingsPerPkg: number;
  annualSavings: number;
  pctSaved: number;
  lbsSaved: number;
};

function calcResults(l: number, w: number, h: number, weight: number, vol: number): Results {
  const dim139 = dimWeight(l, w, h, DIM_DIVISOR_STANDARD);
  const dim166 = dimWeight(l, w, h, DIM_DIVISOR_3PL);
  const dim225 = dimWeight(l, w, h, DIM_DIVISOR_SHIPPINGCOW);
  const bill139 = billable(weight, dim139);
  const bill166 = billable(weight, dim166);
  const bill225 = billable(weight, dim225);
  const lbsSaved = bill139 - bill225;
  const pctSaved = bill139 > 0 ? (lbsSaved / bill139) * 100 : 0;
  const savingsPerPkg = lbsSaved * ESTIMATED_COST_PER_LB;
  const fuelWaiverPerPkg = savingsPerPkg * FUEL_SURCHARGE_RATE;
  const totalSavingsPerPkg = savingsPerPkg + fuelWaiverPerPkg;
  const annualSavings = totalSavingsPerPkg * vol * 12;
  return { dim139, dim166, dim225, bill139, bill166, bill225, savingsPerPkg, fuelWaiverPerPkg, totalSavingsPerPkg, annualSavings, pctSaved, lbsSaved };
}

function fmt1(n: number) { return n.toFixed(1); }
function fmtDollar(n: number) {
  if (n >= 1000) return `$${(n / 1000).toFixed(1)}K`;
  return `$${n.toFixed(2)}`;
}

// ---- Bar component ----
function Bar({ value, max, color, label, billable: bill, isBest }: {
  value: number; max: number; color: string; label: string; billable: number; isBest?: boolean;
}) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div style={{ flex: 1 }}>
      <div style={{
        fontFamily: 'var(--font-pixel)', fontSize: '0.62rem', textTransform: 'uppercase',
        color: isBest ? '#059669' : '#fff', marginBottom: '0.4rem', letterSpacing: '0.04em',
      }}>
        {label}
        {isBest && (
          <span style={{ marginLeft: 6, background: '#059669', color: '#fff', padding: '1px 5px', fontSize: '0.55rem' }}>
            BEST
          </span>
        )}
      </div>
      <div style={{ position: 'relative', height: 120, background: 'rgba(255,255,255,0.08)', border: '2px solid rgba(255,255,255,0.12)' }}>
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          height: `${pct}%`,
          background: color,
          transition: 'height 0.35s ease',
        }} />
      </div>
      <div style={{ marginTop: '0.5rem', textAlign: 'center', fontSize: '0.85rem', fontWeight: 700, color: isBest ? '#059669' : '#fff' }}>
        {fmt1(value)} lbs DIM
      </div>
      <div style={{ textAlign: 'center', fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)' }}>
        Billable: {fmt1(bill)} lbs
      </div>
    </div>
  );
}

export default function DimCalculator() {
  const searchParams = useSearchParams();

  const [length, setLength]   = useState(() => Number(searchParams.get('l'))      || 24);
  const [width,  setWidth]    = useState(() => Number(searchParams.get('w'))      || 18);
  const [height, setHeight]   = useState(() => Number(searchParams.get('h'))      || 16);
  const [weight, setWeight]   = useState(() => Number(searchParams.get('weight')) || 55);
  const [volume, setVolume]   = useState(() => Number(searchParams.get('vol'))    || 100);
  const [results, setResults] = useState<Results>(() =>
    calcResults(
      Number(searchParams.get('l'))      || 24,
      Number(searchParams.get('w'))      || 18,
      Number(searchParams.get('h'))      || 16,
      Number(searchParams.get('weight')) || 55,
      Number(searchParams.get('vol'))    || 100,
    )
  );
  const [copied, setCopied] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sessionIdRef = useRef<string | null>(null);

  // Get or create anonymous session_id
  useEffect(() => {
    if (typeof window === 'undefined') return;
    let sid = localStorage.getItem('sc_session_id');
    if (!sid) {
      sid = crypto.randomUUID();
      localStorage.setItem('sc_session_id', sid);
    }
    sessionIdRef.current = sid;
  }, []);

  const saveToDb = useCallback((l: number, w: number, h: number, wt: number, vol: number) => {
    fetch('/api/calculator-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        session_id:     sessionIdRef.current,
        length: l, width: w, height: h,
        actual_weight:  wt,
        monthly_volume: vol,
      }),
    }).catch(() => {/* non-fatal */});
  }, []);

  // Recalculate on any input change, debounce DB save
  useEffect(() => {
    if (length > 0 && width > 0 && height > 0 && weight > 0 && volume > 0) {
      setResults(calcResults(length, width, height, weight, volume));

      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        saveToDb(length, width, height, weight, volume);
      }, 800);
    }
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [length, width, height, weight, volume, saveToDb]);

  function handleCopyLink() {
    const url = new URL(window.location.href);
    url.searchParams.set('l',      String(length));
    url.searchParams.set('w',      String(width));
    url.searchParams.set('h',      String(height));
    url.searchParams.set('weight', String(weight));
    url.searchParams.set('vol',    String(volume));
    navigator.clipboard.writeText(url.toString()).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  const maxDim = Math.max(results.dim139, results.dim166, results.dim225, 1);
  const inquiryHref = `/inquiry?l=${length}&w=${width}&h=${height}&weight=${weight}`;

  return (
    <div className="dim-calculator">
      <div className="dim-calculator__grid">

        {/* ---- Inputs ---- */}
        <div className="dim-calculator__inputs">
          <h3 style={{ fontFamily: 'var(--font-display)', textTransform: 'uppercase', marginBottom: '1.5rem', fontSize: '1.1rem' }}>
            Your Package Dimensions
          </h3>

          {([
            { label: 'Length (inches)', value: length, set: setLength },
            { label: 'Width (inches)',  value: width,  set: setWidth  },
            { label: 'Height (inches)', value: height, set: setHeight },
          ] as const).map(({ label, value, set }) => (
            <div key={label} className="dim-calculator__field">
              <label className="dim-calculator__label">{label}</label>
              <input
                type="number" min={1} max={120} step={0.5}
                value={value}
                onChange={(e) => set(Number(e.target.value))}
                className="dim-calculator__input"
              />
            </div>
          ))}

          <div className="dim-calculator__field">
            <label className="dim-calculator__label">Actual Weight (lbs)</label>
            <input
              type="number" min={1} max={500} step={0.5}
              value={weight}
              onChange={(e) => setWeight(Number(e.target.value))}
              className="dim-calculator__input"
            />
          </div>

          <div className="dim-calculator__field">
            <label className="dim-calculator__label">Monthly Shipment Volume</label>
            <input
              type="number" min={1} max={100000} step={1}
              value={volume}
              onChange={(e) => setVolume(Number(e.target.value))}
              className="dim-calculator__input"
            />
          </div>

          <div style={{ marginTop: '1rem', padding: '0.8rem', background: 'rgba(0,82,201,0.08)', border: '1px solid rgba(0,82,201,0.2)', fontSize: '0.8rem', color: '#3a4454' }}>
            <strong>Cubic inches:</strong> {(length * width * height).toLocaleString()} in³
          </div>
        </div>

        {/* ---- Results ---- */}
        <div className="dim-calculator__results">
          {/* Bar chart */}
          <div style={{ background: '#1A202C', padding: '1.5rem', border: '4px solid var(--dark)', boxShadow: 'var(--shadow-pixel)', marginBottom: '1.5rem' }}>
            <div style={{ fontFamily: 'var(--font-pixel)', fontSize: '0.65rem', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', marginBottom: '1rem', letterSpacing: '0.06em' }}>
              DIM Weight Comparison
            </div>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end' }}>
              <Bar value={results.dim139} max={maxDim} color="#ef4444" label="UPS / FedEx (÷139)" billable={results.bill139} />
              <Bar value={results.dim166} max={maxDim} color="#f97316" label="Typical 3PL (÷166)" billable={results.bill166} />
              <Bar value={results.dim225} max={maxDim} color="#059669" label="ShippingCow (÷225)" billable={results.bill225} isBest />
            </div>
          </div>

          {/* Savings callout */}
          <div style={{ background: 'var(--yellow)', border: '4px solid var(--dark)', padding: '1.2rem', boxShadow: 'var(--shadow-pixel)', marginBottom: '1.5rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '0.9rem' }}>
              <div>
                <div style={{ fontFamily: 'var(--font-pixel)', fontSize: '0.6rem', textTransform: 'uppercase', marginBottom: '0.3rem' }}>
                  Billable lbs saved vs UPS/FedEx
                </div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 900, color: 'var(--dark)' }}>
                  {fmt1(results.lbsSaved)} lbs
                </div>
                <div style={{ fontSize: '0.8rem', color: '#3a4454' }}>
                  {fmt1(results.pctSaved)}% reduction
                </div>
              </div>
              <div>
                <div style={{ fontFamily: 'var(--font-pixel)', fontSize: '0.6rem', textTransform: 'uppercase', marginBottom: '0.3rem' }}>
                  Estimated annual savings
                </div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 900, color: 'var(--dark)' }}>
                  {fmtDollar(results.annualSavings)}
                </div>
                <div style={{ fontSize: '0.8rem', color: '#3a4454' }}>
                  {fmtDollar(results.totalSavingsPerPkg)} per pkg × {volume.toLocaleString()} mo × 12
                </div>
              </div>
            </div>
            {/* Fuel waiver breakdown */}
            <div style={{ borderTop: '2px solid rgba(26,32,44,0.2)', paddingTop: '0.75rem', display: 'flex', gap: '1.5rem', flexWrap: 'wrap', fontSize: '0.8rem' }}>
              <span>
                <strong>DIM savings:</strong> {fmtDollar(results.savingsPerPkg)}/pkg
              </span>
              <span style={{ color: '#1a202c' }}>+</span>
              <span>
                <strong>Fuel waiver ({(FUEL_SURCHARGE_RATE * 100).toFixed(0)}%):</strong> {fmtDollar(results.fuelWaiverPerPkg)}/pkg
              </span>
              <span style={{ color: '#1a202c' }}>→</span>
              <span>
                <strong>Total: {fmtDollar(results.totalSavingsPerPkg)}/pkg</strong>
              </span>
            </div>
          </div>

          {/* 3-column detail table */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.6rem', marginBottom: '1.5rem' }}>
            {([
              { label: 'UPS / FedEx', divisor: DIM_DIVISOR_STANDARD, dim: results.dim139, bill: results.bill139, isBest: false, color: '#ef4444' },
              { label: 'Typical 3PL', divisor: DIM_DIVISOR_3PL,      dim: results.dim166, bill: results.bill166, isBest: false, color: '#f97316' },
              { label: 'ShippingCow', divisor: DIM_DIVISOR_SHIPPINGCOW, dim: results.dim225, bill: results.bill225, isBest: true,  color: '#059669' },
            ] as const).map(col => (
              <div key={col.divisor} style={{
                border: `3px solid ${col.isBest ? col.color : 'var(--dark)'}`,
                padding: '0.8rem',
                background: col.isBest ? '#f0fdf4' : 'var(--white)',
                boxShadow: col.isBest ? `4px 4px 0 ${col.color}` : 'var(--shadow-pixel)',
              }}>
                <div style={{ fontFamily: 'var(--font-pixel)', fontSize: '0.55rem', textTransform: 'uppercase', color: col.color, marginBottom: '0.4rem' }}>
                  {col.label}
                </div>
                <div style={{ fontSize: '0.7rem', color: '#6b7280', marginBottom: '0.2rem' }}>÷{col.divisor} divisor</div>
                <div style={{ fontSize: '0.85rem', fontWeight: 700 }}>DIM: {fmt1(col.dim)} lbs</div>
                <div style={{ fontSize: '0.85rem', color: col.isBest ? col.color : 'var(--dark)', fontWeight: 700 }}>Bill: {fmt1(col.bill)} lbs</div>
              </div>
            ))}
          </div>

          {/* CTAs */}
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <Link href={inquiryHref} className="btn btn--blue" style={{ flex: 1, textAlign: 'center', minWidth: 180 }}>
              These are your numbers. Get the full audit →
            </Link>
            <button
              onClick={handleCopyLink}
              className="btn"
              style={{ flex: '0 0 auto', background: copied ? '#059669' : 'var(--dark)', color: '#fff', border: '3px solid var(--dark)' }}
            >
              {copied ? '✓ Copied!' : 'Copy link'}
            </button>
          </div>

          <p style={{ fontSize: '0.72rem', color: '#6b7280', marginTop: '0.75rem' }}>
            * DIM savings use ${ESTIMATED_COST_PER_LB}/lb blended rate. Fuel waiver calculated at {(FUEL_SURCHARGE_RATE * 100).toFixed(0)}% of base charge (current FedEx surcharge). Actual savings vary by carrier, zone, and negotiated rates.
          </p>
        </div>
      </div>
    </div>
  );
}
