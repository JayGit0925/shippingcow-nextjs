# GEO Crawler Readiness Implementation Plan (TSK-WEB-07)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make shippingcow.ai citable by AI answer engines — explicit robots.txt allowance for the 7 named AI crawlers, site-wide Service JSON-LD, and a visible "Last updated" date on the vertical-style money page.

**Architecture:** Three independent, tiny changes: `app/robots.ts` gains named-bot rules; `components/JsonLd.tsx` (rendered on every page via `app/layout.tsx`) gains a Service node in its existing `@graph`; `app/big-and-bulky/page.tsx` gains a visible dateline. No new routes, no new dependencies.

**Tech Stack:** Next.js 14 App Router metadata routes, schema.org JSON-LD, vitest (node environment — no jsdom).

## Global Constraints

- Source of truth: PRD WS-C item **C-3** (`shippingcow/website/prd_website_shippingcow_2026-07-25.md` in logistar) + GEO build notes in the approved copy doc (`shippingcow/content/copy_vertical-landing-and-comparison_shippingcow_2026-07-20.md`).
- Named crawlers (verbatim from spec): `GPTBot`, `OAI-SearchBot`, `PerplexityBot`, `ClaudeBot`, `anthropic-ai`, `Google-Extended`, `Bingbot`.
- Red lines: no DIM divisor values (225/285/221) in rendered copy or emitted JSON-LD; no dollar figures; savings framing only as "~17% below FedEx Home / ~28% below UPS on the last leg"; no transit/SLA promises; entity string `ShippingCow` (DEC-007 — one word in copy).
- Private paths stay disallowed for ALL crawlers, AI bots included: `/dashboard/`, `/api/`, `/_next/`.
- Tests run in vitest **node** environment; no jsdom. `@` alias = repo root.
- Commits: `git -c user.email=noreply@anthropic.com -c user.name=Claude commit`.

## Scope decisions (documented deviations)

