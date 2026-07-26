const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');
const { execSync } = require('child_process');

const contentDir = path.join(process.cwd(), 'content');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else {
      results.push(file);
    }
  });
  return results;
}

const allFiles = walk(contentDir);
const mdFiles = allFiles.filter(f => f.endsWith('.md') && !path.basename(f).startsWith('.'));

for (const file of mdFiles) {
  try {
    const rawContent = fs.readFileSync(file, 'utf8');
    const { data, content } = matter(rawContent);
    
    let title = data.title || path.basename(file, '.md');
    
    // Save content to a temporary file without frontmatter for pandoc
    const tmpMd = file + '.tmp.md';
    fs.writeFileSync(tmpMd, content);
    
    const typFile = file.replace(/\.md$/, '.typ');
    
    console.log(`Converting ${file} -> ${typFile}`);
    // Run pandoc to convert to typst
    execSync(`pandoc -f markdown -t typst "${tmpMd}" -o "${typFile}"`);
    
    // Read the generated typst
    let typstContent = fs.readFileSync(typFile, 'utf8');
    
    // Prepend the book template
    const header = `#import "/content/book.typ": book\n#show: book.with(title: "${title}")\n\n`;
    fs.writeFileSync(typFile, header + typstContent);
    
    // Cleanup temporary md file and original md file (optional, we can keep md for backup or delete later)
    fs.unlinkSync(tmpMd);
    fs.renameSync(file, file + '.bak'); // rename md to .bak instead of deleting immediately

  } catch (e) {
    console.error(`Failed on ${file}:`, e.message);
  }
}

console.log('Done!');
