/**
 * Raw Markdown Generator (post-build)
 *
 * Generates clean markdown files in .vitepress/dist/raw/ for each doc page.
 * Must run AFTER `vitepress build` to write directly into the dist output.
 *
 * These files are served at /cs2inspect-web/raw/{path}.md and used by:
 * - "View as Markdown" page action
 * - "Open in ChatGPT/Claude" prompts (Read {url} so I can ask questions)
 *
 * Run: bun run scripts/generate-raw-md.ts
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const DOCS_DIR = join(dirname(fileURLToPath(import.meta.url)), '..')
const DIST_DIR = join(DOCS_DIR, '.vitepress', 'dist')
const RAW_DIR = join(DIST_DIR, 'raw')

// Same page list as generate-llms-txt.ts (matching .vitepress/config.ts sidebar)
const files = [
  'index.md',
  'docs-overview.md',
  'user-guide.md',
  'how-it-works.md',
  'faq.md',
  'faq-general.md',
  'faq-customization.md',
  'faq-technical.md',
  'self-hosting.md',
  'deployment.md',
  'coolify.md',
  'version-history.md',
  'admin.md',
  'setup.md',
  'architecture.md',
  'architecture-frontend.md',
  'architecture-backend.md',
  'architecture-deployment.md',
  'components.md',
  'github-actions.md',
  'contributing.md',
  'services-steam.md',
  'services-scrapers.md',
  'reference-composables.md',
  'reference-stores.md',
  'reference-types.md',
  'reference-env.md',
  'HEALTH_CHECKS.md',
  'api/index.md',
  'api/authentication.md',
  'api/health.md',
  'api/data.md',
  'api/loadouts.md',
  'api/items.md',
  'api/inspect.md',
  'api/admin.md',
  'api/errors.md',
  'api/api-reference.md',
  'plugin/index.md',
  'plugin/commands.md',
  'plugin/configuration.md',
  'plugin/config-generator.md',
  'theme-customization.md',
  'StickerSlots.md',
  'GLASSMORPHISM.md',
  'recommendations.md',
  'improvements-summary.md',
]

function cleanMarkdown(content: string): string {
  content = content.replace(/^---\n[\s\S]*?\n---\n?/, '')
  content = content.replace(/<Badge[^>]*\/>/g, '')
  content = content.replace(/<script[^>]*>[\s\S]*?<\/script>/g, '')
  content = content.replace(
    /^:::\s*(tip|warning|danger|info|details)\s*(.*)?$/gm,
    (_match, type, title) => {
      if (title?.trim()) return `**${title.trim()}**`
      return `**${type.charAt(0).toUpperCase() + type.slice(1)}**`
    }
  )
  content = content.replace(/^:::$/gm, '')
  content = content.replace(/\n{3,}/g, '\n\n')
  return content.trim()
}

function main() {
  if (!existsSync(DIST_DIR)) {
    console.error('Error: .vitepress/dist/ does not exist. Run `vitepress build` first.')
    process.exit(1)
  }

  let count = 0

  for (const file of files) {
    const srcPath = join(DOCS_DIR, file)
    if (!existsSync(srcPath)) continue

    const raw = readFileSync(srcPath, 'utf-8')
    const cleaned = cleanMarkdown(raw)
    if (!cleaned) continue

    const outPath = join(RAW_DIR, file)
    mkdirSync(dirname(outPath), { recursive: true })
    writeFileSync(outPath, cleaned, 'utf-8')
    count++
  }

  console.log(`raw/*.md generated: ${count} files → ${RAW_DIR}`)
}

main()
