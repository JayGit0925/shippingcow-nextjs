# Calculator Gap Closure (TSK-WEB-06, PRD A-2) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close the four real gaps between the shipped calculator and PRD item A-2: bulky-item presets, a complete calculator → /inquiry handoff (volume + ZIPs, not just dimensions), a live `sc_calc_result` localStorage channel for the chat widget's dormant `getCalculatorContext()` reader, and a rate limit on `/api/calculator/estimate`.

**Architecture:** Everything already exists except these gaps — `analyzeShipment()` is wired via `POST /api/calculator/estimate` with redaction, ZIP inputs and the zone-routing display ship today. New logic lands in two pure modules (`lib/calculator-presets.ts`, `lib/calculator-handoff.ts`) so it is testable in the node-only vitest setup; `DimCalculator.tsx` and `app/inquiry/page.tsx` get surgical wiring edits. The localStorage blob is built by an allowlisting function so a money field can never leak into it even if the API someday returns one to this client.

**Tech Stack:** Next.js 14 app router, React 18, TypeScript, zod, vitest (node environment, `@` alias = repo root).

## Scope decisions (deviations from the PRD's literal text)

- The server route stays at `POST /api/calculator/estimate` — the PRD says "POST /api/calculator" but renaming a working, tested route adds churn for zero user value.
- `smartRoute()`'s discarded `all_options` ("why this warehouse" display) is deliberately NOT in scope — minimalism; nothing in the AC needs it.
- Playwright zero-dollar DOM assertion from the AC: this repo has no Playwright harness; the equivalent guarantee is enforced server-side (redaction tests + the new allowlist-builder tests) plus the claims grep. Noted for the PR body.

## Global Constraints

