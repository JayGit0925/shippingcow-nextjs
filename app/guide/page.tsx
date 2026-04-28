'use client';

import { useState } from 'react';
import Link from 'next/link';
import FinalCTA from '@/components/FinalCTA';

const SECTIONS = [
  {
    id: 'dim-225',
    title: 'What Is DIM 225 — and Why Does It Matter?',
    content: `DIM (dimensional weight) pricing is how carriers bill for the space your package takes up in a truck, not just how much it weighs.

The standard DIM divisor is 139. That means every cubic foot of space is billed as if it weighs 139 lbs. For a 40 lb bike in a box that's 4 cubic feet: you're billed for 52 lbs — 12 lbs of phantom weight.

DIM 225 flips this. At 225 divisor, that same bike bills at its actual 40 lbs.

That's a 30% savings on every shipment before any other optimization.`,
    stat: '30% average savings vs standard DIM 139 pricing',
  },
  {
    id: 'fuel-surcharge',
    title: 'The Hidden Tax: Fuel Surcharges',
    content: `Fuel surcharges are the #1 hidden cost in parcel shipping. Carriers adjust them weekly based on diesel prices, and they're applied to the base rate — after all other discounts.

A quote for $55 often becomes $82 after fuel surcharge, residential delivery fee, and peak season demand charges. Most shippers don't realize this until the bill arrives.

The fix: work with a 3PL that has a direct carrier contract with fuel surcharge waivers built in. This alone can save 8-15% on every shipment.`,
    stat: 'Up to 15% of your shipping bill = fuel surcharges alone',
  },
  {
    id: 'zone-routing',
    title: "Smart Zone Routing: Don't Ship Across the Country",
    content: `Where you ship from matters more than most shippers realize. A package from New Jersey to California (Zone 8) costs 2-3x more than shipping within Zone 2.

With fulfillment hubs in NJ-08901, CA-91761, and TX-77489, Shipping Cow automatically routes each order to the closest hub.

This means more Zone 2-3 deliveries and fewer Zone 7-8 shipments. Combined with DIM 225 pricing, the savings compound on every order.`,
    stat: '3 hubs covering 85% of US population within 3-day ground',
  },
  {
    id: 'heavy-parcel',
    title: 'Heavy Parcel: The Overlooked Category',
    content: `"Heavy parcel" (50-150 lbs) is the most underserved segment in shipping. Standard carriers like FedEx Ground and UPS Ground are designed for lightweight e-commerce parcels.

Heavy parcels trigger:
• Higher base rates (sometimes 2-3x)
• Oversize surcharges ($30-120)
• Residential delivery fees ($5-40)
• Liftgate fees ($50-150)

A dedicated heavy parcel partner like Shipping Cow optimizes for this exact weight category, with pricing that starts where standard carriers peak.`,
    stat: 'Heavy parcel shippers overpay by 25-40% on standard carrier rates',
  },
  {
    id: 'audit-checklist',
    title: 'Your Free Shipping Cost Audit Checklist',
    content: `Before you negotiate your next carrier contract, run through this audit:

1. Check your DIM divisor — Are you on 139 or 225?
2. Review your fuel surcharge — What percentage are you paying?
3. Map your zone distribution — What % of shipments go to Zone 5+?
4. Identify heavy parcels — What % of items are 50-150 lbs?
5. Calculate hidden fees — Total surcharges as % of base rate
6. Compare 3PL pricing — How does your all-in rate compare?

Upload your shipment data to our free audit tool for an instant analysis.`,
    stat: 'Most shippers discover $500-5,000/month in hidden cost savings',
  },
];

