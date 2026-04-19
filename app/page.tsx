import Link from 'next/link';
import HeroTracker from '@/components/HeroTracker';
import ShrinkageCalculator from '@/components/ShrinkageCalculator';
import PricingToggle from '@/components/PricingToggle';
import USMap from '@/components/USMap';
import SocialProof from '@/components/SocialProof';
import SellerCallout from '@/components/SellerCallout';
import FAQ from '@/components/FAQ';
import FinalCTA from '@/components/FinalCTA';

export default function HomePage() {
  return (
    <>
      {/* ============ HERO ============ */}
      <section className="hero" id="home">
        <div className="container">
          <div className="hero__grid">
            <div>
              <span className="hero__eyebrow">★ HEAVY GOODS 3PL · EST. 2026</span>
              <h1>
                <span className="accent">Moo-ve</span> Your Heavy Goods Without Getting <span className="mark">Milked</span> on Shipping Costs
              </h1>
              <p className="hero__sub">
                Shipping Cow AI is the only logistics platform built for the 50 lb+ seller. Enterprise carrier rates. AI-powered routing. Zero DIM weight surprises. We make heavy e-commerce finally profitable.
              </p>
              <div className="hero__ctas">
                <Link href="/track" className="btn btn--blue">Track a Package</Link>
                <Link href="/inquiry" className="btn">Get My Free Cost Audit →</Link>
              </div>
              <div className="hero__trust">
                <span><span className="check">✓</span> Up to 80% off FedEx Rates</span>
                <span><span className="check">✓</span> 2-Day Delivery Guarantee</span>
                <span><span className="check">✓</span> Zero Shrinkage Promise</span>
                <span><span className="check">✓</span> AI-Powered Back Office</span>
              </div>
              <p className="hero__note">
                Already a customer? <Link href="/login">Log in</Link> to your dashboard.
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

      {/* ============ PAIN POINTS ============ */}
      <section className="pain">
        <div className="pain__inner">
          <div className="container">
            <div className="pain__head">
              <h2>The Three Things <span>Killing</span> Your Heavy-Goods Margins</h2>
              <p>You're losing $28K/year to DIM weight guessing, carrier fees, and paperwork you never signed up for. We fixed that.</p>
            </div>
            <div className="pain__grid">
              <div className="pain__card">
                <div className="pain__card-icon">$</div>
                <h3>DIM Weight Death Spiral</h3>
                <p>You're paying for air. Our 3D Packaging Optimizer kills overcharge before it starts — average merchant saves $0.85–$2.40 per shipment on DIM alone.</p>
              </div>
              <div className="pain__card">
                <div className="pain__card-icon">⚖</div>
                <h3>No Carrier Leverage?</h3>
                <p>We pool volume across our entire merchant herd. You get FedEx enterprise rates without enterprise volume — up to 80% off published rates.</p>
              </div>
              <div className="pain__card">
                <div className="pain__card-icon">📝</div>
                <h3>Drowning in Paperwork?</h3>
                <p>Bills of Lading. Customs filings. ISF 10+2. Our AI Copilot handles it all autonomously — 85%+ of your paperwork, done before you ask.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============ SOCIAL PROOF — stats + testimonials ============ */}
      <SocialProof />

      {/* ============ STATS ============ */}
      <section className="stats">
        <div className="container">
          <div className="stats__grid">
            <div><div className="stats__num">$1,500+</div><div className="stats__label">Avg. Monthly Savings</div></div>
            <div><div className="stats__num">80%</div><div className="stats__label">Off FedEx Published</div></div>
            <div><div className="stats__num">99.2%</div><div className="stats__label">2-Day SLA Attained</div></div>
            <div><div className="stats__num">85%+</div><div className="stats__label">Paperwork Automated</div></div>
          </div>
        </div>
      </section>

      {/* ============ SELLER CALLOUT — platform grid ============ */}
      <SellerCallout />

      {/* ============ PRICING ============ */}
      <section className="section section--alt" id="pricing">
        <div className="container">
          <div className="section__head">
            <h2>No Bull Pricing. <span>Every Herd Gets Fed.</span></h2>
            <p>Start free. Scale when it pays. Every tier pays for itself in the first month — or we're not doing our job.</p>
          </div>
          <PricingToggle />
        </div>
      </section>

      {/* ============ COW-GUARANTEED ============ */}
      <section className="section" id="cow-guaranteed">
        <div className="container">
          <div className="section__head">
            <h2>The <span>Cow-Guaranteed</span> Promise</h2>
            <p>Most 3PLs bury a "shrinkage allowance" clause in their contract — that's them telling you they'll lose your stuff and you'll pay for it. We don't do that. Every Shipping Cow guarantee is backed by our wallet, not just our word.</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginTop: '2.5rem' }}>
            {[
              { num: '01', title: 'Zero Shrinkage. Or We Pay.', body: 'Industry average loss is 2–4%. Our rate? Zero. If we lose or damage your inventory, we cover the wholesale cost. No excuses, no clauses.' },
              { num: '02', title: '2-Day Delivery. Guaranteed.', body: 'Every destination ZIP we serve is injected at Zone ≤ 4. If we miss your SLA, we make it right. Fast shipping isn\'t optional — it\'s in the contract.' },
              { num: '03', title: 'Dock to Stock in 48 Hours.', body: 'We receive all inbound shipments within 2 business days. Your inventory goes live fast so you can sell, not wait.' },
              { num: '04', title: '100% Order Accuracy. Or $50 Says We\'re Sorry.', body: 'Wrong item ships? We pay you $50 per error and reship correctly. Immediately. No ticket queue, no excuses.' },
            ].map((g) => (
              <div key={g.num} style={{ background: 'var(--white)', border: '4px solid var(--dark)', padding: '1.8rem', boxShadow: 'var(--shadow-pixel)', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: 0, right: 0, width: 60, height: 60, background: 'var(--yellow)', clipPath: 'polygon(100% 0, 0 0, 100% 100%)' }} />
                <div style={{ fontFamily: 'var(--font-pixel)', fontSize: '0.9rem', color: 'var(--blue)', marginBottom: '0.6rem' }}>{g.num}</div>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', textTransform: 'uppercase', marginBottom: '0.6rem' }}>{g.title}</h3>
                <p style={{ fontSize: '0.98rem', color: '#3a4454' }}>{g.body}</p>
              </div>
            ))}
          </div>

          {/* Shrinkage + Shipping Rate Calculator */}
          <div style={{ marginTop: '4rem' }}>
            <h2 style={{ textAlign: 'center' }}>Find Out What Shrinkage &amp; Overpriced Shipping <span style={{ color: 'var(--blue)' }}>Is Really Costing</span> Your Herd</h2>
            <p style={{ textAlign: 'center', maxWidth: 680, margin: '1rem auto 0', color: '#3a4454', fontSize: '1.05rem' }}>
              The industry average for 3PL inventory shrinkage is 2–4%. Most providers treat it as "normal." Calculate what "normal" costs you — then see what zero looks like.
            </p>
            <ShrinkageCalculator />
          </div>

          {/* US Map */}
          <div style={{ marginTop: '4rem' }}>
            <h2 style={{ textAlign: 'center' }}>2-Day Delivery to <span style={{ color: 'var(--blue)' }}>92% of the Continental U.S.</span> No Bull.</h2>
            <p style={{ textAlign: 'center', maxWidth: 680, margin: '1rem auto 0', color: '#3a4454', fontSize: '1.05rem' }}>
              Our strategically positioned fulfillment nodes use smart zone-skipping to inject your packages at Zone ≤ 4 — cutting 2–4 days off transit and up to 52% off per-parcel cost.
            </p>
            <USMap />
          </div>
        </div>
      </section>

      {/* ============ SERVICES ============ */}
      <section className="section section--alt" id="services">
        <div className="container">
          <div className="section__head">
            <h2>Every Link in the Chain. <span>Handled by the Herd.</span></h2>
            <p>From the moment your container leaves overseas to the minute your customer unboxes — and every return in between — Shipping Cow has you covered. No fragmented broker network. One platform. Full visibility.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', marginTop: '2.5rem' }}>
            {[
              { num: 'SVC 01', title: 'First Mile & Ocean Freight Import', tag: '"Don\'t Let Your Container Sit at Port While Costs Stack Up"', body: 'We run smart-quotation across ocean carriers for FCL and LCL bookings — with HTS-code-assisted customs clearance, ISF 10+2 filing, and autonomous document generation built in.' },
              { num: 'SVC 02', title: 'Middle Mile & LTL Consolidation', tag: '"Zone-Skip Your Way to Profitability"', body: 'We consolidate your outbound freight into line-haul trailers bound for strategic injection points — so your parcels enter the last-mile network at Zone 1–4, not Zone 7. Result: 28–52% lower per-parcel cost.' },
              { num: 'SVC 03', title: 'Heavy Goods Warehousing', tag: '"We Treat Your Inventory Like It\'s Ours."', body: 'Our fulfillment nodes are engineered for heavy goods — furniture, fitness equipment, appliances, outdoor gear. Bin-level WMS tracking, 24/7 security, zero-shrinkage guarantee backed by real dollars.' },
              { num: 'SVC 04', title: 'AI-Powered Packaging Optimization', tag: '"Stop Paying for Air. Start Paying for Deliveries."', body: 'Every SKU gets a 3D geometry profile. Our Packaging Optimizer finds the exact carton that minimizes your billable DIM weight — returned in under 200ms, applied automatically at every order.' },
              { num: 'SVC 05', title: 'Last Mile & 2-Day Delivery', tag: '"The Amazon SFP Badge. The TikTok 48-Hour SLA."', body: 'Our Smart Routing Algorithm guarantees every destination ZIP in our coverage zone receives delivery in 2 business days. We handle SFP compliance, TikTok dispatch, and any SLA your storefront promises.' },
              { num: 'SVC 06', title: 'Returns & Reverse Logistics', tag: '"Returns Don\'t Have to Be a Total Loss Anymore"', body: 'Heavy goods return rates run 15–20%. Shipping Cow handles returns authorization, reverse routing, condition triage, and refurbishment — so returned goods go back to sellable status, not the landfill.' },
            ].map((s) => (
              <article key={s.num} style={{ background: 'var(--white)', border: '3px solid var(--dark)', padding: '1.8rem', boxShadow: 'var(--shadow-pixel)', display: 'flex', flexDirection: 'column' }}>
                <div style={{ fontFamily: 'var(--font-pixel)', fontSize: '0.75rem', color: 'var(--blue)', display: 'inline-block', padding: '0.2rem 0.5rem', border: '2px solid var(--blue)', marginBottom: '0.6rem' }}>{s.num}</div>
                <h3 style={{ fontSize: '1.3rem', textTransform: 'uppercase', marginBottom: '0.4rem' }}>{s.title}</h3>
                <div style={{ fontWeight: 700, fontStyle: 'italic', color: 'var(--blue)', marginBottom: '0.8rem', fontSize: '1rem' }}>{s.tag}</div>
                <p style={{ fontSize: '0.95rem', color: '#3a4454', flex: 1 }}>{s.body}</p>
                <div style={{ marginTop: '1.2rem' }}>
                  <Link href="/inquiry" className="btn btn--sm" style={{ background: 'var(--yellow)', color: 'var(--dark)', fontSize: '0.8rem' }}>
                    Get a Quote →
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ============ FAQ ============ */}
      <FAQ />

      {/* ============ ABOUT ============ */}
      <section className="section" id="about">
        <div className="container">
          <div className="section__head">
            <h2>We Built This Because <span>We Got Burned Too.</span></h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '3rem', alignItems: 'center', marginBottom: '3rem' }} className="about-grid">
            <div>
              <p style={{ fontSize: '1.2rem', fontWeight: 500, marginBottom: '1rem' }}>Shipping Cow wasn't born in a boardroom. It was built by sellers who watched their margins evaporate — shipment by shipment — inside a logistics system that was never designed for heavy goods.</p>
              <p style={{ marginBottom: '1rem' }}>We know what it feels like to open a carrier invoice and find a DIM weight charge you didn't budget for. We know the anxiety of Q4 peak surcharges hitting your account retroactively.</p>
              <p style={{ marginBottom: '1rem' }}>So we built the platform we wish had existed: a deterministic, AI-native fulfillment stack where every cost is traceable, every route is optimized, and every piece of paperwork is handled before you ask.</p>
              <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', color: 'var(--blue)', textTransform: 'uppercase' }}>The Shipping Cow herd is growing. Come moo-ve with us.</p>
            </div>
            <div style={{ background: 'var(--blue)', border: '4px solid var(--dark)', padding: '2rem', boxShadow: 'var(--shadow-pixel-lg)', display: 'flex', justifyContent: 'center', aspectRatio: '1/1', alignItems: 'center' }}>
              <span className="cow-logo cow-logo--about wiggle" role="img" aria-label="Shipping Cow mascot" />
            </div>
          </div>
        </div>
      </section>

      {/* ============ FINAL CTA ============ */}
      <FinalCTA
        headline="Ready to stop overpaying on heavy freight?"
        subtext="Tell us your products, current carrier, and monthly volume. We'll build a custom savings model — no commitment, 24-hour turnaround."
        primaryLabel="Get my free savings estimate →"
        primaryHref="/inquiry"
        secondaryLabel="See Big & Bulky rates"
        secondaryHref="/big-and-bulky"
      />
    </>
  );
}
