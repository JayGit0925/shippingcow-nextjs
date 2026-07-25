import Link from 'next/link';
import type { Metadata } from 'next';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://shippingcow.ai';

export const metadata: Metadata = {
  title:
    '3PLs That Handle 50–149 lb: ShippingCow vs ShipBob vs ShipMonk vs Red Stag (2026)',
  description:
    'The honest split on heavy-parcel 3PLs: who actually handles 50–149 lb, who steers it away, and where each provider is genuinely the right call. Updated 2026.',
  alternates: { canonical: `${siteUrl}/heavy-3pl-comparison` },
};

const LAST_UPDATED = '2026-07-25';

const VERDICTS = [
  {
    name: 'ShipBob',
    verdict:
      'Great for light, fast-moving DTC; not built for 50–149 lb. No financial service-level guarantee. Ancillary fees can stack on heavy SKUs.',
  },
  {
    name: 'ShipMonk',
    verdict:
      'Flexible light-to-mid DTC with a low monthly minimum; heavy items are an exception, and its SLA pauses during peak ("Spike Protection").',
  },
  {
    name: 'Red Stag',
    verdict:
      'The genuine US heavy specialist with an aggressive paid-penalty guarantee. Best-in-class on US-domestic heavy fulfillment; carrier-list last-mile pricing, English-only.',
  },
  {
    name: 'ShippingCow',
    verdict:
      'A self-operated US heavy specialist in the same lane, differentiated by a below-market last-mile cost floor (GS ~17% below FedEx Home / ~28% below UPS), a written, capped, paid guarantee, and a bilingual, one-responsible-party operation built for brands sourcing from China.',
  },
];

const TABLE_ROWS: [string, string, string, string, string][] = [
  ['Core sweet spot', '50–149 lb heavy/bulky', '1–5 lb light DTC', 'Light-to-mid DTC', 'Heavy/bulky, US-domestic'],
  ['50–149 lb band', 'Default business', 'Steers away', 'Exception', 'Yes'],
  ['Self-operated US warehouse', 'Yes (own network)', 'Own + partner nodes', 'Own network', 'Yes (own network)'],
  ['Last-mile cost floor', 'GS ~17% below FedEx Home / ~28% below UPS', 'Carrier list-based', 'Carrier list-based', 'Carrier list-based'],
  ['Written, paid loss/accuracy SLA', 'Yes (controllable segment, paid at your cost)', 'No financial SLA', 'Yes, but pauses in peak', 'Yes (industry-leading)'],
  ['Chinese-language, one responsible party', 'Yes', 'No', 'No', 'No'],
  ['Best for', 'Heavy sellers — esp. China-sourced — wanting a below-market rate + a team in their language', 'Light DTC scaling fast', 'Light DTC wanting flexibility', 'US-domestic heavy sellers'],
];

const RIGHT_CALL = [
  {
    title: 'Choose Red Stag',
    body: "if you want the most established US-domestic heavy 3PL with an aggressive paid-penalty SLA and don't need a below-market rate or bilingual support. It's an excellent operator in this category.",
  },
  {
    title: 'Choose ShipBob or ShipMonk',
    body: 'if your SKUs are light, standardized, and fast-moving, and heavy items are a rounding error in your catalog.',
  },
  {
    title: 'Choose ShippingCow',
    body: 'if you ship 50–149 lb parcels, want a below-market last-mile cost floor that shows up on every order, a written paid guarantee, and — if you source from China — a bilingual team and single responsible party for your US fulfillment.',
  },
];

