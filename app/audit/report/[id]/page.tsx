'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { ReportView } from '../../_components/ReportView';
import type { AuditReport } from '@/app/api/audit/route';

type Status = 'loading' | 'found' | 'not_found' | 'error';

export default function AuditReportPage() {
  const { id } = useParams<{ id: string }>();
  const [status, setStatus] = useState<Status>('loading');
  const [report, setReport] = useState<AuditReport | null>(null);

  useEffect(() => {
    if (!id) { setStatus('not_found'); return; }
    fetch(`/api/audit?id=${encodeURIComponent(id)}`)
      .then(async (res) => {
        if (res.status === 404) { setStatus('not_found'); return; }
        if (!res.ok) { setStatus('error'); return; }
        const row = await res.json();
        // report_data is the full AuditReport shape stored as JSONB
        const reportData = row.report_data as AuditReport;
        setReport(reportData);
        setStatus('found');
      })
      .catch(() => setStatus('error'));
  }, [id]);

  if (status === 'loading') {
    return (
      <div className="dash" style={{textAlign: 'center', paddingTop: '5rem'}}>
        <div style={{fontSize: '3rem', animation: 'spin 2s linear infinite'}}>🐄</div>
        <p style={{marginTop: '1rem', color: '#666'}}>Loading your report...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (status === 'not_found') {
    return (
      <div className="dash" style={{textAlign: 'center', paddingTop: '5rem'}}>
        <div style={{fontSize: '3rem'}}>🐄</div>
        <h1 style={{fontFamily: 'var(--font-display)', fontSize: '1.8rem', marginTop: '1rem'}}>Report Not Found</h1>
        <p style={{color: '#666', marginTop: '0.5rem'}}>This audit link may have expired or been removed.</p>
        <a href="/audit" className="btn btn--blue" style={{display: 'inline-block', marginTop: '2rem', padding: '0.75rem 1.5rem'}}>
          Run a New Audit →
        </a>
      </div>
    );
  }

  if (status === 'error' || !report) {
    return (
      <div className="dash" style={{textAlign: 'center', paddingTop: '5rem'}}>
        <p style={{color: '#DC2626'}}>Failed to load report. Try again or run a new audit.</p>
        <a href="/audit" className="btn btn--blue" style={{display: 'inline-block', marginTop: '1.5rem', padding: '0.75rem 1.5rem'}}>
          Run a New Audit →
        </a>
      </div>
    );
  }

  return (
    <ReportView
      state={{ type: 'report', report, auditId: id }}
      defaultUnlocked={true}
    />
  );
}
