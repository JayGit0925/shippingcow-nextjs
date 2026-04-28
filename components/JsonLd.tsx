const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://shippingcow.ai';

export default function JsonLd() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': `${siteUrl}/#organization`,
        name: 'Shipping Cow',
        url: siteUrl,
        logo: `${siteUrl}/icon.svg`,
        description:
          'AI-native logistics platform for heavy-goods e-commerce. Enterprise rates, zero shrinkage, guaranteed 2-day delivery.',
        sameAs: [
          'https://twitter.com/shippingcow',
          'https://linkedin.com/company/shippingcow',
        ],
      },
      {
        '@type': 'WebSite',
        '@id': `${siteUrl}/#website`,
        url: siteUrl,
        name: 'Shipping Cow',
        description:
          'Heavy goods 3PL & e-commerce fulfillment — cut shipping costs up to 80% with DIM 225 pricing.',
        publisher: { '@id': `${siteUrl}/#organization` },
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
