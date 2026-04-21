export type LeadNotificationPayload = {
  session_id: string;
  page_url: string;
  email: string | null;
  qualified_score: number;
  last_messages: { role: string; content: string }[];
  trigger: 'email_captured' | 'score_threshold' | 'human_requested';
};

const TRIGGER_LABEL: Record<LeadNotificationPayload['trigger'], string> = {
  email_captured:   '📧 Email captured',
  score_threshold:  '🎯 High ICP score',
  human_requested:  '🙋 Requested human',
};

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export async function sendLeadNotification(payload: LeadNotificationPayload): Promise<boolean> {
  const token  = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    console.warn('[notify] TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID not configured — skipping ping');
    return false;
  }

  const transcript = payload.last_messages
    .slice(-5)
    .map((m) => `<i>${m.role === 'user' ? 'Visitor' : 'Bot'}:</i> ${escapeHtml(m.content.slice(0, 200))}`)
    .join('\n');

  const text = [
    `🐄 <b>ShippingCow Lead</b> — ${TRIGGER_LABEL[payload.trigger]}`,
    '',
    `<b>Email:</b> ${payload.email ? escapeHtml(payload.email) : '_not captured_'}`,
    `<b>Score:</b> ${payload.qualified_score}/100`,
    `<b>Page:</b> ${escapeHtml(payload.page_url)}`,
    `<b>Session:</b> <code>${payload.session_id.slice(0, 8)}…</code>`,
    '',
    '<b>Last messages:</b>',
    transcript,
  ].join('\n');

  try {
    const res = await fetch(
      `https://api.telegram.org/bot${token}/sendMessage`,
      {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' }),
      },
    );
    if (!res.ok) {
      const err = await res.text();
      console.error('[notify] Telegram error:', err);
    }
    return res.ok;
  } catch (err) {
    console.error('[notify] Telegram send failed:', err);
    return false;
  }
}
