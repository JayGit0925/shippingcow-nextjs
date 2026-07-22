import type { Metadata } from 'next';
import './globals.css';
import Nav from '@/components/Nav';
import Footer from '@/components/Footer';
import ChatWidget from '@/components/ChatWidget';
import CookieConsent from '@/components/CookieConsent';
import PostHogProvider from '@/components/PostHogProvider';
import JsonLd from '@/components/JsonLd';
import { Analytics } from '@vercel/analytics/react';
import { SITE_URL } from '@/lib/site';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: 'ShippingCow — The Self-Operated US 3PL Built for 50–149 lb Parcels',
  description:
    'ShippingCow is the self-operated US 3PL built for 50–149 lb heavy DTC parcels. Pooled enterprise FedEx rates, zone-skip routing, and a free audit of what your current carrier is actually billing you for.',
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
    title: 'ShippingCow — Moo-ve Heavy Goods Without Getting Milked',
    description:
      'The self-operated US 3PL built for 50–149 lb parcels. Pooled enterprise FedEx rates and zone-skip routing.',
    type: 'website',
    url: SITE_URL,
    siteName: 'ShippingCow',
    images: [{ url: '/opengraph-image', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ShippingCow — 3PL for 50–149 lb Parcels',
    description: 'The self-operated US 3PL built for 50–149 lb parcels. Pooled enterprise FedEx rates. Zone-skip routing.',
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
