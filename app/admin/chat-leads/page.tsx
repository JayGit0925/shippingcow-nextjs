import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentUser, isAdmin } from '@/lib/auth';
import { getAllChatSessions, type ChatSessionRow } from '@/lib/db';

export default async function AdminChatLeadsPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  if (!isAdmin(user)) redirect('/dashboard');

  const sessions = await getAllChatSessions(100);
  const withEmail = sessions.filter((s) => s.email);
  const notified = sessions.filter((s) => s.slack_notified_at);
  const highScore = sessions.filter((s) => s.qualified_score >= 70);

  return (
    <div className="dash">
      <div className="container">
        <div className="dash__header">
          <div className="dash__welcome">
            <h1>Admin — Chat Leads 🐄</h1>
            <p>Logged in as {user.email}. Last 100 chat sessions.</p>
          </div>
          <Link href="/admin" className="btn btn--ghost">Back to Inquiries</Link>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
          {[
            { label: 'Total Sessions', value: sessions.length, color: '#0052C9' },
            { label: 'Email Captured', value: withEmail.length, color: '#059669' },
            { label: 'Notified (Telegram)', value: notified.length, color: '#F59E0B' },
            { label: 'Score ≥ 70', value: highScore.length, color: '#7C3AED' },
          ].map(({ label, value, color }) => (
            <div key={label} className="card" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2.5rem', fontWeight: 700, color }}>{value}</div>
              <div style={{ fontSize: '0.9rem', color: '#6b7280' }}>{label}</div>
            </div>
          ))}
        </div>

        {/* Table */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {sessions.length === 0 ? (
            <div className="empty-state" style={{ padding: '3rem' }}>
              <p>No chat sessions yet.</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                <thead>
                  <tr style={{ background: '#f4f7ff', borderBottom: '2px solid #1A202C' }}>
                    <th style={th}>Last Seen</th>
                    <th style={th}>Email</th>
                    <th style={th}>Score</th>
                    <th style={th}>Msgs</th>
                    <th style={th}>Page</th>
                    <th style={th}>Notified</th>
                    <th style={th}>Session ID</th>
                  </tr>
                </thead>
                <tbody>
                  {sessions.map((s: ChatSessionRow) => (
                    <tr key={s.session_id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                      <td style={td}>{new Date(s.last_seen).toLocaleDateString()}</td>
                      <td style={td}>
                        {s.email ? (
                          <a href={`mailto:${s.email}`} style={{ color: '#0052C9' }}>{s.email}</a>
                        ) : (
                          <span style={{ color: '#9ca3af' }}>—</span>
                        )}
                      </td>
                      <td style={td}>
                        <span style={{
                          background: s.qualified_score >= 70 ? '#7C3AED' : s.qualified_score >= 40 ? '#F59E0B' : '#6b7280',
                          color: '#fff',
                          padding: '2px 8px',
                          borderRadius: 4,
                          fontSize: '0.75rem',
                          fontWeight: 600,
                        }}>
                          {s.qualified_score}
                        </span>
                      </td>
                      <td style={td}>{s.message_count}</td>
                      <td style={{ ...td, fontSize: '0.7rem', color: '#6b7280', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {s.opener_variant || '—'}
                      </td>
                      <td style={td}>
                        {s.slack_notified_at ? (
                          <span style={{ color: '#059669', fontSize: '0.75rem' }}>✓ {new Date(s.slack_notified_at).toLocaleDateString()}</span>
                        ) : (
                          <span style={{ color: '#9ca3af', fontSize: '0.75rem' }}>—</span>
                        )}
                      </td>
                      <td style={td}>
                        <code style={{ fontSize: '0.65rem', color: '#9ca3af', fontFamily: 'monospace' }}>
                          {s.session_id.substring(0, 8)}
                        </code>
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
