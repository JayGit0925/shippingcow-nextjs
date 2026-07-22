import type { Metadata } from 'next';
import Link from 'next/link';
import HeroTracker from '@/components/HeroTracker';
import FinalCTA from '@/components/FinalCTA';
import { SITE_URL } from '@/lib/site';

export const metadata: Metadata = {
  title:       'ShippingCow — The Self-Operated US 3PL for 50–149 lb Parcels',
  description: 'The self-operated US 3PL built for 50–149 lb heavy DTC parcels. Pooled enterprise FedEx rates, zone-skip routing, and a free audit of what your current carrier is actually billing you for.',
  alternates:  { canonical: '/' },
  openGraph: {
    title:       'ShippingCow — The Self-Operated US 3PL for 50–149 lb Parcels',
    description: 'Built for 50–149 lb heavy DTC parcels. Pooled enterprise FedEx rates. Zone-skip routing.',
    type:        'website',
    url:         SITE_URL,
  },
};

// Organization / WebSite JSON-LD lives in a single place: components/JsonLd.tsx
// (rendered from app/layout.tsx). Do not re-declare an Organization block here.

export default function HomePage() {
  return (
    <>
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
                Carriers bill your dimensional weight, not your actual weight — so you pay for air on every bulky box. ShippingCow is a self-operated US 3PL for 50–149 lb parcels: we pool enterprise FedEx rates across our merchant herd and zone-skip your parcels into the network at Zone ≤ 4.
              </p>
              <div className="hero__ctas">
                <Link href="/audit" className="btn btn--blue">Get My Free Cost Audit →</Link>
                <Link href="/calculator" className="btn">See What You&apos;re Billed For</Link>
              </div>
              <div className="hero__trust">
                <span><span className="check">✓</span> Enterprise FedEx Rates</span>
                <span><span className="check">✓</span> Self-Operated US Warehouses</span>
                <span><span className="check">✓</span> Built for 50–149 lb Parcels</span>
              </div>
              <p className="hero__note">
                Already a customer? <Link href="/login">Log in</Link> · <Link href="/track">Track a package</Link>
              </p>
            </div>

            <div className="hero__art">
              <div className="hero__art-frame">
                <span className="cow-logo cow-logo--hero wiggle" role="img" aria-label="Shipping Cow mascot" />
                <div className="hero__badge hero__badge--top">NO BULL<br />PRICING</div>
                <div className="hero__badge hero__badge--bottom">★ 50–149 LB<br />SPECIALIST</div>
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
                <p>Your carrier bills dimensional weight at divisor 139 — so a dense 50–149 lb product in a right-sized box still gets charged for air. We audit every DIM line on your invoice and re-engineer the packaging that causes it.</p>
              </div>
              <div className="pain__card">
                <div className="pain__card-icon">⚖</div>
                <h3>No Carrier Leverage?</h3>
                <p>We pool volume across our entire merchant herd. You get enterprise FedEx rates without enterprise volume — plus discounted fuel surcharge you can&apos;t get retail.</p>
              </div>
              <div className="pain__card">
                <div className="pain__card-icon">📍</div>
                <h3>Stuck in Zone 7–8?</h3>
                <p>Zone-skipping injection puts your parcels into the last-mile network at Zone ≤ 4 instead of Zone 7–8 — shorter distance billed, shorter distance travelled.</p>
              </div>
            </div>
            <div className="stats__grid" style={{ marginTop: '3rem' }}>
              <div><div className="stats__num">50–149</div><div className="stats__label">lb Sweet Spot</div></div>
              <div><div className="stats__num">3</div><div className="stats__label">Self-Operated US Warehouses — NJ / TX / CA</div></div>
              <div><div className="stats__num">Zone ≤ 4</div><div className="stats__label">Injection Target, Zone-Skipped</div></div>
              <div><div className="stats__num">$15M</div><div className="stats__label">ARR — Logistar, Our Parent 3PL</div></div>
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
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', textTransform: 'uppercase', marginBottom: '0.6rem' }}>Billable Weight Calculator</h3>
              <p style={{ fontSize: '0.98rem', color: '#3a4454', marginBottom: '1.2rem' }}>Enter weight and dimensions. See the billable weight your current carrier is charging you for at the published DIM divisors — the phantom pounds in plain sight.</p>
              <Link href="/calculator" className="btn btn--blue">See What You&apos;re Billed For →</Link>
            </div>
            <div style={{ background: 'var(--white)', border: '4px solid var(--dark)', padding: '2rem', boxShadow: 'var(--shadow-pixel)' }}>
              <div style={{ fontFamily: 'var(--font-pixel)', fontSize: '0.9rem', color: 'var(--blue)', marginBottom: '0.6rem' }}>02</div>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', textTransform: 'uppercase', marginBottom: '0.6rem' }}>Free Invoice Audit</h3>
              <p style={{ fontSize: '0.98rem', color: '#3a4454', marginBottom: '1.2rem' }}>Upload your shipment export (CSV/XLSX — template provided). We find every overpaid DIM charge, surcharge, and zone penalty — instant savings report.</p>
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
