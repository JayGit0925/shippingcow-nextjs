import type { Metadata } from 'next';
import Link from 'next/link';
import { getAllPosts, BLOG_CATEGORIES } from '@/lib/blog';

export const metadata: Metadata = {
  title:       'ShippingCow Blog — Heavy Goods Shipping Insights',
  description: 'Guides, data, and tactics for heavy-goods e-commerce sellers. DIM weight, zone skipping, carrier pricing, and fulfillment strategy.',
  openGraph: {
    title:       'ShippingCow Blog',
    description: 'Heavy goods shipping insights for serious e-commerce sellers.',
    type:        'website',
  },
};

export default function BlogPage({ searchParams }: { searchParams: { category?: string } }) {
  const allPosts = getAllPosts();
  const activeCategory = searchParams.category ?? null;
  const posts = activeCategory
    ? allPosts.filter((p) => p.category === activeCategory)
    : allPosts;

  return (
    <>
      <section className="section" style={{ paddingTop: '3rem' }}>
        <div className="container">
          <div className="section__head">
            <h1>Heavy Goods <span>Shipping Insights</span></h1>
            <p>DIM weight explainers, zone-skip tactics, carrier math, and war stories from the 50 lb+ trenches.</p>
          </div>

          {/* Category filter */}
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '2.5rem', marginTop: '1rem' }}>
            <Link
              href="/blog"
              style={{
                fontFamily: 'var(--font-pixel)', fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.06em',
                padding: '0.3rem 0.7rem', border: '2px solid var(--dark)',
                background: !activeCategory ? 'var(--dark)' : 'transparent',
                color:      !activeCategory ? '#fff'       : 'var(--dark)',
                textDecoration: 'none',
              }}
            >
              All
            </Link>
            {BLOG_CATEGORIES.map((cat) => (
              <Link
                key={cat}
                href={`/blog?category=${encodeURIComponent(cat)}`}
                style={{
                  fontFamily: 'var(--font-pixel)', fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.06em',
                  padding: '0.3rem 0.7rem', border: '2px solid var(--dark)',
                  background: activeCategory === cat ? 'var(--dark)' : 'transparent',
                  color:      activeCategory === cat ? '#fff'        : 'var(--dark)',
                  textDecoration: 'none',
                }}
              >
                {cat}
              </Link>
            ))}
          </div>

          {posts.length === 0 ? (
            <p style={{ color: '#6b7280', textAlign: 'center', padding: '3rem 0' }}>
              No posts in this category yet. Check back soon.
            </p>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
              {posts.map((post) => (
                <article key={post.slug} style={{ background: 'var(--white)', border: '4px solid var(--dark)', boxShadow: 'var(--shadow-pixel)', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ background: 'var(--blue)', padding: '1rem 1.5rem' }}>
                    <span style={{ fontFamily: 'var(--font-pixel)', fontSize: '0.58rem', textTransform: 'uppercase', color: 'var(--yellow)', letterSpacing: '0.06em' }}>
                      {post.category}
                    </span>
                  </div>
                  <div style={{ padding: '1.4rem 1.5rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.15rem', textTransform: 'uppercase', marginBottom: '0.6rem', lineHeight: 1.25 }}>
                      <Link href={`/blog/${post.slug}`} style={{ color: 'var(--dark)', textDecoration: 'none' }}>
                        {post.title}
                      </Link>
                    </h2>
                    <p style={{ fontSize: '0.88rem', color: '#3a4454', flex: 1, marginBottom: '1rem' }}>
                      {post.excerpt}
                    </p>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: '#6b7280' }}>
                      <span>{post.date}</span>
                      <span>{post.readingTime} read</span>
                    </div>
                  </div>
                  <div style={{ padding: '0 1.5rem 1.2rem' }}>
                    <Link href={`/blog/${post.slug}`} className="btn btn--sm btn--ghost">
                      Read more →
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
