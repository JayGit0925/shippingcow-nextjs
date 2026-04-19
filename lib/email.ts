import { Resend } from 'resend';

const apiKey = process.env.RESEND_API_KEY;
const from = process.env.RESEND_FROM || 'Shipping Cow <onboarding@resend.dev>';

// Lazy instance — only created when actually sending
let _resend: Resend | null = null;
function getClient(): Resend | null {
  if (!apiKey) return null;
  if (!_resend) _resend = new Resend(apiKey);
  return _resend;
}

export type InquiryEmailData = {
  name: string;
  email: string;
  company?: string;
  phone?: string;
  monthly_spend?: string;
  product_weight?: string;
  message?: string;
};

export async function sendInquiryNotification(data: InquiryEmailData): Promise<
  | { ok: true; id: string }
  | { ok: false; error: string }
> {
  const to = process.env.INQUIRY_TO_EMAIL;
  if (!to) {
    console.warn('[email] INQUIRY_TO_EMAIL not configured — skipping notification send.');
    return { ok: false, error: 'INQUIRY_TO_EMAIL not configured' };
  }

  const client = getClient();
  if (!client) {
    console.warn('[email] RESEND_API_KEY not configured — skipping notification send.');
    return { ok: false, error: 'RESEND_API_KEY not configured' };
  }

  const html = buildInquiryHtml(data);
  const text = buildInquiryText(data);

  try {
    const result = await client.emails.send({
      from,
      to,
      reply_to: data.email,
      subject: `🐄 New Shipping Cow Inquiry — ${data.name}${data.company ? ` (${data.company})` : ''}`,
      html,
      text,
    });

    if (result.error) {
      console.error('[email] Resend error:', result.error);
      return { ok: false, error: result.error.message };
    }
    return { ok: true, id: result.data?.id || '' };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown email error';
    console.error('[email] send failed:', msg);
    return { ok: false, error: msg };
  }
}

export async function sendInquiryConfirmation(data: InquiryEmailData): Promise<
  | { ok: true }
  | { ok: false; error: string }
> {
  const client = getClient();
  if (!client) return { ok: false, error: 'Email not configured' };

  try {
    await client.emails.send({
      from,
      to: data.email,
      subject: "🐄 We got your message — Shipping Cow",
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 24px; color: #1A202C;">
          <div style="background: #0052C9; color: #fff; padding: 24px; text-align: center; border: 4px solid #1A202C;">
            <h1 style="margin: 0; font-size: 28px; letter-spacing: 0.02em;">SHIPPING COW</h1>
            <p style="margin: 8px 0 0; color: #FEB81B;">We got your inquiry. Moo's honor.</p>
          </div>
          <div style="background: #fff; padding: 24px; border: 4px solid #1A202C; border-top: 0;">
            <p>Hi ${escapeHtml(data.name)},</p>
            <p>Thanks for reaching out to Shipping Cow. A member of our herd will review your logistics needs and get back to you within <strong>one business day</strong>.</p>
            <p>In the meantime, here's what we heard:</p>
            <ul style="background: #F4F7FF; padding: 16px 16px 16px 32px; border-left: 4px solid #FEB81B;">
              ${data.company ? `<li><strong>Company:</strong> ${escapeHtml(data.company)}</li>` : ''}
              ${data.monthly_spend ? `<li><strong>Monthly shipping spend:</strong> ${escapeHtml(data.monthly_spend)}</li>` : ''}
              ${data.product_weight ? `<li><strong>Product weight class:</strong> ${escapeHtml(data.product_weight)}</li>` : ''}
              ${data.message ? `<li><strong>Your message:</strong> ${escapeHtml(data.message)}</li>` : ''}
            </ul>
            <p>No bull. No filler. Just the plan.</p>
            <p style="margin-top: 32px;">— The Shipping Cow Team 🐄</p>
          </div>
        </div>
      `,
    });
    return { ok: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return { ok: false, error: msg };
  }
}

export async function sendPasswordResetEmail(
  to: string,
  name: string,
  resetUrl: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const client = getClient();
  if (!client) {
    console.warn('[email] RESEND_API_KEY not configured — skipping password reset email.');
    return { ok: false, error: 'Email not configured' };
  }

  try {
    await client.emails.send({
      from,
      to,
      subject: '🐄 Reset your Shipping Cow password',
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 24px; color: #1A202C;">
          <div style="background: #0052C9; color: #fff; padding: 24px; text-align: center; border: 4px solid #1A202C;">
            <h1 style="margin: 0; font-size: 28px; letter-spacing: 0.02em;">SHIPPING COW</h1>
            <p style="margin: 8px 0 0; color: #FEB81B;">Password reset request</p>
          </div>
          <div style="background: #fff; padding: 24px; border: 4px solid #1A202C; border-top: 0;">
            <p>Hi ${escapeHtml(name)},</p>
            <p>We received a request to reset your password. Click the button below to choose a new one. This link expires in <strong>1 hour</strong>.</p>
            <div style="text-align: center; margin: 32px 0;">
              <a href="${resetUrl}" style="background: #0052C9; color: #fff; padding: 14px 28px; text-decoration: none; font-weight: 700; border: 3px solid #1A202C; display: inline-block;">
                Reset My Password
              </a>
            </div>
            <p style="font-size: 13px; color: #666;">If you didn't request this, you can safely ignore this email — your password won't change.</p>
            <p style="margin-top: 32px;">— The Shipping Cow Team 🐄</p>
          </div>
        </div>
      `,
    });
    return { ok: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    console.error('[email] password reset send failed:', msg);
    return { ok: false, error: msg };
  }
}

function buildInquiryHtml(d: InquiryEmailData): string {
  const row = (label: string, value?: string) =>
    value
      ? `<tr><td style="padding:8px 12px; background:#F4F7FF; font-weight:600; border:1px solid #ddd;">${label}</td><td style="padding:8px 12px; border:1px solid #ddd;">${escapeHtml(value)}</td></tr>`
      : '';

  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, sans-serif; max-width: 640px; margin: 0 auto;">
      <div style="background: #1A202C; color: #FEB81B; padding: 20px; text-align: center;">
        <h2 style="margin: 0;">🐄 New Shipping Cow Inquiry</h2>
      </div>
      <div style="padding: 24px; background: #fff; color: #1A202C;">
        <p style="margin-top: 0;">A new lead just came in through the site.</p>
        <table style="width:100%; border-collapse: collapse; font-size: 14px;">
          ${row('Name', d.name)}
          ${row('Email', d.email)}
          ${row('Company', d.company)}
          ${row('Phone', d.phone)}
          ${row('Monthly Spend', d.monthly_spend)}
          ${row('Product Weight', d.product_weight)}
          ${row('Message', d.message)}
        </table>
        <p style="margin-top: 24px; font-size: 12px; color: #666;">
          Reply directly to this email to respond to ${escapeHtml(d.name)}.
        </p>
      </div>
    </div>
  `;
}

function buildInquiryText(d: InquiryEmailData): string {
  return [
    'NEW SHIPPING COW INQUIRY',
    '========================',
    `Name: ${d.name}`,
    `Email: ${d.email}`,
    d.company ? `Company: ${d.company}` : '',
    d.phone ? `Phone: ${d.phone}` : '',
    d.monthly_spend ? `Monthly Spend: ${d.monthly_spend}` : '',
    d.product_weight ? `Product Weight: ${d.product_weight}` : '',
    d.message ? `\nMessage:\n${d.message}` : '',
  ]
    .filter(Boolean)
    .join('\n');
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
