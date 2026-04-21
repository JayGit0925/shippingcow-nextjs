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

// --- Chat v2 ------------------------------------------------------

export type ChatSession = {
  session_id: string;
  first_seen: string;
  last_seen: string;
  page_count: number;
  opener_variant: string | null;
  email: string | null;
  qualified_score: number;
  lead_id: string | null;
  slack_notified_at: string | null;
  follow_up_sent_at: string | null;
  message_count: number;
  calculator_context: Record<string, unknown> | null;
};

export type ChatEvent = {
  id: string;
  created_at: string;
  session_id: string;
  event_type: ChatEventType;
  metadata: Record<string, unknown> | null;
};

export type ChatEventType =
  | 'widget_opened'
  | 'widget_auto_opened'
  | 'first_message'
  | 'email_captured'
  | 'qualified'
  | 'handoff_slack'
  | 'session_end';

export type QualifyResult = {
  score: number;        // 0–100
  intent: string;       // "pricing" | "support" | "browsing" | "ready_to_buy"
  capture_ready: boolean;
  needs_human: boolean;
};
