'use client';

import { useState } from 'react';
import type { FAQItem } from '@/lib/types';

const DEFAULT_ITEMS: FAQItem[] = [
  {
    question: 'How does ShippingCow decide which carrier to use?',
    answer:
      'ShippingCow analyzes each order in real time — package dimensions, weight, origin zip, destination zip, and your service-level requirement — then routes it through whichever carrier and service gives you the lowest landed cost. We re-run this optimization on every single shipment, not just on averages.',
  },
  {
    question: 'What carriers does ShippingCow support?',
    answer:
      'We connect to UPS, FedEx, USPS, DHL, OnTrac, LaserShip, and a growing list of regional carriers. Regional carriers often beat the nationals by 20–35% on short-zone shipments, and ShippingCow automatically taps them when it makes sense.',
  },
  {
    question: 'Do I have to change my 3PL or warehouse?',
    answer:
      'No. ShippingCow sits between your store and your existing 3PL or warehouse. We inject our routing decisions at label-generation time, so your fulfillment workflow stays the same — you just pay less per label.',
  },
  {
    question: 'How long does it take to integrate?',
    answer:
      'Most sellers are live within one business day. We have native connections for Shopify, WooCommerce, Amazon MCF, and ShipStation. For custom stacks, our REST API has a Postman collection and sandbox you can test against in minutes.',
  },
  {
    question: 'What if ShippingCow routes a package incorrectly?',
    answer:
      'You set guardrails — max transit days, required carriers for certain SKUs, blacklisted zip codes — and ShippingCow never violates them. If a shipment falls outside expected parameters, it escalates to your team rather than shipping blind.',
  },
  {
    question: 'Is there a volume minimum?',
    answer:
      "Our Scout plan starts at $0/month for up to 200 shipments. There's no volume floor. As you scale, our per-label rate drops, so the ROI gets stronger the more you ship.",
  },
  {
    question: 'How do I know how much I\'m saving?',
    answer:
      'Your dashboard shows side-by-side comparisons: what you paid vs. what you would have paid at your previous carrier\'s list rate. We also export monthly savings reports you can share with your CFO.',
  },
];

type Props = {
  items?: FAQItem[];
  title?: string;
};

export default function FAQ({ items = DEFAULT_ITEMS, title = 'Frequently asked questions' }: Props) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section
      style={{
        padding: '5rem 1.5rem',
        background: '#F9FAFB',
        borderTop: '2px solid #E5E7EB',
        borderBottom: '2px solid #E5E7EB',
      }}
    >
      <div style={{ maxWidth: 760, margin: '0 auto' }}>
        <h2
          style={{
            fontSize: 'clamp(1.75rem, 4vw, 2.5rem)',
            fontWeight: 800,
            textAlign: 'center',
            color: '#111827',
            marginBottom: '3rem',
          }}
        >
          {title}
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {items.map((item, i) => {
            const isOpen = openIndex === i;
            return (
              <div
                key={i}
                style={{
                  border: isOpen ? '2px solid #1E40AF' : '2px solid #E5E7EB',
                  borderRadius: 8,
                  background: '#fff',
                  overflow: 'hidden',
                  boxShadow: isOpen ? '3px 3px 0 #1E40AF' : 'none',
                  transition: 'box-shadow 0.2s',
                }}
              >
                <button
                  onClick={() => setOpenIndex(isOpen ? null : i)}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    padding: '1rem 1.25rem',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: 12,
                    fontWeight: 600,
                    fontSize: '1rem',
                    color: isOpen ? '#1E40AF' : '#111827',
                  }}
                >
                  <span>{item.question}</span>
                  <span
                    style={{
                      flexShrink: 0,
                      fontSize: '1.25rem',
                      color: '#6B7280',
                      transform: isOpen ? 'rotate(45deg)' : 'none',
                      transition: 'transform 0.2s',
                    }}
                  >
                    +
                  </span>
                </button>

                {isOpen && (
                  <div
                    style={{
                      padding: '0 1.25rem 1.25rem',
                      fontSize: '0.9375rem',
                      color: '#4B5563',
                      lineHeight: 1.7,
                    }}
                  >
                    {item.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
