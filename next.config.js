/** @type {import('next').NextConfig} */
const { withSentryConfig } = require('@sentry/nextjs');

const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverComponentsExternalPackages: ['better-sqlite3'],
  },
  async redirects() {
    return [
      {
        // Unpublished 2026-07-22 (Jay): the article's entire thesis was a
        // ShippingCow DIM divisor claim plus a 38–39% savings figure, both of
        // which are banned from public surfaces. 301 to the live DIM explainer
        // so the slug's inbound links and equity are not thrown away.
        source: '/blog/dim-225-advantage',
        destination: '/blog/dim-weight-calculator-guide',
        permanent: true,
      },
    ];
  },
};

module.exports = withSentryConfig(nextConfig, {
  silent: true,
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
}, {
  hideSourceMaps: true,
  widenClientFileUpload: true,
});
