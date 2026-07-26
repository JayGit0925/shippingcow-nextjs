import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';

const calc = readFileSync('components/DimCalculator.tsx', 'utf8');

describe('funnel instrumentation: DimCalculator', () => {
  it('imports typed helpers from lib/funnel (no raw event strings)', () => {
    expect(calc).toMatch(/from '@\/lib\/funnel'/);
    expect(calc).not.toMatch(/captureEvent\(/);
  });

  it('fires calculator_start via trackCalculatorStart', () => {
    expect(calc).toMatch(/trackCalculatorStart\(/);
  });

  it('fires calculator_complete via trackCalculatorComplete, gated on start', () => {
    expect(calc).toMatch(/trackCalculatorComplete\(/);
    expect(calc).toMatch(/startedRef\.current && !completedRef\.current/);
  });

  it('sends no dollar or savings properties to the funnel', () => {
    const trackCalls = calc.match(/trackCalculator\w+\(\{[^}]*\}/g) ?? [];
    for (const call of trackCalls) {
      expect(call).not.toMatch(/savings|cost|price|\$/i);
    }
  });
});