1. **FAQPage schema is NOT extended in this task.** C-3 asks for Organization + Service + FAQPage "on money pages". Organization is already global (`components/JsonLd.tsx` via layout); FAQPage + Service already exist on `/heavy-3pl-comparison` (shipped with PR #7). The remaining money pages (`/`, `/calculator`, `/audit`, `/big-and-bulky`) have **no visible FAQ content**, and Google's guidelines require FAQPage markup to mirror on-page content. The approved FAQ copy in the copy doc belongs to the gated vertical pages (TSK-WEB-08, GATE-LANDED-COST). Emitting FAQPage without visible FAQs would be schema spam. FAQPage coverage therefore lands with TSK-WEB-08's pages.
2. **`components/FAQ.tsx` is dead code with legacy off-positioning copy** (label-routing product story, "$0/month Scout plan", "20–35%" claims). It is imported nowhere, so nothing renders it. Deleting it is out of scope here (not a C-3 deliverable) — logged in the PR body as a follow-up candidate for TSK-WEB-12 constants/legacy cleanup.
3. **"Last updated" placement:** `/heavy-3pl-comparison` already has it. The only other live comparison/vertical-style page is `/big-and-bulky` — it gets the dateline. Homepage/calculator/audit are not comparison/vertical pages per the spec.
4. **DEC-007 rider:** `/big-and-bulky` renders "Shipping Cow" (two words) in an H2. Fixing it is a one-word compliance correction on a file this task already touches — folded into Task 3.

## File Structure

- Modify: `app/robots.ts` — named AI-crawler rules
- Create: `__tests__/robots.test.ts`
- Modify: `components/JsonLd.tsx` — add Service node to `@graph`
- Create: `__tests__/jsonld.test.ts`
- Modify: `app/big-and-bulky/page.tsx` — visible dateline + DEC-007 fix
- Create: `__tests__/big-and-bulky-copy.test.ts` (static source check, claims-grep style)

---

### Task 1: robots.ts — explicit AI crawler allowance

**Files:**
- Modify: `app/robots.ts`
- Test: `__tests__/robots.test.ts`

**Interfaces:**
- Consumes: `SITE_URL` from `@/lib/site` (existing).
- Produces: default export `robots(): MetadataRoute.Robots` whose `rules` is an ARRAY: 7 named-bot rules + the existing wildcard rule, all with `allow: '/'` and `disallow: ['/dashboard/', '/api/', '/_next/']`.

- [ ] **Step 1: Write the failing test**

```ts
// __tests__/robots.test.ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run __tests__/robots.test.ts`
Expected: FAIL — named-bot rules undefined (current `rules` is a single wildcard object).

- [ ] **Step 3: Write the implementation**

```ts
// app/robots.ts
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run __tests__/robots.test.ts`
Expected: PASS (3 test blocks, 9 assertions total via `it.each`).

- [ ] **Step 5: Commit**

```bash
git add app/robots.ts __tests__/robots.test.ts
git -c user.email=noreply@anthropic.com -c user.name=Claude commit -m "feat: allow named AI crawlers in robots.txt (TSK-WEB-07)"
```

### Task 2: Site-wide Service JSON-LD

**Files:**
- Modify: `components/JsonLd.tsx`
- Test: `__tests__/jsonld.test.ts`

**Interfaces:**
- Consumes: existing `JsonLd()` component. **Execution deviation:** vitest's rolldown transform cannot parse `.tsx` imports in this repo's node-env setup, so the `@graph` object is extracted to `lib/jsonld.ts` (`export function buildJsonLd()`); `components/JsonLd.tsx` becomes a thin renderer and the test imports `buildJsonLd` directly.
- Produces: `@graph` gains a `Service` node with `@id: ${SITE_URL}/#service`, `provider: { '@id': ${SITE_URL}/#organization }`. Description reuses the red-line-safe framing already shipped on /heavy-3pl-comparison's Service node — no numbers, no dollar figures.

- [ ] **Step 1: Write the failing test**

```ts
// __tests__/jsonld.test.ts
import { describe, it, expect } from 'vitest';
import JsonLd from '@/components/JsonLd';

// TSK-WEB-07 (PRD C-3): Organization + Service must be emitted on every page
// (JsonLd renders in app/layout.tsx). The payload is public — red lines apply.
function graph() {
  const el = JsonLd() as unknown as {
    props: { dangerouslySetInnerHTML: { __html: string } };
  };
  const json = JSON.parse(el.props.dangerouslySetInnerHTML.__html);
  return { json, nodes: json['@graph'] as Array<Record<string, unknown>> };
}

describe('global JSON-LD (components/JsonLd.tsx)', () => {
  it('emits Organization, WebSite, and Service nodes', () => {
    const { nodes } = graph();
    const types = nodes.map((n) => n['@type']);
    expect(types).toContain('Organization');
    expect(types).toContain('WebSite');
    expect(types).toContain('Service');
  });

  it('Service is provided by the Organization node', () => {
    const { nodes } = graph();
    const org = nodes.find((n) => n['@type'] === 'Organization')!;
    const svc = nodes.find((n) => n['@type'] === 'Service')!;
    expect((svc.provider as { '@id': string })['@id']).toBe(org['@id']);
    expect(svc.areaServed).toBe('US');
    expect(String(svc.name)).toMatch(/50–149 lb/);
  });

  it('payload violates no public red lines', () => {
    const { json } = graph();
    const flat = JSON.stringify(json);
    expect(flat).not.toMatch(/225|285|221/);
    expect(flat).not.toMatch(/\$\s?\d/);
    expect(flat).not.toMatch(/2.day|two.day|guarantee(d)? deliver/i);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run __tests__/jsonld.test.ts`
Expected: FAIL — first test: `types` lacks `'Service'`.

- [ ] **Step 3: Add the Service node**

In `components/JsonLd.tsx`, append to the `@graph` array (after the WebSite node):

```ts
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run __tests__/jsonld.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add components/JsonLd.tsx __tests__/jsonld.test.ts
git -c user.email=noreply@anthropic.com -c user.name=Claude commit -m "feat: emit site-wide Service JSON-LD (TSK-WEB-07)"
```

### Task 3: Visible dateline on /big-and-bulky + DEC-007 fix

**Files:**
- Modify: `app/big-and-bulky/page.tsx`
- Test: `__tests__/big-and-bulky-copy.test.ts`

**Interfaces:**
- Consumes: nothing new.
- Produces: exported `const LAST_UPDATED = '2026-07-26'` pattern is NOT needed — a module-level `const LAST_UPDATED` mirroring /heavy-3pl-comparison's convention (`app/heavy-3pl-comparison/page.tsx:14`), rendered in the hero. Test is a static source check (claims-grep style, same rationale as PR #10: node-env vitest cannot render Next pages).

- [ ] **Step 1: Write the failing test**

```ts
// __tests__/big-and-bulky-copy.test.ts
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

// Static source checks, claims-grep style: node-env vitest cannot render Next
// pages, and these are copy-level invariants (PRD C-3 + DEC-007).
const src = readFileSync(
  join(__dirname, '..', 'app', 'big-and-bulky', 'page.tsx'),
  'utf8'
);

describe('/big-and-bulky copy invariants', () => {
  it('carries a visible Last updated dateline (PRD C-3 freshness signal)', () => {
    expect(src).toMatch(/LAST_UPDATED = '\d{4}-\d{2}-\d{2}'/);
    expect(src).toMatch(/Last updated: \{LAST_UPDATED\}/);
  });

  it('never renders the entity as two words (DEC-007)', () => {
    expect(src).not.toMatch(/Shipping Cow/);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run __tests__/big-and-bulky-copy.test.ts`
Expected: FAIL — both tests (no dateline; "Shipping Cow" present at the "Why Heavy Sellers Switch" H2).

- [ ] **Step 3: Edit the page**

3a. Below the imports (after the `metadata` export), add:

```ts
const LAST_UPDATED = '2026-07-26';
```

3b. In the hero, directly above the `<h1>`, add:

```tsx
              <p style={{ color: '#64748B', fontSize: 14, marginBottom: 12 }}>
                Last updated: {LAST_UPDATED}
              </p>
```

3c. Change the H2 `Why Heavy Sellers <span …>Switch</span> to Shipping Cow` → `… to ShippingCow`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run __tests__/big-and-bulky-copy.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add app/big-and-bulky/page.tsx __tests__/big-and-bulky-copy.test.ts
git -c user.email=noreply@anthropic.com -c user.name=Claude commit -m "feat: visible Last-updated dateline on /big-and-bulky + DEC-007 entity fix (TSK-WEB-07)"
```

### Task 4: Full verification + crawler-sim AC evidence

**Files:** none (verification only).

- [ ] **Step 1: Full test suite** — `npx vitest run` → all suites pass (expect 32 baseline + 14 new = 46; baseline on this branch is main's 32, not PR #12's 47).
- [ ] **Step 2: Types + build** — `npx tsc --noEmit` clean; `npm run build` succeeds.
- [ ] **Step 3: Crawler-sim fetch (AC for C-3)** — `npm run start` (or `next start`) on the built app, then:
  - `curl -A "GPTBot/1.0" http://localhost:3000/robots.txt` → named `User-Agent: GPTBot` group with `Allow: /`, all 7 bots present, sitemap line present.
  - `curl -A "GPTBot/1.0" http://localhost:3000/ | grep -o 'application/ld+json'` → present; extract the JSON-LD block and confirm Organization + WebSite + Service.
  - `curl -A "PerplexityBot/1.0" http://localhost:3000/big-and-bulky | grep 'Last updated'` → dateline in served HTML.
  - Record outputs in the PR body.
- [ ] **Step 4: Claims grep (PRD §4, manual)** — `grep -rniE "DIM ?(225|285|221)|÷ ?(225|285|221)|2.day|two.day|zero shrinkage|guaranteed deliver|\$15M|80% off" app/ components/ lib/` → no NEW hits vs main (known main-state hits stay as-is).
- [ ] **Step 5: Push + draft PR** — `git push -u origin claude/tsk-web-07-geo-crawler`, open draft PR with QA evidence, subscribe to PR activity.
