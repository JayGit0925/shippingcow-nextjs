import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentUser, isAdmin } from '@/lib/auth';
import { getAllLeads, Lead } from '@/lib/db';

const STATUS_COLORS: Record<string, string> = {
  new: '#0052C9',
  contacted: '#059669',
  qualified: '#F59E0B',
  converted: '#6b7280',
};

export default async function AdminLeadsPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  if (!isAdmin(user)) redirect('/dashboard');

  const leads = await getAllLeads();
  const total = leads.length;
  const newCount = leads.filter((l) => l.status === 'new').length;
  const contactedCount = leads.filter((l) => l.status === 'contacted').length;
  const qualifiedCount = leads.filter((l) => l.status === 'qualified').length;
  const convertedCount = leads.filter((l) => l.status === 'converted').length;

  return (
    <div className="dash">
      <div className="container">
        <div className="dash__header">
          <div className="dash__welcome">
            <h1>Admin — All Leads 🐄</h1>
            <p>Logged in as {user.email}. Showing all leads from the 4-step funnel.</p>
          </div>
          <Link href="/admin" className="btn btn--ghost">Back to Inquiries</Link>
        </div>

        {/* Stats row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
          <div className="card" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2.5rem', fontWeight: 700, color: '#0052C9' }}>{total}</div>
            <div style={{ fontSize: '0.9rem', color: '#6b7280' }}>Total</div>
          </div>
          <div className="card" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2.5rem', fontWeight: 700, color: '#0052C9' }}>{newCount}</div>
            <div style={{ fontSize: '0.9rem', color: '#6b7280' }}>New</div>
          </div>
          <div className="card" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2.5rem', fontWeight: 700, color: '#059669' }}>{contactedCount}</div>
            <div style={{ fontSize: '0.9rem', color: '#6b7280' }}>Contacted</div>
          </div>
          <div className="card" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2.5rem', fontWeight: 700, color: '#F59E0B' }}>{qualifiedCount}</div>
            <div style={{ fontSize: '0.9rem', color: '#6b7280' }}>Qualified</div>
          </div>
          <div className="card" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2.5rem', fontWeight: 700, color: '#6b7280' }}>{convertedCount}</div>
            <div style={{ fontSize: '0.9rem', color: '#6b7280' }}>Converted</div>
          </div>
        </div>

        {/* Leads table */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {leads.length === 0 ? (
            <div className="empty-state" style={{ padding: '3rem' }}>
              <p>No leads yet. They&apos;ll show up here once people start the calculator funnel.</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem' }}>
                <thead>
                  <tr style={{ background: '#f4f7ff', borderBottom: '2px solid #1A202C' }}>
                    <th style={th}>ID</th>
                    <th style={th}>Created</th>
                    <th style={th}>Steps</th>
                    <th style={th}>Status</th>
                    <th style={th}>Step 1 Data</th>
                    <th style={th}>Step 2 Data</th>
                    <th style={th}>Step 3 Data</th>
                    <th style={th}>Step 4 Data</th>
                  </tr>
                </thead>
                <tbody>
                  {leads.map((lead) => (
                    <tr key={lead.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                      <td style={td}>
                        <code style={{ fontSize: '0.7rem', color: '#6b7280', fontFamily: 'monospace' }}>
                          {lead.id.substring(0, 8)}
                        </code>
                      </td>
                      <td style={td}>{new Date(lead.created_at).toLocaleDateString()}</td>
                      <td style={td}>
                        <strong>{lead.step_completed}/4</strong>
                      </td>
                      <td style={td}>
                        <span style={{
                          background: STATUS_COLORS[lead.status] || '#6b7280',
                          color: '#fff',
                          padding: '2px 6px',
                          borderRadius: 3,
                          fontSize: '0.7rem',
                          fontWeight: 600,
                          textTransform: 'uppercase',
                          display: 'inline-block',
                        }}>
                          {lead.status}
                        </span>
                      </td>
                      <td style={{ ...td, fontSize: '0.7rem', fontFamily: 'monospace', background: lead.step1_data ? '#f9fafb' : 'transparent' }}>
                        {lead.step1_data ? (
                          <pre style={{ margin: 0, overflow: 'auto', maxHeight: '100px', maxWidth: '250px' }}>
                            {JSON.stringify(lead.step1_data, null, 2)}
                          </pre>
                        ) : '—'}
                      </td>
                      <td style={{ ...td, fontSize: '0.7rem', fontFamily: 'monospace', background: lead.step2_data ? '#f9fafb' : 'transparent' }}>
                        {lead.step2_data ? (
                          <pre style={{ margin: 0, overflow: 'auto', maxHeight: '100px', maxWidth: '250px' }}>
                            {JSON.stringify(lead.step2_data, null, 2)}
                          </pre>
                        ) : '—'}
                      </td>
                      <td style={{ ...td, fontSize: '0.7rem', fontFamily: 'monospace', background: lead.step3_data ? '#f9fafb' : 'transparent' }}>
                        {lead.step3_data ? (
                          <pre style={{ margin: 0, overflow: 'auto', maxHeight: '100px', maxWidth: '250px' }}>
                            {JSON.stringify(lead.step3_data, null, 2)}
                          </pre>
                        ) : '—'}
                      </td>
                      <td style={{ ...td, fontSize: '0.7rem', fontFamily: 'monospace', background: lead.step4_data ? '#f9fafb' : 'transparent' }}>
                        {lead.step4_data ? (
                          <pre style={{ margin: 0, overflow: 'auto', maxHeight: '100px', maxWidth: '250px' }}>
                            {JSON.stringify(lead.step4_data, null, 2)}
                          </pre>
                        ) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const th: React.CSSProperties = {
  padding: '12px 16px',
  textAlign: 'left',
  fontWeight: 600,
  fontSize: '0.8rem',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  color: '#374151',
};

const td: React.CSSProperties = {
  padding: '12px 16px',
  verticalAlign: 'top',
};
