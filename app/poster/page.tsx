import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Big & Bulky Poster — 51–150 lb Parcel | Shipping Cow',
};

export default function PosterPage() {
  return (
    <div style={{
      minHeight: '100vh',
      background: '#f0f0f0',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
      fontFamily: 'sans-serif',
    }}>
      {/* Poster */}
      <div style={{
        width: 680,
        background: '#fff',
        border: '6px solid #1A202C',
        boxShadow: '10px 10px 0 #1A202C',
        overflow: 'hidden',
        position: 'relative',
      }}>

        {/* Top stripe */}
        <div style={{
          background: '#FEB81B',
          borderBottom: '5px solid #1A202C',
          padding: '0.6rem 2rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.15em', fontWeight: 700 }}>
            ★ FedEx Heavy Program
          </span>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.15em', fontWeight: 700 }}>
            3 US Warehouses ★
          </span>
        </div>

        {/* Hero block */}
        <div style={{
          background: '#0052C9',
          padding: '2.5rem 2.5rem 0',
          position: 'relative',
          overflow: 'hidden',
        }}>
          {/* Dot grid texture */}
          <div style={{
            position: 'absolute', inset: 0, pointerEvents: 'none',
            backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.12) 1px, transparent 1px)',
            backgroundSize: '18px 18px',
          }} />

          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{
              display: 'inline-block',
              background: '#FEB81B',
              border: '3px solid #1A202C',
              boxShadow: '3px 3px 0 #1A202C',
              fontFamily: 'var(--font-display)',
              fontSize: '0.7rem',
              textTransform: 'uppercase',
              letterSpacing: '0.12em',
              padding: '0.3rem 0.9rem',
              marginBottom: '1.2rem',
              color: '#1A202C',
              fontWeight: 700,
            }}>
              Big &amp; Bulky Parcel Specialist
            </div>

            <h1 style={{
              fontFamily: 'var(--font-display)',
              fontSize: '3.6rem',
              lineHeight: 0.95,
              textTransform: 'uppercase',
              color: '#fff',
              marginBottom: '1rem',
              letterSpacing: '-0.01em',
            }}>
              SHIP BIG.<br />
              <span style={{ color: '#FEB81B' }}>PAY LESS.</span><br />
              MOO.
            </h1>

            <p style={{
              color: '#B0C8F0',
              fontSize: '1.05rem',
              lineHeight: 1.55,
              maxWidth: 420,
              marginBottom: '1.8rem',
            }}>
              Shipping Cow hauls the heavy stuff your current 3PL refuses.
              FedEx Heavy rates on every parcel from&nbsp;
              <strong style={{ color: '#fff' }}>51 to 150 lbs</strong> — no oversize
              surcharges, no excuses.
            </p>

            {/* Cow emoji / mascot area */}
            <div style={{
              position: 'absolute',
              right: '2rem',
              bottom: 0,
              fontSize: '9rem',
              lineHeight: 1,
              userSelect: 'none',
              filter: 'drop-shadow(4px 4px 0px rgba(0,0,0,0.35))',
            }}>
              🐄
            </div>
          </div>

          {/* Weight banner */}
          <div style={{
            background: '#1A202C',
            margin: '0 -2.5rem',
            padding: '1rem 2.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '1.5rem',
            marginTop: '1.5rem',
          }}>
            <span style={{
              fontFamily: 'var(--font-display)',
              fontSize: '2.8rem',
              color: '#FEB81B',
              letterSpacing: '-0.02em',
              lineHeight: 1,
            }}>51–150</span>
            <div>
              <div style={{ fontFamily: 'var(--font-display)', color: '#fff', fontSize: '1rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Pounds</div>
              <div style={{ fontFamily: 'var(--font-display)', color: '#7a8fa8', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Big &amp; Bulky Sweet Spot</div>
            </div>
            <div style={{ width: 3, height: 48, background: '#333' }} />
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: 'var(--font-display)', color: '#FEB81B', fontSize: '1.9rem', lineHeight: 1 }}>FROM</div>
              <div style={{ fontFamily: 'var(--font-display)', color: '#fff', fontSize: '2.4rem', lineHeight: 1 }}>$35.10</div>
              <div style={{ fontFamily: 'var(--font-display)', color: '#7a8fa8', fontSize: '0.7rem', textTransform: 'uppercase' }}>FedEx Heavy</div>
            </div>
          </div>
        </div>

        {/* Stats row */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          borderBottom: '4px solid #1A202C',
        }}>
          {[
            { num: '30%', label: 'DIM Savings', sub: 'avg per SKU' },
            { num: '3', label: 'Warehouses', sub: 'NJ · TX · CA' },
            { num: '24hr', label: 'Quote Back', sub: 'free cost audit' },
          ].map((s, i) => (
            <div key={s.label} style={{
              padding: '1.4rem 1rem',
              textAlign: 'center',
              borderRight: i < 2 ? '3px solid #1A202C' : 'none',
              background: i === 1 ? '#F4F7FF' : '#fff',
            }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '2.2rem', color: '#0052C9', lineHeight: 1 }}>{s.num}</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: '0.3rem' }}>{s.label}</div>
              <div style={{ fontSize: '0.7rem', color: '#9ca3af', marginTop: '0.15rem' }}>{s.sub}</div>
            </div>
          ))}
        </div>

        {/* Product types */}
        <div style={{ padding: '1.6rem 2.5rem', background: '#F4F7FF', borderBottom: '4px solid #1A202C' }}>
          <p style={{
            fontFamily: 'var(--font-display)',
            fontSize: '0.7rem',
            textTransform: 'uppercase',
            letterSpacing: '0.12em',
            color: '#6b7280',
            marginBottom: '1rem',
            textAlign: 'center',
          }}>We Ship It All</p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', flexWrap: 'wrap' }}>
            {[
              { icon: '🛋️', label: 'Furniture' },
              { icon: '🏋️', label: 'Gym Gear' },
              { icon: '🏠', label: 'Appliances' },
              { icon: '🚗', label: 'Auto Parts' },
              { icon: '🌿', label: 'Outdoor' },
              { icon: '📦', label: 'Industrial' },
            ].map(p => (
              <div key={p.label} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.8rem' }}>{p.icon}</div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#374151', marginTop: '0.3rem' }}>{p.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Rate table */}
        <div style={{ padding: '1.8rem 2.5rem', borderBottom: '4px solid #1A202C' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#6b7280', marginBottom: '0.8rem' }}>
            FedEx Heavy Rate Guide — NJ Hub
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
            <thead>
              <tr style={{ background: '#0052C9' }}>
                <th style={{ padding: '0.55rem 0.8rem', textAlign: 'left', color: '#fff', fontFamily: 'var(--font-display)', fontSize: '0.68rem', textTransform: 'uppercase' }}>Weight</th>
                <th style={{ padding: '0.55rem 0.8rem', textAlign: 'right', color: '#fff', fontFamily: 'var(--font-display)', fontSize: '0.68rem', textTransform: 'uppercase' }}>Rate From</th>
                <th style={{ padding: '0.55rem 0.8rem', textAlign: 'right', color: '#fff', fontFamily: 'var(--font-display)', fontSize: '0.68rem', textTransform: 'uppercase' }}>Rate To</th>
              </tr>
            </thead>
            <tbody>
              {[
                { range: '51–59 lbs', from: '$35.10', to: '$38.70' },
                { range: '60–79 lbs', from: '$39.10', to: '$46.70' },
                { range: '80–99 lbs', from: '$47.10', to: '$57.10' },
                { range: '100–125 lbs', from: '$57.70', to: '$74.20' },
                { range: '126–150 lbs', from: '$74.60', to: '$74.60' },
              ].map((r, i) => (
                <tr key={r.range} style={{ background: i % 2 === 0 ? '#fff' : '#F9FAFB', borderBottom: '1px solid #e5e7eb' }}>
                  <td style={{ padding: '0.55rem 0.8rem', fontWeight: 600 }}>{r.range}</td>
                  <td style={{ padding: '0.55rem 0.8rem', textAlign: 'right', color: '#0052C9', fontWeight: 700 }}>{r.from}</td>
                  <td style={{ padding: '0.55rem 0.8rem', textAlign: 'right', color: '#6b7280' }}>{r.to}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p style={{ fontSize: '0.68rem', color: '#9ca3af', marginTop: '0.5rem' }}>
            + Handling fee $3.60–$5.50 · Zone 2 base · DIM audit included free
          </p>
        </div>

        {/* Why us bullets */}
        <div style={{ padding: '1.8rem 2.5rem', background: '#fff', borderBottom: '4px solid #1A202C' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.7rem' }}>
            {[
              'No oversize surcharges',
              'Free DIM weight audit',
              'White-glove handling',
              'Daily FedEx pickup',
              'Split inventory, 3 coasts',
              'Real-time tracking dashboard',
            ].map(pt => (
              <div key={pt} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
                <span style={{
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  width: 20, height: 20,
                  background: '#0052C9', color: '#fff',
                  fontWeight: 700, fontSize: '0.7rem',
                  flexShrink: 0,
                }}>✓</span>
                <span style={{ fontFamily: 'var(--font-display)', textTransform: 'uppercase', fontSize: '0.72rem', letterSpacing: '0.04em' }}>{pt}</span>
              </div>
            ))}
          </div>
        </div>

        {/* CTA footer */}
        <div style={{
          background: '#1A202C',
          padding: '2rem 2.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1.5rem',
          flexWrap: 'wrap',
        }}>
          <div>
            <div style={{
              fontFamily: 'var(--font-display)',
              fontSize: '1.5rem',
              color: '#fff',
              textTransform: 'uppercase',
              lineHeight: 1.1,
            }}>
              Get Your Free<br />
              <span style={{ color: '#FEB81B' }}>Cost Audit</span>
            </div>
            <div style={{ fontSize: '0.8rem', color: '#7a8fa8', marginTop: '0.4rem' }}>
              24-hr turnaround · no commitment
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div style={{
              display: 'inline-block',
              background: '#FEB81B',
              border: '3px solid #FEB81B',
              boxShadow: '4px 4px 0 rgba(254,184,27,0.3)',
              fontFamily: 'var(--font-display)',
              fontSize: '0.95rem',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              padding: '0.75rem 1.8rem',
              color: '#1A202C',
              fontWeight: 700,
              marginBottom: '0.6rem',
              display: 'block',
            }}>
              shippingcow.com/inquiry
            </div>
            <div style={{
              fontFamily: 'var(--font-display)',
              fontSize: '1.4rem',
              color: '#0052C9',
              letterSpacing: '0.04em',
            }}>
              🐄 SHIPPING COW
            </div>
          </div>
        </div>

        {/* Bottom stripe */}
        <div style={{
          background: '#FEB81B',
          borderTop: '4px solid #1A202C',
          padding: '0.4rem 2rem',
          display: 'flex',
          justifyContent: 'center',
          gap: '2rem',
        }}>
          {['NJ 08901', 'TX 77489', 'CA 91761'].map(wh => (
            <span key={wh} style={{
              fontFamily: 'var(--font-display)',
              fontSize: '0.65rem',
              textTransform: 'uppercase',
              letterSpacing: '0.12em',
              fontWeight: 700,
              color: '#1A202C',
            }}>
              ■ {wh}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
