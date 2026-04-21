# Chat Widget v2 — Iteration Log

## Format
Each entry: Date | Phase | What failed | Root cause | Fix | Outcome

---

## Build iterations

### 2026-04-21 | Phase 2 | Build fail — scripts/seed-zips.ts TypeScript error
- **Failure:** `npm run build` failed: `'row' is of type 'unknown'` in scripts/seed-zips.ts
- **Root cause:** Pre-existing untracked file included in tsconfig `**/*.ts`, TypeScript strict mode rejected implicit `unknown` indexing
- **Fix:** Added `const r = row as Record<string, unknown>` cast, updated property access through `r`
- **Outcome:** Build passes ✅

---

## Pending test iterations
_(fill in during staging QA)_
