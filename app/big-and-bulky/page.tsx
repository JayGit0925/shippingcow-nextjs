import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Big & Bulky Shipping — 50–149 lb Products | Shipping Cow',
  description:
    'Finally — a 3PL built for heavy products. FedEx Heavy rates from $35.10, white-glove handling, 3-warehouse US coverage. Furniture, gym equipment, appliances, auto parts.',
};

const PRODUCTS = [
  { icon: '🛋️', label: 'Furniture' },
  { icon: '🏋️', label: 'Gym Equipment' },
  { icon: '🏠', label: 'Appliances' },
  { icon: '🚗', label: 'Auto Parts' },
  { icon: '🌿', label: 'Outdoor & Garden' },
  { icon: '📦', label: 'Industrial Supplies' },
];

const PAIN_POINTS = [
  {
    icon: '🚫',
    title: 'Standard 3PLs Reject You',
    body: 'Most fulfillment centers cap at 40 lbs and charge oversize surcharges after that. We built our entire warehouse operation around 50–149 lb freight — it\'s our specialty, not an exception.',
  },
  {
    icon: '💸',
    title: 'LTL Rates Are Killing Margins',
    body: 'Carriers slot your 80 lb shipment into LTL pricing and charge $180+ per piece. Our FedEx Heavy program ships the same box for $47–$55. That\'s $125+ back per order.',
  },
  {
    icon: '📐',
    title: 'DIM Weight Blindsides You',
    body: 'A 55 lb sofa cushion in a 24×18×12 box bills at 79 lbs DIM. We audit every SKU for the optimal box spec and repack where needed — most clients cut DIM overcharges by 30%.',
  },
];

const HOW_IT_WORKS = [
  {
    step: '01',
    title: 'Send Us Your SKUs',
    body: 'Share your product list, dimensions, and current fulfillment costs. We\'ll build a savings model in 24 hours.',
  },
  {
    step: '02',
    title: 'We Optimize the Box',
    body: 'Our team recommends the right carton spec for each SKU to minimize dimensional weight before a single label prints.',
  },
  {
    step: '03',
    title: 'Smart Routing, 3 Warehouses',
    body: 'Inventory splits across NJ, TX, and CA so every shipment ships from the closest warehouse — lower zone, faster delivery.',
  },
  {
    step: '04',
    title: 'You Ship. We Handle Everything',
    body: 'Labels, tracking, exceptions, carrier claims — all managed. You focus on selling.',
  },
];

const RATE_ROWS = [
  { range: '50–59 lbs', from: 35.10, to: 38.70 },
  { range: '60–79 lbs', from: 39.10, to: 46.70 },
  { range: '80–99 lbs', from: 47.10, to: 57.10 },
  { range: '100–125 lbs', from: 57.70, to: 74.20 },
  { range: '126–149 lbs', from: 74.60, to: 74.60 },
];

const WAREHOUSES = [
  { key: 'NJ', city: 'New Brunswick', state: 'NJ', zip: '08901', covers: 'East Coast + Midwest', emoji: '🗽' },
  { key: 'TX', city: 'Missouri City', state: 'TX', zip: '77489', covers: 'South + Central US', emoji: '🤠' },
  { key: 'CA', city: 'Ontario', state: 'CA', zip: '91761', covers: 'West Coast + Mountain', emoji: '🌴' },
];

