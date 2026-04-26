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
    total_current_cost,
    total_sc_cost,
    total_savings,
    avg_zone_before,
    avg_zone_after,
    pct_within_zone_5,
    avg_billable_weight_139,
    avg_billable_weight_225,
    dim_weight_reduction_pct,
    warehouse_distribution,
    total_inbound_fees,
    total_handling_fees,
    total_last_mile_fees,
    shipment_details,
  } = report;

  const monthly_savings = total_savings;
  const annual_savings = total_savings * 12;

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
        body: JSON.stringify({email: gateEmail, audit_id: auditId, annual_savings}),
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
            YOU COULD SAVE
          </div>
          <div style={{fontSize: '3rem', fontWeight: 700, fontFamily: 'var(--font-display)'}}>
            ${total_savings.toLocaleString('en-US', {minimumFractionDigits: 0})}
          </div>
          <div style={{fontSize: '1.1rem', marginTop: '0.5rem'}}>per month with ShippingCow</div>
          <div style={{fontSize: '0.95rem', color: '#FEB81B', marginTop: '1rem'}}>
            That's ${annual_savings.toLocaleString('en-US', {minimumFractionDigits: 0})} per year
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
                  Enter your email to see zone breakdowns, per-shipment savings, and your inbound cost analysis. We'll also send you a copy.
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

          <Section title="DIM Weight Savings">
            <div style={{marginTop: '2rem'}}>
              <p style={{fontSize: '1.05rem', marginBottom: '1.5rem'}}>
                Your average billable weight drops from <strong>{avg_billable_weight_139.toFixed(1)} lbs</strong> to <strong>{avg_billable_weight_225.toFixed(1)} lbs</strong>{' '}
                <span style={{color: 'var(--blue)', fontWeight: 700}}>({dim_weight_reduction_pct.toFixed(1)}% reduction)</span>
              </p>
              <ComparisonBar before={avg_billable_weight_139} after={avg_billable_weight_225} />
            </div>
          </Section>

          <Section title="Cost Breakdown">
            <table style={{width: '100%', marginTop: '1.5rem', borderCollapse: 'collapse'}}>
              <tbody>
                {[
                  ['Current Shipping', `$${total_current_cost.toFixed(2)}`, '—'],
                  ['SC Inbound (LTL)', '—', `$${total_inbound_fees.toFixed(2)}`],
                  ['SC Last-Mile',     '—', `$${total_last_mile_fees.toFixed(2)}`],
                  ['SC Handling',      '—', `$${total_handling_fees.toFixed(2)}`],
                  ['Total',            `$${total_current_cost.toFixed(2)}`, `$${total_sc_cost.toFixed(2)}`],
                ].map((row, i) => (
                  <tr key={i} style={{borderBottom: '1px solid #E5E7EB', background: i === 4 ? '#F4F7FF' : 'white'}}>
                    <td style={{padding: '1rem', fontWeight: i === 4 ? 700 : 600}}>{row[0]}</td>
                    <td style={{padding: '1rem', textAlign: 'right'}}>{row[1]}</td>
                    <td style={{padding: '1rem', textAlign: 'right'}}>{row[2]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{marginTop: '1.5rem', fontSize: '1.05rem'}}>
              <div style={{color: 'var(--blue)', fontWeight: 700}}>Monthly Savings: ${monthly_savings.toFixed(2)}</div>
              <div style={{color: 'var(--blue)', fontWeight: 700, marginTop: '0.5rem'}}>Annual Savings: ${annual_savings.toFixed(2)}</div>
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
                    {['Origin','Dest','Dims','Wt','Current Zone','SC Zone','Current Cost','SC Cost','Savings'].map(h => (
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
                      <td style={tableCellStyle}>{detail.weight}</td>
                      <td style={tableCellStyle}>{detail.current_zone}</td>
                      <td style={{...tableCellStyle, color: detail.zone_improvement > 0 ? '#059669' : '#666', fontWeight: detail.zone_improvement > 0 ? 700 : 400}}>
                        {detail.sc_zone}
                      </td>
                      <td style={tableCellStyle}>${detail.current_cost.toFixed(2)}</td>
                      <td style={tableCellStyle}>${detail.sc_cost.toFixed(2)}</td>
                      <td style={{...tableCellStyle, color: detail.savings_per_package > 0 ? '#059669' : '#999', fontWeight: 700}}>
                        ${detail.savings_per_package.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>

          <Section title="Inbound Cost Breakdown">
            <p style={{color: '#666', marginBottom: '1.5rem', fontSize: '0.95rem'}}>
              Inbound LTL cost is amortized per unit based on pallet capacity (1.8 CBM/pallet at $2.50/mile).
              SC selects the warehouse closest to your origin to minimize inbound freight.
            </p>
            <div style={{overflowX: 'auto'}}>
              <table style={{width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem'}}>
                <thead>
                  <tr style={{background: '#F4F7FF', borderBottom: '2px solid var(--dark)'}}>
                    {['Origin','SC Inbound Warehouse','Inbound Distance','Dims','Product CBM','Units / Pallet','Pallet Cost','Inbound / Unit'].map(h => (
                      <th key={h} style={tableHeaderStyle}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {shipment_details.map((detail, i) => {
                    const product_cbm = (detail.length * detail.width * detail.height) / 61023.7;
                    const pallet_cost = detail.inbound_warehouse_distance * 2.50;
                    return (
                      <tr key={i} style={{borderBottom: '1px solid #E5E7EB', background: i % 2 === 0 ? '#fff' : '#F9FAFB'}}>
                        <td style={tableCellStyle}>{detail.origin_zip}</td>
                        <td style={tableCellStyle}>{detail.sc_warehouse}</td>
                        <td style={tableCellStyle}>{detail.inbound_warehouse_distance?.toFixed(0)} mi</td>
                        <td style={tableCellStyle}>{detail.length}×{detail.width}×{detail.height}</td>
                        <td style={tableCellStyle}>{product_cbm.toFixed(3)} m³</td>
                        <td style={tableCellStyle}>{detail.units_per_pallet}</td>
                        <td style={tableCellStyle}>${pallet_cost.toFixed(2)}</td>
                        <td style={{...tableCellStyle, fontWeight: 600}}>${detail.inbound_cost_per_unit?.toFixed(2) ?? '—'}</td>
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
            Ready to save ${annual_savings.toLocaleString('en-US', {minimumFractionDigits: 0})}/year?
          </h3>
          <p style={{margin: '0 0 1.5rem 0', color: '#1A202C'}}>Let's talk about your fulfillment strategy.</p>
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
        <div style={{fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.5rem'}}>Current (DIM 139)</div>
        <div style={{height: '40px', background: '#E5E7EB', borderRadius: '4px', overflow: 'hidden'}}>
          <div style={{height: '100%', background: 'var(--blue)', width: `${(before / max) * 100}%`}} />
        </div>
        <div style={{fontSize: '1rem', fontWeight: 700, marginTop: '0.5rem'}}>{before.toFixed(1)} lbs</div>
      </div>
      <div>
        <div style={{fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.5rem'}}>ShippingCow (DIM 225)</div>
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
    <Section title="Inbound Pallet Costs">
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
            {loading ? '🔄 Calculating...' : '📦 Calculate Pallet Costs'}
          </button>
        </div>
        {results && (
          <div>
            <div style={{marginBottom: '1.5rem', background: '#F0FDF4', border: '2px solid #86EFAC', borderRadius: '6px', padding: '1.5rem'}}>
              <div style={{fontSize: '1rem', fontWeight: 600, marginBottom: '0.5rem'}}>✅ Results for {results.sku_count} SKU{results.sku_count !== 1 ? 's' : ''}</div>
              <div>Total inbound cost: <strong style={{color: 'var(--blue)', fontSize: '1.3rem'}}>${results.totals.total_pallet_cost.toFixed(2)}</strong></div>
              <div style={{fontSize: '0.9rem', color: '#666', marginTop: '0.5rem'}}>
                {results.totals.total_units_per_pallet} total units, ${results.totals.avg_cost_per_unit.toFixed(2)} cost per unit (all-in)
              </div>
            </div>
            <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem', marginBottom: '2rem'}}>
              {results.results.map((r: any, i: number) => (
                <div key={i} style={{border: '2px solid #E5E7EB', borderRadius: '6px', padding: '1.5rem', background: '#fff'}}>
                  <div style={{fontSize: '0.85rem', fontFamily: 'var(--font-pixel)', color: 'var(--blue)', marginBottom: '0.75rem', textTransform: 'uppercase', fontWeight: 600}}>
                    {r.sku.name || `SKU ${i + 1}`}
                  </div>
                  <div style={{fontSize: '0.9rem', lineHeight: '1.8', color: '#666'}}>
                    <div><strong>Warehouse:</strong> {r.closest_warehouse} ({r.warehouse_city}, {r.warehouse_state})</div>
                    <div><strong>Trucking:</strong> {r.trucking_distance_miles.toFixed(0)} mi → ${r.trucking_cost.toFixed(2)}</div>
                    <div><strong>Units/pallet:</strong> {r.units_per_pallet}</div>
                    <div><strong>Receiving:</strong> ${r.inbound_receiving.toFixed(2)}</div>
                    <div style={{marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid #E5E7EB', fontSize: '0.85rem', fontWeight: 600}}>
                      <div>Per-unit (all-in): ${r.per_unit.total.toFixed(2)}</div>
                      <div style={{color: 'var(--blue)', fontSize: '1.1rem', marginTop: '0.5rem'}}>Pallet Total: ${r.pallet_total.toFixed(2)}</div>
                    </div>
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
