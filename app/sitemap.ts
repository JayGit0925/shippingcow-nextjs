import { type MetadataRoute } from 'next';
import { getAllPosts } from '@/lib/blog';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL || 'https://shippingcow.ai';

  const staticRoutes = [
    { path: '', priority: 1.0, changeFreq: 'weekly' as const },
    { path: '/calculator', priority: 0.9, changeFreq: 'weekly' as const },
    { path: '/audit', priority: 0.8, changeFreq: 'weekly' as const },
    { path: '/big-and-bulky', priority: 0.7, changeFreq: 'monthly' as const },
    { path: '/inquiry', priority: 0.7, changeFreq: 'monthly' as const },
    { path: '/track', priority: 0.5, changeFreq: 'monthly' as const },
    { path: '/signup', priority: 0.5, changeFreq: 'monthly' as const },
    { path: '/blog', priority: 0.8, changeFreq: 'weekly' as const },
  ];

  const blogPosts: MetadataRoute.Sitemap = getAllPosts().map((p) => ({
    url: `${baseUrl}/blog/${p.slug}`,
    lastModified: new Date(p.date),
    changeFrequency: 'monthly',
    priority: 0.6,
  }));

  return [
    ...staticRoutes.map((r) => ({
      url: `${baseUrl}${r.path}`,
      lastModified: new Date(),
      changeFrequency: r.changeFreq,
      priority: r.priority,
    })),
    ...blogPosts,
  ];
}
