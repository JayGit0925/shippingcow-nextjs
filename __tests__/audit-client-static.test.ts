import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

// vitest here is node-env and its transform cannot parse .tsx imports, so
// client wiring is asserted statically (same pattern as vertical-pages-static).
const root = join(__dirname, '..');
const read = (p: string) => readFileSync(join(root, p), 'utf8');

describe('audit page failure path (A-1: retry UI)', () => {
  const src = () => read('app/audit/page.tsx');

  it('keeps the parsed preview on failure so retry does not require re-upload', () => {
    // runAudit failure states must carry the preview forward
    expect(src()).toMatch(/type:\s*'upload',\s*error[\s\S]{0,120}preview/);
  });

  it('fires the PostHog submit event', () => {
    expect(src()).toContain("captureEvent('audit_submitted'");
  });
});

describe('unlock gate failure path (A-1: retry UI)', () => {
  const src = () => read('app/audit/_components/ReportView.tsx');

  it('reads email_sent from the unlock response and stores a failure flag', () => {
    expect(src()).toMatch(/email_sent/);
    expect(src()).toMatch(/emailFailed|email_failed/);
  });

  it('offers a resend action when the email copy failed', () => {
    expect(src()).toMatch(/Resend/i);
  });

  it('fires the PostHog unlock event', () => {
    expect(src()).toContain("captureEvent('audit_unlock_submitted'");
  });
});
