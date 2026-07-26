import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

// Static source checks, claims-grep style: node-env vitest cannot render Next
// pages, and these are copy-level invariants (PRD C-3 + DEC-007).
const src = readFileSync(
  join(__dirname, '..', 'app', 'big-and-bulky', 'page.tsx'),
  'utf8'
);

describe('/big-and-bulky copy invariants', () => {
  it('carries a visible Last updated dateline (PRD C-3 freshness signal)', () => {
    expect(src).toMatch(/LAST_UPDATED = '\d{4}-\d{2}-\d{2}'/);
    expect(src).toMatch(/Last updated: \{LAST_UPDATED\}/);
  });

  it('never renders the entity as two words (DEC-007)', () => {
    expect(src).not.toMatch(/Shipping Cow/);
  });
});
