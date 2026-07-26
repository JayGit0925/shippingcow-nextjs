'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  DIM_DIVISOR_STANDARD,
  DIM_DIVISOR_3PL,
} from '@/lib/constants';
import { trackCalculatorStart, trackCalculatorComplete } from '@/lib/funnel';

// PUBLIC SURFACE RULE (Jay, 2026-07-22):
// This calculator shows the customer what THEIR CURRENT carrier is billing them
// for, computed at the PUBLISHED carrier divisors (139 UPS/FedEx, 166 typical 3PL).
// It must NOT display a ShippingCow divisor, a ShippingCow rate, or a savings %.
// Sell the audit, not a number.

// ---- Types ----
type ZoneResults = {
  current_zone: number;
  current_distance_miles: number;
  sc_warehouse: string;
  sc_zone: number;
  sc_distance_miles: number;
  zone_improvement: number;
  current_billable_139: number;
  dim139: number; dim166: number;
  bill139: number; bill166: number;
  // Optional on purpose: /api/calculator/estimate returns these only to an
  // authenticated dashboard session (lib/redact.ts, Jay decision 7,
  // 2026-07-22). This component renders none of them; the optional marker
  // stops anyone re-adding a render path that would print `undefined`.
  sc_billable_225?: number;
  dim225?: number; bill225?: number;
  current_cost_per_pkg?: number;
  sc_cost_per_pkg?: number;
  inbound_cost_per_unit?: number;
  savings_per_pkg?: number;
  annual_savings?: number;
  old_estimate_per_pkg?: number;
  old_estimate_annual?: number;
};

// ---- Math helpers ----
function dimWeight(l: number, w: number, h: number, divisor: number) {
  return (l * w * h) / divisor;
}
function billable(actual: number, dim: number) {
  return Math.max(actual, dim);
}

type Results = {
  dim139: number; dim166: number;
  bill139: number; bill166: number;
  /** Pounds you are billed for above what the package actually weighs, at divisor 139. */
  phantomLbs139: number;
  /** Same, at the typical 3PL divisor 166. */
  phantomLbs166: number;
  /** Phantom lbs across your stated monthly volume, at divisor 139. */
  phantomLbsMonthly139: number;
};

function calcResults(l: number, w: number, h: number, weight: number, vol: number): Results {
  const dim139 = dimWeight(l, w, h, DIM_DIVISOR_STANDARD);
  const dim166 = dimWeight(l, w, h, DIM_DIVISOR_3PL);
  const bill139 = billable(weight, dim139);
  const bill166 = billable(weight, dim166);
  const phantomLbs139 = Math.max(bill139 - weight, 0);
  const phantomLbs166 = Math.max(bill166 - weight, 0);
  return {
    dim139, dim166, bill139, bill166,
    phantomLbs139, phantomLbs166,
    phantomLbsMonthly139: phantomLbs139 * vol,
  };
}

function fmt1(n: number) { return n.toFixed(1); }

