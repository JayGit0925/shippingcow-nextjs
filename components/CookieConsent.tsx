'use client';

import { useState, useEffect } from 'react';

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      const dismissed = localStorage.getItem('sc_cookie_consent');
      if (!dismissed) setVisible(true);
    } catch {}
  }, []);

  function acceptAll() {
    try { localStorage.setItem('sc_cookie_consent', '1'); } catch {}
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        background: 'var(--dark, #1A202C)',
        color: '#fff',
        padding: '0.75rem 1rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '1rem',
        flexWrap: 'wrap',
        fontSize: '0.8rem',
        borderTop: '3px solid var(--yellow, #FEB81B)',
      }}
    >
      <span style={{ maxWidth: 480, lineHeight: 1.5 }}>
        This site uses analytics cookies to understand traffic. No third-party ads. No personal data sold.{' '}
        <span style={{ opacity: 0.6 }}>We just want to see if our cows are finding their way home. 🐮</span>
      </span>
      <button
        onClick={acceptAll}
        style={{
          background: 'var(--yellow, #FEB81B)',
          color: 'var(--dark, #1A202C)',
          border: 'none',
          borderRadius: 6,
          padding: '0.5rem 1.2rem',
          fontWeight: 700,
          cursor: 'pointer',
          fontSize: '0.8rem',
        }}
      >
        Got it
      </button>
    </div>
  );
}
