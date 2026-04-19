import type { PricingTier } from '@/lib/types';
import { formatCurrency } from '@/lib/utils';
import Link from 'next/link';

type Props = {
  tier: PricingTier;
  annual?: boolean;
};

export default function PricingCard({ tier, annual = false }: Props) {
  const price = annual ? tier.yearlyPrice : tier.monthlyPrice;
  const savings =
    annual && tier.yearlyPrice < tier.monthlyPrice * 12
      ? Math.round(100 - (tier.yearlyPrice / (tier.monthlyPrice * 12)) * 100)
      : 0;

  return (
    <div
      style={{
        border: tier.highlighted ? '3px solid #1E40AF' : '2px solid #E5E7EB',
        borderRadius: 12,
        padding: '2rem',
        background: tier.highlighted ? '#EFF6FF' : '#fff',
        boxShadow: tier.highlighted ? '5px 5px 0 #1E40AF' : '3px 3px 0 #E5E7EB',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        transition: 'transform 0.15s, box-shadow 0.15s',
      }}
    >
      {/* Badge */}
      {tier.badge && (
        <div
          style={{
            position: 'absolute',
            top: -14,
            left: '50%',
            transform: 'translateX(-50%)',
            background: '#F97316',
            color: '#fff',
            fontSize: '0.7rem',
            fontWeight: 800,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            padding: '4px 14px',
            borderRadius: 99,
            border: '2px solid #1A202C',
            whiteSpace: 'nowrap',
          }}
        >
          {tier.badge}
        </div>
      )}

      {/* Tier name */}
      <div
        style={{
          fontSize: '0.75rem',
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          color: tier.highlighted ? '#1E40AF' : '#6B7280',
          marginBottom: '0.5rem',
        }}
      >
        {tier.name}
      </div>

      {/* Price */}
      <div style={{ marginBottom: '0.25rem' }}>
        <span
          style={{
            fontSize: '2.75rem',
            fontWeight: 800,
            color: '#111827',
            lineHeight: 1,
          }}
        >
          {formatCurrency(price)}
        </span>
        <span style={{ fontSize: '0.9rem', color: '#6B7280', marginLeft: 4 }}>
          /{annual ? 'yr' : 'mo'}
        </span>
      </div>

      {savings > 0 && (
        <div
          style={{
            fontSize: '0.75rem',
            color: '#059669',
            fontWeight: 600,
            marginBottom: '0.75rem',
          }}
        >
          Save {savings}% vs monthly
        </div>
      )}

      {/* Description */}
      <p
        style={{
          fontSize: '0.875rem',
          color: '#4B5563',
          lineHeight: 1.6,
          marginBottom: '1.5rem',
        }}
      >
        {tier.description}
      </p>

      {/* CTA */}
      <Link
        href="/inquiry"
        className={tier.highlighted ? 'btn btn--blue' : 'btn btn--ghost'}
        style={{ textAlign: 'center', marginBottom: '1.5rem' }}
      >
        {tier.cta}
      </Link>

      {/* Features */}
      <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
        {tier.features.map((feature) => (
          <li
            key={feature}
            style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: '0.875rem', color: '#374151' }}
          >
            <span
              style={{
                color: tier.highlighted ? '#1E40AF' : '#059669',
                fontWeight: 700,
                flexShrink: 0,
                marginTop: 1,
              }}
            >
              ✓
            </span>
            {feature}
          </li>
        ))}
      </ul>
    </div>
  );
}
