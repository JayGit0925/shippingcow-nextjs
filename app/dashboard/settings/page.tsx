import { getCurrentUser } from '@/lib/auth';

export default async function SettingsPage() {
  const user = await getCurrentUser();

  return (
    <div>
      <h1 style={{ fontFamily: 'var(--font-display)', textTransform: 'uppercase', fontSize: '1.8rem', marginBottom: '2rem' }}>
        Settings
      </h1>

      <div style={{ maxWidth: 560 }}>
        <div style={{ background: 'var(--white)', border: '4px solid var(--dark)', padding: '2rem', boxShadow: 'var(--shadow-pixel)', marginBottom: '1.5rem' }}>
          <h3 style={{ fontFamily: 'var(--font-display)', textTransform: 'uppercase', marginBottom: '1.2rem', fontSize: '1rem' }}>
            Account Info
          </h3>
          {[
            { label: 'Name',    value: user?.name    ?? '—' },
            { label: 'Email',   value: user?.email   ?? '—' },
            { label: 'Company', value: user?.company ?? '—' },
          ].map(({ label, value }) => (
            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.75rem', marginBottom: '0.75rem', borderBottom: '1px solid #e5e7eb', fontSize: '0.92rem' }}>
              <span style={{ color: '#6b7280', fontWeight: 600 }}>{label}</span>
              <span style={{ color: 'var(--dark)', fontWeight: 700 }}>{value}</span>
            </div>
          ))}
          <p style={{ fontSize: '0.8rem', color: '#9ca3af', marginTop: '0.5rem' }}>
            To update your name or company, contact <a href="mailto:support@shippingcow.io" style={{ color: 'var(--blue)' }}>support@shippingcow.io</a>
          </p>
        </div>

        <div style={{ background: 'var(--white)', border: '4px solid var(--dark)', padding: '2rem', boxShadow: 'var(--shadow-pixel)' }}>
          <h3 style={{ fontFamily: 'var(--font-display)', textTransform: 'uppercase', marginBottom: '1.2rem', fontSize: '1rem' }}>
            Plan
          </h3>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <div style={{ fontFamily: 'var(--font-pixel)', fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--blue)' }}>
                Free Scout
              </div>
              <div style={{ fontSize: '0.88rem', color: '#6b7280', marginTop: '0.3rem' }}>
                Calculator access · Rate estimates · Coverage lookup
              </div>
            </div>
            <a href="/#pricing" className="btn btn--sm btn--blue" style={{ textDecoration: 'none' }}>
              Upgrade →
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
