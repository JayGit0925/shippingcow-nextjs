import { describe, it, expect } from 'vitest';
import { buildJsonLd } from '@/lib/jsonld';

// TSK-WEB-07 (PRD C-3): Organization + Service must be emitted on every page
// (components/JsonLd.tsx renders this graph in app/layout.tsx). The payload
// is public — red lines apply.
function graph() {
  const json = buildJsonLd();
  return { json, nodes: json['@graph'] as Array<Record<string, unknown>> };
}

describe('global JSON-LD (lib/jsonld.ts)', () => {
  it('emits Organization, WebSite, and Service nodes', () => {
    const { nodes } = graph();
    const types = nodes.map((n) => n['@type']);
    expect(types).toContain('Organization');
    expect(types).toContain('WebSite');
    expect(types).toContain('Service');
  });

  it('Service is provided by the Organization node', () => {
    const { nodes } = graph();
    const org = nodes.find((n) => n['@type'] === 'Organization')!;
    const svc = nodes.find((n) => n['@type'] === 'Service')!;
    expect((svc.provider as { '@id': string })['@id']).toBe(org['@id']);
    expect(svc.areaServed).toBe('US');
    expect(String(svc.name)).toMatch(/50–149 lb/);
  });

  it('payload violates no public red lines', () => {
    const { json } = graph();
    const flat = JSON.stringify(json);
    expect(flat).not.toMatch(/225|285|221/);
    expect(flat).not.toMatch(/\$\s?\d/);
    expect(flat).not.toMatch(/2.day|two.day|guarantee(d)? deliver/i);
  });
});
