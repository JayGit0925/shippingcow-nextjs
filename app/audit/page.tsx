'use client';

import { useState, useRef, ReactNode } from 'react';
import Link from 'next/link';
import * as XLSX from 'xlsx';
import type { AuditReport } from '@/app/api/audit/route';

type UploadState = {
  type: 'upload';
  error?: string;
  preview?: {
    rows: Array<any>;
    count: number;
  };
};

type ProcessingState = {
  type: 'processing';
  count: number;
};

type ReportState = {
  type: 'report';
  report: AuditReport;
  auditId?: string;
};

type State = UploadState | ProcessingState | ReportState;

const COLUMN_ALIASES: Record<string, string> = {
  'origin zip': 'origin_zip',
  'origin_zip': 'origin_zip',
  'from zip': 'origin_zip',
  'ship from': 'origin_zip',
  'origin': 'origin_zip',

  'dest zip': 'dest_zip',
  'destination zip': 'dest_zip',
  'dest_zip': 'dest_zip',
  'to zip': 'dest_zip',
  'ship to': 'dest_zip',
  'destination': 'dest_zip',

  'length': 'length',
  'l': 'length',

  'width': 'width',
  'w': 'width',

  'height': 'height',
  'h': 'height',

  'weight': 'weight',
  'wt': 'weight',
  'actual weight': 'weight',

  'quantity': 'quantity',
  'qty': 'quantity',
  'count': 'quantity',

  'current cost': 'current_cost',
  'cost': 'current_cost',
  'price': 'current_cost',
};

function fuzzyMatchColumns(headers: string[]): Record<string, number> {
  const mapping: Record<string, number> = {};

  for (let i = 0; i < headers.length; i++) {
    const lower = headers[i].toLowerCase().trim();
    const mappedKey = COLUMN_ALIASES[lower];

    if (mappedKey && !mapping[mappedKey]) {
      mapping[mappedKey] = i;
    }
  }

  return mapping;
}

function parseFile(file: File): Promise<{rows: any[], headers: string[]} | {error: string}> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        if (!data) return resolve({error: 'Failed to read file'});

        const workbook = XLSX.read(data, {type: 'array'});
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        if (!worksheet) return resolve({error: 'No sheet found'});

        const jsonData = XLSX.utils.sheet_to_json(worksheet, {header: 1}) as any[];
        if (jsonData.length < 2) return resolve({error: 'File must have headers and at least 1 data row'});

        const headers = jsonData[0] as string[];
        const rows = jsonData.slice(1) as any[][];

        resolve({rows, headers});
      } catch (err) {
        resolve({error: err instanceof Error ? err.message : 'Parse error'});
      }
    };
    reader.readAsArrayBuffer(file);
  });
}

function normalizeRow(
  row: any[],
  headers: string[],
  colMapping: Record<string, number>
): any | null {
  const required = ['origin_zip', 'dest_zip', 'weight'];
  const missing = required.filter((col) => !colMapping[col]);

  if (missing.length > 0) {
    return null; // Skip if required columns missing
  }

  const normalized: any = {};
  for (const [key, idx] of Object.entries(colMapping)) {
    let value = row[idx];

    // Normalize numeric columns
    if (['length', 'width', 'height', 'weight', 'quantity', 'current_cost'].includes(key)) {
      value = parseFloat(value);
      if (isNaN(value)) return null;
    }

    // Pad ZIPs
    if (key.includes('zip')) {
      value = String(value).padStart(5, '0');
      if (!/^\d{5}$/.test(value)) return null;
    }

    normalized[key] = value;
  }

  normalized.quantity = normalized.quantity || 1;
  return normalized;
}

