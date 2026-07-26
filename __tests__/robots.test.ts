import { describe, it, expect } from 'vitest';
import robots from '@/app/robots';

// PRD C-3 (TSK-WEB-07): the 7 AI/search crawlers named in the approved copy
// doc must be explicitly allowed, and private paths stay closed to everyone.
const AI_BOTS = [
  'GPTBot', 'OAI-SearchBot', 'PerplexityBot', 'ClaudeBot',
  'anthropic-ai', 'Google-Extended', 'Bingbot',
];
const PRIVATE = ['/dashboard/', '/api/', '/_next/'];

describe('robots.txt (app/robots.ts)', () => {
  const result = robots();
  const rules = Array.isArray(result.rules) ? result.rules : [result.rules];

  it.each(AI_BOTS)('explicitly allows %s', (bot) => {
    const rule = rules.find((r) => r.userAgent === bot);
    expect(rule).toBeDefined();
    expect(rule!.allow).toBe('/');
  });

  it('keeps private paths disallowed for every rule, AI bots included', () => {
    for (const rule of rules) {
      expect(rule.disallow).toEqual(PRIVATE);
    }
  });

  it('keeps the wildcard rule and the sitemap pointer', () => {
    expect(rules.some((r) => r.userAgent === '*')).toBe(true);
    expect(String(result.sitemap)).toMatch(/\/sitemap\.xml$/);
  });
});
