import Link from 'next/link';

const PLATFORMS = [
  { name: 'Shopify', icon: '🛍️', pain: 'Calculated rates eating your margin' },
  { name: 'Amazon', icon: '📦', pain: 'FBA fees and MCF surcharges' },
  { name: 'WooCommerce', icon: '🔌', pain: 'Manual carrier shopping every order' },
  { name: 'BigCommerce', icon: '🏪', pain: 'Zone 6–8 rates killing conversions' },
];

export default function SellerCallout() {
  return (
    <section
      style={{
        padding: '5rem 1.5rem',
        background: '#F9FAFB',
        borderTop: '2px solid #E5E7EB',
      }}
    >
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '4rem',
            alignItems: 'center',
          }}
        >
          {/* Left: copy */}
          <div>
            <div
              style={{
                display: 'inline-block',
                background: '#FEF3C7',
                color: '#92400E',
                fontSize: '0.75rem',
                fontWeight: 700,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                padding: '4px 12px',
                borderRadius: 99,
                border: '1.5px solid #FCD34D',
                marginBottom: '1rem',
              }}
            >
              Built for e-commerce sellers
            </div>

            <h2
              style={{
                fontSize: 'clamp(1.75rem, 4vw, 2.75rem)',
                fontWeight: 800,
                color: '#111827',
                lineHeight: 1.2,
                marginBottom: '1.25rem',
              }}
            >
              Still letting carriers set
              <br />
              <span style={{ color: '#1E40AF' }}>your shipping price?</span>
            </h2>

            <p
              style={{
                fontSize: '1.0625rem',
                color: '#4B5563',
                lineHeight: 1.7,
                marginBottom: '2rem',
                maxWidth: 480,
              }}
            >
              Every carrier charges you more than they charge your biggest competitors.
              ShippingCow levels the playing field — routing each order through the cheapest
              qualified carrier, automatically, for every single label you print.
            </p>

            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <Link href="/inquiry" className="btn btn--blue">
                Get my free savings estimate →
              </Link>
              <Link href="/track" className="btn btn--ghost">
                See a demo
              </Link>
            </div>
          </div>

          {/* Right: platform grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '1rem',
            }}
          >
            {PLATFORMS.map((p) => (
              <div
                key={p.name}
                style={{
                  border: '2px solid #E5E7EB',
                  borderRadius: 10,
                  padding: '1.25rem',
                  background: '#fff',
                  boxShadow: '3px 3px 0 #E5E7EB',
                  transition: 'box-shadow 0.15s, border-color 0.15s',
                }}
              >
                <div style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>{p.icon}</div>
                <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#111827', marginBottom: '0.3rem' }}>
                  {p.name}
                </div>
                <div style={{ fontSize: '0.8rem', color: '#6B7280', lineHeight: 1.4 }}>
                  {p.pain}
                </div>
              </div>
            ))}

            <div
              style={{
                gridColumn: '1 / -1',
                background: '#EFF6FF',
                border: '2px solid #1E40AF',
                borderRadius: 10,
                padding: '1rem 1.25rem',
                fontSize: '0.875rem',
                color: '#1E40AF',
                fontWeight: 600,
                textAlign: 'center',
              }}
            >
              🐄 ShippingCow works with all of these — and your 3PL
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
