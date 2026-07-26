import { SITE_URL } from '@/lib/site';
import type { MetadataRoute } from 'next';

// TSK-WEB-07 (PRD C-3): AI answer engines are a citation channel, so the
// crawlers behind them are allowed by name — a future blanket bot-block must
// not silently catch them. Private paths stay closed to everyone.
const DISALLOW = ['/dashboard/', '/api/', '/_next/'];
const AI_CRAWLERS = [
  'GPTBot',
  'OAI-SearchBot',
  'PerplexityBot',
  'ClaudeBot',
  'anthropic-ai',
  'Google-Extended',
  'Bingbot',
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      ...AI_CRAWLERS.map((userAgent) => ({
        userAgent,
        allow: '/',
        disallow: DISALLOW,
      })),
      { userAgent: '*', allow: '/', disallow: DISALLOW },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
