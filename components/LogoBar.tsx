// TODO: replace placeholder SVG rectangles with real partner/customer logos

const LOGOS = [
  { id: 1, label: 'Fitness Brand A',  w: 110, h: 32 },
  { id: 2, label: 'Furniture Co',     w: 90,  h: 36 },
  { id: 3, label: 'Outdoor Gear',     w: 120, h: 30 },
  { id: 4, label: 'Industrial Parts', w: 100, h: 34 },
  { id: 5, label: 'Home Appliances',  w: 108, h: 32 },
];

export default function LogoBar() {
  return (
    <section style={{ background: '#f8fafc', borderTop: '3px solid var(--dark)', borderBottom: '3px solid var(--dark)', padding: '2rem 0' }}>
      <div className="container">
        <div style={{ textAlign: 'center', fontFamily: 'var(--font-pixel)', fontSize: '0.58rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#6b7280', marginBottom: '1.4rem' }}>
          Trusted by heavy-goods sellers nationwide
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '2.5rem', flexWrap: 'wrap' }}>
          {LOGOS.map((logo) => (
            <div
              key={logo.id}
              aria-label={logo.label}
              style={{
                width:  logo.w,
                height: logo.h,
                background: '#d1d5db',
                borderRadius: 4,
                opacity: 0.6,
                // TODO: replace with <Image src={...} alt={logo.label} />
              }}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
