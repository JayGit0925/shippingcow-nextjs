import Link from 'next/link';
import {
  VERTICALS,
  type VerticalSlug,
  SUBHEAD_TEMPLATE,
  PRIMARY_CTA,
  SECONDARY_CTAS,
  BENEFIT_HEADING,
  BENEFIT_BULLETS,
  PROOF_LINES,
  CLOSING,
  FAQ_HEADING,
  FAQ_ITEMS,
  buildVerticalJsonLd,
} from '@/lib/vertical-copy';

const sectionStyle: React.CSSProperties = {
  maxWidth: 960,
  margin: '0 auto',
  padding: '48px 24px',
};

export default function VerticalLanding({ slug }: { slug: VerticalSlug }) {
  const v = VERTICALS[slug];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(buildVerticalJsonLd(slug)) }}
      />

      {/* ===== HERO ===== */}
      <section style={{ background: 'linear-gradient(180deg,#EAF0FC 0%,#fff 100%)' }}>
        <div style={{ ...sectionStyle, paddingTop: 72 }}>
          <h1 style={{ fontSize: 40, lineHeight: 1.15, fontWeight: 800, color: '#1A202C', marginBottom: 20 }}>
            {v.h1}
          </h1>
          <p style={{ fontSize: 18, lineHeight: 1.6, color: '#334155', maxWidth: 760 }}>
            {SUBHEAD_TEMPLATE(v.heroExamples)}
          </p>
          <div style={{ marginTop: 28 }}>
            <Link
              href={PRIMARY_CTA.href}
              style={{
                display: 'inline-block',
                background: '#0052C9',
                color: '#fff',
                fontWeight: 700,
                padding: '14px 28px',
                borderRadius: 8,
                textDecoration: 'none',
              }}
            >
              {PRIMARY_CTA.button}
            </Link>
            <p style={{ color: '#64748B', fontSize: 14, marginTop: 10, maxWidth: 640 }}>
              {PRIMARY_CTA.body}
            </p>
            <p style={{ fontSize: 14, marginTop: 12 }}>
              {SECONDARY_CTAS.map((c, i) => (
                <span key={c.href}>
                  {i > 0 && <span style={{ color: '#94A3B8', margin: '0 8px' }}>·</span>}
                  <Link href={c.href} style={{ color: '#0052C9', fontWeight: 600 }}>
                    {c.label}
                  </Link>
                </span>
              ))}
            </p>
          </div>
        </div>
      </section>

      {/* ===== BENEFITS ===== */}
      <section style={sectionStyle}>
        <h2 style={{ fontSize: 28, fontWeight: 800, color: '#1A202C', marginBottom: 24 }}>
          {BENEFIT_HEADING}
        </h2>
        <div style={{ display: 'grid', gap: 20 }}>
          {BENEFIT_BULLETS.map((b) => (
            <div key={b.title} style={{ borderLeft: '4px solid #FEB81B', paddingLeft: 18 }}>
              <strong style={{ color: '#1A202C' }}>{b.title}</strong>{' '}
              <span style={{ color: '#334155', lineHeight: 1.6 }}>{b.body}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ===== VERTICAL PROOF ===== */}
      <section style={{ background: '#F8FAFC' }}>
        <div style={sectionStyle}>
          <div style={{ display: 'grid', gap: 16 }}>
            {v.proofLines.map((key) => (
              <p key={key} style={{ color: '#334155', lineHeight: 1.7, maxWidth: 800, margin: 0 }}>
                <strong style={{ color: '#1A202C', textTransform: 'capitalize' }}>{key}:</strong>{' '}
                {PROOF_LINES[key]}
              </p>
            ))}
          </div>
        </div>
      </section>

      {/* ===== FAQ ===== */}
      <section style={sectionStyle}>
        <h2 style={{ fontSize: 28, fontWeight: 800, color: '#1A202C', marginBottom: 24 }}>
          {FAQ_HEADING}
        </h2>
        <div style={{ display: 'grid', gap: 24 }}>
          {FAQ_ITEMS.map((f) => (
            <div key={f.question}>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: '#1A202C', marginBottom: 8 }}>
                {f.question}
              </h3>
              <p style={{ color: '#334155', lineHeight: 1.7 }}>{f.answer}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ===== CLOSING CTA ===== */}
      <section style={{ background: '#1A202C' }}>
        <div style={{ ...sectionStyle, textAlign: 'center' }}>
          <h2 style={{ fontSize: 30, fontWeight: 800, color: '#fff', marginBottom: 12 }}>
            {CLOSING.headline}
          </h2>
          <p style={{ color: '#CBD5E1', fontSize: 17, lineHeight: 1.6, marginBottom: 24 }}>
            {CLOSING.body}
          </p>
          <Link
            href={CLOSING.href}
            style={{
              display: 'inline-block',
              background: '#FEB81B',
              color: '#1A202C',
              fontWeight: 800,
              padding: '14px 32px',
              borderRadius: 8,
              textDecoration: 'none',
            }}
          >
            {CLOSING.button}
          </Link>
        </div>
      </section>
    </>
  );
}
