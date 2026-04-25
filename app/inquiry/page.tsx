'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  DIM_DIVISOR_STANDARD,
  DIM_DIVISOR_SHIPPINGCOW,
  ESTIMATED_COST_PER_LB,
} from '@/lib/constants';

// ---- DIM math (same as calculator) ----
function calcSavings(skus: Sku[]) {
  let totalSavingsPerPkg = 0;
  for (const s of skus) {
    if (!s.length || !s.width || !s.height || !s.weight) continue;
    const vol = s.length * s.width * s.height;
    const bill139 = Math.max(s.weight, vol / DIM_DIVISOR_STANDARD);
    const bill225 = Math.max(s.weight, vol / DIM_DIVISOR_SHIPPINGCOW);
    totalSavingsPerPkg += (bill139 - bill225) * ESTIMATED_COST_PER_LB;
  }
  return totalSavingsPerPkg;
}

type Sku = {
  name: string; length: number; width: number; height: number; weight: number;
};

const EMPTY_SKU: Sku = { name: '', length: 0, width: 0, height: 0, weight: 0 };

// ---- Progress bar ----
function FunnelProgress({ step }: { step: number }) {
  return (
    <div className="funnel-progress">
      {[1, 2, 3, 4].map((s) => (
        <div
          key={s}
          className={`funnel-step ${s < step ? 'funnel-step--done' : ''} ${s === step ? 'funnel-step--active' : ''}`}
        />
      ))}
    </div>
  );
}

