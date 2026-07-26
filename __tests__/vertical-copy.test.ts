import { describe, it, expect } from 'vitest';
import {
  VERTICAL_SLUGS,
  VERTICALS,
  BENEFIT_BULLETS,
  FAQ_ITEMS,
  buildVerticalJsonLd,
} from '@/lib/vertical-copy';
import { SITE_URL } from '@/lib/site';
import * as copyModule from '@/lib/vertical-copy';

const flat = JSON.stringify(copyModule);

describe('vertical registry', () => {
  it('exposes the three PRD D-1 slugs', () => {
    expect([...VERTICAL_SLUGS]).toEqual([
      'heavy-goods-fulfillment',
      'furniture-fulfillment',
      'fitness-equipment-fulfillment',
    ]);
  });

  it('swaps only the H1 noun per vertical', () => {
    expect(VERTICALS['heavy-goods-fulfillment'].h1).toBe(
      'The self-operated US 3PL built for 50–149 lb furniture and fitness goods.'
    );
    expect(VERTICALS['furniture-fulfillment'].h1).toBe(
      'The self-operated US 3PL built for 50–149 lb furniture.'
    );
    expect(VERTICALS['fitness-equipment-fulfillment'].h1).toBe(
      'The self-operated US 3PL built for 50–149 lb fitness equipment.'
    );
  });

  it('master shows both proof lines, variants show one', () => {
    expect(VERTICALS['heavy-goods-fulfillment'].proofLines).toEqual(['furniture', 'fitness']);
    expect(VERTICALS['furniture-fulfillment'].proofLines).toEqual(['furniture']);
    expect(VERTICALS['fitness-equipment-fulfillment'].proofLines).toEqual(['fitness']);
  });

  it('carries the full approved body', () => {
    expect(BENEFIT_BULLETS).toHaveLength(8);
    expect(FAQ_ITEMS).toHaveLength(6);
  });
});

describe('JSON-LD', () => {
  const graph = (buildVerticalJsonLd('furniture-fulfillment') as any)['@graph'];

  it('emits FAQPage with all 6 approved Q&As', () => {
    const faq = graph.find((n: any) => n['@type'] === 'FAQPage');
    expect(faq.mainEntity).toHaveLength(6);
    expect(faq['@id']).toBe(`${SITE_URL}/furniture-fulfillment#faq`);
  });

  it('emits Service linked to the site Organization', () => {
    const svc = graph.find((n: any) => n['@type'] === 'Service');
    expect(svc.provider['@id']).toBe(`${SITE_URL}/#organization`);
    expect(svc.areaServed).toBe('US');
    expect(svc.name).toMatch(/50–149 lb/);
  });
});

describe('red lines (approved-copy hygiene)', () => {
  it('contains no DIM divisors', () => {
    expect(flat).not.toMatch(/\b(225|285|221)\b/);
  });

  it('contains no transit promises or banned claims', () => {
    expect(flat).not.toMatch(/2.day|two.day/i);
    expect(flat).not.toMatch(/guaranteed? deliver/i);
    expect(flat).not.toMatch(/zero shrinkage/i);
    expect(flat).not.toMatch(/\$15M|80% off/i);
  });

  it('only approved market-size dollar figures appear', () => {
    const dollars = [...new Set(flat.match(/\$[\d.,]+[A-Za-z]*/g) ?? [])].sort();
    expect(dollars).toEqual(['$47B', '$4B'].sort());
  });

  it('contains no unfilled placeholders or citation markers', () => {
    expect(flat).not.toMatch(/\[X%\]|\[\$X\]/);
    expect(flat).not.toMatch(/\[(H-comp|C-sla|A-tam|G-geo|logistar-[\w-]+)\]/);
  });

  it('respects entity naming (DEC-007)', () => {
    expect(flat).not.toMatch(/Shipping Cow/);
    expect(flat).not.toMatch(/壹仓|Logistar/i);
  });
});
