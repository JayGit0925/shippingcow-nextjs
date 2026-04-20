import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

const BLOG_DIR = path.join(process.cwd(), 'content/blog');

export type PostMeta = {
  slug:        string;
  title:       string;
  date:        string;
  category:    string;
  excerpt:     string;
  readingTime: string;
  author?:     string;
};

export type Post = PostMeta & {
  content: string;
};

export function getAllPosts(): PostMeta[] {
  if (!fs.existsSync(BLOG_DIR)) return [];

  return fs
    .readdirSync(BLOG_DIR)
    .filter((f) => f.endsWith('.mdx') || f.endsWith('.md'))
    .map((filename) => {
      const slug = filename.replace(/\.(mdx|md)$/, '');
      const raw  = fs.readFileSync(path.join(BLOG_DIR, filename), 'utf8');
      const { data } = matter(raw);
      return {
        slug,
        title:       data.title       ?? slug,
        date:        data.date        ?? '',
        category:    data.category    ?? 'Uncategorized',
        excerpt:     data.excerpt     ?? '',
        readingTime: data.readingTime ?? '3 min',
        author:      data.author,
      } as PostMeta;
    })
    .sort((a, b) => (a.date < b.date ? 1 : -1));
}

export function getPost(slug: string): Post | null {
  const mdxPath = path.join(BLOG_DIR, `${slug}.mdx`);
  const mdPath  = path.join(BLOG_DIR, `${slug}.md`);
  const filePath = fs.existsSync(mdxPath) ? mdxPath : fs.existsSync(mdPath) ? mdPath : null;
  if (!filePath) return null;

  const raw = fs.readFileSync(filePath, 'utf8');
  const { data, content } = matter(raw);

  return {
    slug,
    content,
    title:       data.title       ?? slug,
    date:        data.date        ?? '',
    category:    data.category    ?? 'Uncategorized',
    excerpt:     data.excerpt     ?? '',
    readingTime: data.readingTime ?? '3 min',
    author:      data.author,
  };
}

export const BLOG_CATEGORIES = [
  'Death Zone Education',
  'DIM Weight Truth',
  'Seller Success Stories',
  'Logistics Operations',
  'Shopify FBM Tips',
] as const;
