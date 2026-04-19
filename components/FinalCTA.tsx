import Link from 'next/link';

const TRUST_SIGNALS = [
  '✓ No long-term contracts',
  '✓ Live in under 24 hours',
  '✓ Free savings estimate',
  '✓ Cancel any time',
];

type Props = {
  headline?: string;
  subtext?: string;
  primaryLabel?: string;
  primaryHref?: string;
  secondaryLabel?: string;
  secondaryHref?: string;
};

export default function FinalCTA({
  headline = 'Ready to stop overpaying on shipping?',
  subtext = "Tell us about your volume and we'll show you exactly what you'd save. No commitment, no credit card.",
  primaryLabel = 'Get my free savings estimate →',
  primaryHref = '/inquiry',
  secondaryLabel = 'Talk to a human first',
  secondaryHref = '/inquiry',
}: Props) {
  return (
    <section
      style={{
        padding: '6rem 1.5rem',
        background: '#1E40AF',
        borderTop: '3px solid #1A202C',
        borderBottom: '3px solid #1A202C',
        textAlign: 'center',
      }}
    >
      <div style={{ maxWidth: 680, margin: '0 auto' }}>
        {/* Cow logo accent */}
        <div style={{ fontSize: '3.5rem', marginBottom: '1.25rem' }}>🐄</div>

        <h2
          style={{
            fontSize: 'clamp(2rem, 5vw, 3.25rem)',
            fontWeight: 800,
            color: '#fff',
            lineHeight: 1.15,
            marginBottom: '1.25rem',
          }}
        >
          {headline}
        </h2>

        <p
          style={{
            fontSize: '1.125rem',
            color: '#BFDBFE',
            lineHeight: 1.7,
            marginBottom: '2.5rem',
          }}
        >
          {subtext}
        </p>

        {/* CTA buttons */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '1rem',
            justifyContent: 'center',
            marginBottom: '2.5rem',
          }}
        >
          <Link
            href={primaryHref}
            style={{
              background: '#F97316',
              color: '#fff',
              fontWeight: 800,
              fontSize: '1.0625rem',
              padding: '0.9rem 2rem',
              border: '3px solid #1A202C',
              borderRadius: 6,
              boxShadow: '4px 4px 0 #1A202C',
              textDecoration: 'none',
              display: 'inline-block',
              transition: 'transform 0.1s, box-shadow 0.1s',
            }}
          >
            {primaryLabel}
          </Link>
          <Link
            href={secondaryHref}
            style={{
              background: 'transparent',
              color: '#fff',
              fontWeight: 700,
              fontSize: '1rem',
              padding: '0.9rem 1.75rem',
              border: '2px solid rgba(255,255,255,0.5)',
              borderRadius: 6,
              textDecoration: 'none',
              display: 'inline-block',
            }}
          >
            {secondaryLabel}
          </Link>
        </div>

        {/* Trust signals */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '0.5rem 1.5rem',
            justifyContent: 'center',
            fontSize: '0.875rem',
            color: '#93C5FD',
            fontWeight: 500,
          }}
        >
          {TRUST_SIGNALS.map((s) => (
            <span key={s}>{s}</span>
          ))}
        </div>
      </div>
    </section>
  );
}
