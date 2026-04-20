export default function ShipmentsPage() {
  return (
    <div>
      <h1 style={{ fontFamily: 'var(--font-display)', textTransform: 'uppercase', fontSize: '1.8rem', marginBottom: '2rem' }}>
        Shipments
      </h1>

      <div style={{ background: 'var(--white)', border: '4px solid var(--dark)', boxShadow: 'var(--shadow-pixel)', padding: '3rem', textAlign: 'center', minHeight: 320, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
        <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>📦</div>
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', textTransform: 'uppercase', marginBottom: '0.75rem' }}>
          Coming Soon
        </h3>
        <p style={{ maxWidth: 420, color: '#3a4454', fontSize: '0.95rem', marginBottom: '1.5rem' }}>
          Connect your Shopify store to see live shipment status, tracking updates, and carrier performance metrics — all in one place.
        </p>
        <a href="/inquiry" className="btn btn--blue" style={{ textDecoration: 'none' }}>
          Get Early Access →
        </a>
      </div>
    </div>
  );
}
