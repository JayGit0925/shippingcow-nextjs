export default function CopilotPage() {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', textTransform: 'uppercase', fontSize: '1.8rem', margin: 0 }}>
          AI Copilot
        </h1>
        <span style={{ fontFamily: 'var(--font-pixel)', fontSize: '0.6rem', background: 'var(--dark)', color: '#fff', padding: '0.25rem 0.6rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Free Scout
        </span>
      </div>

      {/* Chat area */}
      <div style={{ background: 'var(--white)', border: '4px solid var(--dark)', boxShadow: 'var(--shadow-pixel)', marginBottom: '1rem', minHeight: 400, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '3rem', textAlign: 'center' }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✦</div>
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', textTransform: 'uppercase', marginBottom: '0.75rem' }}>
          Your AI Copilot
        </h3>
        <p style={{ maxWidth: 420, color: '#3a4454', fontSize: '0.95rem', marginBottom: '1.5rem' }}>
          The AI Copilot helps you manage shipping, generate documents, compare carrier rates, and automate your back office.
          Upgrade to <strong>Optimizer</strong> or <strong>Herd Leader</strong> to activate.
        </p>
        <a href="/#pricing" className="btn btn--blue" style={{ textDecoration: 'none' }}>
          Upgrade My Plan →
        </a>
      </div>

      {/* Input (disabled) */}
      <div style={{ display: 'flex', gap: '0.75rem' }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <input
            disabled
            placeholder="Available on Optimizer plan and above"
            title="Upgrade to Optimizer to unlock AI Copilot"
            style={{
              width: '100%',
              border: '3px solid #d1d5db',
              padding: '0.7rem 1rem',
              background: '#f3f4f6',
              color: '#9ca3af',
              cursor: 'not-allowed',
              fontFamily: 'var(--font-body)',
              fontSize: '0.95rem',
            }}
          />
        </div>
        <button
          disabled
          title="Upgrade to activate"
          style={{ background: '#d1d5db', color: '#9ca3af', border: '3px solid #d1d5db', padding: '0.7rem 1.2rem', cursor: 'not-allowed', fontFamily: 'var(--font-display)', fontSize: '0.85rem' }}
        >
          Send
        </button>
      </div>

      {/* Token usage */}
      <div style={{ marginTop: '0.75rem', fontFamily: 'var(--font-pixel)', fontSize: '0.58rem', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        0 / 0 tokens used this month · upgrade to unlock
      </div>
    </div>
  );
}