- Branch: `claude/tsk-web-06-calculator-gaps` from `origin/main` (fb5df4f). Draft PR at the end.
- Commit identity: `git -c user.email=noreply@anthropic.com -c user.name=Claude commit ...`; every message ends with the two standard trailers used on this repo's recent commits.
- **No dollar figures anywhere client-side** (GATE-DIM open). The localStorage blob, the inquiry href, and all preset copy must contain zero currency fields. No DIM divisor values 225/285/221 in any rendered copy (139/166 are the carriers' published divisors and are already rendered — those stay).
- `npm run check:claims` does not exist on main yet (rides PR #10) — run the grep pattern manually: `grep -rniE "DIM ?(225|285|221)|÷ ?(225|285|221)|2.day|two.day|zero shrinkage|guaranteed deliver|\$15M|80% off" app/ components/ lib/` and paste output into the PR body.
- Full suite (`npx vitest run`) green before every commit. 32 tests exist on main.
- Input bounds from the estimate route's zod schema are the law: l/w/h ≤ 120 in, weight ≤ 500 lb — presets must fit inside them.

---

### Task 1: Bulky-item presets — data module + chips UI

**Files:**
- Create: `lib/calculator-presets.ts`
- Test: `__tests__/calculator-presets.test.ts`
- Modify: `components/DimCalculator.tsx` (inputs column, after the "Your Package Dimensions" heading at line ~243)

**Interfaces:**
- Produces: `type CalcPreset = { id: string; label: string; length: number; width: number; height: number; weight: number }`; `export const CALC_PRESETS: readonly CalcPreset[]` — both exported from `lib/calculator-presets.ts`. Task 1 is self-contained; no later task consumes it.

- [ ] **Step 1: Write the failing test**

Create `__tests__/calculator-presets.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { CALC_PRESETS } from "@/lib/calculator-presets";

// Bounds come from the zod schema in app/api/calculator/estimate/route.ts —
// a preset outside them would 400 the moment ZIPs are entered.
describe("CALC_PRESETS", () => {
  it("has at least 4 presets", () => {
    expect(CALC_PRESETS.length).toBeGreaterThanOrEqual(4);
  });

  it("every preset fits the estimate API input bounds", () => {
    for (const p of CALC_PRESETS) {
      expect(p.length).toBeGreaterThan(0);
      expect(p.length).toBeLessThanOrEqual(120);
      expect(p.width).toBeGreaterThan(0);
      expect(p.width).toBeLessThanOrEqual(120);
      expect(p.height).toBeGreaterThan(0);
      expect(p.height).toBeLessThanOrEqual(120);
      expect(p.weight).toBeGreaterThan(0);
      expect(p.weight).toBeLessThanOrEqual(500);
    }
  });

  it("every preset is DIM-relevant: dim weight at ÷139 exceeds actual weight", () => {
    // Presets exist to show the phantom-weight problem; a preset whose DIM
    // weight is below its actual weight would render a zero callout.
    for (const p of CALC_PRESETS) {
      const dim139 = (p.length * p.width * p.height) / 139;
      expect(dim139).toBeGreaterThan(p.weight);
    }
  });

  it("ids are unique and labels non-empty", () => {
    const ids = CALC_PRESETS.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const p of CALC_PRESETS) {
      expect(p.label.trim().length).toBeGreaterThan(0);
    }
  });

  it("contains no dollar or divisor copy in labels", () => {
    for (const p of CALC_PRESETS) {
      expect(p.label).not.toMatch(/\$|225|285|221/);
    }
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd /workspace/shippingcow-nextjs && npx vitest run __tests__/calculator-presets.test.ts`
Expected: FAIL — cannot resolve `@/lib/calculator-presets`.

- [ ] **Step 3: Write minimal implementation**

Create `lib/calculator-presets.ts`:

```ts
// Bulky-item presets for the DIM calculator (PRD A-2 / TSK-WEB-06).
// One click seeds l/w/h/weight with a typical big-and-bulky SKU so a visitor
// sees the phantom-weight problem without measuring anything.
//
// Bounds contract: every preset must satisfy the estimate API's zod schema
// (l/w/h <= 120 in, weight <= 500 lb) and must be DIM-heavy at ÷139
// (dim weight > actual weight) so the callout is never zero.
// __tests__/calculator-presets.test.ts enforces both.

export type CalcPreset = {
  id: string;
  label: string;
  length: number;
  width: number;
  height: number;
  weight: number;
};

export const CALC_PRESETS: readonly CalcPreset[] = [
  { id: "office-chair", label: "🪑 Office chair", length: 27, width: 26, height: 39, weight: 55 },
  { id: "gas-grill", label: "🍖 Gas grill", length: 48, width: 26, height: 48, weight: 95 },
  { id: "bed-frame", label: "🛏 Bed frame", length: 82, width: 30, height: 11, weight: 110 },
  { id: "treadmill", label: "🏃 Treadmill", length: 80, width: 34, height: 16, weight: 145 },
  { id: "rooftop-tent", label: "⛺ Rooftop tent", length: 56, width: 48, height: 14, weight: 140 },
  { id: "kayak", label: "🛶 Kayak", length: 110, width: 20, height: 14, weight: 65 },
] as const;
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd /workspace/shippingcow-nextjs && npx vitest run __tests__/calculator-presets.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 5: Wire preset chips into DimCalculator**

In `components/DimCalculator.tsx`:

Add to the imports:

```ts
import { CALC_PRESETS } from '@/lib/calculator-presets';
```

Inside the inputs column, directly after the `<h3>Your Package Dimensions</h3>` heading (before the l/w/h field map), insert:

```tsx
          {/* ---- Bulky-item presets (TSK-WEB-06) ---- */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '1.2rem' }}>
            {CALC_PRESETS.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  setLength(p.length);
                  setWidth(p.width);
                  setHeight(p.height);
                  setWeight(p.weight);
                }}
                style={{
                  fontFamily: 'var(--font-pixel)', fontSize: '0.6rem', textTransform: 'uppercase',
                  padding: '0.4rem 0.6rem', cursor: 'pointer',
                  background: 'var(--white)', border: '2px solid var(--dark)',
                  boxShadow: '2px 2px 0 var(--dark)', letterSpacing: '0.03em',
                }}
              >
                {p.label}
              </button>
            ))}
          </div>
