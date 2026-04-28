import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'ShippingCow — Heavy Goods Fulfillment with DIM 225 Pricing';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          background: '#0A0F1A',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          justifyContent: 'center',
          padding: '80px',
          fontFamily: 'Inter, system-ui, sans-serif',
        }}
      >
        {/* Brand tag */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 40 }}>
          <div style={{
            background: '#0052C9',
            color: '#FFE600',
            fontWeight: 900,
            fontSize: 22,
            padding: '8px 18px',
            borderRadius: 6,
          }}>
            SC
          </div>
          <span style={{ color: '#6b7280', fontSize: 22, fontWeight: 400 }}>ShippingCow</span>
        </div>

        {/* Headline */}
        <div style={{
          color: '#ffffff',
          fontSize: 64,
          fontWeight: 900,
          lineHeight: 1.1,
          maxWidth: 900,
          marginBottom: 32,
        }}>
          Stop Paying for Weight{' '}
          <span style={{ color: '#FFE600' }}>That Doesn&apos;t Exist</span>
        </div>

        {/* Sub */}
        <div style={{ color: '#9ca3af', fontSize: 28, marginBottom: 56, maxWidth: 800 }}>
          DIM divisor 225. Three warehouses. 2-day delivery to 92% of the US.
        </div>

        {/* Stats row */}
        <div style={{ display: 'flex', gap: 48 }}>
          {[
            { num: '÷225', label: 'DIM Divisor' },
            { num: '39%', label: 'Lower Billing' },
            { num: '80%', label: 'Off FedEx Rates' },
            { num: '$0', label: 'Shrinkage' },
          ].map((s) => (
            <div key={s.num} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={{ color: '#FFE600', fontSize: 36, fontWeight: 900 }}>{s.num}</span>
              <span style={{ color: '#6b7280', fontSize: 18 }}>{s.label}</span>
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size }
  );
}
