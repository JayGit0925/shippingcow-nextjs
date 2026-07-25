import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Free Shipping Cost Audit — Upload Your Shipment Data | ShippingCow',
  description:
    'Upload a CSV or XLSX export of your shipments and we read the invoice line by line: dimensional weight, surcharges, and zone penalties on your 50–149 lb parcels. No signup, no sales call.',
  alternates: { canonical: '/audit' },
  openGraph: {
    title: 'Free Shipping Cost Audit — ShippingCow',
    description:
      'Upload your shipment export. We show you what you are actually being billed for on heavy parcels.',
    type: 'website',
  },
};

export default function AuditLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