export default function AuditPage() {
  const [state, setState] = useState<State>({type: 'upload'});
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    const parsed = await parseFile(file);
    if ('error' in parsed) {
      setState({type: 'upload', error: parsed.error});
      return;
    }

    const {rows, headers} = parsed;
    const colMapping = fuzzyMatchColumns(headers);

    const required = ['origin_zip', 'dest_zip', 'weight'];
    const missing = required.filter((col) => !colMapping[col]);
    if (missing.length > 0) {
      setState({type: 'upload', error: `Missing columns: ${missing.join(', ')}`});
      return;
    }

    const normalized: any[] = [];
    for (const row of rows) {
      const normalized_row = normalizeRow(row, headers, colMapping);
      if (normalized_row) normalized.push(normalized_row);
    }

    if (normalized.length === 0) {
      setState({type: 'upload', error: 'No valid rows found'});
      return;
    }

    setState({
      type: 'upload',
      preview: {
        rows: normalized.slice(0, 5),
        count: normalized.length,
      },
    });

    // Store parsed data in sessionStorage for analysis
    sessionStorage.setItem('audit_shipments', JSON.stringify(normalized));
  }

  async function runAudit() {
    const shipmentsJson = sessionStorage.getItem('audit_shipments');
    if (!shipmentsJson) {
      setState({type: 'upload', error: 'No shipment data found'});
      return;
    }

    const shipments = JSON.parse(shipmentsJson);
    setState({type: 'processing', count: shipments.length});

    try {
      const res = await fetch('/api/audit', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({shipments}),
      });

      if (!res.ok) {
        const err = await res.json();
        setState({type: 'upload', error: err.error || 'Analysis failed'});
        return;
      }

      const report = await res.json();
      setState({type: 'report', report, auditId: report.id});
      sessionStorage.removeItem('audit_shipments');
    } catch (err) {
      setState({type: 'upload', error: err instanceof Error ? err.message : 'Error'});
    }
  }

  if (state.type === 'upload') {
    return <UploadView state={state} onFile={handleFile} onRun={runAudit} fileInputRef={fileInputRef} />;
  }

  if (state.type === 'processing') {
    return <ProcessingView state={state} />;
  }

  if (state.type === 'report') {
    return <ReportView state={state} />;
  }

  return null;
}

// ============ UPLOAD VIEW ============

