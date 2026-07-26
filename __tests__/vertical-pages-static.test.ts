import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = join(__dirname, '..');
const read = (p: string) => readFileSync(join(root, p), 'utf8');
const SLUGS = [
  'heavy-goods-fulfillment',
  'furniture-fulfillment',
  'fitness-equipment-fulfillment',
];

describe.each(SLUGS)('app/%s/page.tsx', (slug) => {
  it('ships noindex until GATE-LANDED-COST clears', () => {
    const src = read(`app/${slug}/page.tsx`);
    expect(src).toMatch(/robots:\s*\{\s*index:\s*false,\s*follow:\s*true\s*\}/);
  });

  it('renders the shared body for its slug', () => {
    const src = read(`app/${slug}/page.tsx`);
    expect(src).toMatch(/VerticalLanding/);
    expect(src).toContain(`'${slug}'`);
  });
});

describe('publish gate', () => {
  it('sitemap.ts does not list any vertical page', () => {
    const sitemap = read('app/sitemap.ts');
    for (const slug of SLUGS) expect(sitemap).not.toContain(slug);
  });
});
