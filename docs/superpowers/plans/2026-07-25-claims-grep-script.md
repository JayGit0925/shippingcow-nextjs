# Claims-Grep Script (TSK-WEB-03) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Commit the red-line claims check as a runnable script and wire it into the PR checklist, so every website PR mechanically runs the website PRD §4 enforcement grep.

**Architecture:** One bash script (`scripts/check-claims.sh`) holding the PRD §4 pattern, exit 1 on any hit; a vitest test proving pass/fail behavior against fixtures; an npm alias; a PR template that requires the script's output in every PR body.

**Tech Stack:** bash + grep -E, vitest (already in repo) via `execFileSync`.

**Spec:** website PRD §4 (enforcement line) + backlog row TSK-WEB-03 — `shippingcow/website/prd_website_shippingcow_2026-07-25.md` in JayGit0925/logistar. PRD is founder-approved, so this plan enters at writing-plans (house rule 2).

## Global Constraints

- Pattern must be exactly the PRD §4 grep: `DIM ?(225|285|221)|÷ ?(225|285|221)|2.day|two.day|zero shrinkage|guaranteed deliver|\$15M|80% off`, case-insensitive, over `app/ components/ lib/`.
- Hits are allowed only as gated code paths documented in the PR body — so the script FAILS loud (exit 1) and prints every hit; it never allowlists.
- Known current state: `$15M` badge exists pending DEC-008 — the script is expected to exit 1 on today's main with only those hits.
- No secrets, no internal cost constants, no new claims copy (this is tooling only).

---

### Task 1: check-claims script + test + PR checklist wiring

**Files:**
- Create: `scripts/check-claims.sh`
- Create: `__tests__/check-claims.test.ts`
- Create: `.github/pull_request_template.md`
- Modify: `package.json` (scripts block: add `check:claims`)

**Interfaces:**
- Produces: `bash scripts/check-claims.sh [dir...]` — defaults to `app components lib`; exit 0 + `PASS` line when clean, exit 1 + hit list when any restricted string matches. `npm run check:claims` is the canonical entry point referenced by the PR template.

- [ ] **Step 1: Write the failing test**

```ts
// __tests__/check-claims.test.ts
import { describe, it, expect } from "vitest";
import { execFileSync } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

function runCheck(dirs: string[]): { code: number; out: string } {
  try {
    const out = execFileSync("bash", ["scripts/check-claims.sh", ...dirs], {
      encoding: "utf8",
    });
    return { code: 0, out };
  } catch (e: any) {
    return { code: e.status, out: `${e.stdout ?? ""}${e.stderr ?? ""}` };
  }
}

function fixtureDir(content?: string): string {
  const dir = mkdtempSync(join(tmpdir(), "claims-"));
  writeFileSync(join(dir, "page.tsx"), content ?? "export default () => <p>heavy goods</p>;");
  return dir;
}

describe("check-claims.sh", () => {
  it("passes on a clean directory", () => {
    const r = runCheck([fixtureDir()]);
    expect(r.code).toBe(0);
    expect(r.out).toContain("PASS");
  });

  it.each([
    "our DIM 225 divisor",
    "savings of $15M ARR",
    "2-day delivery",
    "guaranteed delivery window",
    "zero shrinkage promise",
    "80% off list rates",
  ])("fails and reports the hit for %s", (banned) => {
    const r = runCheck([fixtureDir(`<p>${banned}</p>`)]);
    expect(r.code).toBe(1);
    expect(r.out).toContain("page.tsx");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run __tests__/check-claims.test.ts`
Expected: FAIL — script file does not exist (`ENOENT`/exit code null).

- [ ] **Step 3: Write the script**

```bash
#!/usr/bin/env bash
# Red-line claims check — website PRD §4 enforcement.
# Exit 1 if any restricted claim string appears in shipped code.
# Hits are allowed ONLY as gated code paths documented in the PR body.
set -uo pipefail

PATTERN='DIM ?(225|285|221)|÷ ?(225|285|221)|2.day|two.day|zero shrinkage|guaranteed deliver|\$15M|80% off'

if [ "$#" -gt 0 ]; then DIRS=("$@"); else DIRS=(app components lib); fi

matches=$(grep -riEn "$PATTERN" "${DIRS[@]}" 2>/dev/null || true)

if [ -n "$matches" ]; then
  echo "Restricted claim strings found:"
  echo "$matches"
  echo
  echo "FAIL — each hit above must be a gated code path documented in the PR body (website PRD §4)."
  exit 1
fi

echo "PASS — no restricted claim strings in: ${DIRS[*]}"
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run __tests__/check-claims.test.ts`
Expected: PASS (all 7 cases).

- [ ] **Step 5: Wire npm alias**

In `package.json` scripts block add: `"check:claims": "bash scripts/check-claims.sh"`.

- [ ] **Step 6: Create the PR template (the "PR checklist" wiring)**

```markdown
## What changed

<!-- one or two sentences -->

## QA evidence (website PRD §7, Build → QA contract)

- [ ] `npm run check:claims` output pasted below — any hit documented as a gated code path
- [ ] Mobile fold check at 375×667 (UI changes)
- [ ] Lighthouse mobile score (UI changes)

### check:claims output

```
(paste script output here)
```
```

- [ ] **Step 7: Verify against the real tree and record known hits**

Run: `npm run check:claims`
Expected: exit 1 with ONLY `$15M` hits (DEC-008 pending, documented in PR body). Any other hit = investigate before committing.

- [ ] **Step 8: Full test suite + commit**

Run: `npx vitest run`
Expected: all suites pass.

```bash
git add scripts/check-claims.sh __tests__/check-claims.test.ts .github/pull_request_template.md package.json docs/superpowers/plans/2026-07-25-claims-grep-script.md
git commit -m "Add claims-grep red-line check (TSK-WEB-03): script, tests, PR template"
```
