import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

const contentDirectory = path.join(process.cwd(), 'content');

export function getPostSlugs(section: string) {
  const sectionPath = path.join(contentDirectory, section);
  if (!fs.existsSync(sectionPath)) return [];
  
  // Recursively get all .md files
  const slugs: string[][] = [];
  
  function traverse(dir: string, currentPath: string[]) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const fullPath = path.join(dir, file);
      if (fs.statSync(fullPath).isDirectory()) {
        traverse(fullPath, [...currentPath, file]);
      } else if (file.endsWith('.md')) {
        let slugName = file.replace(/\.md$/, '');
        if (slugName === 'index') {
          // 'index' means this directory itself
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

function preprocessMarkdown(content: string, section: string): string {
  // Fix MkDocs admonitions (!!! note, !!! warning, etc) -> Blockquotes
  // Match `!!! type ["title"]` and indent the following lines until empty line or unindented text
  // Since full admonition parsing is complex, we do a simple regex for blockquotes:
  let processed = content.replace(/^!!! (\w+)(?: "(.*?)")?([\s\S]*?)(?=\n\n|$)/gm, (match, type, title, body) => {
    const formattedTitle = title ? title : type.charAt(0).toUpperCase() + type.slice(1);
    const indentedBody = body.split('\n').map((line: string) => `> ${line.replace(/^    /, '')}`).join('\n');
    return `> **${formattedTitle}**\n${indentedBody}`;
  });

  // Rewrite image src from "file.png" or "./file.png" to "/images/section/file.png"
  // Matches markdown images: ![alt](src)
  processed = processed.replace(/!\[(.*?)\]\((?!http|\/)(.*?)\)/g, (match, alt, src) => {
    const cleanSrc = src.replace(/^\.\//, '');
    return `![${alt}](/images/${section}/${cleanSrc})`;
  });

  // Also HTML images <img src="file.png">
  processed = processed.replace(/<img([^>]*?)src=["'](?!http|\/)([^"']+)["']([^>]*)>/g, (match, before, src, after) => {
    const cleanSrc = src.replace(/^\.\//, '');
    return `<img${before}src="/images/${section}/${cleanSrc}"${after}>`;
  });

  return processed;
}

export function getPostBySlug(section: string, slug: string[]) {
  // First try joining as a file
  let realSlug = slug.join('/');
  let fullPath = path.join(contentDirectory, section, `${realSlug}.md`);
  
  // If file doesn't exist, try index.md
  if (!fs.existsSync(fullPath)) {
    fullPath = path.join(contentDirectory, section, realSlug, 'index.md');
  }

  if (!fs.existsSync(fullPath)) {
    return null;
  }

  const fileContents = fs.readFileSync(fullPath, 'utf8');
  const { data, content } = matter(fileContents);
  
  if (!data.title) {
    const match = content.match(/^#\s+(.+)$/m);
    if (match) {
      data.title = match[1].trim();
    }
  }

  return { slug, frontmatter: data, content: preprocessMarkdown(content, section) };
}

export function getAllPosts(section: string) {
  const slugs = getPostSlugs(section);
  const posts = slugs
    .map((slug) => getPostBySlug(section, slug))
    .filter(post => post !== null)
    // sort posts by date or title
    .sort((post1, post2) => ((post1?.frontmatter?.date || '') > (post2?.frontmatter?.date || '') ? -1 : 1));
  return posts;
}
