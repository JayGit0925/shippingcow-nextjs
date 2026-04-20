'use client';

import { useState, useRef, useEffect, FormEvent } from 'react';
import { usePathname } from 'next/navigation';
import type { Message } from '@/lib/types';

const WELCOME: Message = {
  role: 'assistant',
  content:
    "Hey there! I'm the ShippingCow AI 🐄 Ask me anything about reducing your shipping costs, carrier options, or how ShippingCow works.",
};

function getOrCreateSessionId(): string {
  let sid = localStorage.getItem('sc_session_id');
  if (!sid) {
    sid = crypto.randomUUID();
    localStorage.setItem('sc_session_id', sid);
  }
  return sid;
}

export default function ChatWidget() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([WELCOME]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, open]);

  // Hide on dashboard — dashboard has its own AI Copilot page
  if (pathname?.startsWith('/dashboard')) return null;

  async function send(e: FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || loading) return;

    const userMsg: Message = { role: 'user', content: text };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput('');
    setLoading(true);

    try {
      const sessionId = getOrCreateSessionId();
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages:   next.filter((m) => m.role !== 'system'),
          session_id: sessionId,
          page_url:   window.location.pathname,
        }),
      });
      const data = await res.json();
      const reply: Message = {
        role:    'assistant',
        content: data.content || data.error || 'Sorry, something went wrong.',
      };
      setMessages((prev) => [...prev, reply]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Network error. Please try again.' },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* Floating toggle button */}
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? 'Close chat' : 'Open ShippingCow AI chat'}
        style={{
          position: 'fixed', bottom: '1.5rem', right: '1.5rem', zIndex: 50,
          width: 56, height: 56, borderRadius: '50%',
          background: '#1E40AF', color: '#fff',
          border: '3px solid #1A202C', boxShadow: '3px 3px 0 #1A202C',
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 26, transition: 'transform 0.15s',
        }}
      >
        {open ? '✕' : '🐄'}
      </button>

      {/* Chat panel */}
      {open && (
        <div
          style={{
            position: 'fixed', bottom: '5rem', right: '1.5rem', zIndex: 50,
            width: 360, maxWidth: 'calc(100vw - 2rem)',
            background: '#fff', border: '3px solid #1A202C', boxShadow: '5px 5px 0 #1A202C',
            borderRadius: 8, display: 'flex', flexDirection: 'column', overflow: 'hidden',
          }}
        >
          {/* Header */}
          <div style={{ background: '#1E40AF', color: '#fff', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10, fontWeight: 700, fontSize: '0.95rem' }}>
            <span>🐄</span>
            <span>ShippingCow AI</span>
            <span style={{ marginLeft: 'auto', fontSize: 10, background: '#22c55e', borderRadius: 99, padding: '2px 8px', fontWeight: 600 }}>
              Online
            </span>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 360, fontSize: '0.875rem' }}>
            {messages.map((m, i) => (
              <div
                key={i}
                style={{
                  alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                  maxWidth: '82%',
                  background: m.role === 'user' ? '#1E40AF' : '#F3F4F6',
                  color:      m.role === 'user' ? '#fff'    : '#111827',
                  padding: '8px 12px',
                  borderRadius: m.role === 'user' ? '12px 12px 0 12px' : '12px 12px 12px 0',
                  lineHeight: 1.5,
                }}
              >
                {m.content}
              </div>
            ))}
            {loading && (
              <div style={{ alignSelf: 'flex-start', background: '#F3F4F6', borderRadius: '12px 12px 12px 0', padding: '8px 14px', color: '#6B7280', fontSize: '1.1rem', letterSpacing: 2 }}>
                •••
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <form onSubmit={send} style={{ borderTop: '2px solid #E5E7EB', padding: '10px 12px', display: 'flex', gap: 8 }}>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about shipping costs…"
              disabled={loading}
              style={{ flex: 1, border: '2px solid #D1D5DB', borderRadius: 6, padding: '8px 10px', fontSize: '0.875rem', outline: 'none', background: loading ? '#F9FAFB' : '#fff' }}
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              style={{ background: '#1E40AF', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 14px', fontWeight: 700, cursor: loading || !input.trim() ? 'not-allowed' : 'pointer', opacity: loading || !input.trim() ? 0.6 : 1, fontSize: '0.875rem' }}
            >
              Send
            </button>
          </form>
        </div>
      )}
    </>
  );
}
