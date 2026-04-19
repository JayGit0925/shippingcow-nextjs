import type { Testimonial } from '@/lib/types';

const STATS = [
  { value: '2.4M+', label: 'Shipments routed' },
  { value: '28%', label: 'Average cost reduction' },
  { value: '1,800+', label: 'Active sellers' },
  { value: '$9.2M', label: 'Saved for sellers this year' },
];

const TESTIMONIALS: Testimonial[] = [
  {
    author: 'Maria Chen',
    role: 'Head of Ops',
    company: 'Brightvine Apparel',
    quote:
      "We ship 4,000 packages a month. ShippingCow cut our per-label cost by 31% in the first 90 days without touching our 3PL setup. The ROI is embarrassingly obvious.",
    metric: '31%',
    metricLabel: 'cost reduction',
  },
  {
    author: 'Derek Osei',
    role: 'Founder',
    company: 'CanvasRoost',
    quote:
      'I was skeptical it would work for heavy items, but ShippingCow found regional carriers I had never heard of. My freight bill dropped by $18K in the first quarter.',
    metric: '$18K',
    metricLabel: 'saved in Q1',
  },
  {
    author: 'Priya Nair',
    role: 'E-Commerce Director',
    company: 'SunRoot Wellness',
    quote:
      "Integration took four hours including testing. We were live the same afternoon. Our team didn't change anything — rates just got better.",
    metric: '4 hrs',
    metricLabel: 'to go live',
  },
];

export default function SocialProof() {
  return (
    <section style={{ padding: '5rem 1.5rem', background: '#fff' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>

        {/* Stats bar */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '2rem',
            background: '#1E40AF',
            border: '3px solid #1A202C',
            borderRadius: 12,
            boxShadow: '5px 5px 0 #1A202C',
            padding: '2.5rem 2rem',
            marginBottom: '4rem',
            textAlign: 'center',
          }}
        >
          {STATS.map((s) => (
            <div key={s.label}>
              <div
                style={{
                  fontSize: 'clamp(1.75rem, 4vw, 2.5rem)',
                  fontWeight: 800,
                  color: '#F97316',
                  lineHeight: 1,
                  marginBottom: '0.35rem',
                }}
              >
                {s.value}
              </div>
              <div
                style={{
                  fontSize: '0.875rem',
                  color: '#BFDBFE',
                  fontWeight: 500,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                }}
              >
                {s.label}
              </div>
            </div>
          ))}
        </div>

        {/* Testimonials */}
        <h2
          style={{
            textAlign: 'center',
            fontSize: 'clamp(1.5rem, 3.5vw, 2.25rem)',
            fontWeight: 800,
            color: '#111827',
            marginBottom: '2.5rem',
          }}
        >
          Sellers who switched to ShippingCow
        </h2>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '1.5rem',
          }}
        >
          {TESTIMONIALS.map((t) => (
            <div
              key={t.author}
              style={{
                border: '2px solid #E5E7EB',
                borderRadius: 10,
                padding: '1.75rem',
                background: '#F9FAFB',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
              }}
            >
              {t.metric && (
                <div>
                  <span
                    style={{
                      fontSize: '2rem',
                      fontWeight: 800,
                      color: '#1E40AF',
                      lineHeight: 1,
                    }}
                  >
                    {t.metric}
                  </span>
                  {t.metricLabel && (
                    <span
                      style={{
                        fontSize: '0.8rem',
                        color: '#6B7280',
                        marginLeft: 6,
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                      }}
                    >
                      {t.metricLabel}
                    </span>
                  )}
                </div>
              )}

              <p
                style={{
                  fontSize: '0.9375rem',
                  color: '#374151',
                  lineHeight: 1.65,
                  fontStyle: 'italic',
                  margin: 0,
                }}
              >
                &ldquo;{t.quote}&rdquo;
              </p>

              <div style={{ borderTop: '1px solid #E5E7EB', paddingTop: '0.75rem' }}>
                <div style={{ fontWeight: 700, fontSize: '0.875rem', color: '#111827' }}>
                  {t.author}
                </div>
                <div style={{ fontSize: '0.8rem', color: '#6B7280' }}>
                  {t.role} · {t.company}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
