'use client';

import { useState } from 'react';
import Link from 'next/link';

const SPEND_OPTIONS = ['Under $1,000', '$1,000 – $9,999', '$10,000 – $19,999', '$20,000 – $50,000', '$50,000+'];
const WEIGHT_OPTIONS = [
  'Less than 10 lbs (Standard Parcel)',
  '11 – 30 lbs (Mid-weight)',
  '31 – 50 lbs (Heavy)',
  '51 – 150 lbs (Oversized / Extra-Large)',
  '150+ lbs / Pallet Loaded',
];

export default function InquiryPage() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    company: '',
    phone: '',
    monthly_spend: '',
    product_weight: '',
    message: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const r = await fetch('/api/inquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await r.json();
      if (!r.ok) {
        setError(data.error || 'Something went wrong');
        setLoading(false);
        return;
      }
      setSuccess(true);
      setLoading(false);
    } catch {
      setError('Network error. Please try again.');
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="form-page">
        <div className="form-card form-card--wide" style={{ textAlign: 'center' }}>
          <span className="cow-logo form-card__cow bob" role="img" aria-label="Happy Shipping Cow" style={{ display: 'block', margin: '0 auto 1rem', height: 100, width: 120 }} />
          <h1 style={{ color: 'var(--blue)' }}>You&apos;re in the Herd!</h1>
          <p style={{ fontSize: '1.1rem', marginBottom: '1.5rem', color: '#3a4454' }}>
            We got your inquiry. A member of our herd will review your logistics needs and get back to you within <strong>one business day</strong>.
          </p>
          <p style={{ fontSize: '0.95rem', color: '#6b7280', marginBottom: '2rem' }}>
            Check your inbox for a confirmation. No spam. Moo&apos;s honor. 🤝
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/" className="btn btn--ghost">← Back to Home</Link>
            <Link href="/dashboard" className="btn btn--blue">Go to Dashboard →</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="form-page">
      <form className="form-card form-card--wide" onSubmit={submit}>
        <span className="cow-logo form-card__cow" role="img" aria-label="Shipping Cow" style={{ height: 70 }} />
        <h1>Get Your Free Cost Audit</h1>
        <p className="form-card__sub">
          Tell us about your shipping volume and we&apos;ll come back with a custom savings estimate — typically within one business day.
        </p>

        {error && <div className="form-error">{error}</div>}

        <div className="form-row">
          <div className="form-field">
            <label htmlFor="name">Your Name *</label>
            <input id="name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Jane Rancher" />
          </div>
          <div className="form-field">
            <label htmlFor="email">Email *</label>
            <input id="email" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="jane@yourstore.com" />
          </div>
        </div>

        <div className="form-row">
          <div className="form-field">
            <label htmlFor="company">Company</label>
            <input id="company" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} placeholder="Your Store LLC" />
          </div>
          <div className="form-field">
            <label htmlFor="phone">Phone</label>
            <input id="phone" type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="(555) 123-4567" />
          </div>
        </div>

        <div className="form-row">
          <div className="form-field">
            <label htmlFor="monthly_spend">Monthly Shipping Spend</label>
            <select id="monthly_spend" value={form.monthly_spend} onChange={(e) => setForm({ ...form, monthly_spend: e.target.value })}>
              <option value="">Select a range...</option>
              {SPEND_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
          <div className="form-field">
            <label htmlFor="product_weight">Product Weight Class</label>
            <select id="product_weight" value={form.product_weight} onChange={(e) => setForm({ ...form, product_weight: e.target.value })}>
              <option value="">Select a range...</option>
              {WEIGHT_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
        </div>

        <div className="form-field">
          <label htmlFor="message">Tell Us About Your Shipping Challenges</label>
          <textarea
            id="message"
            value={form.message}
            onChange={(e) => setForm({ ...form, message: e.target.value })}
            placeholder="What's the biggest thing eating your margins right now? DIM weight fees? FBA storage? Damaged inventory?"
          />
        </div>

        <button type="submit" className="btn btn--blue btn--full" disabled={loading}>
          {loading ? <><span className="spinner" /> Sending...</> : '🐄 Send My Inquiry →'}
        </button>

        <p style={{ marginTop: '1rem', fontSize: '0.82rem', color: '#6b7280', textAlign: 'center' }}>
          By submitting, you agree to receive logistics insights from Shipping Cow. No spam. Moo&apos;s honor.
        </p>
      </form>
    </div>
  );
}
