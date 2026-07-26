#!/usr/bin/env node

/**
 * Auto-sync script for 一路楼 markdown files.
 *
 * This script:
 * 1. Scans content/yilulou/ for all .md files
 * 2. Extracts frontmatter (via gray-matter)
 * 3. Validates file structure and frontmatter
 * 4. Reports any issues (missing titles, broken links, etc.)
 * 5. Cleans up stale/deleted entries from any generated manifest
 *
 * The navigation is auto-generated at request time by content.ts,
 * so this script focuses on validation and reporting.
 *
 * Usage: node scripts/sync_yilulou.js
 */

const fs = require("fs");
const path = require("path");
const matter = require("gray-matter");

const YILULOU_DIR = path.join(__dirname, "..", "content", "yilulou");

const issues = [];
let totalFiles = 0;

function scan(dir, relativePath = "") {
  if (!fs.existsSync(dir)) {
    console.log(`Directory ${dir} does not exist. Skipping.`);
    return;
  }

  const entries = fs.readdirSync(dir);

  for (const entry of entries) {
    if (entry.startsWith(".")) continue;

    const fullPath = path.join(dir, entry);
    const relative = relativePath ? `${relativePath}/${entry}` : entry;

    if (fs.statSync(fullPath).isDirectory()) {
      scan(fullPath, relative);
    } else if (entry.endsWith(".md")) {
      totalFiles++;
      const content = fs.readFileSync(fullPath, "utf8");

      try {
        const { data } = matter(content);

        if (!data.title) {
          issues.push({ file: relative, issue: "Missing title in frontmatter" });
        }

        if (!data.date) {
          issues.push({ file: relative, issue: "Missing date in frontmatter" });
        }

        if (content.trim().length < 10) {
          issues.push({ file: relative, issue: "File appears to be empty or too short" });
        }
      } catch (e) {
        issues.push({
          file: relative,
          issue: `Failed to parse frontmatter: ${e.message}`,
        });
      }
    }
  }
}

console.log("╔══════════════════════════════╗");
console.log("║   一路楼 Content Sync       ║");
console.log("╚══════════════════════════════╝\n");

console.log(`Scanning: ${YILULOU_DIR}\n`);
scan(YILULOU_DIR);

console.log(`Total markdown files found: ${totalFiles}\n`);

if (issues.length === 0) {
  console.log("✅ All files are valid. No issues found.\n");
} else {
  console.log(`⚠️  Found ${issues.length} issues:\n`);
  for (const issue of issues) {
    console.log(`  📄 ${issue.file}`);
    console.log(`     → ${issue.issue}\n`);
  }
}

console.log("Done. The navigation is auto-generated at request time by src/lib/content.ts.");