```

Flex-wrap keeps the chips usable at 375px — they stack into rows, no horizontal scroll.

- [ ] **Step 6: Full suite + typecheck**

Run: `cd /workspace/shippingcow-nextjs && npx vitest run && npx tsc --noEmit`
Expected: all PASS, no type errors.

- [ ] **Step 7: Commit (plan doc rides this commit)**

```bash
git add docs/superpowers/plans/2026-07-26-calculator-gap-closure.md lib/calculator-presets.ts __tests__/calculator-presets.test.ts components/DimCalculator.tsx
git commit -m "feat: bulky-item presets on the DIM calculator (TSK-WEB-06)"
```

### Task 2: Handoff module — inquiry href with vol + ZIPs, allowlisted calc context

**Files:**
- Create: `lib/calculator-handoff.ts`
- Test: `__tests__/calculator-handoff.test.ts`

**Interfaces:**
- Produces (consumed by Tasks 3 and 4):
  - `type CalcHandoff = { length: number; width: number; height: number; weight: number; volume: number; originZip?: string; destZip?: string }`
  - `buildInquiryHref(h: CalcHandoff): string` — `/inquiry?l=&w=&h=&weight=&vol=` plus `&origin_zip=`/`&dest_zip=` only when the ZIP is exactly 5 digits.
  - `buildCalcContext(h: CalcHandoff, zone?: Record<string, unknown> | null): Record<string, unknown>` — dollar-free blob for `localStorage.sc_calc_result`; zone fields are copied through a hard allowlist, never spread.

- [ ] **Step 1: Write the failing test**

Create `__tests__/calculator-handoff.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { buildInquiryHref, buildCalcContext } from "@/lib/calculator-handoff";

const BASE = { length: 48, width: 26, height: 48, weight: 95, volume: 200 };

describe("buildInquiryHref", () => {
  it("carries dims, weight and volume", () => {
    expect(buildInquiryHref(BASE)).toBe("/inquiry?l=48&w=26&h=48&weight=95&vol=200");
  });

  it("appends ZIPs only when both are 5-digit", () => {
    expect(buildInquiryHref({ ...BASE, originZip: "08901", destZip: "90210" })).toBe(
      "/inquiry?l=48&w=26&h=48&weight=95&vol=200&origin_zip=08901&dest_zip=90210"
    );
  });

  it.each([
    { originZip: "089", destZip: "90210" },
    { originZip: "08901", destZip: "" },
    { originZip: undefined, destZip: "90210" },
  ])("omits ZIP params when a ZIP is missing or partial (%j)", (zips) => {
    const href = buildInquiryHref({ ...BASE, ...zips });
    expect(href).toBe("/inquiry?l=48&w=26&h=48&weight=95&vol=200");
  });
});

