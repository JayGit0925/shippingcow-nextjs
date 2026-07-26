# Constants Cleanup Pre-Gate Portion (TSK-WEB-12) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Execute the pre-gate half of PRD E-1 — strip sales-hook naming from `lib/constants.ts`, mark `ZONE_RATE_MULTIPLIER` and `ESTIMATED_COST_PER_LB` as placeholders that must never render as real numbers, statically assert no UI path prints them as dollars — and delete the confirmed-dead `components/FAQ.tsx` (deletion candidate flagged in TSK-WEB-07 / PR #13).

**Architecture:** Comment/marker edits in `lib/constants.ts`; one dead-local removal in `app/inquiry/page.tsx`; deletion of `components/FAQ.tsx` and its now-orphaned `FAQItem` type. A new vitest file enforces all of it statically (marker presence, no sales-hook wording, importer allowlist for the two placeholder constants, no JSX interpolation of savings values in the one client importer, FAQ file gone).

**Tech Stack:** Next.js 14 App Router, vitest (node env), static source-file assertions via `node:fs`.

## Global Constraints

- PRD E-1 (line 119): "remove sales-hook naming of divisor values from `lib/constants.ts` comments/labels; replace `ZONE_RATE_MULTIPLIER` fake table and `$0.45/lb` with engine-backed values once GATE-DIM clears — until then mark both `// PLACEHOLDER — never render as a real number` and assert no UI path prints them as dollars."
- The VALUES do not change in this task (engine-backed replacement is gated on GATE-DIM). Only comments, markers, tests, and dead code.
- Behavior on main is already compliant: DimCalculator renders published divisors only (139/166); inquiry page sends savings with the lead PATCH but never renders them; `/api/audit` strips dollars for anonymous callers (existing redact tests). This task makes that state enforced instead of incidental.
- Red lines: claims regex `DIM ?(225|285|221)|÷ ?(225|285|221)|2.day|two.day|zero shrinkage|guaranteed deliver|\$15M|80% off` (case-insensitive) — no new rendered-copy hits.
- Commits: `git -c user.email=noreply@anthropic.com -c user.name=Claude commit` with short messages.

---

### Task 1: Static enforcement tests

**Files:**
- Test: `__tests__/constants-cleanup.test.ts`

**Interfaces:**
- Consumes: raw source of `lib/constants.ts`, `app/inquiry/page.tsx`; filesystem state of `components/FAQ.tsx`.
- Produces: the acceptance harness Tasks 2–3 must satisfy.

- [ ] **Step 1: Write the failing tests**

