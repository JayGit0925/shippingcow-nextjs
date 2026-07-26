# Vertical Landing Scaffolds (TSK-WEB-08) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the three vertical landing pages (`/heavy-goods-fulfillment` master + `/furniture-fulfillment`, `/fitness-equipment-fulfillment` variants) as noindex scaffolds with shared body, JSON-LD, and internal links from the comparison page — publish (sitemap + index) stays behind GATE-LANDED-COST.

**Architecture:** All copy lives in a plain-TS data module (`lib/vertical-copy.ts`) transcribed 1:1 from the approved copy doc (`logistar:shippingcow/content/copy_vertical-landing-and-comparison_shippingcow_2026-07-20.md`, PAGE 1), with citation markers (`[H-comp]` etc.) stripped — vitest's rolldown transform can't parse .tsx, so everything testable stays in .ts. A shared server component (`components/VerticalLanding.tsx`) renders any vertical from its config; three thin `app/*/page.tsx` files supply metadata (canonical + `robots: { index: false, follow: true }`) and pick the vertical. JSON-LD (FAQPage + Service) is built by a lib function so tests can audit it flat.

**Tech Stack:** Next.js 14 App Router, vitest (node env, `@` alias = repo root), inline-style pattern copied from `app/heavy-3pl-comparison/page.tsx`.

## Global Constraints

- Copy is **1:1 transcription** from the approved doc — no copy invention. Only permitted edits: strip citation markers (`[H-comp]`, `[C-sla]`, `[A-tam]`, `[G-geo]`, `[logistar-2026-outbound-triggers]`), swap H1 noun + hero-example nouns per vertical using only nouns already in the doc.
- Pages ship **noindex** (`robots: { index: false, follow: true }`) and are **NOT added to `app/sitemap.ts`** — GATE-LANDED-COST gates publishing.
- `[X%]` / `[$X]` placeholders must not appear (the approved PAGE 1 body contains none; tests enforce).
- Red lines: no DIM divisors (225/285/221), no `2-day`/`two-day`, no `guaranteed deliver*`, no `zero shrinkage`, no `$15M`, no `壹仓`/`Logistar` in copy, entity name `ShippingCow` (never `Shipping Cow` in copy). Allowed dollar strings: exactly `$47B` and `$4B` (approved market-size stats).
- Palette `#0052C9` / `#FEB81B` / `#1A202C` (DEC-006).
- Commits: `git -c user.email=noreply@anthropic.com -c user.name=Claude commit ...` with the house trailers.

---

### Task 1: Copy data module + JSON-LD builder (`lib/vertical-copy.ts`)

**Files:**
- Create: `lib/vertical-copy.ts`
- Test: `__tests__/vertical-copy.test.ts`

**Interfaces:**
- Produces: `VERTICAL_SLUGS: readonly ['heavy-goods-fulfillment','furniture-fulfillment','fitness-equipment-fulfillment']`; `type VerticalSlug`; `VERTICALS: Record<VerticalSlug, VerticalConfig>` where `VerticalConfig = { slug, h1, heroExamples, metaTitle, metaDescription, proofLines: ProofKey[] }`; `SUBHEAD_TEMPLATE(examples: string): string`; `PRIMARY_CTA`, `SECONDARY_CTA`, `BENEFIT_HEADING`, `BENEFIT_BULLETS: {title,body}[]` (8), `PROOF_LINES: Record<'furniture'|'fitness', string>`, `CLOSING: {headline, body, button}`, `FAQ_HEADING`, `FAQ_ITEMS: {question,answer}[]` (6), `buildVerticalJsonLd(slug: VerticalSlug): object`.

- [ ] **Step 1: Write the failing test** — `__tests__/vertical-copy.test.ts`:

```ts
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
```

- [ ] **Step 2: Run test to verify it fails** — `npx vitest run __tests__/vertical-copy.test.ts` → FAIL: cannot resolve `@/lib/vertical-copy`.

- [ ] **Step 3: Write `lib/vertical-copy.ts`** — transcribe PAGE 1 of the approved copy doc verbatim (citation markers stripped). Structure:

```ts
import { SITE_URL } from '@/lib/site';

export const VERTICAL_SLUGS = [
  'heavy-goods-fulfillment',
  'furniture-fulfillment',
  'fitness-equipment-fulfillment',
] as const;
export type VerticalSlug = (typeof VERTICAL_SLUGS)[number];
export type ProofKey = 'furniture' | 'fitness';

export interface VerticalConfig {
  slug: VerticalSlug;
  h1: string;
  heroExamples: string;
  metaTitle: string;
  metaDescription: string;
  proofLines: ProofKey[];
}

// H1 noun + hero-example swaps use only nouns from the approved doc
// (master list line 38; furniture/fitness nouns from the proof lines).
export const VERTICALS: Record<VerticalSlug, VerticalConfig> = { /* three entries */ };

export const SUBHEAD_TEMPLATE = (examples: string) =>
  `Most 3PLs are tuned for 1–3 lb boxes and quietly steer heavy SKUs away. ShippingCow does the opposite: ${examples} are the whole business. Your goods live in our own US warehouse; we pick, pack, and ship the last mile on a heavy-parcel rate floor ordinary 3PLs can't match — with a written, penalty-backed guarantee on the segment we control.`;

// PRIMARY_CTA / SECONDARY_CTA / BENEFIT_BULLETS (8) / PROOF_LINES / CLOSING /
// FAQ_ITEMS (6) — verbatim from doc lines 40–63 and 67–86, markers stripped.

