import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import matter from 'gray-matter';
import { BLOG_CATEGORIES } from '../lib/blog';

const POSTS = [
  'fedex-fuel-surcharge-2026',
  'fedex-accessorial-charges-heavy-packages',
];

const CLAIMS_REGEX =
  /DIM ?(225|285|221)|÷ ?(225|285|221)|2.day|two.day|zero shrinkage|guaranteed deliver|\$15M|80% off/i;

const load = (slug: string) => {
  const raw = readFileSync(
    join(__dirname, '..', 'content', 'blog', `${slug}.mdx`),
    'utf8',
  );
  return { raw, ...matter(raw) };
};

describe.each(POSTS)('blog post %s (PRD D-2)', (slug) => {
  it('has complete frontmatter and is published', () => {
    const { data } = load(slug);
    expect(data.title).toBeTruthy();
    expect(data.date).toMatch(/^2026-\d{2}-\d{2}$/);
    expect(BLOG_CATEGORIES).toContain(data.category);
    expect(data.excerpt).toBeTruthy();
    expect(data.readingTime).toMatch(/min/);
    expect(data.draft).not.toBe(true);
  });

  it('internal-links the calculator and the free audit', () => {
    const { content } = load(slug);
    expect(content).toMatch(/\]\(\/calculator\)/);
    expect(content).toMatch(/\]\(\/audit\)/);
  });

  it('is answer-first: substantial copy before the first ## heading', () => {
    const { content } = load(slug);
    const lead = content.split(/^## /m)[0].trim();
    expect(lead.length).toBeGreaterThan(200);
  });

  it('passes the banned-claims grep', () => {
    const { raw } = load(slug);
    expect(raw).not.toMatch(CLAIMS_REGEX);
  });
});

describe('2026 rate-fact citations (PRD D-2)', () => {
  it('fuel post cites the December 2025 22% crossing and the EIA lag', () => {
    const { content } = load('fedex-fuel-surcharge-2026');
    expect(content).toContain('December 2025');
    expect(content).toContain('22%');
    expect(content).toMatch(/EIA/);
  });

  it('accessorial post cites the January 2026 Overmax fee', () => {
    const { content } = load('fedex-accessorial-charges-heavy-packages');
    expect(content).toContain('January 15, 2026');
    expect(content).toMatch(/\$17|\$25/);
  });
});
