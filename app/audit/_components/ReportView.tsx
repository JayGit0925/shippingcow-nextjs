'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { AuditReport } from '@/app/api/audit/route';

export type ReportState = {
  type: 'report';
  report: AuditReport;
  auditId?: string;
};

export function ReportView({state, defaultUnlocked = false}: {state: ReportState; defaultUnlocked?: boolean}) {
  const {report, auditId} = state;
  const {
    // Dollar aggregates (total_current_cost / total_sc_cost / total_savings /
    // savings_percentage / avg_savings_per_package) are deliberately NOT
    // destructured. They derive from ZONE_RATE_MULTIPLIER and
    // ESTIMATED_COST_PER_LB, which are placeholder coefficients — we will not
    // quote a customer a savings figure we cannot honor (Jay, 2026-07-22).
    // They remain on the API response and the stored lead record for internal use.
    total_packages,
    avg_zone_before,
    avg_zone_after,
    pct_within_zone_5,
    avg_billable_weight_139,
    avg_billable_weight_225,
    // dim_weight_reduction_pct is intentionally NOT displayed — no savings
    // percentage on any user-facing surface (Jay, 2026-07-22).
    warehouse_distribution,
    shipment_details,
  } = report;

  // Real, defensible math: what the carrier bills above what the box weighs,
  // at the carrier's own published divisor. Computed from the shipments the
  // customer uploaded — no coefficient of ours is involved.
  const sum_actual_weight = shipment_details.reduce(
    (acc, d) => acc + d.weight * (d.quantity || 1), 0
  );
  const avg_actual_weight = total_packages > 0 ? sum_actual_weight / total_packages : 0;
  const avg_phantom_lbs = Math.max(avg_billable_weight_139 - avg_actual_weight, 0);
  const total_phantom_lbs = avg_phantom_lbs * total_packages;

  const [filterZip, setFilterZip] = useState('');
  const [unlocked, setUnlocked] = useState(defaultUnlocked);
  const [gateEmail, setGateEmail] = useState('');
  const [gateSubmitting, setGateSubmitting] = useState(false);
  const [gateError, setGateError] = useState('');

  async function handleGateSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!gateEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(gateEmail)) {
      setGateError('Enter a valid email address.');
      return;
    }
    setGateSubmitting(true);
    setGateError('');
    try {
      await fetch('/api/audit/unlock', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        // No annual_savings sent: the unlock email must not quote a savings figure.
        body: JSON.stringify({email: gateEmail, audit_id: auditId}),
      });
      setUnlocked(true);
    } catch {
      setGateError('Something went wrong. Try again.');
    } finally {
      setGateSubmitting(false);
    }
  }

  const filteredDetails = shipment_details.filter(
    (d) => d.origin_zip.includes(filterZip) || d.dest_zip.includes(filterZip)
  );

  return (
    <div style={{background: '#fff'}}>
      <div className="container" style={{maxWidth: '1200px', margin: '0 auto', paddingTop: '3rem', paddingBottom: '3rem'}}>
        {/* Top Banner */}
        <div style={{background: 'var(--blue)', color: '#fff', padding: '3rem', textAlign: 'center', marginBottom: '3rem', border: '3px solid var(--dark)', boxShadow: '4px 4px 0 var(--dark)'}}>
          <div style={{fontSize: '0.8rem', fontFamily: 'var(--font-pixel)', color: '#FEB81B', marginBottom: '0.5rem'}}>
            YOU ARE BEING BILLED FOR
          </div>
          <div style={{fontSize: '3rem', fontWeight: 700, fontFamily: 'var(--font-display)'}}>
            {total_phantom_lbs.toLocaleString('en-US', {maximumFractionDigits: 0})} lbs
          </div>
          <div style={{fontSize: '1.1rem', marginTop: '0.5rem'}}>
            you never shipped, across {total_packages.toLocaleString()} packages
          </div>
          <div style={{fontSize: '0.95rem', color: '#FEB81B', marginTop: '1rem'}}>
            {avg_phantom_lbs.toFixed(1)} lbs per package on average, at your carrier&apos;s published DIM 139 divisor
          </div>
        </div>

        {/* Email gate */}
        {!unlocked && (
          <div style={{position: 'relative', marginBottom: '3rem'}}>
            <div style={{filter: 'blur(4px)', pointerEvents: 'none', userSelect: 'none', opacity: 0.5, height: '180px', overflow: 'hidden'}}>
              <Section title="Zone Distribution Impact">
                <div style={{height: '120px', background: '#F4F7FF', borderRadius: '4px'}} />
              </Section>
            </div>
            <div style={{position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
              <div style={{background: '#fff', border: '3px solid var(--dark)', boxShadow: '6px 6px 0 var(--dark)', padding: '2rem', maxWidth: '460px', width: '100%', textAlign: 'center'}}>
                <div style={{fontSize: '2rem', marginBottom: '0.75rem'}}>🔓</div>
                <h3 style={{fontFamily: 'var(--font-display)', fontSize: '1.2rem', margin: '0 0 0.5rem 0'}}>
                  Unlock Your Full Report
                </h3>
                <p style={{fontSize: '0.95rem', color: '#555', margin: '0 0 1.5rem 0'}}>
                  Enter your email to see your zone breakdown, per-shipment billable weight, and your inbound routing analysis. We&apos;ll also send you a copy.
                </p>
                <form onSubmit={handleGateSubmit} style={{display: 'flex', gap: '0.5rem'}}>
                  <input
                    type="email"
                    placeholder="you@company.com"
                    value={gateEmail}
                    onChange={(e) => setGateEmail(e.target.value)}
                    style={{flex: 1, padding: '0.75rem', border: '2px solid #D1D5DB', borderRadius: '4px', fontSize: '0.95rem'}}
                  />
                  <button type="submit" className="btn btn--blue" disabled={gateSubmitting} style={{padding: '0.75rem 1.25rem', whiteSpace: 'nowrap'}}>
                    {gateSubmitting ? '...' : 'View Report →'}
                  </button>
                </form>
                {gateError && <p style={{color: '#DC2626', fontSize: '0.85rem', marginTop: '0.5rem'}}>{gateError}</p>}
                <p style={{fontSize: '0.8rem', color: '#999', marginTop: '1rem'}}>No spam. One email with your report.</p>
              </div>
            </div>
          </div>
        )}

        {unlocked && <>
          <Section title="Zone Distribution Impact">
            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginTop: '2rem'}}>
              <ZoneChart label="Your Current Zones" distribution={report.current_zone_percentages} />
              <ZoneChart label="With ShippingCow Smart Routing" distribution={report.sc_zone_percentages} highlight />
            </div>
          </Section>

          <Section title="Smart Routing Impact">
            <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginTop: '2rem'}}>
              <Card label="Improved to Zone 5 or Better">
                <div style={{fontSize: '2rem', fontWeight: 700, color: 'var(--blue)'}}>{pct_within_zone_5.toFixed(0)}%</div>
                <div style={{fontSize: '0.9rem', color: '#666'}}>of your shipments</div>
              </Card>
              <Card label="Average Zone Improvement">
                <div style={{fontSize: '2rem', fontWeight: 700, color: 'var(--blue)'}}>
                  {avg_zone_before.toFixed(1)} → {avg_zone_after.toFixed(1)}
                </div>
                <div style={{fontSize: '0.9rem', color: '#666'}}>{(avg_zone_before - avg_zone_after).toFixed(1)} zones better</div>
              </Card>
              <Card label="Warehouse Split">
                <div style={{fontSize: '0.95rem', lineHeight: '1.8'}}>
                  {Object.entries(warehouse_distribution).map(([wh, count]) => (
                    <div key={wh}><strong>{wh}:</strong> {((count / report.total_shipments) * 100).toFixed(0)}%</div>
                  ))}
                </div>
              </Card>
            </div>
          </Section>

          <Section title="Billable Weight">
            <div style={{marginTop: '2rem'}}>
              <p style={{fontSize: '1.05rem', marginBottom: '1.5rem'}}>
                Your average billable weight today, at your carrier&apos;s published DIM divisor of 139, is{' '}
                <strong>{avg_billable_weight_139.toFixed(1)} lbs</strong>. Under ShippingCow it becomes{' '}
                <strong>{avg_billable_weight_225.toFixed(1)} lbs</strong>.
              </p>
              <ComparisonBar before={avg_billable_weight_139} after={avg_billable_weight_225} />
            </div>
          </Section>

          <Section title="What This Costs You">
            <div style={{marginTop: '1.5rem'}}>
              <p style={{fontSize: '1.05rem', marginBottom: '1rem'}}>
                Across the {total_packages.toLocaleString()} packages you uploaded, your carrier bills you for{' '}
                <strong>{total_phantom_lbs.toLocaleString('en-US', {maximumFractionDigits: 0})} lbs</strong>{' '}
                of weight that is not in your boxes — an average of{' '}
                <strong>{avg_phantom_lbs.toFixed(1)} lbs per package</strong>, at the published DIM 139 divisor.
                On top of that, {pct_within_zone_5.toFixed(0)}% of these shipments could be routed to Zone 5 or
                better instead of travelling the distance they travel today.
              </p>
              <p style={{fontSize: '0.95rem', color: '#555', margin: 0}}>
                We are deliberately not printing a savings number here. Pricing depends on your real lane mix,
                volume, and inbound profile — put it in front of us and we will quote it properly instead of
                showing you an average that has nothing to do with your business.
              </p>
            </div>
          </Section>

          <Section title="Shipment Details">
            <div style={{marginTop: '1.5rem', marginBottom: '1rem'}}>
              <input
                type="text"
                placeholder="Filter by origin or destination ZIP..."
                value={filterZip}
                onChange={(e) => setFilterZip(e.target.value)}
                style={{width: '100%', padding: '0.75rem', border: '2px solid #E5E7EB', borderRadius: '4px', fontSize: '0.95rem'}}
              />
            </div>
            <div style={{overflowX: 'auto'}}>
              <table style={{width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem'}}>
                <thead>
                  <tr style={{background: '#F4F7FF', borderBottom: '2px solid var(--dark)'}}>
                    {['Origin','Dest','Dims','Actual Wt','Billed Wt (DIM 139)','Phantom lbs','Current Zone','SC Zone'].map(h => (
                      <th key={h} style={tableHeaderStyle}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredDetails.map((detail, i) => (
                    <tr key={i} style={{borderBottom: '1px solid #E5E7EB', background: i % 2 === 0 ? '#fff' : '#F9FAFB'}}>
                      <td style={tableCellStyle}>{detail.origin_zip}</td>
                      <td style={tableCellStyle}>{detail.dest_zip}</td>
                      <td style={tableCellStyle}>{detail.length}×{detail.width}×{detail.height}</td>
                      <td style={tableCellStyle}>{detail.weight} lbs</td>
                      <td style={tableCellStyle}>{detail.current_billable_139.toFixed(1)} lbs</td>
                      <td style={{...tableCellStyle, color: detail.current_billable_139 > detail.weight ? '#DC2626' : '#999', fontWeight: 700}}>
                        {Math.max(detail.current_billable_139 - detail.weight, 0).toFixed(1)} lbs
                      </td>
                      <td style={tableCellStyle}>{detail.current_zone}</td>
                      <td style={{...tableCellStyle, color: detail.zone_improvement > 0 ? '#059669' : '#666', fontWeight: detail.zone_improvement > 0 ? 700 : 400}}>
                        {detail.sc_zone}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>

          <Section title="Inbound Cost Breakdown">
            <p style={{color: '#666', marginBottom: '1.5rem', fontSize: '0.95rem'}}>
              SC selects the warehouse closest to your origin to shorten the inbound leg. Below is how your
              SKUs pallet out and how far each shipment has to travel inbound — the physical facts your
              inbound freight is priced on.
            </p>
            {/* Dollar columns (Pallet Cost, Inbound / Unit) removed 2026-07-22 (Jay,
                decision 7): both derive from LTL_COST_PER_MILE, an internal placeholder
                coefficient. The values remain on the API response and the stored lead
                record for internal use. Do not re-add a dollar column here without a
                logged decision. */}
            <div style={{overflowX: 'auto'}}>
              <table style={{width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem'}}>
                <thead>
                  <tr style={{background: '#F4F7FF', borderBottom: '2px solid var(--dark)'}}>
                    {['Origin','SC Inbound Warehouse','Inbound Distance','Dims','Product CBM','Units / Pallet'].map(h => (
                      <th key={h} style={tableHeaderStyle}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {shipment_details.map((detail, i) => {
                    const product_cbm = (detail.length * detail.width * detail.height) / 61023.7;
                    return (
                      <tr key={i} style={{borderBottom: '1px solid #E5E7EB', background: i % 2 === 0 ? '#fff' : '#F9FAFB'}}>
                        <td style={tableCellStyle}>{detail.origin_zip}</td>
                        <td style={tableCellStyle}>{detail.sc_warehouse}</td>
                        <td style={tableCellStyle}>{detail.inbound_warehouse_distance?.toFixed(0)} mi</td>
                        <td style={tableCellStyle}>{detail.length}×{detail.width}×{detail.height}</td>
                        <td style={tableCellStyle}>{product_cbm.toFixed(3)} m³</td>
                        <td style={tableCellStyle}>{detail.units_per_pallet}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Section>

          <PalletCalculator />
        </>}

        {/* Final CTA — always visible */}
        <div style={{marginTop: '3rem', textAlign: 'center', background: 'var(--yellow)', padding: '2rem', border: '3px solid var(--dark)', boxShadow: '4px 4px 0 var(--dark)'}}>
          <h3 style={{fontFamily: 'var(--font-display)', fontSize: '1.3rem', margin: '0 0 0.5rem 0'}}>
            Ready to stop paying for {total_phantom_lbs.toLocaleString('en-US', {maximumFractionDigits: 0})} lbs of air?
          </h3>
          <p style={{margin: '0 0 1.5rem 0', color: '#1A202C'}}>Let&apos;s talk about your fulfillment strategy and price your real lanes.</p>
          <Link href={`/inquiry${auditId ? `?audit_id=${auditId}` : ''}`} className="btn btn--blue" style={{padding: '0.75rem 1.5rem'}}>
            Get In Touch →
          </Link>
        </div>
      </div>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────

function Section({title, children}: {title: string; children: React.ReactNode}) {
  return (
    <div style={{marginBottom: '3rem'}}>
      <h2 style={{fontFamily: 'var(--font-display)', fontSize: '1.4rem', marginBottom: '1rem', textTransform: 'uppercase'}}>
        {title}
      </h2>
      {children}
    </div>
  );
}

function Card({label, children}: {label: string; children: React.ReactNode}) {
  return (
    <div style={{border: '3px solid var(--dark)', padding: '1.5rem', background: '#fff', boxShadow: '3px 3px 0 var(--dark)'}}>
      <div style={{fontSize: '0.85rem', fontFamily: 'var(--font-pixel)', color: 'var(--blue)', marginBottom: '0.5rem', textTransform: 'uppercase'}}>
        {label}
      </div>
      {children}
    </div>
  );
}

function ZoneChart({label, distribution, highlight}: {label: string; distribution: Record<number, number>; highlight?: boolean}) {
  const maxValue = Math.max(...Object.values(distribution));
  return (
    <div>
      <div style={{fontSize: '0.95rem', fontWeight: 600, marginBottom: '1rem'}}>{label}</div>
      <div style={{display: 'flex', gap: '0.5rem', alignItems: 'flex-end', height: '180px'}}>
        {Array.from({length: 7}, (_, i) => i + 2).map((zone) => {
          const pct = distribution[zone] || 0;
          const height = maxValue > 0 ? (pct / maxValue) * 100 : 0;
          const isImprovement = highlight && pct > 0;
          return (
            <div key={zone} style={{flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
              <div style={{fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.25rem'}}>{pct.toFixed(0)}%</div>
              <div style={{width: '100%', height: `${Math.max(height, 5)}px`, background: isImprovement ? '#059669' : 'var(--blue)', borderRadius: '2px'}} />
              <div style={{fontSize: '0.75rem', marginTop: '0.25rem'}}>Z{zone}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ComparisonBar({before, after}: {before: number; after: number}) {
  const max = Math.max(before, after);
  return (
    <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem'}}>
      <div>
        <div style={{fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.5rem'}}>Your carrier today (published DIM 139)</div>
        <div style={{height: '40px', background: '#E5E7EB', borderRadius: '4px', overflow: 'hidden'}}>
          <div style={{height: '100%', background: 'var(--blue)', width: `${(before / max) * 100}%`}} />
        </div>
        <div style={{fontSize: '1rem', fontWeight: 700, marginTop: '0.5rem'}}>{before.toFixed(1)} lbs</div>
      </div>
      <div>
        <div style={{fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.5rem'}}>ShippingCow</div>
        <div style={{height: '40px', background: '#E5E7EB', borderRadius: '4px', overflow: 'hidden'}}>
          <div style={{height: '100%', background: '#059669', width: `${(after / max) * 100}%`}} />
        </div>
        <div style={{fontSize: '1rem', fontWeight: 700, marginTop: '0.5rem'}}>{after.toFixed(1)} lbs</div>
      </div>
    </div>
  );
}

function PalletCalculator() {
  const [originZip, setOriginZip] = useState('08901');
  const [skus, setSkus] = useState<Array<{id: string; name?: string; length: number; width: number; height: number; weight: number}>>([
    {id: '1', name: '', length: 12, width: 10, height: 8, weight: 25},
  ]);
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const addSku = () => {
    const newId = String(Math.max(...skus.map(s => parseInt(s.id) || 0), 0) + 1);
    setSkus([...skus, {id: newId, name: '', length: 12, width: 10, height: 8, weight: 25}]);
  };
  const removeSku = (id: string) => { if (skus.length > 1) setSkus(skus.filter(s => s.id !== id)); };
  const updateSku = (id: string, field: string, value: any) => setSkus(skus.map(s => s.id === id ? {...s, [field]: value} : s));

  const calculatePallets = async () => {
    if (!originZip || skus.length === 0) { setError('Please enter an origin ZIP and at least one SKU'); return; }
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/audit/pallet', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({origin_zip: originZip.padStart(5, '0'), skus: skus.map(({id, ...rest}) => rest)}),
      });
      if (!res.ok) { const err = await res.json(); setError(err.error || 'Calculation failed'); return; }
      setResults(await res.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Section title="Inbound Pallet Planner">
      <div style={{marginTop: '2rem'}}>
        <div style={{background: '#F9FAFB', border: '2px solid #E5E7EB', borderRadius: '6px', padding: '1.5rem', marginBottom: '2rem'}}>
          <div style={{marginBottom: '1.5rem'}}>
            <label style={{display: 'block', fontWeight: 600, marginBottom: '0.5rem'}}>Origin ZIP (where you ship from)</label>
            <input type="text" value={originZip} onChange={(e) => setOriginZip(e.target.value.slice(0, 5))} placeholder="08901"
              style={{width: '100%', maxWidth: '200px', padding: '0.75rem', border: '2px solid #D1D5DB', borderRadius: '4px', fontSize: '1rem'}} />
          </div>
          <div style={{marginBottom: '1.5rem'}}>
            <label style={{display: 'block', fontWeight: 600, marginBottom: '0.75rem'}}>SKUs (products)</label>
            {skus.map((sku) => (
              <div key={sku.id} style={{display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr auto', gap: '0.75rem', marginBottom: '0.75rem', alignItems: 'flex-end'}}>
                <input type="text" placeholder="Product name (optional)" value={sku.name || ''} onChange={(e) => updateSku(sku.id, 'name', e.target.value)}
                  style={{padding: '0.5rem', border: '1px solid #D1D5DB', borderRadius: '3px', fontSize: '0.9rem'}} />
                {(['length','width','height'] as const).map(f => (
                  <input key={f} type="number" placeholder={f[0].toUpperCase()} value={sku[f]}
                    onChange={(e) => updateSku(sku.id, f, parseFloat(e.target.value) || 0)}
                    style={{padding: '0.5rem', border: '1px solid #D1D5DB', borderRadius: '3px', fontSize: '0.9rem'}} />
                ))}
                <input type="number" placeholder="Wt (lbs)" value={sku.weight} onChange={(e) => updateSku(sku.id, 'weight', parseFloat(e.target.value) || 0)}
                  style={{padding: '0.5rem', border: '1px solid #D1D5DB', borderRadius: '3px', fontSize: '0.9rem'}} />
                <button onClick={() => removeSku(sku.id)}
                  style={{padding: '0.5rem 0.75rem', background: '#FEE2E2', border: '1px solid #FECACA', borderRadius: '3px', cursor: 'pointer', fontSize: '0.85rem', color: '#DC2626'}}>
                  ✕
                </button>
              </div>
            ))}
            <button onClick={addSku} className="btn btn--ghost" style={{marginTop: '0.75rem', padding: '0.5rem 1rem', fontSize: '0.9rem'}}>+ Add SKU</button>
          </div>
          {error && <div style={{background: '#FEE2E2', border: '2px solid #DC2626', color: '#7F1D1D', padding: '1rem', borderRadius: '6px', marginBottom: '1.5rem'}}>❌ {error}</div>}
          <button onClick={calculatePallets} disabled={loading} className="btn btn--blue" style={{width: '100%', padding: '0.75rem'}}>
            {loading ? '🔄 Calculating...' : '📦 Calculate Pallet Layout'}
          </button>
        </div>
        {results && (
          <div>
            <div style={{marginBottom: '1.5rem', background: '#F0FDF4', border: '2px solid #86EFAC', borderRadius: '6px', padding: '1.5rem'}}>
              <div style={{fontSize: '1rem', fontWeight: 600, marginBottom: '0.5rem'}}>✅ Results for {results.sku_count} SKU{results.sku_count !== 1 ? 's' : ''}</div>
              <div style={{fontSize: '0.95rem'}}>
                <strong>{results.totals.total_units_per_pallet}</strong> units across your pallets, into the
                warehouse closest to your origin.
              </div>
              <div style={{fontSize: '0.9rem', color: '#555', marginTop: '0.5rem'}}>
                We are not printing a price here. Inbound freight depends on your real lane, pallet
                configuration and cadence — send us your profile and we will quote it properly.
              </div>
            </div>
            <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem', marginBottom: '2rem'}}>
              {results.results.map((r: any, i: number) => (
                <div key={i} style={{border: '2px solid #E5E7EB', borderRadius: '6px', padding: '1.5rem', background: '#fff'}}>
                  <div style={{fontSize: '0.85rem', fontFamily: 'var(--font-pixel)', color: 'var(--blue)', marginBottom: '0.75rem', textTransform: 'uppercase', fontWeight: 600}}>
                    {r.sku.name || `SKU ${i + 1}`}
                  </div>
                  <div style={{fontSize: '0.9rem', lineHeight: '1.8', color: '#666'}}>
                    {/* Dollar rows (trucking_cost, inbound_receiving, per_unit.total,
                        pallet_total) removed 2026-07-22 (Jay, decision 7). per_unit.total
                        is built on getShippingRate(billable_225), i.e. DIM_DIVISOR_SHIPPINGCOW;
                        trucking_cost on LTL_COST_PER_MILE. Both are internal working values
                        and no prospect sees a price derived from them. The API still returns
                        them for internal use. */}
                    <div><strong>Warehouse:</strong> {r.closest_warehouse} ({r.warehouse_city}, {r.warehouse_state})</div>
                    <div><strong>Inbound distance:</strong> {r.trucking_distance_miles.toFixed(0)} mi</div>
                    <div><strong>Units/pallet:</strong> {r.units_per_pallet}</div>
                    <div><strong>Unit weight:</strong> {r.sku.weight} lbs</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Section>
  );
}

const tableHeaderStyle = {padding: '0.75rem', textAlign: 'left' as const, fontWeight: 600, fontSize: '0.8rem', textTransform: 'uppercase' as const};
const tableCellStyle = {padding: '0.75rem', fontSize: '0.85rem'};