function UploadView({
  state,
  onFile,
  onRun,
  fileInputRef,
}: {
  state: UploadState;
  onFile: (f: File) => void;
  onRun: () => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
}) {
  const preview = state.preview;
  const canRun = !!preview;

  return (
    <div className="dash">
      <div className="container" style={{maxWidth: '900px', margin: '0 auto'}}>
        <section style={{paddingTop: '3rem', paddingBottom: '3rem'}}>
          <div style={{textAlign: 'center', marginBottom: '3rem'}}>
            <h1 style={{fontSize: '2.2rem', fontFamily: 'var(--font-display)'}}>
              Upload Your <span style={{color: 'var(--blue)'}}>Shipment Data</span>
            </h1>
            <p style={{fontSize: '1.05rem', color: '#666', marginTop: '0.5rem'}}>
              See exactly how much you could save with ShippingCow's DIM 225 pricing and smart routing.
            </p>
          </div>

          {/* Drop zone */}
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const file = e.dataTransfer.files[0];
              if (file) onFile(file);
            }}
            onClick={() => fileInputRef.current?.click()}
            style={{
              border: '3px dashed var(--blue)',
              borderRadius: '8px',
              padding: '3rem',
              textAlign: 'center',
              background: '#F4F7FF',
              cursor: 'pointer',
              marginBottom: '1.5rem',
              transition: 'background 0.2s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = '#E3EBFF')}
            onMouseLeave={(e) => (e.currentTarget.style.background = '#F4F7FF')}
          >
            <div style={{fontSize: '2.5rem', marginBottom: '1rem'}}>📤</div>
            <p style={{fontSize: '1.1rem', fontWeight: 600, margin: 0}}>Drop your Excel or CSV file here</p>
            <p style={{fontSize: '0.95rem', color: '#666', marginTop: '0.5rem'}}>
              Or click to browse your computer
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])}
              style={{display: 'none'}}
            />
          </div>

          {/* Template link */}
          <div style={{textAlign: 'center', marginBottom: '2rem'}}>
            <a href="/api/audit/template" download className="btn btn--ghost" style={{fontSize: '0.9rem'}}>
              📥 Download Template
            </a>
          </div>

          {/* Error */}
          {state.error && (
            <div style={{background: '#FEE2E2', border: '2px solid #DC2626', color: '#7F1D1D', padding: '1rem', borderRadius: '6px', marginBottom: '2rem'}}>
              ❌ {state.error}
            </div>
          )}

          {/* Preview */}
          {preview && (
            <div style={{background: '#F9FAFB', border: '2px solid #E5E7EB', borderRadius: '6px', padding: '1.5rem', marginBottom: '2rem'}}>
              <p style={{fontSize: '1rem', fontWeight: 600, margin: '0 0 1rem 0'}}>
                ✅ Found <strong>{preview.count}</strong> shipment{preview.count !== 1 ? 's' : ''}
              </p>
              <div style={{overflowX: 'auto', marginBottom: '1.5rem'}}>
                <table style={{width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem'}}>
                  <thead>
                    <tr style={{background: '#F4F7FF', borderBottom: '1px solid #D1D5DB'}}>
                      <th style={{padding: '0.75rem', textAlign: 'left', fontWeight: 600}}>Origin</th>
                      <th style={{padding: '0.75rem', textAlign: 'left', fontWeight: 600}}>Dest</th>
                      <th style={{padding: '0.75rem', textAlign: 'left', fontWeight: 600}}>L×W×H</th>
                      <th style={{padding: '0.75rem', textAlign: 'left', fontWeight: 600}}>Weight</th>
                      <th style={{padding: '0.75rem', textAlign: 'left', fontWeight: 600}}>Qty</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.rows.map((row, i) => (
                      <tr key={i} style={{borderBottom: '1px solid #E5E7EB', background: i % 2 === 0 ? '#fff' : '#F9FAFB'}}>
                        <td style={{padding: '0.75rem'}}>{row.origin_zip}</td>
                        <td style={{padding: '0.75rem'}}>{row.dest_zip}</td>
                        <td style={{padding: '0.75rem'}}>{row.length}×{row.width}×{row.height}</td>
                        <td style={{padding: '0.75rem'}}>{row.weight} lbs</td>
                        <td style={{padding: '0.75rem'}}>{row.quantity}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <button onClick={onRun} className="btn btn--blue" style={{width: '100%', padding: '0.75rem'}}>
                🚀 Run My Audit
              </button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

// ============ PROCESSING VIEW ============

function ProcessingView({state}: {state: ProcessingState}) {
  return (
    <div className="dash">
      <div className="container" style={{maxWidth: '600px', margin: '0 auto', textAlign: 'center', paddingTop: '5rem', paddingBottom: '5rem'}}>
        <div style={{fontSize: '3rem', marginBottom: '1.5rem', animation: 'spin 2s linear infinite'}}>🐄</div>
        <h2 style={{fontFamily: 'var(--font-display)', fontSize: '1.5rem', marginBottom: '0.5rem'}}>
          Analyzing {state.count} shipments...
        </h2>
        <p style={{color: '#666', marginBottom: '1rem'}}>
          We're calculating your zone-based routing and DIM weight savings.
        </p>
        <div style={{height: '4px', background: '#E5E7EB', borderRadius: '2px', overflow: 'hidden', marginTop: '2rem'}}>
          <div style={{height: '100%', background: 'var(--blue)', width: '60%', animation: 'pulse 1s infinite'}} />
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } } @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }`}</style>
      </div>
    </div>
  );
}

// ============ REPORT VIEW ============

function ReportView({state}: {state: ReportState}) {
  const {report, auditId} = state;
  const {
    total_packages,
    total_current_cost,
    total_sc_cost,
    total_savings,
    savings_percentage,
    avg_zone_before,
    avg_zone_after,
    pct_within_zone_5,
    avg_billable_weight_139,
    avg_billable_weight_225,
    dim_weight_reduction_pct,
    warehouse_distribution,
    total_handling_fees,
    total_last_mile_fees,
    shipment_details,
  } = report;

  const monthly_savings = total_savings;
  const annual_savings = total_savings * 12;

  const [filterZip, setFilterZip] = useState('');
  const filteredDetails = shipment_details.filter(
    (d) =>
      d.origin_zip.includes(filterZip) ||
      d.dest_zip.includes(filterZip)
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

        {/* Section 1: Zone Distribution */}
        <Section title="Zone Distribution Impact">
          <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginTop: '2rem'}}>
            <ZoneChart label="Your Current Zones" distribution={report.current_zone_percentages} />
            <ZoneChart label="With ShippingCow Smart Routing" distribution={report.sc_zone_percentages} highlight />
          </div>
        </Section>

        {/* Section 2: Smart Routing Impact */}
        <Section title="Smart Routing Impact">
          <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginTop: '2rem'}}>
            <Card label="Improved to Zone 5 or Better">
              <div style={{fontSize: '2rem', fontWeight: 700, color: 'var(--blue)'}}>
                {pct_within_zone_5.toFixed(0)}%
              </div>
              <div style={{fontSize: '0.9rem', color: '#666'}}>of your shipments</div>
            </Card>
            <Card label="Average Zone Improvement">
              <div style={{fontSize: '2rem', fontWeight: 700, color: 'var(--blue)'}}>
                {avg_zone_before.toFixed(1)} → {avg_zone_after.toFixed(1)}
              </div>
              <div style={{fontSize: '0.9rem', color: '#666'}}>
                {(avg_zone_before - avg_zone_after).toFixed(1)} zones better
              </div>
            </Card>
            <Card label="Warehouse Split">
              <div style={{fontSize: '0.95rem', lineHeight: '1.8'}}>
                {Object.entries(warehouse_distribution).map(([wh, count]) => (
                  <div key={wh}>
                    <strong>{wh}:</strong> {((count / report.total_shipments) * 100).toFixed(0)}%
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </Section>

        {/* Section 3: DIM Weight Savings */}
        <Section title="DIM Weight Savings">
          <div style={{marginTop: '2rem'}}>
            <p style={{fontSize: '1.05rem', marginBottom: '1.5rem'}}>
              Your average billable weight drops from <strong>{avg_billable_weight_139.toFixed(1)} lbs</strong> to <strong>{avg_billable_weight_225.toFixed(1)} lbs</strong>{' '}
              <span style={{color: 'var(--blue)', fontWeight: 700}}>({dim_weight_reduction_pct.toFixed(1)}% reduction)</span>
            </p>
            <ComparisonBar before={avg_billable_weight_139} after={avg_billable_weight_225} />
          </div>
        </Section>

        {/* Section 4: Cost Breakdown */}
        <Section title="Cost Breakdown">
          <table style={{width: '100%', marginTop: '1.5rem', borderCollapse: 'collapse'}}>
            <tbody>
              {[
                ['Shipping Cost', `$${total_current_cost.toFixed(2)}`, `$${(total_current_cost - total_handling_fees - total_last_mile_fees).toFixed(2)}`],
                ['Handling Fees', '—', `$${total_handling_fees.toFixed(2)}`],
                ['Last-Mile Fees', '—', `$${total_last_mile_fees.toFixed(2)}`],
                ['Total', `$${total_current_cost.toFixed(2)}`, `$${total_sc_cost.toFixed(2)}`],
              ].map((row, i) => (
                <tr key={i} style={{borderBottom: '1px solid #E5E7EB', background: i === 3 ? '#F4F7FF' : 'white'}}>
                  <td style={{padding: '1rem', fontWeight: i === 3 ? 700 : 600}}>{row[0]}</td>
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

        {/* Section 5: Shipment Details */}
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
                  <th style={tableHeaderStyle}>Origin</th>
                  <th style={tableHeaderStyle}>Dest</th>
                  <th style={tableHeaderStyle}>Dims</th>
                  <th style={tableHeaderStyle}>Wt</th>
                  <th style={tableHeaderStyle}>Current Zone</th>
                  <th style={tableHeaderStyle}>SC Zone</th>
                  <th style={tableHeaderStyle}>Current Cost</th>
                  <th style={tableHeaderStyle}>SC Cost</th>
                  <th style={tableHeaderStyle}>Savings</th>
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

        {/* Final CTA */}
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

// ============ COMPONENTS ============

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
          const isImprovement = highlight && pct > (distribution[zone] || 0) * 0.5;

          return (
            <div key={zone} style={{flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
              <div style={{fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.25rem'}}>
                {pct.toFixed(0)}%
              </div>
              <div
                style={{
                  width: '100%',
                  height: `${Math.max(height, 5)}px`,
                  background: isImprovement ? '#059669' : 'var(--blue)',
                  borderRadius: '2px',
                }}
              />
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

const tableHeaderStyle = {padding: '0.75rem', textAlign: 'left' as const, fontWeight: 600, fontSize: '0.8rem', textTransform: 'uppercase' as const};
const tableCellStyle = {padding: '0.75rem', fontSize: '0.85rem'};
