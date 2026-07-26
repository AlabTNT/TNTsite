const fs = require('fs');
const path = require('path');
const { NodeCompiler } = require('@myriaddreamin/typst-ts-node-compiler');

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

const compiler = NodeCompiler.create();
const typFiles = walk(contentDir).filter(f => f.endsWith('.typ') && !path.basename(f).startsWith('.'));

for (const file of typFiles) {
  if (path.basename(file) === 'book.typ') continue;
  
  try {
    console.log(`Compiling ${file}...`);
    const svg = compiler.svg({ mainFilePath: file });
    const svgFile = file + '.svg';
    fs.writeFileSync(svgFile, svg);
  } catch (e) {
    console.error(`Failed to compile ${file}:`, e.message);
  }
}
console.log('All Typst files compiled to SVG successfully.');
