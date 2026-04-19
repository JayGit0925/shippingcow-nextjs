import Link from 'next/link';
import { redirect } from 'next/navigation';
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
  if (!user) redirect('/login');

  const inquiries = getInquiriesForUser(user.id) as InquiryRecord[];

  return (
    <div className="dash">
      <div className="container">
        <div className="dash__header">
          <div className="dash__welcome">
            <h1>Hey, {user.name.split(' ')[0]} 🐄</h1>
            <p>Welcome to your Shipping Cow dashboard. Here&apos;s your herd status.</p>
          </div>
          <Link href="/inquiry" className="btn btn--blue">Request a Custom Quote →</Link>
        </div>

        <div className="dash__grid">
          <div className="card">
            <h3>Your Recent Inquiries</h3>
            {inquiries.length === 0 ? (
              <div className="empty-state">
                <p>You haven&apos;t submitted any inquiries yet.</p>
                <Link href="/inquiry" className="btn">Start Your First Quote</Link>
              </div>
            ) : (
              <div>
                {inquiries.map((i) => (
                  <div className="inquiry-row" key={i.id}>
                    <div className="inquiry-row__meta">
                      {new Date(i.created_at).toLocaleDateString()} · STATUS: {i.status.toUpperCase()}
                    </div>
                    <div className="inquiry-row__text">
                      <strong>{i.company || 'Personal inquiry'}</strong>
                      {i.monthly_spend && <> · Spend: {i.monthly_spend}</>}
                      {i.product_weight && <> · Weight: {i.product_weight}</>}
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

          <div>
            <div className="card" style={{ marginBottom: '1.5rem' }}>
              <h3>Your Account</h3>
              <p style={{ fontSize: '0.9rem', color: '#3a4454', margin: '0.2rem 0' }}>
                <strong>Name:</strong> {user.name}
              </p>
              <p style={{ fontSize: '0.9rem', color: '#3a4454', margin: '0.2rem 0' }}>
                <strong>Email:</strong> {user.email}
              </p>
              {user.company && (
                <p style={{ fontSize: '0.9rem', color: '#3a4454', margin: '0.2rem 0' }}>
                  <strong>Company:</strong> {user.company}
                </p>
              )}
              <p style={{ fontSize: '0.85rem', color: '#6b7280', marginTop: '0.8rem' }}>
                Member since {new Date(user.created_at).toLocaleDateString()}
              </p>
            </div>

            <div className="card">
              <h3>Quick Actions</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                <Link href="/track" className="btn btn--ghost btn--sm">📦 Track a Package</Link>
                <Link href="/inquiry" className="btn btn--ghost btn--sm">📝 Submit Inquiry</Link>
                <Link href="/#pricing" className="btn btn--ghost btn--sm">⭐ Upgrade Plan</Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
