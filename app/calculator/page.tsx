import type { Metadata } from 'next';
import { Suspense } from 'react';
import DimCalculator from '@/components/DimCalculator';
import FinalCTA from '@/components/FinalCTA';

export const metadata: Metadata = {
  title: 'DIM Weight Calculator — See How DIM 225 Saves You Money | ShippingCow',
  description:
    'Calculate your real shipping costs under UPS/FedEx DIM 139, typical 3PL DIM 166, and ShippingCow DIM 225. See exactly how much you\'re overpaying per package — and per year.',
  openGraph: {
    title: 'DIM Weight Calculator — ShippingCow',
    description: 'Stop paying for air. See your real DIM weight savings with divisor 225.',
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
              Every carrier uses a "DIM divisor" to calculate dimensional weight. UPS and FedEx use 139. Most 3PLs use 166.
              ShippingCow uses <strong>225</strong> — the highest in the industry — which means your billable weight is 38–39% lower.
              Enter your package dimensions below and see the difference in real dollars.
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
                title: 'ShippingCow uses 225 — the industry max',
                body: 'A higher divisor = lower DIM weight = lower billable weight = you pay less. Our DIM 225 is 62% higher than the UPS/FedEx standard of 139.',
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
              <strong>Example:</strong> A 24×18×16 box that weighs 55 lbs.{' '}
              UPS/FedEx DIM: <strong>49.8 lbs</strong> → billable: <strong>55 lbs</strong>.{' '}
              ShippingCow DIM: <strong>30.7 lbs</strong> → billable: <strong>55 lbs</strong>.{' '}
              At 80+ lbs the savings are dramatic — try a heavy package in the calculator above.
            </p>
          </div>
        </div>
      </section>

      <FinalCTA
        headline="Ready to run your real numbers?"
        subtext="Submit your top SKU dimensions and we'll build a custom savings model — no commitment, 24-hour turnaround."
        primaryLabel="Get my free savings estimate →"
        primaryHref="/inquiry"
        secondaryLabel="See Big & Bulky rates"
        secondaryHref="/big-and-bulky"
      />
    </>
  );
}
