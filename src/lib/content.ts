import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { marked } from 'marked';

const contentDirectory = path.join(process.cwd(), 'content');

export function getPostSlugs(section: string) {
  const sectionPath = path.join(contentDirectory, section);
  if (!fs.existsSync(sectionPath)) return [];
  
  const slugs: string[][] = [];
  
  function traverse(dir: string, currentPath: string[]) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const fullPath = path.join(dir, file);
      if (fs.statSync(fullPath).isDirectory()) {
        traverse(fullPath, [...currentPath, file]);
      } else if (file.endsWith('.typ') && !file.startsWith('.')) {
        let slugName = file.replace(/\.typ$/, '');
        if (slugName === 'index') {
          if (currentPath.length > 0) {
            slugs.push([...currentPath]);
          }
        } else {
          slugs.push([...currentPath, slugName]);
        }
      }
    }
  }
  
  traverse(sectionPath, []);
  return slugs;
}

export function getPostBySlug(section: string, slug: string[]) {
  let realSlug = slug.join('/');
  let fullPath = path.join(contentDirectory, section, `${realSlug}.typ`);
  
  if (!fs.existsSync(fullPath)) {
    fullPath = path.join(contentDirectory, section, realSlug, 'index.typ');
  }

  if (!fs.existsSync(fullPath)) {
    return null;
  }

  const fileContents = fs.readFileSync(fullPath, 'utf8');
  
  // Extract title from '#show: book.with(title: "TITLE")'
  let title = slug[slug.length - 1] || 'Notebook';
  const titleMatch = fileContents.match(/#show: book\.with\s*\(\s*title:\s*"([^"]+)"/);
  if (titleMatch) {
    title = titleMatch[1];
  }
  
  // Read precompiled SVG
  const svgPath = fullPath + '.svg';
  let svgContent = '';
  if (fs.existsSync(svgPath)) {
    svgContent = fs.readFileSync(svgPath, 'utf8');
  } else {
    svgContent = `<div style="color:red; padding: 2rem;">Failed to load compiled Typst document. Please run build script.</div>`;
  }

  return { slug, frontmatter: { title, description: '' as string | undefined }, content: svgContent };
}

export function getAllPosts(section: string) {
  const slugs = getPostSlugs(section);
  const posts = slugs
    .map((slug) => getPostBySlug(section, slug))
    .filter(post => post !== null);
  // Sort alphabetically by title
  posts.sort((a, b) => (a!.frontmatter.title || '').localeCompare(b!.frontmatter.title || ''));
  return posts;
}

// --- Markdown section support for 一路楼 (yilulou) ---

const YILULOU_DIR = path.join(contentDirectory, 'yilulou');

export interface MarkdownPostMeta {
  slug: string[];
  title: string;
  date?: string;
  description?: string;
  category: string;
}

function getAllMdFiles(dir: string, currentPath: string[] = []): { filePath: string; slug: string[] }[] {
  const results: { filePath: string; slug: string[] }[] = [];
  if (!fs.existsSync(dir)) return results;

  const entries = fs.readdirSync(dir);
  for (const entry of entries) {
    const fullPath = path.join(dir, entry);
    if (entry.startsWith('.')) continue;
    if (fs.statSync(fullPath).isDirectory()) {
      results.push(...getAllMdFiles(fullPath, [...currentPath, entry]));
    } else if (entry.endsWith('.md')) {
      const slugName = entry.replace(/\.md$/, '');
      if (slugName === 'index') {
        results.push({ filePath: fullPath, slug: [...currentPath] });
      } else {
        results.push({ filePath: fullPath, slug: [...currentPath, slugName] });
      }
    }
  }
  return results;
}

export function getYilulouPosts(): MarkdownPostMeta[] {
  const files = getAllMdFiles(YILULOU_DIR);
  return files.map(({ filePath, slug }) => {
    const raw = fs.readFileSync(filePath, 'utf8');
    const { data } = matter(raw);
    const category = slug.length > 1 ? slug[0] : '';
    const postSlug = slug.length > 1 ? slug.slice(1) : slug;
    return {
      slug: postSlug.length > 0 ? postSlug : [],
      title: data.title || (slug[slug.length - 1] || 'untitled'),
      date: data.date || undefined,
      description: data.description || undefined,
      category,
    };
  }).sort((a, b) => {
    if (a.date && b.date) return b.date.localeCompare(a.date);
    if (a.date) return -1;
    if (b.date) return 1;
    return a.title.localeCompare(b.title);
  });
}

export function getYilulouPostBySlug(slug: string[]): {
  slug: string[];
  frontmatter: { title: string; date?: string; description?: string; [key: string]: unknown };
  content: string;
} | null {
  const files = getAllMdFiles(YILULOU_DIR);

  const fullSlug = slug.join('/');

  const match = files.find(f => f.slug.join('/') === fullSlug);
  if (!match) return null;

  const raw = fs.readFileSync(match.filePath, 'utf8');
  const { data, content: mdContent } = matter(raw);

  const htmlContent = marked.parse(mdContent, { async: false }) as string;

  return {
    slug,
    frontmatter: { title: data.title || slug[slug.length - 1] || 'untitled', ...data },
    content: htmlContent,
  };
}

export function getYilulouCategories(): { name: string; count: number }[] {
  if (!fs.existsSync(YILULOU_DIR)) return [];
  const entries = fs.readdirSync(YILULOU_DIR);
  const categories: { name: string; count: number }[] = [];
  for (const entry of entries) {
    const fullPath = path.join(YILULOU_DIR, entry);
    if (entry.startsWith('.')) continue;
    if (fs.statSync(fullPath).isDirectory()) {
      const files = getAllMdFiles(fullPath);
      if (files.length > 0) {
        categories.push({ name: entry, count: files.length });
      }
    }
  }
  return categories.sort((a, b) => a.name.localeCompare(b.name));
}