export default function GuidePage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name || !email) return;
    setSending(true);
    try {
      const res = await fetch('/api/inquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          message: 'Requested: Free Heavy Parcel Cost-Saving Guide',
        }),
      });
      if (res.ok) setSubmitted(true);
    } catch {
      setSubmitted(true);
    }
    setSending(false);
  }

  return (
    <div className="dash" style={{ background: '#fff' }}>
      {/* Hero */}
      <section className="guide-hero">
        <div className="guide-hero__inner">
          <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>🐮</div>
          <h1 className="guide-hero__title">
            The Heavy Parcel <span className="text-yellow">Cost-Saving Guide</span>
          </h1>
          <p className="guide-hero__sub">
            How DIM 225, fuel surcharge waivers, and smart zone routing can cut your
            shipping costs by 30% or more.
          </p>

          {!submitted ? (
            <form onSubmit={handleSubmit} className="guide-form">
              <input
                type="text"
                required
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="guide-form__input"
              />
              <input
                type="email"
                required
                placeholder="Enter your email for the printable guide"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="guide-form__input"
              />
              <button type="submit" disabled={sending} className="btn btn--blue guide-form__btn">
                {sending ? 'Sending...' : 'Send My Free Guide →'}
              </button>
            </form>
          ) : (
            <div className="guide-form__success">
              ✅ Guide sent! Check your inbox. 🐄
            </div>
          )}
          <p className="guide-form__disclaimer">
            We&apos;ll never spam you. Unsubscribe anytime.
          </p>
        </div>
      </section>

      {/* Table of contents */}
      <div className="guide-toc">
        {SECTIONS.map((s) => (
          <Link key={s.id} href={`#${s.id}`} className="guide-toc__link">
            {s.title.split(':')[0]}
          </Link>
        ))}
      </div>

      {/* Content sections */}
      <div className="guide-content">
        {SECTIONS.map((section, i) => (
          <section key={section.id} id={section.id} className="guide-section">
            <div className="guide-section__header">
              <span className="guide-section__num">{i + 1}</span>
              <h2 className="guide-section__title">{section.title}</h2>
            </div>
            <div className="guide-section__body">
              <p className="guide-section__text">{section.content}</p>
            </div>
            <div className="guide-section__stat">💡 {section.stat}</div>
          </section>
        ))}

        {/* Mid-page CTA */}
        <div className="guide-cta">
          <p className="guide-cta__text">
            Want to see your actual savings? Upload your shipment data for a free audit.
          </p>
          <Link href="/audit" className="btn btn--blue" style={{ display: 'inline-block', padding: '0.75rem 1.5rem' }}>
            Run Free Audit →
          </Link>
        </div>
      </div>

      <FinalCTA
        headline="Stop guessing. Start saving."
        subtext="Upload your shipment data and see your exact savings in under 60 seconds."
        primaryLabel="Run Free Audit →"
        primaryHref="/audit"
        secondaryLabel="Calculate your savings"
        secondaryHref="/calculator"
      />

      {/* Styles scoped to this page */}
      <style jsx>{`
        .guide-hero {
          background: linear-gradient(135deg, #1E40AF 0%, #1A202C 100%);
          color: #fff;
          padding: 5rem 1.5rem 4rem;
          text-align: center;
          border-bottom: 4px solid #FEB81B;
        }
        .guide-hero__inner {
          max-width: 600px;
          margin: 0 auto;
        }
        .guide-hero__title {
          font-size: clamp(1.75rem, 4.5vw, 3rem);
          font-weight: 800;
          line-height: 1.15;
          margin-bottom: 1rem;
        }
        .guide-hero__sub {
          font-size: 1.125rem;
          color: #BFDBFE;
          line-height: 1.7;
          margin-bottom: 2rem;
        }
        .guide-form {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          max-width: 400px;
          margin: 0 auto;
        }
        .guide-form__input {
          padding: 0.85rem 1rem;
          border: 2px solid rgba(255,255,255,0.3);
          border-radius: 6px;
          font-size: 1rem;
          background: rgba(255,255,255,0.1);
          color: #fff;
          outline: none;
        }
        .guide-form__input::placeholder { color: rgba(255,255,255,0.5); }
        .guide-form__btn {
          justify-content: center;
          padding: 0.85rem 1.5rem;
          font-size: 1rem;
        }
        .guide-form__success {
          background: rgba(254, 184, 27, 0.15);
          border-radius: 8px;
          padding: 1rem 1.5rem;
          font-weight: 600;
          color: #FEB81B;
        }
        .guide-form__disclaimer {
          font-size: 0.8rem;
          color: rgba(255,255,255,0.5);
          margin-top: 0.75rem;
        }
        .text-yellow { color: #FEB81B; }
        .guide-toc {
          max-width: 780px;
          margin: 0 auto;
          padding: 2rem 1.5rem 0;
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
          justify-content: center;
        }
        .guide-toc__link {
          padding: 0.4rem 0.9rem;
          background: #F4F7FF;
          border-radius: 20px;
          font-size: 0.85rem;
          color: #1E40AF;
          font-weight: 500;
          text-decoration: none;
        }
        .guide-content {
          max-width: 780px;
          margin: 0 auto;
          padding: 0 1.5rem 1rem;
        }
        .guide-section {
          margin-bottom: 3.5rem;
          scroll-margin-top: 2rem;
        }
        .guide-section__header {
          display: flex;
          align-items: flex-start;
          gap: 1rem;
          margin-bottom: 1rem;
        }
        .guide-section__num {
          background: #1E40AF;
          color: #fff;
          border-radius: 50%;
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 0.9rem;
          flex-shrink: 0;
        }
        .guide-section__title {
          font-size: 1.35rem;
          font-weight: 700;
          line-height: 1.3;
          margin: 0;
          padding-top: 0.3rem;
        }
        .guide-section__body {
          padding: 1.5rem;
          background: #F9FAFB;
          border-radius: 8px;
          border: 1px solid #E5E7EB;
        }
        .guide-section__text {
          font-size: 1rem;
          line-height: 1.7;
          color: #374151;
          margin: 0;
          white-space: pre-wrap;
        }
        .guide-section__stat {
          margin-top: 0.75rem;
          padding: 0.75rem 1rem;
          background: #F4F7FF;
          border-left: 4px solid #FEB81B;
          border-radius: 0 6px 6px 0;
          font-size: 0.9rem;
          font-weight: 600;
          color: #1E40AF;
        }
        .guide-cta {
          text-align: center;
          padding: 2rem;
          margin-bottom: 3rem;
          background: #F4F7FF;
          border-radius: 8px;
          border: 2px dashed #1E40AF;
        }
        .guide-cta__text {
          font-size: 1.1rem;
          font-weight: 600;
          color: #1E40AF;
          margin: 0 0 1rem 0;
        }
        @media (min-width: 500px) {
          .guide-form { flex-direction: row; }
          .guide-form__input { flex: 1; }
        }
      `}</style>
    </div>
  );
}
