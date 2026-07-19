import type { Metadata } from 'next';
import Link from 'next/link';
import HeroTracker from '@/components/HeroTracker';
import FinalCTA from '@/components/FinalCTA';

export const metadata: Metadata = {
  title:       'ShippingCow — Heavy Goods Fulfillment with DIM 225 Pricing',
  description: 'The only 3PL built for the 50 lb+ seller. DIM divisor 225 means up to 39% lower shipping costs. Enterprise FedEx rates. 2-day delivery to 92% of the US. Zero shrinkage guaranteed.',
  openGraph: {
    title:       'ShippingCow — Heavy Goods Fulfillment with DIM 225 Pricing',
    description: 'DIM 225 pricing. Enterprise carrier rates. Zero shrinkage. 2-day delivery.',
    type:        'website',
    url:         'https://shippingcow.com',
  },
};

const JSON_LD = {
  '@context':   'https://schema.org',
  '@type':      'Organization',
  name:         'ShippingCow',
  url:          'https://shippingcow.com',
  description:  'AI-native heavy-goods fulfillment platform with DIM 225 pricing, enterprise carrier rates, and guaranteed 2-day delivery to 92% of the continental US.',
  foundingDate: '2026',
  areaServed:   'US',
  serviceType:  '3PL Fulfillment, Freight, Returns',
};

export default function HomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }}
      />

      {/* ============ HERO ============ */}
      <section className="hero" id="home">
        <div className="container">
          <div className="hero__grid">
            <div>
              <span className="hero__eyebrow">★ HEAVY GOODS 3PL · BACKED BY LOGISTAR ($15M ARR)</span>
              <h1>
                Shipping 50–149 lb Parcels? You&apos;re Getting <span className="mark">Milked</span> on Every Label.
              </h1>
              <p className="hero__sub">
                DIM 225, oversize fees, and zone 7–8 rates are eating your margin. We fix all three: better DIM divisor, pooled enterprise FedEx rates, and zone-skipping injection so your parcels enter the network at Zone ≤ 4.
              </p>
              <div className="hero__ctas">
                <Link href="/calculator" className="btn btn--blue">See My Savings →</Link>
                <Link href="/audit" className="btn">Free Invoice Audit</Link>
              </div>
              <div className="hero__trust">
                <span><span className="check">✓</span> Enterprise FedEx Rates</span>
                <span><span className="check">✓</span> 2-Day Delivery Guarantee</span>
                <span><span className="check">✓</span> Zero Shrinkage Promise</span>
              </div>
              <p className="hero__note">
                Already a customer? <Link href="/login">Log in</Link> · <Link href="/track">Track a package</Link>
              </p>
            </div>

            <div className="hero__art">
              <div className="hero__art-frame">
                <span className="cow-logo cow-logo--hero wiggle" role="img" aria-label="Shipping Cow mascot" />
                <div className="hero__badge hero__badge--top">NO BULL<br />PRICING</div>
                <div className="hero__badge hero__badge--bottom">★ $1.5K+/MO<br />SAVINGS</div>
              </div>
            </div>
          </div>

          <HeroTracker />
        </div>
      </section>

      {/* ============ PAIN POINTS + STATS ============ */}
      <section className="pain">
        <div className="pain__inner">
          <div className="container">
            <div className="pain__head">
              <h2>The Three Things <span>Killing</span> Your Heavy-Goods Margins</h2>
              <p>You&apos;re losing thousands a year to DIM weight guessing, retail carrier rates, and zone 7–8 surcharges. We fixed all three.</p>
            </div>
            <div className="pain__grid">
              <div className="pain__card">
                <div className="pain__card-icon">$</div>
                <h3>DIM Weight Death Spiral</h3>
                <p>DIM 225 means you pay for air. Our packaging optimizer and better DIM divisor kill the overcharge before it starts — $0.85–$2.40 saved per shipment on DIM alone.</p>
              </div>
              <div className="pain__card">
                <div className="pain__card-icon">⚖</div>
                <h3>No Carrier Leverage?</h3>
                <p>We pool volume across our entire merchant herd. You get enterprise FedEx rates without enterprise volume — plus discounted fuel surcharge you can&apos;t get retail.</p>
              </div>
              <div className="pain__card">
                <div className="pain__card-icon">📍</div>
                <h3>Stuck in Zone 7–8?</h3>
                <p>Zone-skipping injection puts your parcels into the last-mile network at Zone ≤ 4 — cutting 2–4 transit days and up to 52% off per-parcel cost.</p>
              </div>
            </div>
            <div className="stats__grid" style={{ marginTop: '3rem' }}>
              <div><div className="stats__num">$1,500+</div><div className="stats__label">Avg. Monthly Savings</div></div>
              <div><div className="stats__num">50–149</div><div className="stats__label">lb Sweet Spot</div></div>
              <div><div className="stats__num">99.2%</div><div className="stats__label">2-Day SLA Attained</div></div>
              <div><div className="stats__num">0%</div><div className="stats__label">Shrinkage. Or We Pay.</div></div>
            </div>
          </div>
        </div>
      </section>

      {/* ============ TWO WAYS TO START ============ */}
      <section className="section section--alt" id="start">
        <div className="container">
          <div className="section__head">
            <h2>Two Ways to <span>See the Money</span></h2>
            <p>No sales call. No commitment. Pick one and get a number in minutes.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginTop: '2.5rem' }}>
            <div style={{ background: 'var(--white)', border: '4px solid var(--dark)', padding: '2rem', boxShadow: 'var(--shadow-pixel)' }}>
              <div style={{ fontFamily: 'var(--font-pixel)', fontSize: '0.9rem', color: 'var(--blue)', marginBottom: '0.6rem' }}>01</div>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', textTransform: 'uppercase', marginBottom: '0.6rem' }}>Savings Calculator</h3>
              <p style={{ fontSize: '0.98rem', color: '#3a4454', marginBottom: '1.2rem' }}>Enter weight, dimensions, and destination ZIP. See your rate vs. what you&apos;re paying now — line by line, fuel and DIM included.</p>
              <Link href="/calculator" className="btn btn--blue">Run the Numbers →</Link>
            </div>
            <div style={{ background: 'var(--white)', border: '4px solid var(--dark)', padding: '2rem', boxShadow: 'var(--shadow-pixel)' }}>
              <div style={{ fontFamily: 'var(--font-pixel)', fontSize: '0.9rem', color: 'var(--blue)', marginBottom: '0.6rem' }}>02</div>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', textTransform: 'uppercase', marginBottom: '0.6rem' }}>Free Invoice Audit</h3>
              <p style={{ fontSize: '0.98rem', color: '#3a4454', marginBottom: '1.2rem' }}>Upload a recent carrier invoice. We find every overpaid DIM charge, surcharge, and zone penalty — and send you a savings report within 24 hours.</p>
              <Link href="/audit" className="btn">Get My Audit →</Link>
            </div>
          </div>
        </div>
      </section>

      {/* ============ FINAL CTA ============ */}
      <FinalCTA
        headline="Ready to stop overpaying on heavy freight?"
        subtext="Tell us your products, current carrier, and monthly volume. We'll build a custom savings model — no commitment, 24-hour turnaround."
        primaryLabel="Get my free savings estimate →"
        primaryHref="/audit"
        secondaryLabel="Try the calculator"
        secondaryHref="/calculator"
      />
    </>
  );
}
