# Lighthouse Performance Floor (TSK-WEB-10 / PRD C-1) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A committed repo script that fails (exit 1) whenever any money page scores below Lighthouse mobile 0.90 performance, so PR QA can enforce the perf floor mechanically.

**Architecture:** A tiny pure ESM module (`scripts/lighthouse-floor-lib.mjs`) holds the money-page list, the floor constant, and the pass/fail evaluation — unit-testable in vitest with zero browser involvement. A runner (`scripts/lighthouse-floor.mjs`) spawns `next start` against an existing build (or targets `BASE_URL`), shells out to `npx lighthouse` per page with mobile defaults, and exits non-zero on any failure. The runner is asserted statically (flags, wiring) the same way `.tsx` wiring is tested elsewhere in this repo.

**Tech Stack:** Node ESM, `npx lighthouse` (13.x, mobile emulation is the Lighthouse default), Chromium via `CHROME_PATH`, vitest (node env).

## Global Constraints

- Money pages (from `plan_organic-search-growth_2026-07-22` + TSK-W1-02): `/`, `/calculator`, `/audit`, `/big-and-bulky`, `/heavy-3pl-comparison`.
- Floor: performance score ≥ **0.90**, mobile emulation (PRD C-1). A score of exactly 0.90 passes.
- PRD C-1 names the invocation shape: `CHROME_PATH=… npx lighthouse` — lighthouse stays an npx dependency, NOT a package.json devDependency (it is ~90 MB and only used in QA).
- Vitest is node-env; rolldown cannot parse `.tsx` imports; the `@` alias maps to repo root. The lib module is `.mjs` so the plain-node runner can import it without a TS toolchain.
- No public-copy changes in this task → claims grep must stay clean by construction (script + tests contain no divisor values, no dollar figures, no transit promises).
- Site commits: `git -c user.email=noreply@anthropic.com -c user.name=Claude commit -m "<short message>"`.

---

### Task 1: Pure evaluation module

**Files:**
- Create: `scripts/lighthouse-floor-lib.mjs`
- Test: `__tests__/perf-floor.test.ts`

**Interfaces:**
- Produces: `MONEY_PAGES: string[]`, `PERF_FLOOR: number`, `evaluateFloor(results: Array<{page: string, score: number|null}>, floor?: number): {pass: boolean, failures: Array<{page: string, score: number|null}>}` — Task 2's runner imports all three.

- [ ] **Step 1: Write the failing test**

```ts
// __tests__/perf-floor.test.ts
import { describe, it, expect } from 'vitest';
import { MONEY_PAGES, PERF_FLOOR, evaluateFloor } from '../scripts/lighthouse-floor-lib.mjs';

describe('perf floor config (PRD C-1)', () => {
  it('covers every money page', () => {
    expect(MONEY_PAGES).toEqual([
      '/', '/calculator', '/audit', '/big-and-bulky', '/heavy-3pl-comparison',
    ]);
  });

  it('floor is Lighthouse mobile 0.90', () => {
    expect(PERF_FLOOR).toBe(0.9);
  });
});

describe('evaluateFloor', () => {
  it('passes when every page is at or above the floor', () => {
    const out = evaluateFloor([
      { page: '/', score: 0.98 },
      { page: '/calculator', score: 0.9 }, // exactly at the floor passes
    ]);
    expect(out.pass).toBe(true);
    expect(out.failures).toEqual([]);
  });

  it('fails and names each page below the floor', () => {
    const out = evaluateFloor([
      { page: '/', score: 0.98 },
      { page: '/audit', score: 0.72 },
    ]);
    expect(out.pass).toBe(false);
    expect(out.failures).toEqual([{ page: '/audit', score: 0.72 }]);
  });

  it('treats a null/missing score as a failure (lighthouse error path)', () => {
    const out = evaluateFloor([{ page: '/', score: null }]);
    expect(out.pass).toBe(false);
    expect(out.failures).toEqual([{ page: '/', score: null }]);
  });

  it('respects a custom floor argument', () => {
    const out = evaluateFloor([{ page: '/', score: 0.85 }], 0.8);
    expect(out.pass).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd /workspace/shippingcow-nextjs && npx vitest run __tests__/perf-floor.test.ts`
Expected: FAIL — cannot resolve `../scripts/lighthouse-floor-lib.mjs`.

- [ ] **Step 3: Write minimal implementation**

