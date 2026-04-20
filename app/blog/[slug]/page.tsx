import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { MDXRemote } from 'next-mdx-remote/rsc';
import { getAllPosts, getPost } from '@/lib/blog';

export async function generateStaticParams() {
  return getAllPosts().map((p) => ({ slug: p.slug }));
}

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) return {};
  return {
    title:       `${post.title} | ShippingCow Blog`,
    description: post.excerpt,
    openGraph: {
      title:       post.title,
      description: post.excerpt,
      type:        'article',
      publishedTime: post.date,
    },
  };
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) notFound();

  const jsonLd = {
    '@context':       'https://schema.org',
    '@type':          'Article',
    headline:         post.title,
    description:      post.excerpt,
    datePublished:    post.date,
    author: { '@type': 'Organization', name: 'ShippingCow' },
    publisher: {
      '@type': 'Organization',
      name:    'ShippingCow',
      logo:    { '@type': 'ImageObject', url: 'https://shippingcow.io/logo.png' },
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <article>
        {/* Hero */}
        <div style={{ background: 'var(--dark)', color: '#fff', padding: '3rem 0' }}>
          <div className="container">
            <Link href="/blog" style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.82rem', textDecoration: 'none', display: 'inline-block', marginBottom: '1rem' }}>
              ← All Posts
            </Link>
            <span style={{ fontFamily: 'var(--font-pixel)', fontSize: '0.58rem', textTransform: 'uppercase', color: 'var(--yellow)', letterSpacing: '0.06em', display: 'block', marginBottom: '0.8rem' }}>
              {post.category}
            </span>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', textTransform: 'uppercase', maxWidth: 720, lineHeight: 1.2 }}>
              {post.title}
            </h1>
            <div style={{ marginTop: '1rem', fontSize: '0.82rem', color: 'rgba(255,255,255,0.5)' }}>
              {post.date} · {post.readingTime} read{post.author ? ` · ${post.author}` : ''}
            </div>
          </div>
        </div>

        {/* Body */}
        <section className="section">
          <div className="blog-grid container" style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '3rem', alignItems: 'start' }}>
            <div className="blog-prose">
              <MDXRemote source={post.content} />
            </div>

            {/* Sidebar */}
            <aside style={{ position: 'sticky', top: '5rem' }}>
              <div style={{ background: 'var(--yellow)', border: '4px solid var(--dark)', padding: '1.4rem', boxShadow: 'var(--shadow-pixel)', marginBottom: '1.5rem' }}>
                <div style={{ fontFamily: 'var(--font-pixel)', fontSize: '0.6rem', textTransform: 'uppercase', marginBottom: '0.6rem', letterSpacing: '0.05em' }}>
                  Free Tool
                </div>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                  DIM Weight Calculator
                </h3>
                <p style={{ fontSize: '0.82rem', color: '#3a4454', marginBottom: '0.8rem' }}>
                  See exactly how much DIM 225 saves you on your own package dimensions.
                </p>
                <Link href="/calculator" className="btn btn--sm" style={{ background: 'var(--dark)', color: '#fff', display: 'block', textAlign: 'center' }}>
                  Open Calculator →
                </Link>
              </div>

              <div style={{ border: '3px solid var(--dark)', padding: '1.2rem', background: 'var(--white)', boxShadow: 'var(--shadow-pixel)' }}>
                <div style={{ fontFamily: 'var(--font-pixel)', fontSize: '0.6rem', textTransform: 'uppercase', color: 'var(--blue)', marginBottom: '0.6rem' }}>
                  Get your free audit
                </div>
                <p style={{ fontSize: '0.82rem', color: '#3a4454', marginBottom: '0.8rem' }}>
                  Submit your top SKUs and we&apos;ll build a custom savings model — 24-hour turnaround.
                </p>
                <Link href="/inquiry" className="btn btn--sm btn--blue" style={{ display: 'block', textAlign: 'center' }}>
                  Start Free Audit →
                </Link>
              </div>
            </aside>
          </div>
        </section>
      </article>
    </>
  );
}
