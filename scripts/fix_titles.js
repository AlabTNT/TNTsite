const fs = require('fs');
const path = require('path');

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

const typFiles = walk(contentDir).filter(f => f.endsWith('.typ') && !path.basename(f).startsWith('.'));

for (const file of typFiles) {
  if (path.basename(file) === 'book.typ') continue;
  
  let content = fs.readFileSync(file, 'utf8');
  
  // Find first `= Heading`
  const headerMatch = content.match(/^=\s+(.+)$/m);
  if (headerMatch) {
    let cleanTitle = headerMatch[1].trim();
    // Replace the title in #show: book.with(...)
    // Only if it's currently index or something generic
    const bookShowMatch = content.match(/#show: book\.with\s*\(\s*title:\s*"([^"]+)"/);
    if (bookShowMatch) {
      const currentTitle = bookShowMatch[1];
      if (currentTitle === 'index' || currentTitle.includes('.')) {
        console.log(`Fixing title in ${file}: ${currentTitle} -> ${cleanTitle}`);
        content = content.replace(/(#show: book\.with\s*\(\s*title:\s*")[^"]+("\s*\))/, `$1${cleanTitle}$2`);
        fs.writeFileSync(file, content);
      }
    }
  }
}
console.log('Fixed titles!');