// ---- Bar component ----
function Bar({ value, max, color, label, billable: bill, isBest, isActual }: {
  value: number; max: number; color: string; label: string; billable: number; isBest?: boolean; isActual?: boolean;
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
        {fmt1(value)} lbs {isActual ? 'actual' : 'DIM'}
      </div>
      <div style={{ textAlign: 'center', fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)' }}>
        {isActual ? 'What it weighs' : `Billed: ${fmt1(bill)} lbs`}
      </div>
    </div>
  );
}

export default function DimCalculator() {
  const searchParams = useSearchParams();

  const [length, setLength]   = useState(() => Number(searchParams.get('l'))      || 30);
  const [width,  setWidth]    = useState(() => Number(searchParams.get('w'))      || 24);
  const [height, setHeight]   = useState(() => Number(searchParams.get('h'))      || 20);
  const [weight, setWeight]   = useState(() => Number(searchParams.get('weight')) || 45);
  const [volume, setVolume]   = useState(() => Number(searchParams.get('vol'))    || 100);
  const [results, setResults] = useState<Results>(() =>
    calcResults(
      Number(searchParams.get('l'))      || 30,
      Number(searchParams.get('w'))      || 24,
      Number(searchParams.get('h'))      || 20,
      Number(searchParams.get('weight')) || 45,
      Number(searchParams.get('vol'))    || 100,
    )
  );
  const [copied, setCopied] = useState(false);
  const [originZip, setOriginZip] = useState('');
  const [destZip, setDestZip] = useState('');
  const [zoneResults, setZoneResults] = useState<ZoneResults | null>(null);
  const [zoneLoading, setZoneLoading] = useState(false);
  const [zoneError, setZoneError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sessionIdRef = useRef<string | null>(null);
  const startedRef = useRef(false);
  const completedRef = useRef(false);

  // Funnel: calculator_start fires once, on the first user edit of any input.
  function markStarted(field: string) {
    if (startedRef.current) return;
    startedRef.current = true;
    trackCalculatorStart({ first_field: field });
  }

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
        // Funnel: complete = results recomputed after a real user edit. The
        // mount-time run recalculates with defaults, so gate on startedRef.
        if (startedRef.current && !completedRef.current) {
          completedRef.current = true;
          trackCalculatorComplete({
            used_zone_check: originZip.length === 5 && destZip.length === 5,
            monthly_volume: volume,
          });
        }
        saveToDb(length, width, height, weight, volume);
      }, 800);
    }
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [length, width, height, weight, volume, originZip, destZip, saveToDb]);

  // Fetch zone-based real estimate when ZIPs are valid
  const zoneDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!originZip || !destZip || originZip.length !== 5 || destZip.length !== 5) {
      setZoneResults(null);
      setZoneError(null);
      return;
    }

    if (zoneDebounceRef.current) clearTimeout(zoneDebounceRef.current);
    zoneDebounceRef.current = setTimeout(async () => {
      setZoneLoading(true);
      setZoneError(null);
      try {
        const r = await fetch('/api/calculator/estimate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            length, width, height,
            weight,
            monthly_volume: volume,
            origin_zip: originZip,
            dest_zip: destZip,
          }),
        });
        const data = await r.json();
        if (!r.ok) {
          setZoneError(data.error || 'Could not estimate');
          setZoneResults(null);
        } else {
          setZoneResults(data as ZoneResults);
        }
      } catch {
        setZoneError('Network error');
        setZoneResults(null);
      }
      setZoneLoading(false);
    }, 600);

    return () => { if (zoneDebounceRef.current) clearTimeout(zoneDebounceRef.current); };
  }, [length, width, height, weight, volume, originZip, destZip]);

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

  const maxDim = Math.max(results.dim139, results.dim166, weight, 1);
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
            { label: 'Length (inches)', field: 'length', value: length, set: setLength },
            { label: 'Width (inches)',  field: 'width',  value: width,  set: setWidth  },
            { label: 'Height (inches)', field: 'height', value: height, set: setHeight },
          ] as const).map(({ label, field, value, set }) => (
            <div key={label} className="dim-calculator__field">
              <label className="dim-calculator__label">{label}</label>
              <input
                type="number" min={1} max={120} step={0.5}
                value={value}
                onChange={(e) => { markStarted(field); set(Number(e.target.value)); }}
                className="dim-calculator__input"
              />
            </div>
          ))}

          <div className="dim-calculator__field">
            <label className="dim-calculator__label">Actual Weight (lbs)</label>
            <input
              type="number" min={1} max={500} step={0.5}
              value={weight}
              onChange={(e) => { markStarted('weight'); setWeight(Number(e.target.value)); }}
              className="dim-calculator__input"
            />
          </div>

          <div className="dim-calculator__field">
            <label className="dim-calculator__label">Monthly Shipment Volume</label>
            <input
              type="number" min={1} max={100000} step={1}
              value={volume}
              onChange={(e) => { markStarted('volume'); setVolume(Number(e.target.value)); }}
              className="dim-calculator__input"
            />
          </div>

          {/* ---- ZIP inputs for zone-based estimate ---- */}
          <div style={{ marginTop: '1rem', borderTop: '2px dashed rgba(0,0,0,0.1)', paddingTop: '1rem' }}>
            <div style={{ fontFamily: 'var(--font-pixel)', fontSize: '0.6rem', textTransform: 'uppercase', color: 'var(--blue)', marginBottom: '0.6rem', letterSpacing: '0.04em' }}>
              📍 Zone Check (Optional)
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <div className="dim-calculator__field" style={{ flex: 1 }}>
                <label className="dim-calculator__label">Origin ZIP</label>
                <input
                  type="text" maxLength={5} inputMode="numeric"
                  value={originZip}
                  onChange={(e) => { markStarted('origin_zip'); setOriginZip(e.target.value.replace(/\D/g, '').slice(0, 5)); }}
                  className="dim-calculator__input"
                  placeholder="Your warehouse ZIP"
                />
              </div>
              <div className="dim-calculator__field" style={{ flex: 1 }}>
                <label className="dim-calculator__label">Dest. ZIP</label>
                <input
                  type="text" maxLength={5} inputMode="numeric"
                  value={destZip}
                  onChange={(e) => { markStarted('dest_zip'); setDestZip(e.target.value.replace(/\D/g, '').slice(0, 5)); }}
                  className="dim-calculator__input"
                  placeholder="Customer ZIP"
                />
              </div>
            </div>
            {originZip.length === 5 && destZip.length === 5 && (
              <div style={{ fontSize: '0.72rem', color: '#6b7280', marginTop: '0.3rem' }}>
                {zoneLoading ? '⏳ Checking zones…' : zoneError ? `⚠ ${zoneError}` : ''}
              </div>
            )}
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
              What You&apos;re Billed For Today
            </div>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end' }}>
              <Bar value={weight} max={maxDim} color="#0059D2" label="Actual Weight" billable={weight} isActual />
              <Bar value={results.dim139} max={maxDim} color="#ef4444" label="UPS / FedEx (÷139)" billable={results.bill139} />
              <Bar value={results.dim166} max={maxDim} color="#f97316" label="Typical 3PL (÷166)" billable={results.bill166} />
            </div>
          </div>

          {/* Phantom weight callout — customer's own carrier, published divisors only */}
          <div style={{ background: 'var(--yellow)', border: '4px solid var(--dark)', padding: '1.2rem', boxShadow: 'var(--shadow-pixel)', marginBottom: '1.5rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <div style={{ fontFamily: 'var(--font-pixel)', fontSize: '0.6rem', textTransform: 'uppercase', marginBottom: '0.3rem' }}>
                  Phantom lbs per package (÷139)
                </div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 900, color: 'var(--dark)' }}>
                  {fmt1(results.phantomLbs139)} lbs
                </div>
                <div style={{ fontSize: '0.8rem', color: '#3a4454' }}>
                  Billed {fmt1(results.bill139)} lbs on a {fmt1(weight)} lb package
                </div>
              </div>
              <div>
                <div style={{ fontFamily: 'var(--font-pixel)', fontSize: '0.6rem', textTransform: 'uppercase', marginBottom: '0.3rem' }}>
                  Phantom lbs per month
                </div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 900, color: 'var(--dark)' }}>
                  {results.phantomLbsMonthly139.toLocaleString(undefined, { maximumFractionDigits: 0 })} lbs
                </div>
                <div style={{ fontSize: '0.8rem', color: '#3a4454' }}>
                  {fmt1(results.phantomLbs139)} lbs × {volume.toLocaleString()} shipments/mo
                </div>
              </div>
            </div>
          </div>

          {/* ---- Zone routing check (distance/zone only — no rates shown) ---- */}
          {zoneResults && (
            <div style={{ background: '#EEF2FF', border: '4px solid var(--blue)', padding: '1.2rem', boxShadow: '4px 4px 0 var(--blue)', marginBottom: '1.5rem' }}>
              <div style={{ fontFamily: 'var(--font-pixel)', fontSize: '0.6rem', textTransform: 'uppercase', color: 'var(--blue)', marginBottom: '0.6rem', letterSpacing: '0.04em' }}>
                📍 Zone Routing Check
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem', marginBottom: '1rem', fontSize: '0.85rem' }}>
                <div style={{ background: '#fff', padding: '0.6rem 0.8rem', border: '2px solid var(--dark)' }}>
                  <div style={{ fontSize: '0.65rem', color: '#6b7280', fontFamily: 'var(--font-pixel)', textTransform: 'uppercase' }}>Shipping Direct Today</div>
                  <div style={{ fontWeight: 700 }}>Zone {zoneResults.current_zone} · {zoneResults.current_distance_miles.toLocaleString()} mi</div>
                </div>
                <div style={{ background: '#fff', padding: '0.6rem 0.8rem', border: '2px solid #059669' }}>
                  <div style={{ fontSize: '0.65rem', color: '#059669', fontFamily: 'var(--font-pixel)', textTransform: 'uppercase' }}>From Our {zoneResults.sc_warehouse} Warehouse</div>
                  <div style={{ fontWeight: 700 }}>Zone {zoneResults.sc_zone} · {zoneResults.sc_distance_miles.toLocaleString()} mi</div>
                </div>
              </div>

              <div style={{ background: 'var(--yellow)', padding: '0.8rem', border: '3px solid var(--dark)', textAlign: 'center' }}>
                <div style={{ fontFamily: 'var(--font-pixel)', fontSize: '0.55rem', textTransform: 'uppercase', marginBottom: '0.3rem', color: '#3a4454' }}>
                  Zone Improvement
                </div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 900, color: 'var(--dark)' }}>
                  -{zoneResults.zone_improvement}
                </div>
                <div style={{ fontSize: '0.7rem', color: '#3a4454' }}>zones closer to your customer</div>
              </div>

              <div style={{ fontSize: '0.7rem', color: '#6b7280', marginTop: '0.6rem', textAlign: 'center' }}>
                Zone and distance only. What it costs depends on your volume and lane mix — that is what the audit is for.
              </div>
            </div>
          )}

          {/* Detail table — published carrier divisors only */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.6rem', marginBottom: '1.5rem' }}>
            {([
              { label: 'UPS / FedEx', divisor: DIM_DIVISOR_STANDARD, dim: results.dim139, bill: results.bill139, isBest: false, color: '#ef4444' },
              { label: 'Typical 3PL', divisor: DIM_DIVISOR_3PL,      dim: results.dim166, bill: results.bill166, isBest: false, color: '#f97316' },
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
                <div style={{ fontSize: '0.85rem', color: 'var(--dark)', fontWeight: 700 }}>You&apos;re billed: {fmt1(col.bill)} lbs</div>
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
            * Calculated at the carriers&apos; published DIM divisors — UPS/FedEx 139 and the typical 3PL 166. This is what your
            current carrier bills you for, not a ShippingCow quote. Send us an invoice and we&apos;ll price the real thing.
          </p>
        </div>
      </div>
    </div>
  );
}