// ---- Select helper ----
function Select({ id, label, value, onChange, options, required }: {
  id: string; label: string; value: string;
  onChange: (v: string) => void;
  options: string[]; required?: boolean;
}) {
  return (
    <div className="form-field">
      <label htmlFor={id}>{label}{required && ' *'}</label>
      <select id={id} required={required} value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">Select…</option>
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}

// ---- Inner component (needs useSearchParams) ----
function InquiryInner() {
  const searchParams = useSearchParams();

  const [step, setStep]     = useState(1);
  const [leadId, setLeadId] = useState<string | null>(null);
  const [busy, setBusy]     = useState(false);
  const [err, setErr]       = useState<string | null>(null);
  const [done, setDone]     = useState(false);
  const [auditSummary, setAuditSummary] = useState<{annual_savings: number, warehouse_distribution?: Record<string, number>} | null>(null);

  // Step 1
  const [spend,    setSpend]    = useState('');
  const [wClass,   setWClass]   = useState('');
  const [category, setCategory] = useState('');

  // Step 2
  const [company,  setCompany]  = useState('');
  const [shopify,  setShopify]  = useState('');
  const [ordVol,   setOrdVol]   = useState('');
  const [current3pl, setCurrent3pl] = useState('');

  // Step 3 — pre-fill first SKU from /calculator params
  const [skus, setSkus] = useState<Sku[]>(() => [{
    ...EMPTY_SKU,
    length: Number(searchParams.get('l'))      || 0,
    width:  Number(searchParams.get('w'))      || 0,
    height: Number(searchParams.get('h'))      || 0,
    weight: Number(searchParams.get('weight')) || 0,
  }]);
  const [originZip, setOriginZip]   = useState('');
  const [destZips,  setDestZips]    = useState('');

  // Step 4
  const [email,       setEmail]       = useState('');
  const [phone,       setPhone]       = useState('');
  const [frustration, setFrustration] = useState('');

  // Fetch audit summary if audit_id in URL
  useEffect(() => {
    const auditId = searchParams.get('audit_id');
    if (auditId) {
      fetch(`/api/audit?id=${encodeURIComponent(auditId)}`)
        .then((r) => r.json())
        .then((data) => {
          if (data.report_data) {
            setAuditSummary({
              annual_savings: data.report_data.total_savings * 12,
              warehouse_distribution: data.report_data.warehouse_distribution,
            });
          }
        })
        .catch(() => {}); // Silently fail if audit not found
    }
  }, [searchParams]);

  // Live savings preview (step 3)
  const [savingsPerPkg, setSavingsPerPkg] = useState(0);
  useEffect(() => {
    setSavingsPerPkg(calcSavings(skus));
  }, [skus]);

  function updateSku(i: number, field: keyof Sku, value: string | number) {
    setSkus((prev) => prev.map((s, idx) => idx === i ? { ...s, [field]: value } : s));
  }

  async function step1Next(e: React.FormEvent) {
    e.preventDefault();
    setErr(null); setBusy(true);
    const r = await fetch('/api/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        monthly_spend: spend, weight_class: wClass, product_category: category,
        source_url: window.location.href,
      }),
    });
    const data = await r.json();
    setBusy(false);
    if (!r.ok) { setErr(data.error || 'Error saving step 1'); return; }
    setLeadId(data.id);
    setStep(2);
  }

  async function step2Next(e: React.FormEvent) {
    e.preventDefault();
    if (!leadId) return;
    setErr(null); setBusy(true);
    const r = await fetch(`/api/leads/${leadId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        step_completed: 2,
        step2_data: { company, shopify_url: shopify, monthly_volume: ordVol, current_fulfillment: current3pl },
      }),
    });
    setBusy(false);
    if (!r.ok) { const d = await r.json(); setErr(d.error || 'Error saving step 2'); return; }
    setStep(3);
  }

  async function step3Next(e: React.FormEvent) {
    e.preventDefault();
    if (!leadId) return;
    setErr(null); setBusy(true);
    const monthlySavings = savingsPerPkg * Number(ordVol || 100);
    const savings_estimate = {
      savings_per_package: Math.round(savingsPerPkg * 100) / 100,
      monthly_savings:     Math.round(monthlySavings * 100) / 100,
      annual_savings:      Math.round(monthlySavings * 12 * 100) / 100,
    };
    const r = await fetch(`/api/leads/${leadId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        step_completed: 3,
        step3_data: {
          skus,
          origin_zip: originZip,
          top_destination_zips: destZips.split(',').map((z) => z.trim()).filter(Boolean),
        },
        savings_estimate,
      }),
    });
    setBusy(false);
    if (!r.ok) { const d = await r.json(); setErr(d.error || 'Error saving step 3'); return; }
    setStep(4);
  }

  async function step4Submit(e: React.FormEvent) {
    e.preventDefault();
    if (!leadId) return;
    setErr(null); setBusy(true);
    const r = await fetch(`/api/leads/${leadId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        step_completed: 4,
        step4_data: { email, phone, frustration },
        status: 'new',
      }),
    });
    setBusy(false);
    if (!r.ok) { const d = await r.json(); setErr(d.error || 'Error saving step 4'); return; }
    setDone(true);
  }

  // ---- Confirmation screen ----
  if (done) {
    const monthlySavings = savingsPerPkg * Number(ordVol || 100);
    return (
      <div className="form-page">
        <div className="form-card form-card--wide" style={{ textAlign: 'center' }}>
          <span className="cow-logo bob" role="img" aria-label="Shipping Cow" style={{ display: 'block', margin: '0 auto 1rem', height: 100, width: 120 }} />
          <h1 style={{ color: 'var(--blue)' }}>You&apos;re in the Herd!</h1>
          <p style={{ fontSize: '1.1rem', marginBottom: '1rem', color: '#3a4454' }}>
            Your custom savings report is being prepared. Expect it within <strong>1 business day</strong>.
          </p>
          {savingsPerPkg > 0 && (
            <div style={{ background: 'var(--yellow)', border: '4px solid var(--dark)', padding: '1.2rem', margin: '1.5rem 0', boxShadow: 'var(--shadow-pixel)' }}>
              <div style={{ fontFamily: 'var(--font-pixel)', fontSize: '0.65rem', textTransform: 'uppercase', marginBottom: '0.4rem' }}>Your estimated savings</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '2.2rem', fontWeight: 900 }}>
                ${Math.round(monthlySavings).toLocaleString()}/mo
              </div>
              <div style={{ fontSize: '0.85rem', color: '#3a4454' }}>
                ${Math.round(savingsPerPkg * 100) / 100} per package with DIM 225
              </div>
            </div>
          )}
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap', marginTop: '1.5rem' }}>
            <Link href="/" className="btn btn--ghost">← Back to Home</Link>
            <Link href={`/signup?email=${encodeURIComponent(email)}`} className="btn btn--blue">
              Create account to track your audit →
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="form-page">
      {auditSummary && (
        <div style={{ background: 'var(--yellow)', border: '3px solid var(--dark)', padding: '1.5rem', marginBottom: '1.5rem', boxShadow: 'var(--shadow-pixel)' }}>
          <div style={{ fontFamily: 'var(--font-pixel)', fontSize: '0.7rem', color: 'var(--blue)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
            Based on your audit
          </div>
          <div style={{ fontSize: '1.3rem', fontWeight: 700 }}>
            You could save <span style={{ color: 'var(--blue)' }}>${(auditSummary.annual_savings).toLocaleString('en-US', {minimumFractionDigits: 0})}/year</span>
          </div>
          <div style={{ fontSize: '0.95rem', color: '#3a4454', marginTop: '0.5rem' }}>
            Complete your profile below and we'll send you a detailed breakdown within 1 business day.
          </div>
        </div>
      )}
      <div className="form-card form-card--wide">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
          <h1 style={{ margin: 0 }}>Get Your Free Audit</h1>
          <span style={{ fontFamily: 'var(--font-pixel)', fontSize: '0.65rem', color: 'var(--blue)', textTransform: 'uppercase' }}>
            Step {step} of 4
          </span>
        </div>
        <FunnelProgress step={step} />
        {err && <div className="form-error" style={{ marginBottom: '1rem' }}>{err}</div>}

        {/* ====== STEP 1 ====== */}
        {step === 1 && (
          <form onSubmit={step1Next}>
            <p className="form-card__sub">Two minutes. No commitment. We&apos;ll tell you exactly how much you&apos;re leaving on the table.</p>
            <Select id="spend" label="Monthly shipping spend" value={spend} onChange={setSpend} required
              options={['Under $5K', '$5K–$15K', '$15K–$50K', '$50K+']} />
            <Select id="wclass" label="Product weight class" value={wClass} onChange={setWClass} required
              options={['30–50 lbs', '50–80 lbs', '80+ lbs']} />
            <Select id="cat" label="Product category" value={category} onChange={setCategory} required
              options={['Furniture', 'Fitness Equipment', 'Industrial Parts', 'Electronics & Appliances', 'Outdoor & Garden', 'Other']} />
            <button type="submit" className="btn btn--blue btn--full" disabled={busy}>
              {busy ? <><span className="spinner" /> Saving…</> : 'Continue to Step 2 →'}
            </button>
          </form>
        )}

        {/* ====== STEP 2 ====== */}
        {step === 2 && (
          <form onSubmit={step2Next}>
            <p className="form-card__sub">Tell us a bit about your operation.</p>
            <div className="form-row">
              <div className="form-field">
                <label htmlFor="company">Company name *</label>
                <input id="company" required value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Your Store LLC" />
              </div>
              <div className="form-field">
                <label htmlFor="shopify">Shopify URL (optional)</label>
                <input id="shopify" type="url" value={shopify} onChange={(e) => setShopify(e.target.value)} placeholder="https://yourstore.myshopify.com" />
              </div>
            </div>
            <div className="form-row">
              <div className="form-field">
                <label htmlFor="ordvol">Monthly order volume *</label>
                <input id="ordvol" type="number" min={1} required value={ordVol} onChange={(e) => setOrdVol(e.target.value)} placeholder="200" />
              </div>
              <div className="form-field">
                <label htmlFor="cur3pl">Current fulfillment</label>
                <select id="cur3pl" value={current3pl} onChange={(e) => setCurrent3pl(e.target.value)}>
                  <option value="">Select…</option>
                  {['Self-fulfilled', 'FBA', '3PL (name it below)', 'Other'].map((o) => <option key={o}>{o}</option>)}
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
              <button type="button" className="btn btn--ghost" onClick={() => setStep(1)}>← Back</button>
              <button type="submit" className="btn btn--blue" style={{ flex: 1 }} disabled={busy}>
                {busy ? <><span className="spinner" /> Saving…</> : 'Continue to Step 3 →'}
              </button>
            </div>
          </form>
        )}

        {/* ====== STEP 3 ====== */}
        {step === 3 && (
          <form onSubmit={step3Next}>
            <p className="form-card__sub">Add your top 1–3 SKUs. We&apos;ll show you real savings before you give us your contact info.</p>

            {skus.map((sku, i) => (
              <div key={i} style={{ border: '3px solid var(--dark)', padding: '1.2rem', marginBottom: '1rem', background: '#f8fafc', boxShadow: 'var(--shadow-pixel)' }}>
                <div style={{ fontFamily: 'var(--font-pixel)', fontSize: '0.6rem', textTransform: 'uppercase', color: 'var(--blue)', marginBottom: '0.8rem' }}>
                  SKU {i + 1}
                </div>
                <div className="form-field">
                  <label>Product name (optional)</label>
                  <input value={sku.name} onChange={(e) => updateSku(i, 'name', e.target.value)} placeholder="e.g. Squat Rack Model A" />
                </div>
                <div className="form-row">
                  {(['length', 'width', 'height'] as const).map((f) => (
                    <div key={f} className="form-field">
                      <label>{f.charAt(0).toUpperCase() + f.slice(1)} (in)</label>
                      <input type="number" min={1} step={0.5} value={sku[f] || ''} onChange={(e) => updateSku(i, f, Number(e.target.value))} placeholder="0" />
                    </div>
                  ))}
                </div>
                <div className="form-row">
                  <div className="form-field">
                    <label>Weight (lbs) *</label>
                    <input type="number" min={1} step={0.5} required={i === 0} value={sku.weight || ''} onChange={(e) => updateSku(i, 'weight', Number(e.target.value))} placeholder="0" />
                  </div>
                  {i > 0 && (
                    <div className="form-field" style={{ display: 'flex', alignItems: 'flex-end' }}>
                      <button type="button" className="btn btn--sm btn--ghost" onClick={() => setSkus((s) => s.filter((_, idx) => idx !== i))}>
                        Remove
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {skus.length < 3 && (
              <button type="button" className="btn btn--sm btn--ghost" style={{ marginBottom: '1rem' }}
                onClick={() => setSkus((s) => [...s, { ...EMPTY_SKU }])}>
                + Add another SKU
              </button>
            )}

            {/* Live savings preview */}
            {savingsPerPkg > 0 && (
              <div style={{ background: '#1A202C', border: '4px solid var(--dark)', padding: '1.2rem', marginBottom: '1.2rem', boxShadow: 'var(--shadow-pixel)' }}>
                <div style={{ fontFamily: 'var(--font-pixel)', fontSize: '0.6rem', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)', marginBottom: '0.6rem' }}>
                  Your DIM 225 Savings Preview
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <div style={{ color: '#059669', fontFamily: 'var(--font-display)', fontSize: '1.8rem', fontWeight: 900 }}>
                      ${Math.round(savingsPerPkg * 100) / 100}
                    </div>
                    <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.78rem' }}>saved per package</div>
                  </div>
                  <div>
                    <div style={{ color: 'var(--yellow)', fontFamily: 'var(--font-display)', fontSize: '1.8rem', fontWeight: 900 }}>
                      ${Math.round(savingsPerPkg * Number(ordVol || 100)).toLocaleString()}
                    </div>
                    <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.78rem' }}>estimated monthly savings</div>
                  </div>
                </div>
              </div>
            )}

            <div className="form-row">
              <div className="form-field">
                <label htmlFor="origzip">Origin ZIP (optional)</label>
                <input id="origzip" value={originZip} onChange={(e) => setOriginZip(e.target.value)} placeholder="e.g. 90001" maxLength={10} />
              </div>
              <div className="form-field">
                <label htmlFor="destzip">Top destination ZIPs (comma-separated, optional)</label>
                <input id="destzip" value={destZips} onChange={(e) => setDestZips(e.target.value)} placeholder="10001, 77001, 60601" />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
              <button type="button" className="btn btn--ghost" onClick={() => setStep(2)}>← Back</button>
              <button type="submit" className="btn btn--blue" style={{ flex: 1 }} disabled={busy}>
                {busy ? <><span className="spinner" /> Saving…</> : 'Continue to Step 4 →'}
              </button>
            </div>
          </form>
        )}

        {/* ====== STEP 4 ====== */}
        {step === 4 && (
          <form onSubmit={step4Submit}>
            <p className="form-card__sub">Last step. Where should we send your free savings report?</p>
            <div className="form-row">
              <div className="form-field">
                <label htmlFor="email">Email *</label>
                <input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@yourstore.com" />
              </div>
              <div className="form-field">
                <label htmlFor="phone">Phone (optional)</label>
                <input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(555) 123-4567" />
              </div>
            </div>
            <div className="form-field">
              <label htmlFor="frust">What&apos;s your biggest shipping frustration? (optional)</label>
              <textarea
                id="frust"
                value={frustration}
                onChange={(e) => setFrustration(e.target.value)}
                placeholder="DIM weight fees? FBA restock limits? Carrier surcharges eating your Q4 margins?"
                style={{ minHeight: 80 }}
              />
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
              <button type="button" className="btn btn--ghost" onClick={() => setStep(3)}>← Back</button>
              <button type="submit" className="btn btn--blue" style={{ flex: 1 }} disabled={busy}>
                {busy ? <><span className="spinner" /> Submitting…</> : '🐄 Get My Free Audit →'}
              </button>
            </div>
            <p style={{ marginTop: '0.75rem', fontSize: '0.78rem', color: '#6b7280', textAlign: 'center' }}>
              No spam. No commitment. Moo&apos;s honor.
            </p>
          </form>
        )}
      </div>
    </div>
  );
}

export default function InquiryPage() {
  return (
    <Suspense fallback={<div className="form-page"><div className="form-card">Loading…</div></div>}>
      <InquiryInner />
    </Suspense>
  );
}
