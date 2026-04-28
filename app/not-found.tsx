import Link from 'next/link';

export default function NotFound() {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      minHeight: '70vh', textAlign: 'center', padding: '2rem',
    }}>
      <h1 style={{
        fontSize: '6rem', fontWeight: 800, color: 'var(--blue, #0052C9)',
        margin: 0, lineHeight: 1, fontFamily: 'var(--font-display, sans-serif)',
      }}>
        404
      </h1>
      <p style={{ fontSize: '1.25rem', color: '#9ca3af', margin: '1rem 0 2rem' }}>
        This page has wandered off the pasture. 🐄
      </p>
      <Link href="/" style={{
        background: 'var(--blue, #0052C9)', color: '#fff', padding: '0.75rem 2rem',
        borderRadius: 8, fontWeight: 600, textDecoration: 'none', fontSize: '1rem',
      }}>
        Back to the herd
      </Link>
    </div>
  );
}
