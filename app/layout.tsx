import type { Metadata } from 'next';
import './globals.css';
import Nav from '@/components/Nav';
import Footer from '@/components/Footer';
import ChatWidget from '@/components/ChatWidget';
import CookieConsent from '@/components/CookieConsent';
import PostHogProvider from '@/components/PostHogProvider';
import JsonLd from '@/components/JsonLd';
import { Analytics } from '@vercel/analytics/react';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://shippingcow.ai'),
  title: 'Shipping Cow — 3PL for 50–149 lb Parcels | DIM 225 Billing',
  description:
    'The 3PL built for heavy parcels. DIM 225 billing (vs carriers’ 139), pooled enterprise FedEx rates, and zone-skipping — typically 15–20% lower all-in cost, up to 52% on zone 7–8 lanes.',
  keywords: [
    'heavy goods 3PL',
    'oversized shipping',
    'ecommerce fulfillment',
    'cut shipping costs',
    'DIM weight optimizer',
    'furniture 3PL',
    'fitness equipment shipping',
    'freight logistics platform',
  ],
  openGraph: {
    title: 'Shipping Cow — Moo-ve Heavy Goods Without Getting Milked',
    description:
      'DIM 225 billing, pooled enterprise FedEx rates, zone-skipping. Typically 15–20% lower all-in cost on 50–149 lb parcels.',
    type: 'website',
    images: [{ url: '/opengraph-image', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ShippingCow — 3PL for 50–149 lb Parcels',
    description: 'DIM 225 billing vs carriers’ 139. Pooled enterprise FedEx rates. Zone-skipping to 92% of the US.',
    images: ['/opengraph-image'],
  },
  alternates: { canonical: './' },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_VERIFICATION || '',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Nav />
        {children}
        <Footer />
        <ChatWidget />
        <CookieConsent />
        <PostHogProvider />
        <JsonLd />
        <Analytics />
      </body>
    </html>
  );
}