export default function BigAndBulkyPage() {
  return (
    <>
      {/* ===== HERO ===== */}
      <section
        style={{
          background: 'linear-gradient(180deg,#EAF0FC 0%,#fff 100%)',
          padding: '5rem 0 4rem',
          borderBottom: '4px solid #1A202C',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* grid texture */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          backgroundImage: 'linear-gradient(rgba(0,82,201,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(0,82,201,0.04) 1px,transparent 1px)',
          backgroundSize: '20px 20px',
        }} />

        <div className="container" style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '3rem', alignItems: 'center' }}>
            <div>
              <span style={{
                display: 'inline-block', background: '#0052C9', color: '#fff',
                fontFamily: 'var(--font-display)', fontSize: '0.8rem',
                textTransform: 'uppercase', letterSpacing: '0.1em',
                padding: '0.35rem 0.9rem', border: '2px solid #1A202C',
                boxShadow: '2px 2px 0 #1A202C', marginBottom: '1.2rem',
              }}>
                ★ Big &amp; Bulky Specialist · 50–149 lb Products
              </span>

              <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2rem,5vw,3.5rem)', lineHeight: 1.05, marginBottom: '1.2rem', textTransform: 'uppercase' }}>
                Heavy Products Deserve a <span style={{ color: '#0052C9' }}>Heavy-Duty</span>{' '}
                <span style={{ background: '#FEB81B', padding: '0 0.2em', display: 'inline-block' }}>3PL</span>
              </h1>

              <p style={{ fontSize: '1.15rem', color: '#3a4454', maxWidth: 560, lineHeight: 1.6, marginBottom: '2rem' }}>
                Standard fulfillment centers weren't built for 50–149 lb shipments. We were. FedEx Heavy rates, white-glove handling, and 3-warehouse routing that keeps your zones low and your margins high.
              </p>

              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
                <Link href="/inquiry" className="btn btn--blue">Get My Free Savings Quote →</Link>
                <Link href="#rates" className="btn btn--ghost">See Our Rates</Link>
              </div>

              <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', fontSize: '0.9rem', fontFamily: 'var(--font-display)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                {['FedEx Heavy from $35.10', '3 US Warehouses', 'DIM Audit Included', 'No Oversize Surcharges'].map(t => (
                  <span key={t} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <span style={{ color: '#059669', fontWeight: 700 }}>✓</span> {t}
                  </span>
                ))}
              </div>
            </div>

            {/* Stat badge */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', minWidth: 180 }}>
              {[
                { num: '$35.10', label: 'Starting Rate', sub: '50 lb FedEx Heavy' },
                { num: '3', label: 'US Warehouses', sub: 'NJ · TX · CA' },
                { num: '30%', label: 'DIM Savings', sub: 'avg per SKU' },
              ].map(s => (
                <div key={s.label} style={{
                  border: '3px solid #1A202C', padding: '1rem 1.2rem',
                  boxShadow: '4px 4px 0 #1A202C', background: '#fff', textAlign: 'center',
                }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', color: '#0052C9' }}>{s.num}</div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</div>
                  <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>{s.sub}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ===== PRODUCT CATEGORIES ===== */}
      <section style={{ padding: '3rem 0', background: '#1A202C', borderBottom: '4px solid #FEB81B' }}>
        <div className="container">
          <p style={{ fontFamily: 'var(--font-display)', color: '#FEB81B', textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: '0.85rem', textAlign: 'center', marginBottom: '1.5rem' }}>
            Products We Specialize In
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', flexWrap: 'wrap' }}>
            {PRODUCTS.map(p => (
              <div key={p.label} style={{ textAlign: 'center', color: '#fff' }}>
                <div style={{ fontSize: '2rem', marginBottom: '0.4rem' }}>{p.icon}</div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{p.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== PAIN POINTS ===== */}
      <section style={{ padding: '5rem 0', background: '#F4F7FF' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <h2 style={{ fontFamily: 'var(--font-display)', textTransform: 'uppercase', fontSize: 'clamp(1.6rem,4vw,2.6rem)', marginBottom: '0.8rem' }}>
              Why Heavy Sellers <span style={{ color: '#0052C9' }}>Switch</span> to Shipping Cow
            </h2>
            <p style={{ color: '#3a4454', maxWidth: 560, margin: '0 auto', fontSize: '1rem' }}>
              Every 3PL says they handle heavy freight. Most don't want it. We built the entire operation around it.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: '1.5rem' }}>
            {PAIN_POINTS.map(p => (
              <div key={p.title} style={{
                background: '#fff', border: '3px solid #1A202C',
                boxShadow: '4px 4px 0 #1A202C', padding: '2rem',
              }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '0.8rem' }}>{p.icon}</div>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', textTransform: 'uppercase', marginBottom: '0.6rem' }}>{p.title}</h3>
                <p style={{ color: '#3a4454', fontSize: '0.95rem', lineHeight: 1.6 }}>{p.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== RATES ===== */}
      <section id="rates" style={{ padding: '5rem 0', background: '#fff', borderTop: '4px solid #1A202C' }}>
        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4rem', alignItems: 'start' }}>
            <div>
              <h2 style={{ fontFamily: 'var(--font-display)', textTransform: 'uppercase', fontSize: 'clamp(1.6rem,4vw,2.4rem)', marginBottom: '0.8rem' }}>
                Transparent <span style={{ color: '#0052C9' }}>FedEx Heavy</span> Pricing
              </h2>
              <p style={{ color: '#3a4454', marginBottom: '2rem', lineHeight: 1.6 }}>
                No hidden surcharges. No "oversize" mystery fees. These are real FedEx Heavy rates — the same program Fortune 500 companies pay millions for access to.
              </p>

              <div style={{ border: '3px solid #1A202C', boxShadow: '4px 4px 0 #1A202C', overflow: 'hidden' }}>
                <div style={{ background: '#0052C9', color: '#fff', padding: '0.8rem 1.2rem', fontFamily: 'var(--font-display)', textTransform: 'uppercase', fontSize: '0.85rem', letterSpacing: '0.05em' }}>
                  FedEx Heavy Rate Table — NJ Warehouse (08901)
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                  <thead>
                    <tr style={{ background: '#F4F7FF', borderBottom: '2px solid #1A202C' }}>
                      <th style={{ padding: '0.7rem 1rem', textAlign: 'left', fontFamily: 'var(--font-display)', fontSize: '0.75rem', textTransform: 'uppercase' }}>Weight Range</th>
                      <th style={{ padding: '0.7rem 1rem', textAlign: 'right', fontFamily: 'var(--font-display)', fontSize: '0.75rem', textTransform: 'uppercase' }}>From</th>
                      <th style={{ padding: '0.7rem 1rem', textAlign: 'right', fontFamily: 'var(--font-display)', fontSize: '0.75rem', textTransform: 'uppercase' }}>To</th>
                    </tr>
                  </thead>
                  <tbody>
                    {RATE_ROWS.map((r, i) => (
                      <tr key={r.range} style={{ borderBottom: '1px solid #e5e7eb', background: i % 2 === 0 ? '#fff' : '#F9FAFB' }}>
                        <td style={{ padding: '0.7rem 1rem', fontWeight: 600 }}>{r.range}</td>
                        <td style={{ padding: '0.7rem 1rem', textAlign: 'right', color: '#0052C9', fontWeight: 700 }}>${r.from.toFixed(2)}</td>
                        <td style={{ padding: '0.7rem 1rem', textAlign: 'right', color: '#6b7280' }}>${r.to.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div style={{ padding: '0.8rem 1rem', background: '#F4F7FF', fontSize: '0.78rem', color: '#6b7280', borderTop: '1px solid #e5e7eb' }}>
                  + Handling fee $3.60–$5.50 (50–80 lbs) · Rates shown are last-mile delivery, Zone 2 base.
                </div>
              </div>
            </div>

            <div>
              <h3 style={{ fontFamily: 'var(--font-display)', textTransform: 'uppercase', fontSize: '1.3rem', marginBottom: '1.5rem' }}>
                What's Included at Every Weight
              </h3>
              {[
                { icon: '📦', title: 'Receive & Inbound', body: 'Container unloading, carton putaway, SKU verification. Pallet putaway $12 · Carton putaway $2.40.' },
                { icon: '🔍', title: 'DIM Audit', body: 'Every SKU measured and documented. We recommend carton specs to minimize dimensional weight billing.' },
                { icon: '🏷️', title: 'Pick, Pack & Label', body: 'Single-item or multi-item orders. FedEx Heavy labels generated and applied.' },
                { icon: '🚛', title: 'FedEx Heavy Pickup', body: 'Daily carrier pickup from all 3 warehouses. No minimum volume requirement.' },
                { icon: '📊', title: 'Tracking & Reporting', body: 'Real-time tracking in your dashboard. Monthly shipping spend and zone reports.' },
              ].map(item => (
                <div key={item.title} style={{ display: 'flex', gap: '1rem', marginBottom: '1.2rem', padding: '1rem', border: '2px solid #e5e7eb', background: '#F9FAFB' }}>
                  <span style={{ fontSize: '1.5rem', flexShrink: 0 }}>{item.icon}</span>
                  <div>
                    <div style={{ fontFamily: 'var(--font-display)', textTransform: 'uppercase', fontSize: '0.85rem', marginBottom: '0.3rem' }}>{item.title}</div>
                    <div style={{ fontSize: '0.875rem', color: '#3a4454', lineHeight: 1.5 }}>{item.body}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ===== HOW IT WORKS ===== */}
      <section style={{ padding: '5rem 0', background: '#F4F7FF', borderTop: '4px solid #1A202C' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <h2 style={{ fontFamily: 'var(--font-display)', textTransform: 'uppercase', fontSize: 'clamp(1.6rem,4vw,2.4rem)', marginBottom: '0.6rem' }}>
              How It Works
            </h2>
            <p style={{ color: '#3a4454', maxWidth: 480, margin: '0 auto' }}>
              From first SKU to first shipment in as little as 5 business days.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: '1.5rem' }}>
            {HOW_IT_WORKS.map(s => (
              <div key={s.step} style={{
                background: '#fff', border: '3px solid #1A202C',
                boxShadow: '4px 4px 0 #1A202C', padding: '1.8rem',
                position: 'relative',
              }}>
                <div style={{
                  fontFamily: 'var(--font-pixel)', fontSize: '0.6rem',
                  color: '#0052C9', marginBottom: '1rem', letterSpacing: '0.05em',
                }}>{s.step}</div>
                <h3 style={{ fontFamily: 'var(--font-display)', textTransform: 'uppercase', fontSize: '1rem', marginBottom: '0.6rem' }}>{s.title}</h3>
                <p style={{ fontSize: '0.875rem', color: '#3a4454', lineHeight: 1.6 }}>{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== WAREHOUSES ===== */}
      <section style={{ padding: '5rem 0', background: '#fff', borderTop: '4px solid #1A202C' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <h2 style={{ fontFamily: 'var(--font-display)', textTransform: 'uppercase', fontSize: 'clamp(1.6rem,4vw,2.4rem)', marginBottom: '0.6rem' }}>
              3 Warehouses. <span style={{ color: '#0052C9' }}>Lower Zones.</span> Faster Delivery.
            </h2>
            <p style={{ color: '#3a4454', maxWidth: 560, margin: '0 auto' }}>
              We split your inventory across East, Central, and West to keep every shipment at the lowest possible FedEx zone — that means lower cost and 2-day ground delivery to more ZIP codes.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '1.5rem' }}>
            {WAREHOUSES.map(wh => (
              <div key={wh.key} style={{
                border: '3px solid #1A202C', boxShadow: '4px 4px 0 #1A202C',
                padding: '2rem', textAlign: 'center', background: '#F4F7FF',
              }}>
                <div style={{ fontSize: '3rem', marginBottom: '0.6rem' }}>{wh.emoji}</div>
                <div style={{
                  display: 'inline-block', background: '#0052C9', color: '#fff',
                  fontFamily: 'var(--font-display)', fontSize: '0.7rem',
                  textTransform: 'uppercase', letterSpacing: '0.1em',
                  padding: '0.2rem 0.7rem', marginBottom: '0.8rem',
                }}>{wh.key} Warehouse</div>
                <h3 style={{ fontFamily: 'var(--font-display)', textTransform: 'uppercase', fontSize: '1.1rem', marginBottom: '0.3rem' }}>{wh.city}, {wh.state}</h3>
                <p style={{ fontSize: '0.8rem', color: '#6b7280', marginBottom: '0.6rem' }}>ZIP {wh.zip}</p>
                <p style={{ fontSize: '0.9rem', color: '#3a4454', fontWeight: 600 }}>{wh.covers}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== CTA ===== */}
      <section style={{
        padding: '5rem 0', background: '#0052C9',
        borderTop: '4px solid #FEB81B', borderBottom: '4px solid #FEB81B',
        textAlign: 'center',
      }}>
        <div className="container">
          <h2 style={{ fontFamily: 'var(--font-display)', textTransform: 'uppercase', color: '#fff', fontSize: 'clamp(1.8rem,4vw,2.8rem)', marginBottom: '1rem' }}>
            Ready to Stop Overpaying for Heavy Freight?
          </h2>
          <p style={{ color: '#B0C8F0', fontSize: '1.1rem', maxWidth: 520, margin: '0 auto 2rem' }}>
            Tell us your products, current carrier, and monthly volume. We'll build a custom savings model — no commitment, 24-hour turnaround.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/inquiry" className="btn" style={{ background: '#FEB81B', color: '#1A202C' }}>
              Get My Free Cost Audit →
            </Link>
            <Link href="/track" className="btn btn--ghost" style={{ borderColor: '#fff', color: '#fff', background: 'transparent' }}>
              Track a Shipment
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