```js
// scripts/lighthouse-floor-lib.mjs
// PRD C-1 perf floor: Lighthouse mobile performance >= 0.90 on every money
// page. Plain .mjs so both the node runner and vitest import it untranspiled.

export const MONEY_PAGES = [
  '/',
  '/calculator',
  '/audit',
  '/big-and-bulky',
  '/heavy-3pl-comparison',
];

export const PERF_FLOOR = 0.9;

export function evaluateFloor(results, floor = PERF_FLOOR) {
  const failures = results.filter(
    (r) => typeof r.score !== 'number' || r.score < floor,
  );
  return { pass: failures.length === 0, failures };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd /workspace/shippingcow-nextjs && npx vitest run __tests__/perf-floor.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
cd /workspace/shippingcow-nextjs
git add scripts/lighthouse-floor-lib.mjs __tests__/perf-floor.test.ts
git -c user.email=noreply@anthropic.com -c user.name=Claude commit -m "Add perf-floor evaluation module (PRD C-1)"
```

### Task 2: Runner script + npm wiring

**Files:**
- Create: `scripts/lighthouse-floor.mjs`
- Modify: `package.json` (add `"perf:floor": "node scripts/lighthouse-floor.mjs"` to scripts)
- Test: `__tests__/perf-floor.test.ts` (append a static-wiring describe block)

**Interfaces:**
- Consumes: `MONEY_PAGES`, `PERF_FLOOR`, `evaluateFloor` from Task 1.
- Produces: `npm run perf:floor` — exits 0 when all money pages ≥ floor, 1 otherwise. Honors `BASE_URL` (skip server spawn) and `CHROME_PATH` (defaults to `/opt/pw-browsers/chromium` when unset and present).

- [ ] **Step 1: Append the failing static tests**

```ts
// append to __tests__/perf-floor.test.ts
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

describe('runner wiring (static)', () => {
  const runner = () =>
    readFileSync(join(__dirname, '..', 'scripts', 'lighthouse-floor.mjs'), 'utf8');
  const pkg = () =>
    JSON.parse(readFileSync(join(__dirname, '..', 'package.json'), 'utf8'));

  it('imports the shared evaluation module', () => {
    expect(runner()).toMatch(/from '\.\/lighthouse-floor-lib\.mjs'/);
  });

  it('measures performance only, on lighthouse mobile defaults', () => {
    expect(runner()).toContain('--only-categories=performance');
    // No desktop override anywhere — mobile is the lighthouse default.
    expect(runner()).not.toMatch(/desktop/i);
  });

  it('honors CHROME_PATH', () => {
    expect(runner()).toContain('CHROME_PATH');
  });

  it('is wired as npm run perf:floor', () => {
    expect(pkg().scripts['perf:floor']).toBe('node scripts/lighthouse-floor.mjs');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd /workspace/shippingcow-nextjs && npx vitest run __tests__/perf-floor.test.ts`
Expected: FAIL — runner file missing (4 new tests fail).

- [ ] **Step 3: Write the runner**

```js
// scripts/lighthouse-floor.mjs
// PRD C-1: enforce Lighthouse mobile performance >= 0.90 on every money page.
// Usage:
//   npm run build && npm run perf:floor              # spawns `next start`
//   BASE_URL=https://preview.example npm run perf:floor  # audits a live URL
// CHROME_PATH is passed to lighthouse; defaults to the preinstalled Chromium
// when unset. Lighthouse's default emulation is mobile — no preset needed.
import { spawn, execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { MONEY_PAGES, PERF_FLOOR, evaluateFloor } from './lighthouse-floor-lib.mjs';

const DEFAULT_CHROME = '/opt/pw-browsers/chromium';
const chromePath =
  process.env.CHROME_PATH || (existsSync(DEFAULT_CHROME) ? DEFAULT_CHROME : undefined);
if (!chromePath) {
  console.error('CHROME_PATH is not set and no default Chromium found.');
  process.exit(1);
}

const externalBase = process.env.BASE_URL;
const base = externalBase || 'http://localhost:3000';

async function waitForServer(url, tries = 60) {
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(url);
      if (res.status < 500) return;
    } catch {
      // server not up yet
    }
    await new Promise((r) => setTimeout(r, 1000));
  }
  throw new Error(`Server at ${url} did not become ready`);
}

function auditPage(page) {
  const out = execFileSync(
    'npx',
    [
      'lighthouse',
      `${base}${page}`,
      '--only-categories=performance',
      '--output=json',
      '--output-path=stdout',
      '--quiet',
      '--chrome-flags=--headless=new --no-sandbox --disable-dev-shm-usage',
    ],
    {
      env: { ...process.env, CHROME_PATH: chromePath },
      maxBuffer: 64 * 1024 * 1024,
      encoding: 'utf8',
    },
  );
  const report = JSON.parse(out);
  return report.categories?.performance?.score ?? null;
}

let server;
if (!externalBase) {
  server = spawn('npx', ['next', 'start'], { stdio: 'ignore' });
}

try {
  await waitForServer(base);
  const results = [];
  for (const page of MONEY_PAGES) {
    let score = null;
    try {
      score = auditPage(page);
    } catch (err) {
      console.error(`lighthouse failed on ${page}: ${err.message}`);
    }
    results.push({ page, score });
    console.log(
      `${page.padEnd(24)} ${score === null ? 'ERROR' : score.toFixed(2)}`,
    );
  }
  const { pass, failures } = evaluateFloor(results);
  if (!pass) {
    console.error(
      `\nPerf floor FAILED (< ${PERF_FLOOR}): ${failures
        .map((f) => `${f.page}=${f.score ?? 'error'}`)
        .join(', ')}`,
    );
    process.exit(1);
  }
  console.log(`\nPerf floor PASSED: all ${results.length} money pages >= ${PERF_FLOOR}`);
} finally {
  if (server) server.kill('SIGTERM');
}
```

