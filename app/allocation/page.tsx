'use client';

import { useState, useCallback } from 'react';

type SkuRow = { sku: string; label: string; length: number; width: number; height: number; weight: number; qty: number };
type DestRow = { zip: string; pct: number };

type WhSkus = {
  sku: string; label: string; warehouse: string;
  units: number; pallets: number; units_per_pallet: number;
  inbound_distance_miles: number; inbound_cost_total: number;
  outbound_savings_per_pkg: number;
  outbound_monthly_savings: number; outbound_annual_savings: number;
};

type WhSummary = {
  warehouse: string; warehouse_zip: string;
  total_units: number; total_pallets: number;
  inbound_distance_miles: number; inbound_ltl_cost: number;
  weighted_savings_per_pkg: number;
  skus: WhSkus[];
};

type Result = {
  origin_zip: string; label: string | null;
  total_units: number; total_pallets: number;
  total_inbound_ltl_cost: number;
  total_monthly_savings: number; total_annual_savings: number;
  warehouses: WhSummary[];
  errors: string[];
};

function fmtNum(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return n.toFixed(0);
}

export default function AllocationPage() {
  const [originZip, setOriginZip] = useState('91761');
  const [skus, setSkus] = useState<SkuRow[]>([
    { sku: 'SKU-001', label: 'Heavy Box', length: 24, width: 18, height: 16, weight: 55, qty: 1000 },
  ]);
  const [dests, setDests] = useState<DestRow[]>([
    { zip: '10001', pct: 0.6 },
    { zip: '90001', pct: 0.4 },
  ]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);

  const updateSku = useCallback((i: number, field: keyof SkuRow, val: number | string) => {
    setSkus(prev => prev.map((s, j) => j === i ? { ...s, [field]: val } : s));
  }, []);

  const addSku = useCallback(() => {
    setSkus(prev => [...prev, { sku: `SKU-${prev.length + 1}`, label: '', length: 24, width: 18, height: 16, weight: 55, qty: 500 }]);
  }, []);

  const removeSku = useCallback((i: number) => {
    setSkus(prev => prev.filter((_, j) => j !== i));
  }, []);

  const updateDest = useCallback((i: number, field: keyof DestRow, val: number | string) => {
    setDests(prev => prev.map((d, j) => j === i ? { ...d, [field]: val } : d));
  }, []);

  const addDest = useCallback(() => {
    setDests(prev => [...prev, { zip: '', pct: 0 }]);
  }, []);

  const removeDest = useCallback((i: number) => {
    setDests(prev => prev.filter((_, j) => j !== i));
  }, []);

  async function handleSubmit() {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const r = await fetch('/api/allocation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ origin_zip: originZip, items: skus, destinations: dests }),
      });
      const data = await r.json();
      if (!r.ok) {
        setError(data.error || 'Request failed');
      } else {
        setResult(data as Result);
      }
    } catch {
      setError('Network error');
    }
    setLoading(false);
  }

  const totalPct = dests.reduce((s, d) => s + d.pct, 0);

  return (
    <div className="page-container" style={{ maxWidth: 900, margin: '0 auto', padding: '2rem 1rem' }}>
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', textTransform: 'uppercase', marginBottom: '0.3rem' }}>
        📦 Inbound Allocator
      </h1>
      <p style={{ fontSize: '0.85rem', color: '#6b7280', marginBottom: '1.5rem' }}>
        Enter your products, destinations, and origin — we&apos;ll distribute pallets across our 3 warehouses.
      </p>

      {/* Origin ZIP */}
      <div style={{ marginBottom: '1.5rem' }}>
        <label style={{ display: 'block', fontFamily: 'var(--font-pixel)', fontSize: '0.65rem', textTransform: 'uppercase', marginBottom: '0.3rem', color: '#374151' }}>
          Origin ZIP (where inventory ships from)
        </label>
        <input
          type="text" maxLength={5} inputMode="numeric"
          value={originZip}
          onChange={e => setOriginZip(e.target.value.replace(/\D/g, '').slice(0, 5))}
          style={{ width: 120, padding: '0.5rem', border: '3px solid var(--dark)', fontFamily: 'inherit', fontSize: '1rem' }}
        />
      </div>

      {/* Products */}
      <h2 style={{ fontFamily: 'var(--font-pixel)', fontSize: '0.7rem', textTransform: 'uppercase', marginBottom: '0.6rem', color: '#374151' }}>
        Products ({skus.length})
      </h2>
      <div style={{ marginBottom: '1rem' }}>
        {skus.map((sku, i) => (
          <div key={i} style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', flexWrap: 'wrap', marginBottom: '0.4rem', padding: '0.4rem', border: '1px solid #e5e7eb' }}>
            <input type="text" value={sku.label} onChange={e => updateSku(i, 'label', e.target.value)}
              placeholder="Label" style={{ width: 90, padding: '0.3rem', border: '2px solid #d1d5db', fontSize: '0.8rem' }} />
            <input type="text" value={sku.sku} onChange={e => updateSku(i, 'sku', e.target.value)}
              placeholder="SKU" style={{ width: 80, padding: '0.3rem', border: '2px solid #d1d5db', fontSize: '0.8rem' }} />
            <input type="number" value={sku.length} onChange={e => updateSku(i, 'length', +e.target.value)}
              placeholder="L" style={{ width: 55, padding: '0.3rem', border: '2px solid #d1d5db', fontSize: '0.8rem' }} title="Length (in)" />
            <input type="number" value={sku.width} onChange={e => updateSku(i, 'width', +e.target.value)}
              placeholder="W" style={{ width: 55, padding: '0.3rem', border: '2px solid #d1d5db', fontSize: '0.8rem' }} title="Width (in)" />
            <input type="number" value={sku.height} onChange={e => updateSku(i, 'height', +e.target.value)}
              placeholder="H" style={{ width: 55, padding: '0.3rem', border: '2px solid #d1d5db', fontSize: '0.8rem' }} title="Height (in)" />
            <input type="number" value={sku.weight} onChange={e => updateSku(i, 'weight', +e.target.value)}
              placeholder="Wt" style={{ width: 55, padding: '0.3rem', border: '2px solid #d1d5db', fontSize: '0.8rem' }} title="Weight (lbs)" />
            <input type="number" value={sku.qty} onChange={e => updateSku(i, 'qty', +e.target.value)}
              placeholder="Qty" style={{ width: 65, padding: '0.3rem', border: '2px solid #d1d5db', fontSize: '0.8rem' }} title="Monthly units" />
            <button onClick={() => removeSku(i)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '0.8rem' }}>✕</button>
          </div>
        ))}
        <button onClick={addSku} className="btn" style={{ fontSize: '0.8rem', padding: '0.3rem 0.8rem' }}>+ Add SKU</button>
      </div>

      {/* Destinations */}
      <h2 style={{ fontFamily: 'var(--font-pixel)', fontSize: '0.7rem', textTransform: 'uppercase', marginBottom: '0.6rem', color: '#374151' }}>
        Destination Distribution ({totalPct > 0 ? `${(totalPct * 100).toFixed(0)}%` : '0%'})
      </h2>
      <div style={{ marginBottom: '1.5rem' }}>
        {dests.map((d, i) => (
          <div key={i} style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', marginBottom: '0.4rem' }}>
            <input type="text" maxLength={5} inputMode="numeric"
              value={d.zip} onChange={e => updateDest(i, 'zip', e.target.value.replace(/\D/g, '').slice(0, 5))}
              placeholder="Dest ZIP" style={{ width: 100, padding: '0.3rem', border: '2px solid #d1d5db', fontSize: '0.8rem' }} />
            <input type="number" value={d.pct} onChange={e => updateDest(i, 'pct', +e.target.value)}
              placeholder="0.6" style={{ width: 80, padding: '0.3rem', border: '2px solid #d1d5db', fontSize: '0.8rem' }}
              step={0.05} min={0} max={1} />
            <span style={{ fontSize: '0.8rem', color: '#6b7280' }}>={(d.pct * 100).toFixed(0)}%</span>
            <button onClick={() => removeDest(i)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}>✕</button>
          </div>
        ))}
        <button onClick={addDest} className="btn" style={{ fontSize: '0.8rem', padding: '0.3rem 0.8rem' }}>+ Add destination</button>
      </div>

      {/* Submit */}
      <button onClick={handleSubmit} disabled={loading}
        className="btn btn--blue"
        style={{ padding: '0.6rem 2rem', fontSize: '1rem', marginBottom: '1.5rem' }}>
        {loading ? '⏳ Calculating...' : '▶ Run Allocation'}
      </button>

      {error && <div style={{ color: '#dc2626', marginBottom: '1rem', fontSize: '0.85rem' }}>⚠ {error}</div>}

      {/* ─── RESULTS ─── */}
      {result && (
        <div>
          {/* Summary bar */}
          <div style={{ background: 'var(--yellow)', border: '4px solid var(--dark)', padding: '1rem', boxShadow: '4px 4px 0 var(--dark)', marginBottom: '1.5rem', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem', textAlign: 'center' }}>
            <div>
              <div style={{ fontFamily: 'var(--font-pixel)', fontSize: '0.55rem', textTransform: 'uppercase', color: '#3a4454' }}>Total Units</div>
              <div style={{ fontSize: '1.3rem', fontWeight: 900 }}>{fmtNum(result.total_units)}</div>
            </div>
            <div>
              <div style={{ fontFamily: 'var(--font-pixel)', fontSize: '0.55rem', textTransform: 'uppercase', color: '#3a4454' }}>Pallets</div>
              <div style={{ fontSize: '1.3rem', fontWeight: 900 }}>{result.total_pallets}</div>
            </div>
            <div>
              <div style={{ fontFamily: 'var(--font-pixel)', fontSize: '0.55rem', textTransform: 'uppercase', color: '#3a4454' }}>Inbound LTL /mo</div>
              <div style={{ fontSize: '1.3rem', fontWeight: 900 }}>${result.total_inbound_ltl_cost.toLocaleString()}</div>
            </div>
            <div>
              <div style={{ fontFamily: 'var(--font-pixel)', fontSize: '0.55rem', textTransform: 'uppercase', color: '#059669' }}>Annual Savings</div>
              <div style={{ fontSize: '1.3rem', fontWeight: 900, color: '#059669' }}>${result.total_annual_savings >= 1000 ? `${(result.total_annual_savings / 1000).toFixed(1)}K` : result.total_annual_savings}</div>
            </div>
          </div>

          {/* Per-warehouse breakdown */}
          {result.warehouses.map(wh => (
            <div key={wh.warehouse} style={{ border: '4px solid var(--dark)', marginBottom: '1rem', background: '#fff' }}>
              <div style={{ background: 'var(--blue)', color: '#fff', padding: '0.6rem 1rem', fontFamily: 'var(--font-pixel)', fontSize: '0.65rem', textTransform: 'uppercase' }}>
                🏭 {wh.warehouse} — {wh.warehouse_zip} / {wh.total_pallets} pallets / {wh.total_units.toLocaleString()} units
              </div>
              <div style={{ padding: '0.8rem', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem', fontSize: '0.85rem', borderBottom: '1px solid #e5e7eb' }}>
                <div><span style={{ color: '#6b7280', fontSize: '0.72rem' }}>Inbound dist</span><br />{wh.inbound_distance_miles.toLocaleString()} mi</div>
                <div><span style={{ color: '#6b7280', fontSize: '0.72rem' }}>Inbound LTL /mo</span><br />${wh.inbound_ltl_cost.toLocaleString()}</div>
                <div><span style={{ color: '#6b7280', fontSize: '0.72rem' }}>Avg savings/pkg</span><br />${wh.weighted_savings_per_pkg.toFixed(2)}</div>
                <div><span style={{ color: '#6b7280', fontSize: '0.72rem' }}>Pallets</span><br /><strong>{wh.total_pallets}</strong></div>
              </div>
              {/* SKU table */}
              <div style={{ padding: '0.4rem 0.8rem 0.8rem' }}>
                <table style={{ width: '100%', fontSize: '0.8rem', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ fontFamily: 'var(--font-pixel)', fontSize: '0.55rem', textTransform: 'uppercase', color: '#6b7280', borderBottom: '2px solid #e5e7eb' }}>
                      <th style={{ textAlign: 'left', padding: '0.3rem' }}>SKU</th>
                      <th style={{ textAlign: 'right', padding: '0.3rem' }}>Units</th>
                      <th style={{ textAlign: 'right', padding: '0.3rem' }}>Pallets</th>
                      <th style={{ textAlign: 'right', padding: '0.3rem' }}>$/pkg saved</th>
                      <th style={{ textAlign: 'right', padding: '0.3rem' }}>Annual savings</th>
                    </tr>
                  </thead>
                  <tbody>
                    {wh.skus.map((s, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid #f3f4f6' }}>
                        <td style={{ padding: '0.3rem', fontWeight: 600 }}>{s.label} <span style={{ color: '#6b7280' }}>({s.sku})</span></td>
                        <td style={{ textAlign: 'right', padding: '0.3rem' }}>{s.units.toLocaleString()}</td>
                        <td style={{ textAlign: 'right', padding: '0.3rem' }}>{s.pallets}</td>
                        <td style={{ textAlign: 'right', padding: '0.3rem', color: '#059669' }}>${s.outbound_savings_per_pkg.toFixed(2)}</td>
                        <td style={{ textAlign: 'right', padding: '0.3rem', color: '#059669' }}>${s.outbound_annual_savings >= 1000 ? `${(s.outbound_annual_savings / 1000).toFixed(1)}K` : s.outbound_annual_savings.toFixed(0)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}

          {result.errors.length > 0 && (
            <div style={{ background: '#fef2f2', border: '2px solid #fecaca', padding: '0.8rem', fontSize: '0.8rem', color: '#991b1b' }}>
              <strong>Warnings:</strong>
              {result.errors.map((e, i) => <div key={i}>⚠ {e}</div>)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
