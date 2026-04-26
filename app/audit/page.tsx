'use client';

import { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { ReportView } from './_components/ReportView';
import type { AuditReport } from '@/app/api/audit/route';

type UploadState = { type: 'upload'; error?: string; preview?: { rows: any[]; count: number } };
type ProcessingState = { type: 'processing'; count: number };
type ReportState = { type: 'report'; report: AuditReport; auditId?: string };
type State = UploadState | ProcessingState | ReportState;

const COLUMN_ALIASES: Record<string, string> = {
  'origin zip': 'origin_zip', 'origin_zip': 'origin_zip', 'from zip': 'origin_zip', 'ship from': 'origin_zip', 'origin': 'origin_zip',
  'dest zip': 'dest_zip', 'destination zip': 'dest_zip', 'dest_zip': 'dest_zip', 'to zip': 'dest_zip', 'ship to': 'dest_zip', 'destination': 'dest_zip',
  'length': 'length', 'l': 'length',
  'width': 'width', 'w': 'width',
  'height': 'height', 'h': 'height',
  'weight': 'weight', 'wt': 'weight', 'actual weight': 'weight',
  'quantity': 'quantity', 'qty': 'quantity', 'count': 'quantity',
  'current cost': 'current_cost', 'cost': 'current_cost', 'price': 'current_cost',
};

function fuzzyMatchColumns(headers: string[]): Record<string, number> {
  const mapping: Record<string, number> = {};
  for (let i = 0; i < headers.length; i++) {
    const lower = headers[i].toLowerCase().trim();
    const mappedKey = COLUMN_ALIASES[lower];
    if (mappedKey && mapping[mappedKey] === undefined) mapping[mappedKey] = i;
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
        const headers = (jsonData[0] as any[]).map((h) => String(h || '').trim());
        resolve({rows: jsonData.slice(1) as any[][], headers});
      } catch (err) {
        resolve({error: err instanceof Error ? err.message : 'Parse error'});
      }
    };
    reader.readAsArrayBuffer(file);
  });
}

function normalizeRow(row: any[], colMapping: Record<string, number>): any | null {
  const required = ['origin_zip', 'dest_zip', 'weight'];
  if (required.some((col) => colMapping[col] === undefined)) return null;
  const normalized: any = {};
  for (const [key, idx] of Object.entries(colMapping)) {
    let value = row[idx];
    if (['length', 'width', 'height', 'weight', 'quantity', 'current_cost'].includes(key)) {
      value = parseFloat(value);
      if (isNaN(value)) return null;
    }
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
    if ('error' in parsed) { setState({type: 'upload', error: parsed.error}); return; }
    const {rows, headers} = parsed;
    const colMapping = fuzzyMatchColumns(headers);
    const missing = ['origin_zip', 'dest_zip', 'weight'].filter((col) => colMapping[col] === undefined);
    if (missing.length > 0) {
      setState({type: 'upload', error: `Missing columns: ${missing.join(', ')}. Found: ${Object.keys(colMapping).join(', ')}`});
      return;
    }
    const normalized = rows.map((row) => normalizeRow(row, colMapping)).filter(Boolean);
    if (normalized.length === 0) { setState({type: 'upload', error: 'No valid rows found'}); return; }
    setState({type: 'upload', preview: {rows: normalized.slice(0, 5), count: normalized.length}});
    sessionStorage.setItem('audit_shipments', JSON.stringify(normalized));
  }

  async function runAudit() {
    const shipmentsJson = sessionStorage.getItem('audit_shipments');
    if (!shipmentsJson) { setState({type: 'upload', error: 'No shipment data found'}); return; }
    let shipments;
    try {
      shipments = JSON.parse(shipmentsJson);
    } catch {
      sessionStorage.removeItem('audit_shipments');
      setState({type: 'upload', error: 'Saved data was corrupted — please re-upload your file.'});
      return;
    }
    setState({type: 'processing', count: shipments.length});
    try {
      const res = await fetch('/api/audit', {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({shipments})});
      if (!res.ok) { const err = await res.json(); setState({type: 'upload', error: err.error || 'Analysis failed'}); return; }
      const report = await res.json();
      setState({type: 'report', report, auditId: report.id});
      sessionStorage.removeItem('audit_shipments');
    } catch (err) {
      setState({type: 'upload', error: err instanceof Error ? err.message : 'Error'});
    }
  }

  if (state.type === 'upload') return <UploadView state={state} onFile={handleFile} onRun={runAudit} fileInputRef={fileInputRef} />;
  if (state.type === 'processing') return <ProcessingView state={state} />;
  if (state.type === 'report') return <ReportView state={state} />;

  // Unknown state — branded fallback
  return (
    <div className="dash">
      <div className="container" style={{maxWidth: '600px', margin: '4rem auto', textAlign: 'center'}}>
        <div className="card" style={{padding: '2rem'}}>
          <h1 style={{fontSize: '1.5rem', marginBottom: '0.5rem'}}>Whoops! 🐄</h1>
          <p style={{color: '#6B7280', marginBottom: '1.5rem'}}>
            Looks like we took a wrong turn at the pasture. Let&apos;s get you back to the herd.
          </p>
          <button
            className="btn"
            onClick={() => { sessionStorage.removeItem('audit_shipments'); setState({type: 'upload'}); }}
          >
            Start Over
          </button>
        </div>
      </div>
    </div>
  );
}

