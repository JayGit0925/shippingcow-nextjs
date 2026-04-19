'use client';

import Link from 'next/link';
import { useState } from 'react';

const TIERS = [
  {
    tier: 'TIER 1',
    name: 'Free Scout',
    monthly: '$0',
    annual: '$0',
    suffix: '/mo forever',
    features: ['Death Zone Cost Audit', 'Rate Benchmarking Report', 'Read-only platform sync', 'Monthly logistics newsletter'],
    cta: 'Start Free',
    variant: 'ghost' as const,
  },
  {
    tier: 'TIER 2',
    name: 'Optimizer',
    monthly: '$99',
    annual: '$79',
    features: ['AI Copilot (20K tokens)', '3D Packaging Optimizer', 'Zone Analysis + Smart Routing', 'Live rate comparison engine', 'Email + chat support'],
    cta: 'Choose Optimizer',
    variant: 'default' as const,
  },
  {
    tier: 'TIER 3',
    name: 'Herd Leader',
    monthly: '$499',
    annual: '$399',
    badge: '★ Best Value',
    features: ['Everything in Optimizer', '80% off FedEx volume pool', '120K AI tokens / month', 'Full fulfillment credit', 'Priority support, 4hr SLA'],
    cta: 'Join the Herd',
    variant: 'blue' as const,
    featured: true,
  },
  {
    tier: 'TIER 4',
    name: 'Enterprise',
    monthly: 'Custom',
    annual: 'Custom',
    features: ['Custom SLA contracts', 'ERP & WMS integrations', 'Dedicated logistics engineer', 'White-glove onboarding', 'Volume-tiered rate card'],
    cta: 'Talk to Sales',
    variant: 'ghost' as const,
  },
];

export default function PricingToggle() {
  const [mode, setMode] = useState<'monthly' | 'annual'>('monthly');

  return (
    <>
      <div style={{ textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', gap: 0, margin: '1.5rem auto 2.5rem', border: '3px solid var(--dark)', background: 'var(--white)', boxShadow: 'var(--shadow-pixel-sm)' }}>
          <button
            onClick={() => setMode('monthly')}
            style={{
              padding: '0.7rem 1.4rem',
              fontFamily: 'var(--font-display)',
              fontSize: '0.95rem',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              background: mode === 'monthly' ? 'var(--blue)' : 'var(--white)',
              color: mode === 'monthly' ? 'var(--white)' : 'var(--dark)',
            }}
          >
            Monthly
          </button>
          <button
            onClick={() => setMode('annual')}
            style={{
              padding: '0.7rem 1.4rem',
              fontFamily: 'var(--font-display)',
              fontSize: '0.95rem',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              background: mode === 'annual' ? 'var(--blue)' : 'var(--white)',
              color: mode === 'annual' ? 'var(--white)' : 'var(--dark)',
            }}
          >
            Annual <span style={{ color: 'var(--yellow)', fontSize: '0.8em' }}>· Save 20%</span>
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.2rem' }}>
        {TIERS.map((t) => {
          const price = mode === 'annual' ? t.annual : t.monthly;
          const suffix =
            t.suffix || (price === 'Custom' ? '' : mode === 'annual' ? '/mo billed annually' : '/mo');
          return (
            <div
              key={t.name}
              style={{
                background: t.featured ? 'linear-gradient(180deg, var(--white) 0%, #eef3ff 100%)' : 'var(--white)',
                border: t.featured ? '4px solid var(--blue)' : '3px solid var(--dark)',
                padding: '1.8rem 1.4rem',
                boxShadow: 'var(--shadow-pixel)',
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
              }}
            >
              {t.badge && (
                <div
                  style={{
                    position: 'absolute',
                    top: -14,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: 'var(--yellow)',
                    color: 'var(--dark)',
                    border: '3px solid var(--dark)',
                    padding: '0.25rem 0.75rem',
                    fontFamily: 'var(--font-display)',
                    fontSize: '0.8rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {t.badge}
                </div>
              )}
              <div style={{ fontFamily: 'var(--font-pixel)', fontSize: '0.65rem', color: 'var(--blue)', marginBottom: '0.5rem' }}>{t.tier}</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', textTransform: 'uppercase', marginBottom: '0.4rem' }}>{t.name}</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '2.2rem', color: 'var(--blue)', margin: '0.5rem 0 1rem' }}>
                {price}
                <span style={{ fontSize: '0.45em', color: 'var(--dark)', fontFamily: 'var(--font-body)', fontWeight: 500 }}>{suffix}</span>
              </div>
              <ul style={{ listStyle: 'none', margin: '0.5rem 0 1.5rem', flex: 1 }}>
                {t.features.map((f) => (
                  <li key={f} style={{ padding: '0.4rem 0 0.4rem 1.6rem', fontSize: '0.92rem', position: 'relative', borderBottom: '1px dashed #d0d7e2' }}>
                    <span style={{ position: 'absolute', left: 0, top: '0.4rem', color: 'var(--blue)', fontWeight: 700 }}>✓</span>
                    {f}
                  </li>
                ))}
              </ul>
              <Link href="/inquiry" className={`btn btn--full ${t.variant === 'blue' ? 'btn--blue' : t.variant === 'ghost' ? 'btn--ghost' : ''}`}>
                {t.cta}
              </Link>
            </div>
          );
        })}
      </div>

      <p style={{ textAlign: 'center', marginTop: '2rem', fontStyle: 'italic', color: '#555', fontSize: '0.9rem' }}>
        Tier 3 merchants who use our physical fulfillment can receive up to 100% of their $499 subscription as a credit against warehouse charges.
      </p>
    </>
  );
}
