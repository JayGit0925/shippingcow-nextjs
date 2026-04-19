// ============================================================
// ShippingCow — shared TypeScript types
// ============================================================

// --- Chat --------------------------------------------------------

export type MessageRole = 'user' | 'assistant' | 'system';

export type Message = {
  role: MessageRole;
  content: string;
};

export type ChatRequest = {
  messages: Message[];
};

export type ChatResponse = {
  content: string;
  error?: string;
};

// --- Tracking ----------------------------------------------------

export type TrackingStatus =
  | 'pending'
  | 'in_transit'
  | 'out_for_delivery'
  | 'delivered'
  | 'exception';

export type TrackingEvent = {
  timestamp: string;
  location: string;
  description: string;
};

export type TrackingResult = {
  trackingNumber: string;
  status: TrackingStatus;
  carrier: string;
  origin: string;
  destination: string;
  estimatedDelivery: string;
  events: TrackingEvent[];
};

// --- Pricing -----------------------------------------------------

export type PricingTier = {
  name: string;
  monthlyPrice: number;
  yearlyPrice: number;
  description: string;
  features: string[];
  cta: string;
  highlighted?: boolean;
  badge?: string;
};

// --- Marketing ---------------------------------------------------

export type Testimonial = {
  author: string;
  role: string;
  company: string;
  quote: string;
  metric?: string;
  metricLabel?: string;
};

export type FAQItem = {
  question: string;
  answer: string;
};

// --- Inquiry / Lead ----------------------------------------------

export type InquiryPayload = {
  name: string;
  email: string;
  company?: string;
  phone?: string;
  monthly_spend?: string;
  product_weight?: string;
  message?: string;
};
