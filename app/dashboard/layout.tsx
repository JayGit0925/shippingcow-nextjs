import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentUser, isAdmin } from '@/lib/auth';

const BASE_NAV = [
  { href: '/dashboard',           label: 'Overview',   icon: '◈' },
  { href: '/dashboard/shipments', label: 'Shipments',  icon: '📦' },
  { href: '/dashboard/copilot',   label: 'AI Copilot', icon: '✦' },
  { href: '/dashboard/settings',  label: 'Settings',   icon: '⚙' },
];

const ADMIN_NAV = { href: '/dashboard/chat', label: 'Chat Leads', icon: '💬' };

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  // Gate: email must be verified before accessing dashboard
  if (!user.email_verified) {
    redirect('/verify-email');
  }

  const navItems = isAdmin(user)
    ? [...BASE_NAV.slice(0, 3), ADMIN_NAV, BASE_NAV[3]]
    : BASE_NAV;

  return (
    <div className="dashboard-layout">
      <aside className="dashboard-sidebar">
        <div className="dashboard-sidebar__logo">
          {user.name.split(' ')[0]}&apos;s Dashboard
        </div>
        {navItems.map((item) => (
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
