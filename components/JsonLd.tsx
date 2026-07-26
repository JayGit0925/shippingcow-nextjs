import { buildJsonLd } from '@/lib/jsonld';

// The @graph itself lives in lib/jsonld.ts (plain TS) so node-env vitest can
// audit the payload against the public red lines.
export default function JsonLd() {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(buildJsonLd()) }}
    />
  );
}
