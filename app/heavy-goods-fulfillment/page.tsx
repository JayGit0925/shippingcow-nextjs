import type { Metadata } from 'next';
import VerticalLanding from '@/components/VerticalLanding';
import { VERTICALS } from '@/lib/vertical-copy';
import { SITE_URL } from '@/lib/site';

const v = VERTICALS['heavy-goods-fulfillment'];

// noindex until GATE-LANDED-COST clears (PRD D-1); also excluded from sitemap.
export const metadata: Metadata = {
  title: v.metaTitle,
  description: v.metaDescription,
  alternates: { canonical: `${SITE_URL}/${v.slug}` },
  robots: { index: false, follow: true },
};

export default function HeavyGoodsFulfillmentPage() {
  return <VerticalLanding slug="heavy-goods-fulfillment" />;
}
