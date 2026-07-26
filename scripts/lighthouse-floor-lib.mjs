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