function UploadView({state, onFile, onRun, fileInputRef}: {
  state: UploadState; onFile: (f: File) => void; onRun: () => void; fileInputRef: React.RefObject<HTMLInputElement>;
}) {
  const preview = state.preview;
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
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); const file = e.dataTransfer.files[0]; if (file) onFile(file); }}
            onClick={() => fileInputRef.current?.click()}
            style={{border: '3px dashed var(--blue)', borderRadius: '8px', padding: '3rem', textAlign: 'center', background: '#F4F7FF', cursor: 'pointer', marginBottom: '1.5rem'}}
            onMouseEnter={(e) => (e.currentTarget.style.background = '#E3EBFF')}
            onMouseLeave={(e) => (e.currentTarget.style.background = '#F4F7FF')}
          >
            <div style={{fontSize: '2.5rem', marginBottom: '1rem'}}>📤</div>
            <p style={{fontSize: '1.1rem', fontWeight: 600, margin: 0}}>Drop your Excel or CSV file here</p>
            <p style={{fontSize: '0.95rem', color: '#666', marginTop: '0.5rem'}}>Or click to browse your computer</p>
            <input ref={fileInputRef} type="file" accept=".xlsx,.xls,.csv"
              onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])} style={{display: 'none'}} />
          </div>
          <div style={{textAlign: 'center', marginBottom: '2rem'}}>
            <a href="/api/audit/template" download className="btn btn--ghost" style={{fontSize: '0.9rem'}}>📥 Download Template</a>
          </div>
          {state.error && (
            <div style={{background: '#FEE2E2', border: '2px solid #DC2626', color: '#7F1D1D', padding: '1rem', borderRadius: '6px', marginBottom: '2rem'}}>
              ❌ {state.error}
            </div>
          )}
          {preview && (
            <div style={{background: '#F9FAFB', border: '2px solid #E5E7EB', borderRadius: '6px', padding: '1.5rem', marginBottom: '2rem'}}>
              <p style={{fontSize: '1rem', fontWeight: 600, margin: '0 0 1rem 0'}}>
                ✅ Found <strong>{preview.count}</strong> shipment{preview.count !== 1 ? 's' : ''}
              </p>
              <div style={{overflowX: 'auto', marginBottom: '1.5rem'}}>
                <table style={{width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem'}}>
                  <thead>
                    <tr style={{background: '#F4F7FF', borderBottom: '1px solid #D1D5DB'}}>
                      {['Origin','Dest','L×W×H','Weight','Qty'].map(h => (
                        <th key={h} style={{padding: '0.75rem', textAlign: 'left', fontWeight: 600}}>{h}</th>
                      ))}
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
              <button onClick={onRun} className="btn btn--blue" style={{width: '100%', padding: '0.75rem'}}>🚀 Run My Audit</button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function ProcessingView({state}: {state: ProcessingState}) {
  return (
    <div className="dash">
      <div className="container" style={{maxWidth: '600px', margin: '0 auto', textAlign: 'center', paddingTop: '5rem', paddingBottom: '5rem'}}>
        <div style={{fontSize: '3rem', marginBottom: '1.5rem', animation: 'spin 2s linear infinite'}}>🐄</div>
        <h2 style={{fontFamily: 'var(--font-display)', fontSize: '1.5rem', marginBottom: '0.5rem'}}>
          Analyzing {state.count} shipments...
        </h2>
        <p style={{color: '#666', marginBottom: '1rem'}}>We're calculating your zone-based routing and DIM weight savings.</p>
        <div style={{height: '4px', background: '#E5E7EB', borderRadius: '2px', overflow: 'hidden', marginTop: '2rem'}}>
          <div style={{height: '100%', background: 'var(--blue)', width: '60%', animation: 'pulse 1s infinite'}} />
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } } @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }`}</style>
      </div>
    </div>
  );
}
