import { SITE_URL } from '@/lib/site';

// Single source for the global JSON-LD @graph rendered on every page by
// components/JsonLd.tsx. Kept as plain TS so node-env vitest can audit the
// payload (red lines: no divisors, no dollar figures, no delivery promises).
//
// NOTE: no postalAddress is emitted — there is no verified public street
// address in this repo. Do not invent one. sc-devops/PM to supply first.
export function buildJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': `${SITE_URL}/#organization`,
        name: 'ShippingCow',
        url: SITE_URL,
        logo: `${SITE_URL}/icon.svg`,
        description:
          'ShippingCow is the self-operated US 3PL built for 50–149 lb heavy DTC parcels.',
        parentOrganization: {
          '@type': 'Organization',
          name: 'Logistar',
        },
        areaServed: 'US',
        sameAs: [
          'https://twitter.com/shippingcow',
          'https://linkedin.com/company/shippingcow',
        ],
      },
      {
        '@type': 'WebSite',
        '@id': `${SITE_URL}/#website`,
        url: SITE_URL,
        name: 'ShippingCow',
        description: 'The self-operated US 3PL built for 50–149 lb parcels.',
        publisher: { '@id': `${SITE_URL}/#organization` },
      },
      {
        '@type': 'Service',
        '@id': `${SITE_URL}/#service`,
        name: 'Heavy-parcel 3PL fulfillment (50–149 lb)',
        serviceType: 'Third-party logistics (3PL)',
        provider: { '@id': `${SITE_URL}/#organization` },
        areaServed: 'US',
        description:
          'Self-operated US 3PL for 50–149 lb parcels: receiving, storage, pick, pack, and last-mile on a below-market heavy-parcel ground rate, backed by a written, capped guarantee on the controllable segment.',
      },
    ],
  };
}
