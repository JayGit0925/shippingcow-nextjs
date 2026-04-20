import Link from 'next/link';
import { getCurrentUser } from '@/lib/auth';
import { getInquiriesForUser } from '@/lib/db';

type InquiryRecord = {
  id: number;
  name: string;
  email: string;
  company: string | null;
  phone: string | null;
  monthly_spend: string | null;
  product_weight: string | null;
  message: string | null;
  status: string;
  created_at: string;
};

export default async function DashboardPage() {
  const user = await getCurrentUser();
  // Auth guard lives in layout.tsx — user is always defined here
  const inquiries = (await getInquiriesForUser(user!.id)) as unknown as InquiryRecord[];

  return (
    <>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', textTransform: 'uppercase', fontSize: '1.8rem', marginBottom: '0.3rem' }}>
          Hey, {user!.name.split(' ')[0]}
        </h1>
        <p style={{ color: '#6b7280', fontSize: '0.95rem' }}>Welcome back to your ShippingCow herd.</p>
      </div>

      {/* Savings / get-started card */}
      <div style={{ background: 'var(--blue)', color: '#fff', border: '4px solid var(--dark)', padding: '1.5rem 2rem', boxShadow: 'var(--shadow-pixel-lg)', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ fontFamily: 'var(--font-pixel)', fontSize: '0.6rem', textTransform: 'uppercase', color: 'rgba(255,255,255,0.6)', marginBottom: '0.4rem' }}>
              Run your numbers first
            </div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', fontWeight: 900, textTransform: 'uppercase' }}>
              See Your DIM 225 Savings
            </div>
            <div style={{ fontSize: '0.88rem', color: 'rgba(255,255,255,0.8)', marginTop: '0.3rem' }}>
              Enter your package dimensions and see exactly how much DIM 225 saves you vs UPS/FedEx.
            </div>
          </div>
          <Link href="/calculator" className="btn" style={{ background: 'var(--yellow)', color: 'var(--dark)', border: '3px solid var(--dark)', whiteSpace: 'nowrap' }}>
            Open Calculator →
          </Link>
        </div>
      </div>

      <div className="dash__grid">
        {/* Inquiries */}
        <div className="card">
          <h3>Your Recent Inquiries</h3>
          {inquiries.length === 0 ? (
            <div className="empty-state">
              <p>No inquiries yet.</p>
              <Link href="/inquiry" className="btn">Start Your Free Audit</Link>
            </div>
          ) : (
            <div>
              {inquiries.map((i) => (
                <div className="inquiry-row" key={i.id}>
                  <div className="inquiry-row__meta">
                    {new Date(i.created_at).toLocaleDateString()} · {i.status.toUpperCase()}
                  </div>
                  <div className="inquiry-row__text">
                    <strong>{i.company || 'Personal inquiry'}</strong>
                    {i.monthly_spend && <> · {i.monthly_spend}</>}
                    {i.product_weight && <> · {i.product_weight}</>}
                    {i.message && (
                      <div style={{ marginTop: '0.4rem', color: '#3a4454', fontSize: '0.9rem' }}>
                        &quot;{i.message.slice(0, 140)}{i.message.length > 140 ? '…' : ''}&quot;
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Account + Quick actions */}
        <div>
          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <h3>Your Account</h3>
            <p style={{ fontSize: '0.9rem', color: '#3a4454', margin: '0.2rem 0' }}><strong>Name:</strong> {user!.name}</p>
            <p style={{ fontSize: '0.9rem', color: '#3a4454', margin: '0.2rem 0' }}><strong>Email:</strong> {user!.email}</p>
            {user!.company && (
              <p style={{ fontSize: '0.9rem', color: '#3a4454', margin: '0.2rem 0' }}><strong>Company:</strong> {user!.company}</p>
            )}
            <p style={{ fontSize: '0.85rem', color: '#6b7280', marginTop: '0.8rem' }}>
              Member since {new Date(user!.created_at).toLocaleDateString()}
            </p>
          </div>
          <div className="card">
            <h3>Quick Actions</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              <Link href="/calculator"       className="btn btn--ghost btn--sm">◈ DIM Calculator</Link>
              <Link href="/track"            className="btn btn--ghost btn--sm">📦 Track a Package</Link>
              <Link href="/inquiry"          className="btn btn--ghost btn--sm">📝 Submit Inquiry</Link>
              <Link href="/#pricing"         className="btn btn--ghost btn--sm">⭐ Upgrade Plan</Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
