import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { getAllInquiries } from '@/lib/db';

type InquiryRow = {
  id: number;
  name: string;
  email: string;
  company: string | null;
  phone: string | null;
  monthly_spend: string | null;
  product_weight: string | null;
  message: string | null;
  status: string;
  created_at: string;
  user_id: number | null;
  user_name: string | null;
};

const STATUS_COLORS: Record<string, string> = {
  new: '#0052C9',
  reviewed: '#059669',
  closed: '#6b7280',
};

export default async function AdminPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail || user.email !== adminEmail) {
    redirect('/dashboard');
  }

  const inquiries = (await getAllInquiries()) as unknown as InquiryRow[];
  const total = inquiries.length;
  const newCount = inquiries.filter((i) => i.status === 'new').length;
  const reviewedCount = inquiries.filter((i) => i.status === 'reviewed').length;

  return (
    <div className="dash">
      <div className="container">
        <div className="dash__header">
          <div className="dash__welcome">
            <h1>Admin — All Inquiries 🐄</h1>
            <p>Logged in as {user.email}. Showing all submitted inquiries.</p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <Link href="/admin/leads" className="btn btn--ghost">View Leads</Link>
            <Link href="/dashboard" className="btn btn--ghost">My Dashboard</Link>
          </div>
        </div>

        {/* Stats row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
          <div className="card" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2.5rem', fontWeight: 700, color: '#0052C9' }}>{total}</div>
            <div style={{ fontSize: '0.9rem', color: '#6b7280' }}>Total Inquiries</div>
          </div>
          <div className="card" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2.5rem', fontWeight: 700, color: '#0052C9' }}>{newCount}</div>
            <div style={{ fontSize: '0.9rem', color: '#6b7280' }}>New</div>
          </div>
          <div className="card" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2.5rem', fontWeight: 700, color: '#059669' }}>{reviewedCount}</div>
            <div style={{ fontSize: '0.9rem', color: '#6b7280' }}>Reviewed</div>
          </div>
        </div>

        {/* Inquiries table */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {inquiries.length === 0 ? (
            <div className="empty-state" style={{ padding: '3rem' }}>
              <p>No inquiries yet. They&apos;ll show up here once people submit the contact form.</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ background: '#f4f7ff', borderBottom: '2px solid #1A202C' }}>
                    <th style={th}>Date</th>
                    <th style={th}>Name / Company</th>
                    <th style={th}>Email</th>
                    <th style={th}>Spend</th>
                    <th style={th}>Weight</th>
                    <th style={th}>Status</th>
                    <th style={th}>Account</th>
                  </tr>
                </thead>
                <tbody>
                  {inquiries.map((i) => (
                    <tr key={i.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                      <td style={td}>{new Date(i.created_at).toLocaleDateString()}</td>
                      <td style={td}>
                        <strong>{i.name}</strong>
                        {i.company && (
                          <div style={{ color: '#6b7280', fontSize: '0.8rem' }}>{i.company}</div>
                        )}
                      </td>
                      <td style={td}>
                        <a href={`mailto:${i.email}`} style={{ color: '#0052C9' }}>{i.email}</a>
                        {i.phone && <div style={{ color: '#6b7280', fontSize: '0.8rem' }}>{i.phone}</div>}
                      </td>
                      <td style={td}>{i.monthly_spend || '—'}</td>
                      <td style={td}>{i.product_weight || '—'}</td>
                      <td style={td}>
                        <span style={{
                          background: STATUS_COLORS[i.status] || '#6b7280',
                          color: '#fff',
                          padding: '2px 8px',
                          borderRadius: 4,
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          textTransform: 'uppercase',
                        }}>
                          {i.status}
                        </span>
                      </td>
                      <td style={td}>
                        {i.user_name ? (
                          <span style={{ fontSize: '0.8rem', color: '#059669' }}>✓ {i.user_name}</span>
                        ) : (
                          <span style={{ fontSize: '0.8rem', color: '#9ca3af' }}>Guest</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Message column — below the table */}
        {inquiries.some((i) => i.message) && (
          <div style={{ marginTop: '2rem' }}>
            <h2 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>Messages</h2>
            {inquiries
              .filter((i) => i.message)
              .map((i) => (
                <div className="card" key={i.id} style={{ marginBottom: '1rem' }}>
                  <div style={{ fontSize: '0.8rem', color: '#6b7280', marginBottom: '0.4rem' }}>
                    {i.name} ({i.email}) · {new Date(i.created_at).toLocaleDateString()}
                  </div>
                  <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{i.message}</p>
                </div>
              ))}
          </div>
        )}
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
