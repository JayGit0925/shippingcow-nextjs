'use client';

import { useState, useRef, useEffect, FormEvent, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import type { Message } from '@/lib/types';

// ─── Session storage ────────────────────────────────────────────────────────

function getOrCreateSessionId(): string {
  let sid = localStorage.getItem('sc_session_id');
  if (!sid) {
    sid = crypto.randomUUID();
    localStorage.setItem('sc_session_id', sid);
  }
  return sid;
}

function isDismissedRecently(): boolean {
  const until = localStorage.getItem('sc_widget_dismissed_until');
  if (!until) return false;
  return Date.now() < Number(until);
}

function setDismissed() {
  const sevenDays = Date.now() + 7 * 24 * 60 * 60 * 1000;
  localStorage.setItem('sc_widget_dismissed_until', String(sevenDays));
}

function hasAutoOpenedThisSession(): boolean {
  return sessionStorage.getItem('sc_auto_opened') === '1';
}

function markAutoOpened() {
  sessionStorage.setItem('sc_auto_opened', '1');
}

function getCalculatorContext(): Record<string, unknown> | null {
  try {
    const raw = localStorage.getItem('sc_calc_result');
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

// ─── Page-aware openers ──────────────────────────────────────────────────────

type OpenerVariant = {
  id: string;
  message: string;
};

function getOpener(pathname: string, calcContext: Record<string, unknown> | null): OpenerVariant {
  if (calcContext) {
    return {
      id: 'post_calc',
      message: "Saw you ran the numbers — want me to flag anything or check if we can beat your current rate?",
    };
  }
  if (pathname === '/' || pathname === '') {
    return {
      id: 'home',
      message: "Ship 50lb+ goods? I can estimate your FedEx savings in 60 seconds. What are you shipping?",
    };
  }
  if (pathname.startsWith('/big-and-bulky') || pathname.startsWith('/heavy')) {
    return {
      id: 'heavy',
      message: "Heavy items eating your margin? Tell me your avg weight and monthly volume — I'll show you what DIM 225 saves.",
    };
  }
  if (pathname.startsWith('/calculator')) {
    return {
      id: 'calculator',
      message: "Ran the numbers already? Tell me what surprised you — I can check if we can beat it.",
    };
  }
  if (pathname.startsWith('/blog')) {
    return {
      id: 'blog',
      message: "Question about what you just read? I'm the logistics bot. Ask me anything.",
    };
  }
  return {
    id: 'default',
    message: "Hey! I'm the ShippingCow AI 🐄 Ask me about cutting your shipping costs, our warehouses, or how DIM 225 pricing works.",
  };
}

// ─── Email validation ────────────────────────────────────────────────────────

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

// ─── Main component ──────────────────────────────────────────────────────────

const SUPPRESSED_PATHS = ['/dashboard', '/inquiry'];

export default function ChatWidget() {
  const pathname = usePathname();
  const [open, setOpen]             = useState(false);
  const [messages, setMessages]     = useState<Message[]>([]);
  const [input, setInput]           = useState('');
  const [loading, setLoading]       = useState(false);
  const [captureMode, setCaptureMode]     = useState(false);
  const [emailInput, setEmailInput]       = useState('');
  const [emailError, setEmailError]       = useState('');
  const [emailCaptured, setEmailCaptured] = useState(() => {
    try { return localStorage.getItem('sc_email_captured') === '1'; } catch { return false; }
  });
  const [userMsgCount, setUserMsgCount]   = useState(0);
  const [sessionId, setSessionId]   = useState<string>('');
  const [calcContext, setCalcContext] = useState<Record<string, unknown> | null>(null);
  const [isMobile, setIsMobile]     = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef  = useRef<HTMLInputElement>(null);

  // Suppress on dashboard and inquiry pages
  const suppressed = SUPPRESSED_PATHS.some((p) => pathname?.startsWith(p));

  // Init session and opener on mount
  useEffect(() => {
    if (suppressed) return;
    const sid = getOrCreateSessionId();
    setSessionId(sid);
    const ctx = getCalculatorContext();
    setCalcContext(ctx);
    setIsMobile(window.innerWidth < 768);

    const opener = getOpener(pathname ?? '', ctx);
    setMessages([{ role: 'assistant', content: opener.message }]);

    // Analytics: fire widget_opened event on first open tracked by open state change
  }, [pathname, suppressed]);

  // Auto-scroll
  useEffect(() => {
    if (open) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
      inputRef.current?.focus();
    }
  }, [messages, open]);

  // Auto-open trigger: 30s delay OR exit intent
  useEffect(() => {
    if (suppressed || open) return;

    let timer: ReturnType<typeof setTimeout>;

    function attemptAutoOpen() {
      if (hasAutoOpenedThisSession() || isDismissedRecently()) return;
      markAutoOpened();
      setOpen(true);
      fireEvent('widget_auto_opened', { trigger: 'timer' });
    }

    function handleMouseLeave(e: MouseEvent) {
      if (e.clientY <= 0 && !hasAutoOpenedThisSession() && !isDismissedRecently()) {
        markAutoOpened();
        setOpen(true);
        fireEvent('widget_auto_opened', { trigger: 'exit_intent' });
        document.removeEventListener('mouseleave', handleMouseLeave);
      }
    }

    // Don't trigger auto-open in first 3 seconds of page load
    const initDelay = setTimeout(() => {
      timer = setTimeout(attemptAutoOpen, 30_000);
      document.addEventListener('mouseleave', handleMouseLeave);
    }, 3_000);

    return () => {
      clearTimeout(initDelay);
      clearTimeout(timer);
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [suppressed, open]);

  function fireEvent(event_type: string, metadata?: Record<string, unknown>) {
    if (!sessionId) return;
    fetch('/api/chat/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id: sessionId, event_type, metadata }),
    }).catch(() => {});
  }

  function handleOpen() {
    setOpen(true);
    fireEvent('widget_opened', { page_url: pathname });
  }

  function handleClose() {
    setOpen(false);
    setDismissed();
  }

  const send = useCallback(async (e?: FormEvent) => {
    e?.preventDefault();
    const text = input.trim();
    if (!text || loading) return;

    const userMsg: Message = { role: 'user', content: text };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput('');
    setLoading(true);
    const newCount = userMsgCount + 1;
    setUserMsgCount(newCount);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages:           next.filter((m) => m.role !== 'system'),
          session_id:         sessionId,
          page_url:           window.location.pathname,
          calculator_context: calcContext ?? undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessages((prev) => [...prev, { role: 'assistant', content: data.error || 'Something went wrong. Try again.' }]);
        return;
      }

      const reply: Message = { role: 'assistant', content: data.content };
      const updatedMessages = [...next, reply];
      setMessages(updatedMessages);

      // Trigger email capture: after 2nd user message OR high ICP score from API
      if (!emailCaptured && !captureMode && (newCount >= 2 || data.capture_ready)) {
        setTimeout(() => setCaptureMode(true), 800);
      }
    } catch {
      setMessages((prev) => [...prev, { role: 'assistant', content: 'Network error. Please try again.' }]);
    } finally {
      setLoading(false);
    }
  }, [input, loading, messages, sessionId, calcContext, emailCaptured, captureMode, userMsgCount]);

  async function submitEmail(e: FormEvent) {
    e.preventDefault();
    setEmailError('');
    if (!isValidEmail(emailInput)) {
      setEmailError('Please enter a valid email address.');
      return;
    }

    try {
      await fetch('/api/chat', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          email:      emailInput.trim().toLowerCase(),
          page_url:   window.location.pathname,
          messages:   messages.filter((m) => m.role !== 'system'),
        }),
      });

      setEmailCaptured(true);
      setCaptureMode(false);
      try { localStorage.setItem('sc_email_captured', '1'); } catch {}
      fireEvent('email_captured', { email: emailInput });

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `Got it! I'll have our team send a custom savings estimate to ${emailInput.trim()}. Usually lands within a few hours. Anything else I can answer while you're here?`,
        },
      ]);
    } catch {
      setEmailError('Could not save your email. Please try again.');
    }
  }

  if (suppressed) return null;

  // ─── Render ──────────────────────────────────────────────────────────────

  const buttonPosition = isMobile
    ? { bottom: '1.25rem', right: '1rem' }
    : { bottom: '1.5rem', right: '1.5rem' };

  const panelPosition = isMobile
    ? { bottom: '4.5rem', right: '0.5rem', left: '0.5rem', width: 'auto' }
    : { bottom: '5rem', right: '1.5rem', width: 360 };

  return (
    <>
      {/* Toggle button */}
      <button
        onClick={() => (open ? handleClose() : handleOpen())}
        aria-label={open ? 'Close chat' : 'Open ShippingCow AI chat'}
        style={{
          position: 'fixed',
          zIndex: 40,
          width: 52,
          height: 52,
          borderRadius: '50%',
          background: '#1E40AF',
          color: '#fff',
          border: '3px solid #1A202C',
          boxShadow: '3px 3px 0 #1A202C',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 24,
          transition: 'transform 0.15s',
          ...buttonPosition,
        }}
      >
        {open ? '✕' : '🐄'}
      </button>

      {/* Chat panel */}
      {open && (
        <div
          style={{
            position: 'fixed',
            zIndex: 40,
            background: '#fff',
            border: '3px solid #1A202C',
            boxShadow: '5px 5px 0 #1A202C',
            borderRadius: 8,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            maxHeight: '70vh',
            ...panelPosition,
          }}
        >
          {/* Header */}
          <div style={{ background: '#1E40AF', color: '#fff', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10, fontWeight: 700, fontSize: '0.9rem', flexShrink: 0 }}>
            <span>🐄</span>
            <span>ShippingCow AI</span>
            <span style={{ marginLeft: 'auto', fontSize: 10, background: '#22c55e', borderRadius: 99, padding: '2px 8px', fontWeight: 600 }}>
              Online
            </span>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '12px 12px 8px', display: 'flex', flexDirection: 'column', gap: 8, fontSize: '0.85rem' }}>
            {messages.map((m, i) => (
              <div
                key={i}
                style={{
                  alignSelf:    m.role === 'user' ? 'flex-end' : 'flex-start',
                  maxWidth:     '84%',
                  background:   m.role === 'user' ? '#1E40AF' : '#F3F4F6',
                  color:        m.role === 'user' ? '#fff' : '#111827',
                  padding:      '7px 11px',
                  borderRadius: m.role === 'user' ? '12px 12px 0 12px' : '12px 12px 12px 0',
                  lineHeight:   1.5,
                  whiteSpace:   'pre-wrap',
                  wordBreak:    'break-word',
                }}
              >
                {m.content}
              </div>
            ))}

            {loading && (
              <div style={{ alignSelf: 'flex-start', background: '#F3F4F6', borderRadius: '12px 12px 12px 0', padding: '7px 14px', color: '#6B7280', letterSpacing: 2 }}>
                •••
              </div>
            )}

            {/* Email capture prompt */}
            {captureMode && !emailCaptured && (
              <div style={{ alignSelf: 'flex-start', background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 8, padding: '10px 12px', maxWidth: '90%' }}>
                <p style={{ margin: '0 0 8px', fontSize: '0.85rem', color: '#1E3A8A', fontWeight: 600 }}>
                  Want me to send you a custom savings estimate?
                </p>
                <form onSubmit={submitEmail} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <input
                    type="email"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    placeholder="your@email.com"
                    style={{ border: '2px solid #93C5FD', borderRadius: 6, padding: '6px 10px', fontSize: '0.85rem', outline: 'none' }}
                  />
                  {emailError && <p style={{ margin: 0, fontSize: '0.75rem', color: '#DC2626' }}>{emailError}</p>}
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button
                      type="submit"
                      style={{ flex: 1, background: '#1E40AF', color: '#fff', border: 'none', borderRadius: 6, padding: '6px 0', fontWeight: 700, cursor: 'pointer', fontSize: '0.8rem' }}
                    >
                      Send it
                    </button>
                    <button
                      type="button"
                      onClick={() => setCaptureMode(false)}
                      style={{ background: 'transparent', color: '#6B7280', border: '1px solid #D1D5DB', borderRadius: 6, padding: '6px 10px', cursor: 'pointer', fontSize: '0.8rem' }}
                    >
                      Skip
                    </button>
                  </div>
                </form>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <form
            onSubmit={send}
            style={{ borderTop: '2px solid #E5E7EB', padding: '8px 10px', display: 'flex', gap: 7, flexShrink: 0 }}
          >
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about shipping costs…"
              disabled={loading}
              style={{
                flex: 1,
                border: '2px solid #D1D5DB',
                borderRadius: 6,
                padding: '7px 10px',
                fontSize: '0.85rem',
                outline: 'none',
                background: loading ? '#F9FAFB' : '#fff',
              }}
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              style={{
                background: '#1E40AF',
                color: '#fff',
                border: 'none',
                borderRadius: 6,
                padding: '7px 12px',
                fontWeight: 700,
                cursor: loading || !input.trim() ? 'not-allowed' : 'pointer',
                opacity: loading || !input.trim() ? 0.6 : 1,
                fontSize: '0.85rem',
                flexShrink: 0,
              }}
            >
              Send
            </button>
          </form>
        </div>
      )}
    </>
  );
}
