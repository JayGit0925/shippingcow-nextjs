import type { Metadata } from 'next';
import './globals.css';
import Nav from '@/components/Nav';
import Footer from '@/components/Footer';
import ChatWidget from '@/components/ChatWidget';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://shippingcow.io'),
  title: 'Shipping Cow — Heavy Goods 3PL & E-Commerce Fulfillment | Cut Shipping Costs 80%',
  description:
    'Shipping Cow AI is the #1 fulfillment platform for heavy goods sellers. Cut FedEx costs up to 80%, guarantee 2-day delivery, and automate your logistics paperwork with AI.',
  keywords: [
    'heavy goods 3PL',
    'oversized shipping',
    'ecommerce fulfillment',
    'cut shipping costs',
    'DIM weight optimizer',
    'Amazon SFP fulfillment',
    'TikTok Shop dispatch',
    'furniture 3PL',
    'fitness equipment shipping',
    'freight logistics platform',
  ],
  openGraph: {
    title: 'Shipping Cow — Moo-ve Heavy Goods Without Getting Milked',
    description:
      'Enterprise logistics rates for mid-market heavy goods sellers. Up to 80% off FedEx. 2-day guaranteed. AI-powered back office.',
    type: 'website',
    url: 'https://shippingcow.io',
    images: [{ url: '/opengraph-image', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ShippingCow — Heavy Goods Fulfillment with DIM 225 Pricing',
    description: 'DIM 225 pricing. 80% off FedEx rates. Zero shrinkage. 2-day delivery to 92% of the US.',
    images: ['/opengraph-image'],
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
      </body>
    </html>
  );
}
