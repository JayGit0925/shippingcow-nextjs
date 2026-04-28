import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer__grid">
          <div>
            <div className="footer__brand">
              <span className="cow-logo cow-logo--footer" role="img" aria-label="Shipping Cow logo" />
              <span>Shipping Cow</span>
            </div>
            <p className="footer__about">
              The AI-native logistics platform for heavy-goods e-commerce. Enterprise rates, zero shrinkage, guaranteed 2-day delivery — no bull.
            </p>
          </div>

          <div>
            <h4>Platform</h4>
            <ul>
              <li><Link href="/#services">Services</Link></li>
              <li><Link href="/#cow-guaranteed">Guarantees</Link></li>
              <li><Link href="/#pricing">Pricing</Link></li>
              <li><Link href="/calculator">DIM Calculator</Link></li>
              <li><Link href="/big-and-bulky">Big &amp; Bulky</Link></li>
              <li><Link href="/track">Track Package</Link></li>
              <li><Link href="/blog">Blog</Link></li>
            </ul>
          </div>

          <div>
            <h4>Company</h4>
            <ul>
              <li><Link href="/#about">About Us</Link></li>
              <li><Link href="/inquiry">Contact</Link></li>
              <li><Link href="/inquiry">Get a Quote</Link></li>
            </ul>
          </div>

          <div>
            <h4>Account</h4>
            <ul>
              <li><Link href="/login">Log In</Link></li>
              <li><Link href="/signup">Sign Up</Link></li>
              <li><Link href="/dashboard">Dashboard</Link></li>
              <li><Link href="/inquiry">Free Audit</Link></li>
            </ul>
          </div>
        </div>

        <div className="footer__bottom">
          <div className="footer__social">
            <a href="https://twitter.com/shippingcow" target="_blank" rel="noopener noreferrer" aria-label="Twitter / X">𝕏</a>
            <a href="https://linkedin.com/company/shippingcow" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">in</a>
            <a href="https://instagram.com/shippingcow" target="_blank" rel="noopener noreferrer" aria-label="Instagram">◻</a>
            <a href="https://youtube.com/@shippingcow" target="_blank" rel="noopener noreferrer" aria-label="YouTube">▶</a>
          </div>
          <div>© {new Date().getFullYear()} Shipping Cow AI, Inc. · Moo-ving heavy goods since 2026.</div>
          <div>Privacy · Terms</div>
        </div>
      </div>
    </footer>
  );
}