const FAQ_ITEMS = [
  {
    question: 'Which 3PLs can handle packages over 50 lb?',
    answer:
      'Few mainstream 3PLs are built for 50+ lb goods. ShipBob and ShipMonk optimize for light DTC and steer heavy items away. Red Stag and ShippingCow both specialize in heavy fulfillment from their own US warehouses. ShippingCow differentiates on a below-market last-mile rate, a paid loss/accuracy guarantee, and bilingual one-responsible-party service.',
  },
  {
    question: 'Is Red Stag or ShippingCow better for heavy fulfillment?',
    answer:
      'Both are self-operated US heavy specialists. Red Stag is the most established, with an aggressive paid-penalty guarantee. ShippingCow competes on a below-market last-mile cost floor (roughly 17% below FedEx Home), a written paid guarantee, and bilingual single-operator service for brands sourcing from China — advantages that show up on every order.',
  },
  {
    question: 'Why is ShipBob more expensive for heavy items?',
    answer:
      'ShipBob is engineered for light, standardized DTC parcels, so heavy SKUs fall outside its optimized workflow and trigger additional-handling and oversize fees. Reported all-in ancillary charges can climb meaningfully as a share of order cost on bulky items, and ShipBob provides no financial service-level guarantee to offset loss or damage on heavy goods.',
  },
  {
    question: 'What is the cheapest way to ship 50–149 lb ecommerce orders in 2026?',
    answer:
      "The last-mile carrier rate dominates landed cost for this weight band, so the cheapest path pairs a below-market ground rate with disciplined packaging to dodge 2026's cubic-volume and oversize surcharges. A last-mile rate roughly 17% below FedEx Home and 28% below UPS is the biggest lever. A free Cost Audit returns your exact number.",
  },
  {
    question: 'What should I look for in a heavy-goods 3PL?',
    answer:
      'Look for genuine 50–149 lb specialization (not light-DTC pricing bent to fit), a self-operated warehouse network, a real last-mile cost floor, a written and capped loss/accuracy guarantee reimbursed at your product cost, and clear scope on what’s covered versus excluded. Bilingual support matters if you source from China.',
  },
  {
    question: 'Do I need to handle my own importing to use ShippingCow?',
    answer:
      "ShippingCow's core service starts at its US warehouse: you get goods into the US the way you already do, and we run fulfillment and last-mile from there. Ocean first-leg and customs support exists for qualified accounts on request, but the standard offer — and the pricing above — is US warehousing and heavy-parcel last-mile.",
  },
];

function ComparisonJsonLd() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'FAQPage',
        '@id': `${siteUrl}/heavy-3pl-comparison#faq`,
        mainEntity: FAQ_ITEMS.map((f) => ({
          '@type': 'Question',
          name: f.question,
          acceptedAnswer: { '@type': 'Answer', text: f.answer },
        })),
      },
      {
        '@type': 'Service',
        '@id': `${siteUrl}/heavy-3pl-comparison#service`,
        name: 'Heavy-parcel 3PL fulfillment (50–149 lb)',
        provider: { '@id': `${siteUrl}/#organization` },
        areaServed: 'US',
        description:
          'Self-operated US 3PL for 50–149 lb parcels: receiving, storage, pick, pack, and last-mile on a below-market heavy-parcel ground rate, backed by a written, capped guarantee on the controllable segment.',
      },
    ],
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

const sectionStyle: React.CSSProperties = {
  maxWidth: 960,
  margin: '0 auto',
  padding: '48px 24px',
};

