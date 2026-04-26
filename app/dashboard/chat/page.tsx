import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getCurrentUser, isAdmin } from '@/lib/auth';
import { getAllChatSessions } from '@/lib/db';
import type { ChatSessionRow } from '@/lib/db';

function ScoreBadge({ score }: { score: number }) {
  const color = score >= 85 ? '#16a34a' : score >= 50 ? '#d97706' : '#6b7280';
  return (
    <span style={{ background: color, color: '#fff', borderRadius: 99, padding: '2px 8px', fontSize: 12, fontWeight: 700 }}>
      {score}
    </span>
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

export default async function ChatSessionsPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  if (!isAdmin(user)) redirect('/dashboard');

  const sessions = await getAllChatSessions(100);

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0 }}>Chat Sessions</h1>
        <p style={{ color: '#6b7280', margin: '4px 0 0' }}>{sessions.length} recent sessions</p>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #e5e7eb', textAlign: 'left' }}>
              <th style={{ padding: '8px 12px', fontWeight: 700, color: '#374151' }}>Session</th>
              <th style={{ padding: '8px 12px', fontWeight: 700, color: '#374151' }}>Email</th>
              <th style={{ padding: '8px 12px', fontWeight: 700, color: '#374151' }}>Score</th>
              <th style={{ padding: '8px 12px', fontWeight: 700, color: '#374151' }}>Msgs</th>
              <th style={{ padding: '8px 12px', fontWeight: 700, color: '#374151' }}>Slack</th>
              <th style={{ padding: '8px 12px', fontWeight: 700, color: '#374151' }}>Last Seen</th>
              <th style={{ padding: '8px 12px', fontWeight: 700, color: '#374151' }}></th>
            </tr>
          </thead>
          <tbody>
            {sessions.map((s: ChatSessionRow) => (
              <tr key={s.session_id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                <td style={{ padding: '8px 12px', fontFamily: 'monospace', color: '#6b7280', fontSize: 12 }}>
                  {s.session_id.slice(0, 8)}…
                </td>
                <td style={{ padding: '8px 12px' }}>
                  {s.email ? (
                    <a href={`mailto:${s.email}`} style={{ color: '#1e40af', textDecoration: 'none' }}>
                      {s.email}
                    </a>
                  ) : (
                    <span style={{ color: '#9ca3af', fontStyle: 'italic' }}>—</span>
                  )}
                </td>
                <td style={{ padding: '8px 12px' }}>
                  <ScoreBadge score={s.qualified_score} />
                </td>
                <td style={{ padding: '8px 12px', color: '#374151' }}>{s.message_count}</td>
                <td style={{ padding: '8px 12px' }}>
                  {s.slack_notified_at ? (
                    <span style={{ color: '#16a34a', fontWeight: 600 }}>✓ Sent</span>
                  ) : (
                    <span style={{ color: '#9ca3af' }}>—</span>
                  )}
                </td>
                <td style={{ padding: '8px 12px', color: '#6b7280' }}>{formatDate(s.last_seen)}</td>
                <td style={{ padding: '8px 12px' }}>
                  <Link
                    href={`/dashboard/chat/${s.session_id}`}
                    style={{ color: '#1e40af', fontWeight: 600, textDecoration: 'none', fontSize: 12 }}
                  >
                    View →
                  </Link>
                </td>
              </tr>
            ))}
            {sessions.length === 0 && (
              <tr>
                <td colSpan={7} style={{ padding: '32px', textAlign: 'center', color: '#9ca3af' }}>
                  No chat sessions yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
