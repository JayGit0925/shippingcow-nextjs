import type { Metadata } from 'next';
import { Suspense } from 'react';
import DimCalculator from '@/components/DimCalculator';
import FinalCTA from '@/components/FinalCTA';

export const metadata: Metadata = {
  title: 'DIM Weight Calculator — What Your Carrier Is Really Billing You For | ShippingCow',
  description:
    'Enter your box dimensions and actual weight. See the billable weight your carrier charges at the published DIM divisors — UPS/FedEx 139 and the typical 3PL 166 — on 50–149 lb parcels.',
  alternates: { canonical: '/calculator' },
  openGraph: {
    title: 'DIM Weight Calculator — ShippingCow',
    description: 'Stop paying for air. See the billable weight your carrier is actually charging you for.',
    type: 'website',
  },
};

export default function CalculatorPage() {
  return (
    <>
      <section className="section" style={{ paddingTop: '3rem' }}>
        <div className="container">
          <div className="section__head">
            <h1>
              Stop Paying for <span>Air.</span>
            </h1>
            <p>
              Every carrier uses a &ldquo;DIM divisor&rdquo; to turn your box size into billable weight. UPS and FedEx publish 139. Most 3PLs use 166.
              Enter your package below and see the billable weight you are being charged for today — then let us audit the invoice.
            </p>
          </div>

          <Suspense fallback={<div style={{ minHeight: 400, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading calculator…</div>}>
            <DimCalculator />
          </Suspense>
        </div>
      </section>

      {/* How DIM weight works */}
      <section className="section section--alt">
        <div className="container">
          <div className="section__head">
            <h2>How DIM Weight <span>Actually Works</span></h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginTop: '2rem' }}>
            {[
              {
                step: '01',
                title: 'Carriers measure your box',
                body: 'Length × Width × Height gives you cubic inches. The carrier divides that number by their DIM divisor to get dimensional weight.',
              },
              {
                step: '02',
                title: 'They charge the higher of actual vs DIM',
                body: 'If your DIM weight is higher than your actual weight, you pay DIM weight rates. This is how carriers extract extra money from bulky packages.',
              },
              {
                step: '03',
                title: 'Heavy, dense parcels get punished',
                body: 'DIM divisors were built to penalise light, oversized boxes. Applied to a dense 50–149 lb product they inflate your bill on a package that is already paying its own way. That gap is what our free audit quantifies on your real invoice.',
              },
            ].map(({ step, title, body }) => (
              <div key={step} style={{ background: 'var(--white)', border: '4px solid var(--dark)', padding: '1.8rem', boxShadow: 'var(--shadow-pixel)' }}>
                <div style={{ fontFamily: 'var(--font-pixel)', fontSize: '0.9rem', color: 'var(--blue)', marginBottom: '0.6rem' }}>{step}</div>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', textTransform: 'uppercase', marginBottom: '0.6rem' }}>{title}</h3>
                <p style={{ fontSize: '0.95rem', color: '#3a4454' }}>{body}</p>
              </div>
            ))}
          </div>

          <div style={{ marginTop: '2rem', background: 'var(--blue)', color: '#fff', padding: '1.5rem 2rem', border: '4px solid var(--dark)', boxShadow: 'var(--shadow-pixel-lg)' }}>
            <p style={{ margin: 0, fontSize: '1.05rem', fontWeight: 600 }}>
              <strong>Example:</strong> A 30×24×20 box that weighs 45 lbs.{' '}
              At the published UPS/FedEx divisor of 139 it bills as <strong>103.6 lbs</strong> — more than double what it weighs.{' '}
              That is the number on your invoice today. Run your own box above, then send us the invoice and we&apos;ll tell you what it should cost.
            </p>
          </div>
        </div>
      </section>

      <FinalCTA
        headline="Ready to run your real numbers?"
        subtext="Submit your top SKU dimensions and we'll build a custom savings model — no commitment, 24-hour turnaround."
        primaryLabel="Get my free savings estimate →"
        primaryHref="/inquiry"
        secondaryLabel="Upload shipment data — full audit"
        secondaryHref="/audit"
      />
    </>
  );
}
