import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';

const NAV_ITEMS = [
  { href: '/dashboard',           label: 'Overview',   icon: '◈' },
  { href: '/dashboard/shipments', label: 'Shipments',  icon: '📦' },
  { href: '/dashboard/copilot',   label: 'AI Copilot', icon: '✦' },
  { href: '/dashboard/chat',      label: 'Chat Leads', icon: '💬' },
  { href: '/dashboard/settings',  label: 'Settings',   icon: '⚙' },
];

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  return (
    <div className="dashboard-layout">
      <aside className="dashboard-sidebar">
        <div className="dashboard-sidebar__logo">
          {user.name.split(' ')[0]}&apos;s Dashboard
        </div>
        {NAV_ITEMS.map((item) => (
          <Link key={item.href} href={item.href}>
            <span>{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </aside>
      <main className="dashboard-main">
        {children}
      </main>
    </div>
  );
}
