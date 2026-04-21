export type SlackHandoffPayload = {
  session_id: string;
  page_url: string;
  email: string | null;
  qualified_score: number;
  last_messages: { role: string; content: string }[];
  trigger: 'email_captured' | 'score_threshold' | 'human_requested';
};

export async function sendSlackHandoff(payload: SlackHandoffPayload): Promise<boolean> {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;
  if (!webhookUrl) {
    console.warn('[slack] SLACK_WEBHOOK_URL not configured — skipping handoff ping');
    return false;
  }

  const transcript = payload.last_messages
    .slice(-5)
    .map((m) => `*${m.role === 'user' ? 'Visitor' : 'Bot'}:* ${m.content.slice(0, 200)}`)
    .join('\n');

  const triggerLabel: Record<SlackHandoffPayload['trigger'], string> = {
    email_captured: '📧 Email captured',
    score_threshold: '🎯 High ICP score',
    human_requested: '🙋 Requested human',
  };

  const blocks = [
    {
      type: 'header',
      text: { type: 'plain_text', text: `🐄 ShippingCow Lead — ${triggerLabel[payload.trigger]}` },
    },
    {
      type: 'section',
      fields: [
        { type: 'mrkdwn', text: `*Email:*\n${payload.email || '_not captured_'}` },
        { type: 'mrkdwn', text: `*ICP Score:*\n${payload.qualified_score}/100` },
        { type: 'mrkdwn', text: `*Page:*\n${payload.page_url}` },
        { type: 'mrkdwn', text: `*Session:*\n\`${payload.session_id.slice(0, 8)}…\`` },
      ],
    },
    {
      type: 'section',
      text: { type: 'mrkdwn', text: `*Last 5 messages:*\n${transcript}` },
    },
  ];

  try {
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ blocks }),
    });
    return res.ok;
  } catch (err) {
    console.error('[slack] handoff failed:', err);
    return false;
  }
}
