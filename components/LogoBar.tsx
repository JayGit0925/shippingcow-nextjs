// TODO: replace placeholder text logos with real partner/customer logo images

const LOGOS = [
  { id: 1, label: 'FitGear Pro',       abbr: 'FG' },
  { id: 2, label: 'ModernSpace Co',    abbr: 'MS' },
  { id: 3, label: 'TrailMaster Gear',  abbr: 'TM' },
  { id: 4, label: 'IronWorks Supply',  abbr: 'IW' },
  { id: 5, label: 'HomeBase Direct',   abbr: 'HB' },
];

export default function LogoBar() {
  return (
    <section style={{
      background: '#f8fafc',
      borderTop: '3px solid var(--dark)',
      borderBottom: '3px solid var(--dark)',
      padding: '2rem 0',
    }}>
      <div className="container">
        <div style={{
          textAlign: 'center',
          fontFamily: 'var(--font-pixel)',
          fontSize: '0.58rem',
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          color: '#6b7280',
          marginBottom: '1.4rem',
        }}>
          Trusted by heavy-goods sellers nationwide
        </div>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '2rem',
          flexWrap: 'wrap',
        }}>
          {LOGOS.map((logo) => (
            <div
              key={logo.id}
              aria-label={logo.label}
              title={logo.label}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px 20px',
                border: '2px solid #e5e7eb',
                borderRadius: 4,
                background: '#fff',
                opacity: 0.7,
                transition: 'opacity 0.2s',
                cursor: 'default',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.7')}
            >
              <span style={{
                background: '#1A202C',
                color: '#FFE600',
                fontWeight: 900,
                fontSize: '0.65rem',
                padding: '3px 6px',
                borderRadius: 3,
                fontFamily: 'var(--font-pixel)',
                letterSpacing: '0.05em',
              }}>
                {logo.abbr}
              </span>
              <span style={{
                fontWeight: 700,
                fontSize: '0.85rem',
                color: '#374151',
                letterSpacing: '-0.01em',
              }}>
                {logo.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
