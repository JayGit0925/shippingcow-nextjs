import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { getCurrentUser, isAdmin } from '@/lib/auth';
import { getChatSession, getRecentChatMessages } from '@/lib/db';

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

export default async function ChatTranscriptPage({
  params,
}: {
  params: Promise<{ session_id: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  if (!isAdmin(user)) redirect('/dashboard');

  const { session_id } = await params;
  const [session, messages] = await Promise.all([
    getChatSession(session_id),
    getRecentChatMessages(session_id, 100),
  ]);

  if (!session) notFound();

  return (
    <div style={{ maxWidth: 720 }}>
      <div style={{ marginBottom: 20 }}>
        <Link href="/dashboard/chat" style={{ color: '#1e40af', fontSize: '0.875rem', textDecoration: 'none' }}>
          ← All sessions
        </Link>
      </div>

      {/* Session meta */}
      <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 8, padding: 16, marginBottom: 24, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, fontSize: '0.875rem' }}>
        <div>
          <p style={{ margin: 0, color: '#6b7280', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>Email</p>
          <p style={{ margin: '2px 0 0', fontWeight: 600 }}>{session.email ?? '—'}</p>
        </div>
        <div>
          <p style={{ margin: 0, color: '#6b7280', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>ICP Score</p>
          <p style={{ margin: '2px 0 0', fontWeight: 600 }}>{session.qualified_score}/100</p>
        </div>
        <div>
          <p style={{ margin: 0, color: '#6b7280', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>Messages</p>
          <p style={{ margin: '2px 0 0', fontWeight: 600 }}>{session.message_count}</p>
        </div>
        <div>
          <p style={{ margin: 0, color: '#6b7280', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>First Seen</p>
          <p style={{ margin: '2px 0 0' }}>{formatDate(session.first_seen)}</p>
        </div>
        <div>
          <p style={{ margin: 0, color: '#6b7280', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>Last Seen</p>
          <p style={{ margin: '2px 0 0' }}>{formatDate(session.last_seen)}</p>
        </div>
        <div>
          <p style={{ margin: 0, color: '#6b7280', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>Slack Notified</p>
          <p style={{ margin: '2px 0 0' }}>{session.slack_notified_at ? formatDate(session.slack_notified_at) : '—'}</p>
        </div>
        {session.opener_variant && (
          <div>
            <p style={{ margin: 0, color: '#6b7280', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>Opener</p>
            <p style={{ margin: '2px 0 0' }}>{session.opener_variant}</p>
          </div>
        )}
      </div>

      {/* Transcript */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {messages.map((m, i) => (
          <div
            key={i}
            style={{
              alignSelf:    m.role === 'user' ? 'flex-end' : 'flex-start',
              maxWidth:     '80%',
              background:   m.role === 'user' ? '#1e40af' : '#f3f4f6',
              color:        m.role === 'user' ? '#fff' : '#111827',
              padding:      '8px 12px',
              borderRadius: m.role === 'user' ? '12px 12px 0 12px' : '12px 12px 12px 0',
              lineHeight:   1.5,
              fontSize:     '0.875rem',
              whiteSpace:   'pre-wrap',
              wordBreak:    'break-word',
              display:      'flex',
              flexDirection: 'column',
            }}
          >
            {m.content}
            <span style={{ fontSize: 10, opacity: 0.6, marginTop: 4, alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
              {formatDate(m.created_at)}
            </span>
          </div>
        ))}
        {messages.length === 0 && (
          <p style={{ color: '#9ca3af', textAlign: 'center', padding: 32 }}>No messages in this session.</p>
        )}
      </div>
    </div>
  );
}
