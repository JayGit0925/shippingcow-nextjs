'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';

type User = { id: number; email: string; name: string; company: string | null };

export default function Nav() {
  const [user, setUser] = useState<User | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((d) => setUser(d.user))
      .finally(() => setLoaded(true));
  }, [pathname]);

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
    router.push('/');
    router.refresh();
  }

  return (
    <nav className={`nav ${open ? 'nav--open' : ''}`} aria-label="Main navigation">
      <div className="nav__inner">
        <Link href="/" className="nav__logo" aria-label="Shipping Cow Home" onClick={() => setOpen(false)}>
          <span className="cow-logo cow-logo--nav" role="img" aria-label="Shipping Cow logo" />
          <span>Shipping Cow</span>
        </Link>

        <ul className="nav__links">
          <li><Link href="/" className={pathname === '/' ? 'active' : ''} onClick={() => setOpen(false)}>Home</Link></li>
          <li><Link href="/#cow-guaranteed" onClick={() => setOpen(false)}>Cow-Guaranteed</Link></li>
          <li><Link href="/#services" onClick={() => setOpen(false)}>Services</Link></li>
          <li><Link href="/big-and-bulky" className={pathname === '/big-and-bulky' ? 'active' : ''} onClick={() => setOpen(false)}>Big &amp; Bulky</Link></li>
          <li><Link href="/calculator" className={pathname === '/calculator' ? 'active' : ''} onClick={() => setOpen(false)}>Calculator</Link></li>
          <li><Link href="/blog" className={pathname.startsWith('/blog') ? 'active' : ''} onClick={() => setOpen(false)}>Blog</Link></li>
          <li><Link href="/track" className={pathname === '/track' ? 'active' : ''} onClick={() => setOpen(false)}>Track</Link></li>
          <li><Link href="/inquiry" className={pathname === '/inquiry' ? 'active' : ''} onClick={() => setOpen(false)}>Inquiry</Link></li>
        </ul>

        <div className="nav__right">
          {loaded && user ? (
            <>
              <Link href="/dashboard" className="nav__user">{user.name.split(' ')[0]}</Link>
              <button onClick={logout} className="btn btn--sm btn--ghost">Log Out</button>
            </>
          ) : loaded ? (
            <>
              <Link href="/login" className="nav__user">Log In</Link>
              <Link href="/signup" className="btn btn--sm">Sign Up</Link>
            </>
          ) : null}
        </div>

        <button
          className="hamburger"
          aria-label="Toggle menu"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          <span /><span /><span />
        </button>
      </div>
    </nav>
  );
}
