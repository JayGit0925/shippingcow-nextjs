import { SITE_URL } from '@/lib/site';

// NOTE: no postalAddress is emitted — there is no verified public street address
// in this repo. Do not invent one. sc-devops/PM to supply before adding.
export default function JsonLd() {
  const jsonLd = {
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
        description:
          'The self-operated US 3PL built for 50–149 lb parcels.',
        publisher: { '@id': `${SITE_URL}/#organization` },
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
