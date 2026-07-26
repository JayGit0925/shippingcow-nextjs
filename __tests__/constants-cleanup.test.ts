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
    const before = constants.slice(0, idx).split('\n').slice(-8).join('\n');
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