describe("buildCalcContext", () => {
  const MONEY_KEY = /(cost|price|savings|estimate|per_pkg|225)/i;

  it("contains dims, volume and published-divisor weights only", () => {
    const ctx = buildCalcContext(BASE);
    expect(ctx.length).toBe(48);
    expect(ctx.monthly_volume).toBe(200);
    expect(typeof ctx.bill139).toBe("number");
    expect(typeof ctx.dim166).toBe("number");
    for (const k of Object.keys(ctx)) {
      expect(k).not.toMatch(MONEY_KEY);
    }
  });

  it("copies only allowlisted zone fields and drops money even if present", () => {
    const hostileZone = {
      current_zone: 8,
      sc_zone: 4,
      zone_improvement: 4,
      sc_warehouse: "NJ",
      current_distance_miles: 2400,
      sc_distance_miles: 300,
      // fields an authed session could see — must NEVER be copied through:
      sc_cost_per_pkg: 9.12,
      annual_savings: 50000,
      savings_per_pkg: 4.5,
      dim225: 30.1,
      bill225: 95,
      sc_billable_225: 95,
    };
    const ctx = buildCalcContext({ ...BASE, originZip: "08901", destZip: "90210" }, hostileZone);
    expect(ctx.sc_warehouse).toBe("NJ");
    expect(ctx.zone_improvement).toBe(4);
    const json = JSON.stringify(ctx);
    expect(json).not.toMatch(/cost|savings|225/i);
    for (const k of Object.keys(ctx)) {
      expect(k).not.toMatch(MONEY_KEY);
    }
  });

  it("no known dollar value from the hostile zone survives serialization", () => {
    const ctx = buildCalcContext(BASE, { annual_savings: 50000, savings_per_pkg: 4.5 });
    const nums = JSON.stringify(ctx).match(/-?\d+(\.\d+)?/g) ?? [];
    expect(nums).not.toContain("50000");
    expect(nums).not.toContain("4.5");
  });

  it("handles null zone", () => {
    const ctx = buildCalcContext(BASE, null);
    expect(ctx.sc_warehouse).toBeUndefined();
    expect(ctx.length).toBe(48);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd /workspace/shippingcow-nextjs && npx vitest run __tests__/calculator-handoff.test.ts`
Expected: FAIL — cannot resolve `@/lib/calculator-handoff`.

- [ ] **Step 3: Write minimal implementation**

Create `lib/calculator-handoff.ts`:

```ts
// Calculator → downstream handoff (PRD A-2 / TSK-WEB-06).
//
// PUBLIC SURFACE RULE: everything built here reaches anonymous storage
// (localStorage) or a shareable URL, so it must carry ZERO dollar fields and
// nothing derived from the ShippingCow divisor. Zone data is copied through a
// hard allowlist — never spread the API response, which is shaped by auth
// state (lib/redact.ts).

import { DIM_DIVISOR_STANDARD, DIM_DIVISOR_3PL } from "@/lib/constants";

export type CalcHandoff = {
  length: number;
  width: number;
  height: number;
  weight: number;
  volume: number;
  originZip?: string;
  destZip?: string;
};

const ZIP_RE = /^\d{5}$/;

export function buildInquiryHref(h: CalcHandoff): string {
  const params = new URLSearchParams({
    l: String(h.length),
    w: String(h.width),
    h: String(h.height),
    weight: String(h.weight),
    vol: String(h.volume),
  });
  if (h.originZip && ZIP_RE.test(h.originZip) && h.destZip && ZIP_RE.test(h.destZip)) {
    params.set("origin_zip", h.originZip);
    params.set("dest_zip", h.destZip);
  }
  return `/inquiry?${params.toString()}`;
}

// Zone fields safe for anonymous storage — matches the redactEstimate()
// allowlist in lib/redact.ts minus the weight duplicates.
const ZONE_ALLOWLIST = [
  "current_zone",
  "current_distance_miles",
  "sc_warehouse",
  "sc_zone",
  "sc_distance_miles",
  "zone_improvement",
] as const;

export function buildCalcContext(
  h: CalcHandoff,
  zone?: Record<string, unknown> | null
): Record<string, unknown> {
  const vol = h.length * h.width * h.height;
  const dim139 = vol / DIM_DIVISOR_STANDARD;
  const dim166 = vol / DIM_DIVISOR_3PL;
  const ctx: Record<string, unknown> = {
    length: h.length,
    width: h.width,
    height: h.height,
    weight: h.weight,
    monthly_volume: h.volume,
    dim139: Math.round(dim139 * 10) / 10,
    dim166: Math.round(dim166 * 10) / 10,
    bill139: Math.round(Math.max(h.weight, dim139) * 10) / 10,
    bill166: Math.round(Math.max(h.weight, dim166) * 10) / 10,
  };
  if (h.originZip && ZIP_RE.test(h.originZip)) ctx.origin_zip = h.originZip;
  if (h.destZip && ZIP_RE.test(h.destZip)) ctx.dest_zip = h.destZip;
  if (zone) {
    for (const k of ZONE_ALLOWLIST) {
      if (zone[k] !== undefined) ctx[k] = zone[k];
    }
  }
  return ctx;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd /workspace/shippingcow-nextjs && npx vitest run __tests__/calculator-handoff.test.ts`
Expected: PASS (7 tests).

- [ ] **Step 5: Full suite + typecheck, then commit**

Run: `cd /workspace/shippingcow-nextjs && npx vitest run && npx tsc --noEmit`
Expected: all PASS.

```bash
git add lib/calculator-handoff.ts __tests__/calculator-handoff.test.ts
git commit -m "feat: calculator handoff module — inquiry href builder + allowlisted context blob"
```

### Task 3: Wire the handoff — DimCalculator writes, /inquiry reads

**Files:**
- Modify: `components/DimCalculator.tsx` (import block; `inquiryHref` at line ~233; recalc effect at lines ~165-175)
- Modify: `app/inquiry/page.tsx` (state seeds at lines 95, 106-107)

**Interfaces:**
- Consumes from Task 2: `buildInquiryHref`, `buildCalcContext`, `CalcHandoff`.
- Produces: URL contract `/inquiry?l&w&h&weight&vol&origin_zip&dest_zip` read by the inquiry page.

- [ ] **Step 1: DimCalculator — replace inquiryHref and write sc_calc_result**

In `components/DimCalculator.tsx`, add to imports:

```ts
import { buildInquiryHref, buildCalcContext } from '@/lib/calculator-handoff';
```

Replace the line:

```ts
  const inquiryHref = `/inquiry?l=${length}&w=${width}&h=${height}&weight=${weight}`;
```

with:

```ts
  const inquiryHref = buildInquiryHref({
    length, width, height, weight, volume,
    originZip, destZip,
  });
```

Then add a new effect directly after the zone-fetch effect (after line ~217), so the widget's `getCalculatorContext()` reader in `components/ChatWidget.tsx:61-69` finally has a writer:

```ts
  // Persist a dollar-free snapshot for the chat widget's post-calc opener
  // (ChatWidget.getCalculatorContext reads localStorage.sc_calc_result).
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!(length > 0 && width > 0 && height > 0 && weight > 0 && volume > 0)) return;
    try {
      localStorage.setItem(
        'sc_calc_result',
        JSON.stringify(buildCalcContext(
          { length, width, height, weight, volume, originZip, destZip },
          zoneResults,
        )),
      );
    } catch { /* storage full/blocked — non-fatal */ }
  }, [length, width, height, weight, volume, originZip, destZip, zoneResults]);
```

Note: `zoneResults` may hold authed-only fields when a dashboard session exists; `buildCalcContext` allowlists, so the blob stays dollar-free either way (Task 2's hostile-zone test is the proof).

- [ ] **Step 2: /inquiry — read the new params**

In `app/inquiry/page.tsx`:

Replace:

```ts
  const [ordVol,   setOrdVol]   = useState('');
```

with:

```ts
  const [ordVol,   setOrdVol]   = useState(() => searchParams.get('vol') || '');
```

Replace:

```ts
  const [originZip, setOriginZip]   = useState('');
  const [destZips,  setDestZips]    = useState('');
```

with:

```ts
  const [originZip, setOriginZip]   = useState(() => searchParams.get('origin_zip') || '');
  const [destZips,  setDestZips]    = useState(() => searchParams.get('dest_zip') || '');
```

(`destZips` is a comma-separated free-text field; seeding it with the single calculator destination ZIP is valid input the visitor can extend.)

- [ ] **Step 3: Full suite + typecheck**

Run: `cd /workspace/shippingcow-nextjs && npx vitest run && npx tsc --noEmit`
Expected: all PASS.

- [ ] **Step 4: Commit**

```bash
git add components/DimCalculator.tsx app/inquiry/page.tsx
git commit -m "feat: carry volume and ZIPs through the calculator handoff; write sc_calc_result"
```

### Task 4: Rate-limit `/api/calculator/estimate`

**Files:**
- Modify: `app/api/calculator/estimate/route.ts` (imports; top of `POST`)
- Modify: `__tests__/estimate-route.test.ts` (add `vi.mock('@/lib/rate-limit')` + one 429 test)

**Interfaces:**
- Consumes: `isRateLimited(key: string, maxRequests?: number, windowSeconds?: number): boolean` from `lib/rate-limit.ts` (already exists, in-memory).
- Produces: 429 JSON `{ error: 'Too many requests — try again in a bit.' }`.

- [ ] **Step 1: Write the failing test**

In `__tests__/estimate-route.test.ts`, add alongside the existing `vi.mock` calls at the top:

```ts
vi.mock('@/lib/rate-limit', () => ({
  isRateLimited: vi.fn(() => false),
}));
```

and import the mock handle where the other mocked modules are imported:

```ts
import { isRateLimited } from '@/lib/rate-limit';
```

Then add a new test (same `post()` helper pattern the file already uses):

```ts
  it('returns 429 when the IP is rate-limited', async () => {
    vi.mocked(isRateLimited).mockReturnValueOnce(true);
    const res = await post({
      length: 48, width: 26, height: 48, weight: 95,
      monthly_volume: 200, origin_zip: '08901', dest_zip: '90210',
    });
    expect(res.status).toBe(429);
    const body = await res.json();
    expect(body.error).toMatch(/too many/i);
  });
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd /workspace/shippingcow-nextjs && npx vitest run __tests__/estimate-route.test.ts`
Expected: the new test FAILS (route returns 200 — no rate limit yet). Pre-existing tests still pass (mock defaults to `false`).

- [ ] **Step 3: Implement the limit**

In `app/api/calculator/estimate/route.ts`, add to imports:

```ts
import { isRateLimited } from '@/lib/rate-limit';
```

At the top of `POST`, before `await req.json()`:

```ts
  // 60/hr per IP: a human tweaking dims behind the 600ms client debounce stays
  // far under this; scripted scraping of the zone engine does not.
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  if (isRateLimited(`calc-estimate:${ip}`, 60, 3600)) {
    return NextResponse.json(
      { error: 'Too many requests — try again in a bit.' },
      { status: 429 }
    );
  }
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd /workspace/shippingcow-nextjs && npx vitest run __tests__/estimate-route.test.ts`
Expected: PASS, including all pre-existing cases.

- [ ] **Step 5: Full suite + typecheck + build, then commit**

Run: `cd /workspace/shippingcow-nextjs && npx vitest run && npx tsc --noEmit && npm run build`
Expected: all PASS; build succeeds.

```bash
git add app/api/calculator/estimate/route.ts __tests__/estimate-route.test.ts
git commit -m "feat: rate-limit the calculator estimate endpoint (60/hr per IP)"
```

### Task 5: Ship — claims check, push, draft PR

**Files:** none created; PR body uses `.github/pull_request_template.md` if present on main (it rides PR #10 — if absent, use the standard body shape from recent PRs).

- [ ] **Step 1: Claims check (manual grep — script not on main)**

Run: `cd /workspace/shippingcow-nextjs && grep -rniE "DIM ?(225|285|221)|÷ ?(225|285|221)|2.day|two.day|zero shrinkage|guaranteed deliver|\\$15M|80% off" app/ components/ lib/`
Expected: only the pre-existing dispositioned hits (the `$15M` badge in `app/page.tsx` = DEC-008, plus `dim225`/`bill225` identifiers and comments that predate this branch). The four new/modified files must contribute zero new hits. Paste output into the PR body.

- [ ] **Step 2: Push and open draft PR**

```bash
git push -u origin claude/tsk-web-06-calculator-gaps
```

Open a **draft** PR titled `feat(calculator): TSK-WEB-06 — presets, inquiry handoff, calc-context channel, rate limit`. Body: the four gaps with what/why; QA evidence = full-suite count, tsc, build, claims grep output, note that mobile 375px is handled by flex-wrap chips (no fixed widths added) and that the AC's Playwright zero-dollar assertion is covered server-side by redaction + allowlist-builder tests. Reference PRD A-2 and the scope-decisions section of the plan doc.

- [ ] **Step 3: Subscribe to PR activity**

Subscribe the session to the new PR (house standard: watch, drive-to-green).