export function buildVerticalJsonLd(slug: VerticalSlug) {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      { '@type': 'FAQPage', '@id': `${SITE_URL}/${slug}#faq`,
        mainEntity: FAQ_ITEMS.map((f) => ({ '@type': 'Question', name: f.question,
          acceptedAnswer: { '@type': 'Answer', text: f.answer } })) },
      { '@type': 'Service', '@id': `${SITE_URL}/${slug}#service`,
        name: 'Heavy-parcel 3PL fulfillment (50–149 lb)',
        provider: { '@id': `${SITE_URL}/#organization` }, areaServed: 'US',
        description: 'Self-operated US 3PL for 50–149 lb parcels: receiving, storage, pick, pack, and last-mile on a below-market heavy-parcel ground rate, backed by a written, capped guarantee on the controllable segment.' },
    ],
  };
}
```

- [ ] **Step 4: Run test to verify it passes** — `npx vitest run __tests__/vertical-copy.test.ts` → PASS (14 tests).
- [ ] **Step 5: Commit** — `feat: add vertical landing copy module + JSON-LD builder (TSK-WEB-08)`

### Task 2: Shared body component + three noindex pages

**Files:**
- Create: `components/VerticalLanding.tsx`
- Create: `app/heavy-goods-fulfillment/page.tsx`, `app/furniture-fulfillment/page.tsx`, `app/fitness-equipment-fulfillment/page.tsx`
- Test: `__tests__/vertical-pages-static.test.ts`

**Interfaces:**
- Consumes: everything from Task 1.
- Produces: `VerticalLanding({ slug }: { slug: VerticalSlug })` server component; three routes.

- [ ] **Step 1: Write the failing static test** — `__tests__/vertical-pages-static.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = join(__dirname, '..');
const read = (p: string) => readFileSync(join(root, p), 'utf8');
const SLUGS = ['heavy-goods-fulfillment', 'furniture-fulfillment', 'fitness-equipment-fulfillment'];

describe.each(SLUGS)('app/%s/page.tsx', (slug) => {
  const src = read(`app/${slug}/page.tsx`);
  it('ships noindex until GATE-LANDED-COST clears', () => {
    expect(src).toMatch(/robots:\s*\{\s*index:\s*false,\s*follow:\s*true\s*\}/);
  });
  it('renders the shared body for its slug', () => {
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
```

- [ ] **Step 2: Run to verify it fails** — page files don't exist → ENOENT.
- [ ] **Step 3: Implement** — `VerticalLanding.tsx` mirrors the comparison page's section/inline-style pattern (hero gradient, benefit list with `#FEB81B` accents, FAQ H3 blocks, dark `#1A202C` closing band, `<script type="application/ld+json">` from `buildVerticalJsonLd`). Each page:

```tsx
import type { Metadata } from 'next';
import VerticalLanding from '@/components/VerticalLanding';
import { VERTICALS } from '@/lib/vertical-copy';
import { SITE_URL } from '@/lib/site';

const v = VERTICALS['furniture-fulfillment'];
export const metadata: Metadata = {
  title: v.metaTitle,
  description: v.metaDescription,
  alternates: { canonical: `${SITE_URL}/${v.slug}` },
  robots: { index: false, follow: true },
};
export default function Page() {
  return <VerticalLanding slug="furniture-fulfillment" />;
}
```

(Note: the static test checks `'${slug}'` — pass the slug string with single quotes somewhere in the file, e.g. `VERTICALS['furniture-fulfillment']`.)

- [ ] **Step 4: Run tests** — `npx vitest run` → all pass.
- [ ] **Step 5: Commit** — `feat: add /heavy-goods-fulfillment + vertical variants as noindex scaffolds (TSK-WEB-08)`

### Task 3: Internal links from comparison page + full verification

**Files:**
- Modify: `app/heavy-3pl-comparison/page.tsx` (add a navigational link block after the FAQ section)
- Modify: `__tests__/vertical-pages-static.test.ts` (add link assertions)

- [ ] **Step 1: Extend static test**:

```ts
describe('internal links (PRD D-1)', () => {
  it('comparison page links to all three vertical pages', () => {
    const src = read('app/heavy-3pl-comparison/page.tsx');
    for (const slug of SLUGS) expect(src).toContain(`/${slug}`);
  });
});
```

- [ ] **Step 2: Verify it fails**, then add a short navigational block (no new claims — link labels are the page nouns only: "Heavy goods fulfillment · Furniture fulfillment · Fitness equipment fulfillment").
- [ ] **Step 3: Full verification**:
  - `npx vitest run` → 32 baseline + new tests all pass
  - `npm run build` → success; confirm the three routes appear in the route list
  - Claims grep (PRD §4): `grep -rniE "DIM ?(225|285|221)|÷ ?(225|285|221)|2.day|two.day|zero shrinkage|guaranteed deliver|\$15M|80% off" app/ components/ lib/` → no new hits
  - Served-HTML spot check: `next start`, curl each vertical route → 200, `noindex` in the rendered `<meta name="robots">`, FAQPage JSON-LD present
- [ ] **Step 4: Commit** — `feat: link vertical landings from comparison page (TSK-WEB-08)`

## AC (from PRD D-1)

- Three routes render behind `noindex`; sitemap untouched.
- Shared body component; copy 1:1 from approved doc; JSON-LD (FAQPage + Service) on each page.
- Internal links from `/heavy-3pl-comparison`.
- No `[X%]`/`[$X]`, no red-line strings, no new claims-grep hits.
