# Blog Cadence Start (TSK-WEB-11) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the first two PRD D-2 blog posts (keyword backlog #3 and #4), answer-first GEO structure, each citing a verified 2026 surcharge/rate fact, both claims-grepped.

**Architecture:** Two new MDX files in `content/blog/` picked up automatically by `lib/blog.ts` (index, sitemap, RSS, ISR slug page — no route code changes). One vitest file statically validates frontmatter, internal-link rule, answer-first shape, and the banned-claims regex.

**Tech Stack:** Next.js 14 App Router, MDX via next-mdx-remote, gray-matter frontmatter, vitest (node env, no jsdom).

## Global Constraints

- Public-copy red lines: no `DIM 225|285|221` or `÷ 225|285|221`, no ShippingCow dollar pricing, savings only as "~17% below FedEx Home / ~28% below UPS on the last leg", no transit/SLA/2-day promises, no "zero shrinkage", no "guaranteed deliver", no `$15M`, no "80% off". Claims regex: `DIM ?(225|285|221)|÷ ?(225|285|221)|2.day|two.day|zero shrinkage|guaranteed deliver|\$15M|80% off` (case-insensitive).
- Backlog rule (content_keyword-backlog 2026-07-19): every article internal-links Calculator (`/calculator`) and Free Audit (`/audit`). No internal rate-card numbers; public mechanics + anonymized ranges only.
- Only repo-verified facts: fuel = Monday updates / prior-Monday EIA diesel / crossed 22% Dec 2025 (fuel routine + draft_fedex-fuel-surcharge-2026); AHS >50 lb actual (rate-card confirmed); oversize >96" longest side or >130" length+girth; Amazon Overmax $17–$25/unit eff. Jan 15, 2026 + 3.5% fuel surcharge eff. Apr 17, 2026 (market-map.md, T2 sourced); ShipBob >50 lb / >48" non-standard (list_smb-starter-targets).
- Frontmatter shape per `lib/blog.ts`: title, date (YYYY-MM-DD), category (from BLOG_CATEGORIES), excerpt, readingTime, author. `draft: true` unpublishes — new posts must NOT set it.
- GEO answer-first: the query is answered in the opening paragraphs before the first `##` heading.
- Commits: `git -c user.email=noreply@anthropic.com -c user.name=Claude commit` with short messages.

---

### Task 1: Validation tests for the two posts

**Files:**
- Test: `__tests__/blog-cadence.test.ts`

**Interfaces:**
- Consumes: `content/blog/fedex-fuel-surcharge-2026.mdx` and `content/blog/fedex-accessorial-charges-heavy-packages.mdx` (created in Tasks 2–3), `gray-matter`.
- Produces: the acceptance harness both post tasks must satisfy.

- [ ] **Step 1: Write the failing tests**

```ts
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
```

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run __tests__/blog-cadence.test.ts`
Expected: FAIL — ENOENT for both mdx files.

- [ ] **Step 3: Commit**

```bash
git add __tests__/blog-cadence.test.ts
git -c user.email=noreply@anthropic.com -c user.name=Claude commit -m "test: add D-2 blog post validation harness"
```

### Task 2: Post 1 — FedEx fuel surcharge 2026 (backlog #3)

**Files:**
- Create: `content/blog/fedex-fuel-surcharge-2026.mdx`

**Interfaces:**
- Consumes: frontmatter contract from `lib/blog.ts`; adapted from internal `draft_fedex-fuel-surcharge-2026_shippingcow_2026-07-19.md` with internal notes stripped and links fixed (`/free-audit` → `/audit`).
- Produces: published post at `/blog/fedex-fuel-surcharge-2026`, auto-included in index/sitemap/RSS.

- [ ] **Step 1: Write the post** (full content in repo file; key constraints: category `Logistics Operations`, date `2026-07-26`, answer-first lead ≥200 chars, `[…](/calculator)` and `[…](/audit)` links, cites Monday/prior-Monday EIA mechanism + 22% December 2025 crossing, no ShippingCow fuel-discount specifics beyond "discounted fuel programs exist").
- [ ] **Step 2: Run the harness** — `npx vitest run __tests__/blog-cadence.test.ts` — fuel-post tests PASS, accessorial tests still FAIL.
- [ ] **Step 3: Commit**

```bash
git add content/blog/fedex-fuel-surcharge-2026.mdx
git -c user.email=noreply@anthropic.com -c user.name=Claude commit -m "content: add FedEx fuel surcharge 2026 post (D-2 #3)"
```

### Task 3: Post 2 — FedEx accessorials on heavy packages (backlog #4)

**Files:**
- Create: `content/blog/fedex-accessorial-charges-heavy-packages.mdx`

**Interfaces:**
- Consumes: frontmatter contract; verified thresholds (AHS >50 lb, dims >48"; oversize >96" / >130" L+G) and 2026 marketplace facts (Overmax $17–$25 eff. Jan 15, 2026; Amazon 3.5% fuel surcharge eff. Apr 17, 2026).
- Produces: published post at `/blog/fedex-accessorial-charges-heavy-packages`.

- [ ] **Step 1: Write the post** (same frontmatter constraints; answer-first lead lists the full accessorial stack; table of triggers; fuel-compounding section; no FedEx dollar amounts we haven't verified — the 2026 dollar facts cited are the sourced Amazon ones).
- [ ] **Step 2: Run the harness** — `npx vitest run __tests__/blog-cadence.test.ts` — all PASS.
- [ ] **Step 3: Commit**

```bash
git add content/blog/fedex-accessorial-charges-heavy-packages.mdx
git -c user.email=noreply@anthropic.com -c user.name=Claude commit -m "content: add FedEx heavy-package accessorials post (D-2 #4)"
```

### Task 4: Full verification battery

- [ ] `rm -rf .next && npx vitest run` — full suite green (44 existing + new).
- [ ] `npx tsc --noEmit` — clean.
- [ ] `npm run build` — success; confirm both slugs in the static output.
- [ ] Claims grep over both new files — no hits.
- [ ] Commit plan doc; push; draft PR.