And in `package.json` scripts (after `"test:watch"`):

```json
"perf:floor": "node scripts/lighthouse-floor.mjs"
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd /workspace/shippingcow-nextjs && npx vitest run __tests__/perf-floor.test.ts`
Expected: PASS (9 tests).

- [ ] **Step 5: Commit**

```bash
cd /workspace/shippingcow-nextjs
git add scripts/lighthouse-floor.mjs package.json __tests__/perf-floor.test.ts
git -c user.email=noreply@anthropic.com -c user.name=Claude commit -m "Add lighthouse perf-floor runner + npm run perf:floor (PRD C-1)"
```

### Task 3: Prove the floor passes (AC: "script committed + passing")

**Files:** none new — this is the real-run verification the AC demands.

- [ ] **Step 1: Clean stale types and build**

Run: `cd /workspace/shippingcow-nextjs && rm -rf .next && npm run build`
Expected: build success (stale `.next/types` from other branches otherwise break tsc).

- [ ] **Step 2: Run the floor script for real**

Run: `cd /workspace/shippingcow-nextjs && npm run perf:floor`
Expected: five score lines, `Perf floor PASSED`, exit 0. If any page is below 0.90 locally, record the exact scores in the PR body and STOP — a sub-0.90 money page is its own defect ticket, not something to paper over by lowering the floor.

- [ ] **Step 3: Full verification battery**

Run:
```bash
cd /workspace/shippingcow-nextjs && npx vitest run && npx tsc --noEmit
grep -rniE "DIM ?(225|285|221)|÷ ?(225|285|221)|2.day|two.day|zero shrinkage|guaranteed deliver|\$15M|80% off" scripts/lighthouse-floor.mjs scripts/lighthouse-floor-lib.mjs __tests__/perf-floor.test.ts || echo CLAIMS-CLEAN
```
Expected: full suite green, tsc clean, `CLAIMS-CLEAN`.

- [ ] **Step 4: Commit the plan doc**

> **Execution addendum (2026-07-26):** The first real run scored all five pages 0.82–0.84. Root cause was environmental, not a site regression: this sandbox's egress proxy stalls `fonts.googleapis.com` for ~12s (status −1), zeroing Speed Index (19.8s vs 1.5s) while FCP/LCP/TBT/CLS stayed healthy. Two runner changes followed, both TDD'd: (1) `LH_BLOCK_URLS` env → repeated `--blocked-url-patterns`, documented as sandbox-only — production QA must run unblocked so real third-party cost is measured; (2) the server spawn is now `detached: true` with a process-group kill, because killing only the `npx` wrapper left the grandchild `next start` holding port 3000. Final local scores with the sandbox block: 0.93–0.97 across all five money pages, and the runner frees the port on exit.

```bash
cd /workspace/shippingcow-nextjs
git add docs/superpowers/plans/2026-07-26-lighthouse-floor.md
git -c user.email=noreply@anthropic.com -c user.name=Claude commit -m "Add TSK-WEB-10 plan doc"
```
