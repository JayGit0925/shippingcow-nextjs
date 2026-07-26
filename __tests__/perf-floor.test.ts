import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
// eslint-disable-next-line import/no-relative-packages
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
