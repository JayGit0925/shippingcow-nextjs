import { NextResponse } from 'next/server';
import { getStaleNewLeads, markLeadFollowupSent } from '@/lib/db';
import { sendLeadFollowup } from '@/lib/email';

// Vercel cron calls this with GET. Protected by CRON_SECRET env var.
export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://shippingcow.com';

  try {
    const leads = await getStaleNewLeads();

    if (leads.length === 0) {
      return NextResponse.json({ sent: 0, message: 'No stale leads' });
    }

    let sent = 0;
    const errors: string[] = [];

    for (const lead of leads) {
      // Pull contact info from step4_data (name, email)
      const step4 = lead.step4_data as { name?: string; email?: string } | null;
      const email = step4?.email;

      if (!email) continue;

      // Pull savings estimate if available
      const savings = lead.savings_estimate as { annual_savings?: number } | null;
      const annualSavings = savings?.annual_savings;

      const result = await sendLeadFollowup({
        to: email,
        name: step4?.name,
        annualSavings,
        siteUrl,
      });

      if (result.ok) {
        await markLeadFollowupSent(lead.id);
        sent++;
      } else {
        errors.push(`${lead.id}: ${result.error}`);
      }
    }

    console.log(`[cron/lead-followup] sent=${sent} errors=${errors.length}`);
    return NextResponse.json({ sent, errors: errors.length > 0 ? errors : undefined });
  } catch (err) {
    console.error('[cron/lead-followup]', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