export default function Heavy3plComparisonPage() {
  return (
    <>
      <ComparisonJsonLd />

      {/* ===== HERO ===== */}
      <section style={{ background: 'linear-gradient(180deg,#EAF0FC 0%,#fff 100%)' }}>
        <div style={{ ...sectionStyle, paddingTop: 72 }}>
          <p style={{ color: '#64748B', fontSize: 14, marginBottom: 12 }}>
            Last updated: {LAST_UPDATED}
          </p>
          <h1 style={{ fontSize: 40, lineHeight: 1.15, fontWeight: 800, color: '#1A202C', marginBottom: 20 }}>
            3PLs that actually handle 50–149 lb: ShippingCow vs ShipBob vs ShipMonk vs Red Stag (2026)
          </h1>
          <p style={{ fontSize: 18, lineHeight: 1.6, color: '#334155', maxWidth: 760 }}>
            Most &ldquo;heavy&rdquo; 3PL lists mix apples and forklifts. Here&rsquo;s the honest split: two
            platforms optimized for light DTC that steer heavy goods away, one excellent US-domestic heavy
            specialist, and one self-operated heavy specialist built around a below-market last-mile rate and a
            bilingual, one-responsible-party operation for brands sourcing from China. Pick by where your problem
            actually lives.
          </p>
          <div style={{ marginTop: 28 }}>
            <Link
              href="/audit"
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
              Get a free Cost Audit
            </Link>
            <p style={{ color: '#64748B', fontSize: 14, marginTop: 10 }}>
              We&rsquo;ll show your true landed cost per order against your current provider, heavy SKU by heavy SKU.
            </p>
          </div>
        </div>
      </section>

      {/* ===== VERDICTS ===== */}
      <section style={sectionStyle}>
        <h2 style={{ fontSize: 28, fontWeight: 800, color: '#1A202C', marginBottom: 24 }}>
          The one-line verdict per provider
        </h2>
        <div style={{ display: 'grid', gap: 16 }}>
          {VERDICTS.map((v) => (
            <div
              key={v.name}
              style={{
                border: '1px solid #E2E8F0',
                borderRadius: 12,
                padding: '20px 24px',
                background: v.name === 'ShippingCow' ? '#F0F6FF' : '#fff',
              }}
            >
              <strong style={{ color: '#1A202C' }}>{v.name}</strong>
              <p style={{ color: '#334155', marginTop: 6, lineHeight: 1.6 }}>{v.verdict}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ===== COMPARISON TABLE ===== */}
      <section style={sectionStyle}>
        <h2 style={{ fontSize: 28, fontWeight: 800, color: '#1A202C', marginBottom: 24 }}>
          Side by side: heavy-parcel capability in 2026
        </h2>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 15, minWidth: 720 }}>
            <thead>
              <tr style={{ background: '#1A202C', color: '#fff', textAlign: 'left' }}>
                <th style={{ padding: '12px 14px' }} />
                <th style={{ padding: '12px 14px' }}>ShippingCow</th>
                <th style={{ padding: '12px 14px' }}>ShipBob</th>
                <th style={{ padding: '12px 14px' }}>ShipMonk</th>
                <th style={{ padding: '12px 14px' }}>Red Stag</th>
              </tr>
            </thead>
            <tbody>
              {TABLE_ROWS.map(([label, sc, sb, sm, rs], i) => (
                <tr key={label} style={{ background: i % 2 ? '#F8FAFC' : '#fff' }}>
                  <td style={{ padding: '12px 14px', fontWeight: 700, color: '#1A202C' }}>{label}</td>
                  <td style={{ padding: '12px 14px', color: '#334155', background: i % 2 ? '#EAF2FE' : '#F0F6FF' }}>{sc}</td>
                  <td style={{ padding: '12px 14px', color: '#334155' }}>{sb}</td>
                  <td style={{ padding: '12px 14px', color: '#334155' }}>{sm}</td>
                  <td style={{ padding: '12px 14px', color: '#334155' }}>{rs}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p style={{ color: '#64748B', fontSize: 13, marginTop: 12, lineHeight: 1.6 }}>
          Rate framing is public and directional; run a Cost Audit for your exact landed number. Competitor
          capabilities per their public materials and third-party reviews, 2026.
        </p>
      </section>

      {/* ===== WHERE EACH IS RIGHT ===== */}
      <section style={sectionStyle}>
        <h2 style={{ fontSize: 28, fontWeight: 800, color: '#1A202C', marginBottom: 24 }}>
          Where each provider is genuinely the right call
        </h2>
        <div style={{ display: 'grid', gap: 16 }}>
          {RIGHT_CALL.map((r) => (
            <div key={r.title} style={{ borderLeft: '4px solid #FEB81B', paddingLeft: 18 }}>
              <strong style={{ color: '#1A202C' }}>{r.title}</strong>{' '}
              <span style={{ color: '#334155', lineHeight: 1.6 }}>{r.body}</span>
            </div>
          ))}
        </div>

        <h2 style={{ fontSize: 28, fontWeight: 800, color: '#1A202C', margin: '40px 0 16px' }}>
          The gap we fill
        </h2>
        <p style={{ color: '#334155', lineHeight: 1.7, maxWidth: 800 }}>
          On 50–149 lb parcels the last-mile carrier rate dominates landed cost, and most heavy 3PLs pass
          carrier-list pricing straight through. ShippingCow runs a below-market ground rate on this exact band,
          self-operates every warehouse touch, backs it with a paid guarantee, and serves China-sourcing brands in
          their own language with one responsible party. That combination — cost floor + paid SLA + bilingual
          single-operator — is the seam.
        </p>
      </section>

      {/* ===== FAQ ===== */}
      <section style={sectionStyle}>
        <h2 style={{ fontSize: 28, fontWeight: 800, color: '#1A202C', marginBottom: 24 }}>
          Frequently asked questions
        </h2>
        <div style={{ display: 'grid', gap: 24 }}>
          {FAQ_ITEMS.map((f) => (
            <div key={f.question}>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: '#1A202C', marginBottom: 8 }}>{f.question}</h3>
              <p style={{ color: '#334155', lineHeight: 1.7 }}>{f.answer}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ===== CLOSING CTA ===== */}
      <section style={{ background: '#1A202C' }}>
        <div style={{ ...sectionStyle, textAlign: 'center' }}>
          <h2 style={{ fontSize: 30, fontWeight: 800, color: '#fff', marginBottom: 12 }}>
            Compare on your real numbers, not a marketing table.
          </h2>
          <p style={{ color: '#CBD5E1', fontSize: 17, lineHeight: 1.6, marginBottom: 24 }}>
            Send one heavy SKU and a recent invoice → get your landed cost per order → run a 1-week paid pilot.
          </p>
          <Link
            href="/audit"
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
            Get my free Cost Audit
          </Link>
        </div>
      </section>
    </>
  );
}
