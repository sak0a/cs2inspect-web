/**
 * LLM Documentation Generator
 *
 * 1. llms-full.txt: Concatenates all docs into one file for full-context LLM consumption.
 * 2. raw/*.md: Individual clean markdown files served at /raw/{path}.md for AI "Read URL" prompts.
 *
 * Output placed in public/ so VitePress serves them as static files.
 *
 * Run: bun run scripts/generate-llms-txt.ts
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';

const DOCS_DIR = join(dirname(import.meta.url.replace('file://', '')), '..');
const OUTPUT_DIR = join(DOCS_DIR, 'public');
const OUTPUT_FILE = join(OUTPUT_DIR, 'llms-full.txt');

// Pages in sidebar order (matching .vitepress/config.ts)
const pages: { section: string; files: { path: string; title: string }[] }[] = [
  {
    section: 'Getting Started',
    files: [
      { path: 'docs-overview.md', title: 'Documentation Overview' },
      { path: 'user-guide.md', title: 'User Guide' },
      { path: 'how-it-works.md', title: 'How It Works' },
      { path: 'faq.md', title: 'FAQ' },
      { path: 'faq-general.md', title: 'FAQ - General' },
      { path: 'faq-customization.md', title: 'FAQ - Customization' },
      { path: 'faq-technical.md', title: 'FAQ - Technical' },
    ],
  },
  {
    section: 'Server Setup',
    files: [
      { path: 'self-hosting.md', title: 'Self-Hosting Guide' },
      { path: 'deployment.md', title: 'Deployment Options' },
      { path: 'coolify.md', title: 'Coolify Deployment' },
    ],
  },
  {
    section: 'Features',
    files: [
      { path: 'version-history.md', title: 'Version History' },
      { path: 'admin.md', title: 'Admin Panel' },
    ],
  },
  {
    section: 'Development',
    files: [
      { path: 'setup.md', title: 'Development Setup' },
      { path: 'architecture.md', title: 'Architecture Overview' },
      { path: 'architecture-frontend.md', title: 'Frontend Architecture' },
      { path: 'architecture-backend.md', title: 'Backend Architecture' },
      { path: 'architecture-deployment.md', title: 'Deployment Architecture' },
      { path: 'components.md', title: 'Components' },
      { path: 'github-actions.md', title: 'GitHub Actions CI/CD' },
      { path: 'contributing.md', title: 'Contributing Guide' },
    ],
  },
  {
    section: 'Services',
    files: [
      { path: 'services-steam.md', title: 'Steam Service' },
      { path: 'services-scrapers.md', title: 'Asset Scrapers' },
    ],
  },
  {
    section: 'Reference',
    files: [
      { path: 'reference-composables.md', title: 'Composables' },
      { path: 'reference-stores.md', title: 'Pinia Stores' },
      { path: 'reference-types.md', title: 'TypeScript Types' },
      { path: 'reference-env.md', title: 'Environment Variables' },
      { path: 'HEALTH_CHECKS.md', title: 'Health Checks' },
    ],
  },
  {
    section: 'API Reference',
    files: [
      { path: 'api/index.md', title: 'API Overview' },
      { path: 'api/authentication.md', title: 'Authentication' },
      { path: 'api/health.md', title: 'Health Checks API' },
      { path: 'api/data.md', title: 'Data Endpoints' },
      { path: 'api/loadouts.md', title: 'Loadouts' },
      { path: 'api/items.md', title: 'Items' },
      { path: 'api/inspect.md', title: 'Inspect System' },
      { path: 'api/admin.md', title: 'Admin API' },
      { path: 'api/errors.md', title: 'Error Handling' },
      { path: 'api/api-reference.md', title: 'All Endpoints (Auto-Generated)' },
    ],
  },
  {
    section: 'CS2 Plugin',
    files: [
      { path: 'plugin/index.md', title: 'Plugin Overview' },
      { path: 'plugin/commands.md', title: 'Commands' },
      { path: 'plugin/configuration.md', title: 'Configuration' },
      { path: 'plugin/config-generator.md', title: 'Config Generator' },
    ],
  },
  {
    section: 'Additional Resources',
    files: [
      { path: 'theme-customization.md', title: 'Theme Customization' },
      { path: 'StickerSlots.md', title: 'Sticker Slots' },
      { path: 'GLASSMORPHISM.md', title: 'Glassmorphism' },
      { path: 'recommendations.md', title: 'Recommendations' },
      { path: 'improvements-summary.md', title: 'Improvements Summary' },
    ],
  },
];

/**
 * Strip VitePress-specific syntax from markdown content:
 * - YAML frontmatter (--- blocks at start)
 * - Vue components (<Badge>, <script>, etc.)
 * - VitePress containers (::: tip, ::: warning, etc.) → keep inner content
 */
function cleanMarkdown(content: string): string {
  // Remove YAML frontmatter
  content = content.replace(/^---\n[\s\S]*?\n---\n?/, '');

  // Remove Vue/VitePress components (self-closing and block)
  content = content.replace(/<Badge[^>]*\/>/g, '');
  content = content.replace(/<script[^>]*>[\s\S]*?<\/script>/g, '');

  // Convert VitePress containers to plain text
  // ::: tip Title  →  **Title**
  // ::: warning    →  **Warning**
  content = content.replace(
    /^:::\s*(tip|warning|danger|info|details)\s*(.*)?$/gm,
    (_match, type, title) => {
      if (title?.trim()) return `**${title.trim()}**`;
      return `**${type.charAt(0).toUpperCase() + type.slice(1)}**`;
    }
  );
  content = content.replace(/^:::$/gm, '');

  // Clean up excessive blank lines (3+ → 2)
  content = content.replace(/\n{3,}/g, '\n\n');

  return content.trim();
}

function main() {
  // Ensure output directory exists
  if (!existsSync(OUTPUT_DIR)) {
    mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const parts: string[] = [];
  let fileCount = 0;
  let skippedCount = 0;

  // Header
  parts.push('# CS2Inspect Documentation (Full)');
  parts.push('');
  parts.push(
    '> This file contains the complete CS2Inspect documentation concatenated into a single file for LLM consumption.'
  );
  parts.push(
    '> Generated automatically during the docs build process. See llms.txt for a structured index.'
  );
  parts.push('');

  for (const section of pages) {
    parts.push(`---`);
    parts.push('');
    parts.push(`# ${section.section}`);
    parts.push('');

    for (const file of section.files) {
      const filePath = join(DOCS_DIR, file.path);

      if (!existsSync(filePath)) {
        skippedCount++;
        continue;
      }

      const raw = readFileSync(filePath, 'utf-8');
      const cleaned = cleanMarkdown(raw);

      if (!cleaned) {
        skippedCount++;
        continue;
      }

      parts.push(`## ${file.title}`);
      parts.push(`<!-- source: ${file.path} -->`);
      parts.push('');
      parts.push(cleaned);
      parts.push('');

      fileCount++;
    }
  }

  const output = parts.join('\n');
  writeFileSync(OUTPUT_FILE, output, 'utf-8');

  const sizeKB = (Buffer.byteLength(output, 'utf-8') / 1024).toFixed(1);
  const lines = output.split('\n').length;

  console.log(`llms-full.txt generated:`);
  console.log(`  Files: ${fileCount} included, ${skippedCount} skipped`);
  console.log(`  Size:  ${sizeKB} KB (${lines} lines)`);
  console.log(`  Path:  ${OUTPUT_FILE}`);
}

main();