```ts
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = join(__dirname, '..');
const read = (p: string) => readFileSync(join(ROOT, p), 'utf8');

const PLACEHOLDER_MARKER = 'PLACEHOLDER — never render as a real number';

function sourceFiles(dir: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(join(ROOT, dir))) {
    const rel = join(dir, name);
    const abs = join(ROOT, rel);
    if (statSync(abs).isDirectory()) {
      if (name === 'node_modules' || name === '.next') continue;
      out.push(...sourceFiles(rel));
    } else if (/\.(ts|tsx)$/.test(name)) {
      out.push(rel);
    }
  }
  return out;
}

describe('constants cleanup (PRD E-1 pre-gate)', () => {
  const constants = read('lib/constants.ts');

  it('marks ESTIMATED_COST_PER_LB as a placeholder', () => {
    const block = constants.split('ESTIMATED_COST_PER_LB')[0].split('\n').slice(-4).join('\n');
    expect(block).toContain(PLACEHOLDER_MARKER);
  });

  it('marks ZONE_RATE_MULTIPLIER as a placeholder', () => {
    const idx = constants.indexOf('export const ZONE_RATE_MULTIPLIER');
    const before = constants.slice(0, idx).split('\n').slice(-6).join('\n');
    expect(before).toContain(PLACEHOLDER_MARKER);
  });

  it('carries no sales-hook naming on divisor constants', () => {
    // "ShippingCow advantage" was the sales-hook label; nothing in the
    // constants file may pitch a divisor as an advantage or a flat-rate story.
    expect(constants).not.toMatch(/advantage/i);
    expect(constants).not.toMatch(/flat contracted rates/i);
  });

  it('placeholder constants are only imported by the known engine/API/lead paths', () => {
    const allowed = new Set([
      'lib/cost.ts',
      'app/inquiry/page.tsx',
      'app/api/calculator-session/route.ts',
      'app/api/calculator/estimate/route.ts',
    ]);
    const importers = ['app', 'components', 'lib']
      .flatMap((d) => sourceFiles(d))
      .filter((f) => f !== 'lib/constants.ts')
      .filter((f) => {
        const src = read(f);
        return /import[^;]*\b(ESTIMATED_COST_PER_LB|ZONE_RATE_MULTIPLIER)\b[^;]*from/s.test(src);
      });
    for (const f of importers) {
      expect(allowed, `unexpected importer of placeholder constants: ${f}`).toContain(f);
    }
  });

  it('inquiry page never interpolates placeholder-derived savings into JSX', () => {
    const inquiry = read('app/inquiry/page.tsx');
    // savings values may be POSTed with the lead, but must never appear in
    // rendered output — no JSX interpolation or string templating of them.
    expect(inquiry).not.toMatch(/\{\s*(savingsPerPkg|monthlySavings)/);
    expect(inquiry).not.toMatch(/\$\{\s*(savingsPerPkg|monthlySavings)/);
    expect(inquiry).not.toMatch(/(savingsPerPkg|monthlySavings)[^\n]*toFixed\([^)]*\)\s*\}/);
  });
});

describe('dead FAQ component removed (TSK-WEB-07 deletion candidate)', () => {
  it('components/FAQ.tsx no longer exists', () => {
    expect(existsSync(join(ROOT, 'components', 'FAQ.tsx'))).toBe(false);
  });

  it('FAQItem type is gone from lib/types.ts', () => {
    expect(read('lib/types.ts')).not.toContain('FAQItem');
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run __tests__/constants-cleanup.test.ts`
Expected: FAIL — both placeholder-marker tests, the sales-hook test ("ShippingCow advantage" present), and both FAQ tests fail. The importer-allowlist and inquiry-JSX tests pass already (documents that main's behavior was compliant).

Note: `{savingsPerPkg` also fails on main? No — main computes but never interpolates; expected PASS. `monthlySavings` is computed (dead) but not interpolated; expected PASS.

- [ ] **Step 3: Commit**

```bash
git add __tests__/constants-cleanup.test.ts
git -c user.email=noreply@anthropic.com -c user.name=Claude commit -m "test: add E-1 constants-cleanup enforcement harness"
```

### Task 2: constants.ts markers + neutral naming, inquiry dead local

**Files:**
- Modify: `lib/constants.ts` (lines 7–14, 167–171)
- Modify: `app/inquiry/page.tsx` (line 230 dead local)

- [ ] **Step 1: Edit the DIM divisor comments** — replace:

```ts
// DIM Weight Divisors
export const DIM_DIVISOR_STANDARD = 139     // UPS / FedEx published rate
export const DIM_DIVISOR_3PL      = 166     // Typical 3PL
export const DIM_DIVISOR_SHIPPINGCOW = 225  // ShippingCow advantage
```

with:

```ts
// DIM Weight Divisors
// The 139/166 values are public carrier/3PL knowledge and safe to render.
// The internal contract divisor is GATE-DIM: it must never be rendered,
// quoted, or implied on any public surface (see lib/redact.ts).
export const DIM_DIVISOR_STANDARD = 139     // carrier-published (UPS/FedEx ground)
export const DIM_DIVISOR_3PL      = 166     // typical 3PL published divisor
export const DIM_DIVISOR_SHIPPINGCOW = 225  // internal contract divisor — GATE-DIM
```

- [ ] **Step 2: Mark ESTIMATED_COST_PER_LB** — replace:

```ts
// Shipping cost estimate — $/lb billable weight
// TODO: update with real blended rate data from carrier contracts
export const ESTIMATED_COST_PER_LB = 0.45
```

with:

```ts
// Shipping cost estimate — $/lb billable weight
// PLACEHOLDER — never render as a real number (PRD E-1, GATE-DIM).
// Not a real blended rate; used only for internal lead-scoring context.
// Replace with an engine-backed value once GATE-DIM clears.
export const ESTIMATED_COST_PER_LB = 0.45
```

- [ ] **Step 3: Mark ZONE_RATE_MULTIPLIER** — replace the section comment:

```ts
// ============ Zone Rate Multipliers ============
// Published carrier (FedEx/UPS) rates increase significantly by zone.
// These multipliers represent the zone premium customers pay with standard carriers
// relative to ShippingCow's flat contracted rates (which already reflect zone-skip routing).
```

with:

```ts
// ============ Zone Rate Multipliers ============
// PLACEHOLDER — never render as a real number (PRD E-1, GATE-DIM).
// Illustrative zone-premium coefficients, not a measured carrier table.
// Consumed only by lib/cost.ts internals; every derived dollar figure is
// stripped for anonymous callers by lib/redact.ts. Replace with
// engine-backed values once GATE-DIM clears.
```

- [ ] **Step 4: Remove the dead local in the inquiry confirmation screen** — in `app/inquiry/page.tsx`, delete line 230 (`const monthlySavings = savingsPerPkg * Number(ordVol || 100);` inside `if (done)`): it is computed and never used in that JSX. The identically-named local inside `step4Submit` stays — it is sent with the lead, not rendered.

- [ ] **Step 5: Run the harness** — `npx vitest run __tests__/constants-cleanup.test.ts` — constants/inquiry tests PASS, FAQ tests still FAIL.

- [ ] **Step 6: Commit**

```bash
git add lib/constants.ts app/inquiry/page.tsx
git -c user.email=noreply@anthropic.com -c user.name=Claude commit -m "chore: E-1 placeholder markers + neutral divisor naming"
```

### Task 3: Delete dead FAQ component

**Files:**
- Delete: `components/FAQ.tsx`
- Modify: `lib/types.ts` (remove `FAQItem` type, lines 72–75)

- [ ] **Step 1: Delete** — `git rm components/FAQ.tsx`. Confirmed dead in the TSK-WEB-07 audit (imported nowhere; carries legacy off-positioning copy: "$0/month Scout plan", savings percentages, label-routing story).
- [ ] **Step 2: Remove the orphaned type** — delete the `FAQItem` block from `lib/types.ts`; only `components/FAQ.tsx` ever consumed it (the `/heavy-3pl-comparison` FAQ uses its own inline literals).
- [ ] **Step 3: Run the harness** — `npx vitest run __tests__/constants-cleanup.test.ts` — all PASS.
- [ ] **Step 4: Commit**

```bash
git add -A components/FAQ.tsx lib/types.ts
git -c user.email=noreply@anthropic.com -c user.name=Claude commit -m "chore: delete dead FAQ component + orphaned FAQItem type"
```

### Task 4: Full verification battery

- [ ] `rm -rf .next && npx vitest run` — full suite green (32 baseline + 7 new).
- [ ] `npx tsc --noEmit` — clean.
- [ ] `npm run build` — success.
- [ ] Claims grep over changed files — no new rendered-copy hits (the `= 225` literal and `dim225` identifiers are pre-existing dispositioned code paths, not copy).
- [ ] Commit plan doc; push; draft PR.
