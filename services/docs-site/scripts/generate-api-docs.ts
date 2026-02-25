/**
 * API Documentation Generator
 * 
 * Scans the server/api/ directory and generates VitePress-compatible markdown documentation.
 * Extracts JSDoc comments, file structure, HTTP methods, and route patterns.
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, statSync } from 'fs';
import { join, dirname, relative } from 'path';

// Root paths
const ROOT_DIR = join(dirname(import.meta.url.replace('file://', '')), '../../..');
const API_DIR = join(ROOT_DIR, 'server/api');
const DOCS_OUTPUT_DIR = join(dirname(import.meta.url.replace('file://', '')), '../api');

interface EndpointInfo {
  path: string;
  file: string;
  method: string;
  description: string;
  jsDoc: string[];
  auth: boolean;
  category: string;
  params: ParamInfo[];
  queryParams: ParamInfo[];
  bodyParams: ParamInfo[];
  responseType: string;
}

interface ParamInfo {
  name: string;
  type: string;
  description: string;
  required: boolean;
}

interface CategoryInfo {
  name: string;
  description: string;
  endpoints: EndpointInfo[];
}

/**
 * Extract HTTP method from filename or content
 */
function extractMethod(filename: string, content: string): string {
  // Check file naming conventions (Nuxt style)
  const methodMatch = filename.match(/\.(get|post|put|patch|delete|head|options)\.ts$/i);
  if (methodMatch) {
    return methodMatch[1]!.toUpperCase();
  }

  // Check for explicit method handling in content
  if (content.includes("event.method === 'GET'") || content.includes('method === "GET"')) {
    if (content.includes("event.method === 'POST'") || content.includes('method === "POST"')) {
      return 'GET/POST';
    }
  }
  if (content.includes("event.method")) {
    // Multiple methods handled
    const methods: string[] = [];
    if (content.includes("'GET'") || content.includes('"GET"')) methods.push('GET');
    if (content.includes("'POST'") || content.includes('"POST"')) methods.push('POST');
    if (content.includes("'PUT'") || content.includes('"PUT"')) methods.push('PUT');
    if (content.includes("'PATCH'") || content.includes('"PATCH"')) methods.push('PATCH');
    if (content.includes("'DELETE'") || content.includes('"DELETE"')) methods.push('DELETE');
    if (methods.length > 0) return methods.join('/');
  }

  // Default based on common patterns
  if (content.includes('readBody')) return 'POST';
  return 'GET';
}

/**
 * Extract JSDoc comments from file content
 */
function extractJSDoc(content: string): string[] {
  const jsdocRegex = /\/\*\*\s*([\s\S]*?)\s*\*\//g;
  const comments: string[] = [];
  let match;

  while ((match = jsdocRegex.exec(content)) !== null) {
    const comment = match[1]!
      .split('\n')
      .map(line => line.replace(/^\s*\*\s?/, '').trim())
      .filter(line => line.length > 0);
    if (comment.length > 0) {
      comments.push(comment.join('\n'));
    }
  }

  return comments;
}

/**
 * Extract description from first JSDoc comment
 */
function extractDescription(jsdocs: string[]): string {
  if (jsdocs.length === 0) return 'No description available';
  
  // Get first non-tag line from first JSDoc
  const lines = jsdocs[0]!.split('\n');
  const descLines: string[] = [];
  
  for (const line of lines) {
    if (line.startsWith('@')) break;
    descLines.push(line);
  }
  
  return descLines.join(' ').trim() || 'No description available';
}

/**
 * Check if endpoint requires authentication
 */
function requiresAuth(content: string): boolean {
  return content.includes('verifyUserAccess') || 
         content.includes('validateToken') ||
         content.includes('steamId') && content.includes('validateRequiredRequestData');
}

/**
 * Extract query parameters from content
 */
function extractQueryParams(content: string): ParamInfo[] {
  const params: ParamInfo[] = [];
  
  // Match getQuery patterns
  const queryMatches = content.matchAll(/const\s+(\w+)\s*=\s*query\.(\w+)/g);
  for (const match of queryMatches) {
    params.push({
      name: match[2]!,
      type: 'string',
      description: '',
      required: content.includes(`validateRequiredRequestData(${match[1]}`)
    });
  }

  // Match destructured query
  const destructuredMatch = content.match(/const\s*\{\s*([^}]+)\s*\}\s*=\s*getQuery/);
  if (destructuredMatch) {
    const vars = destructuredMatch[1]!.split(',').map(v => v.trim().split(':')[0]!.trim());
    for (const v of vars) {
      if (!params.find(p => p.name === v)) {
        params.push({
          name: v,
          type: 'string',
          description: '',
          required: false
        });
      }
    }
  }

  return params;
}

/**
 * Extract response type from content
 */
function extractResponseType(content: string): string {
  // Check for explicit return type
  const returnTypeMatch = content.match(/\):\s*Promise<([^>]+)>/);
  if (returnTypeMatch) {
    return returnTypeMatch[1]!;
  }

  // Check for response helpers
  if (content.includes('createSuccessResponse')) return 'SuccessResponse<T>';
  if (content.includes('createCollectionResponse')) return 'CollectionResponse<T>';

  return 'unknown';
}

/**
 * Convert file path to API route path
 */
function fileToRoute(filePath: string): string {
  let route = relative(API_DIR, filePath);
  
  // Remove file extension and method suffix
  route = route.replace(/\.(get|post|put|patch|delete|head|options)?\.ts$/i, '');
  
  // Handle index files
  route = route.replace(/\/index$/, '');
  
  // Convert [param] to :param
  route = route.replace(/\[([^\]]+)\]/g, ':$1');
  
  return '/api/' + route;
}

/**
 * Scan directory recursively for API files
 */
function scanDirectory(dir: string, category: string = ''): EndpointInfo[] {
  const endpoints: EndpointInfo[] = [];
  
  if (!existsSync(dir)) {
    console.warn(`Directory not found: ${dir}`);
    return endpoints;
  }

  const entries = readdirSync(dir);

  for (const entry of entries) {
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);

    if (stat.isDirectory()) {
      // Recurse into subdirectory
      const subEndpoints = scanDirectory(fullPath, entry);
      endpoints.push(...subEndpoints);
    } else if (entry.endsWith('.ts') && !entry.includes('.test.') && !entry.includes('.spec.')) {
      try {
        const content = readFileSync(fullPath, 'utf-8');
        const jsdocs = extractJSDoc(content);

        const endpoint: EndpointInfo = {
          path: fileToRoute(fullPath),
          file: relative(ROOT_DIR, fullPath),
          method: extractMethod(entry, content),
          description: extractDescription(jsdocs),
          jsDoc: jsdocs,
          auth: requiresAuth(content),
          category: category || 'root',
          params: [], // Dynamic route params from path
          queryParams: extractQueryParams(content),
          bodyParams: [], // Would need deeper parsing
          responseType: extractResponseType(content)
        };

        // Extract dynamic params from path
        const paramMatches = endpoint.path.matchAll(/:(\w+)/g);
        for (const match of paramMatches) {
          endpoint.params.push({
            name: match[1]!,
            type: 'string',
            description: '',
            required: true
          });
        }

        endpoints.push(endpoint);
      } catch (error) {
        console.error(`Error processing ${fullPath}:`, error);
      }
    }
  }

  return endpoints;
}

/**
 * Group endpoints by category
 */
function groupByCategory(endpoints: EndpointInfo[]): Map<string, CategoryInfo> {
  const categories = new Map<string, CategoryInfo>();

  const categoryDescriptions: Record<string, string> = {
    'root': 'Root-level API endpoints',
    'auth': 'Authentication and authorization endpoints',
    'health': 'Health check and monitoring endpoints',
    'inspect': 'Item inspection and URL generation endpoints',
    'items': 'Item data retrieval endpoints (weapons, knives, gloves, etc.)',
    'loadouts': 'User loadout management endpoints',
    'proxy': 'Proxy endpoints for external resources',
    'data': 'Static data endpoints'
  };

  for (const endpoint of endpoints) {
    const cat = endpoint.category;
    
    if (!categories.has(cat)) {
      categories.set(cat, {
        name: cat,
        description: categoryDescriptions[cat] || `${cat} API endpoints`,
        endpoints: []
      });
    }

    categories.get(cat)!.endpoints.push(endpoint);
  }

  return categories;
}

/**
 * Escape characters that conflict with Vue's template compiler in VitePress.
 * Curly braces are interpreted as mustache template syntax.
 */
function escapeForVitePress(text: string): string {
  return text.replace(/\{/g, '&#123;').replace(/\}/g, '&#125;');
}

/**
 * Generate markdown for a single endpoint
 */
function generateEndpointMarkdown(endpoint: EndpointInfo): string {
  let md = `### ${endpoint.method} \`${endpoint.path}\`\n\n`;
  md += `${escapeForVitePress(endpoint.description)}\n\n`;

  // Auth badge
  if (endpoint.auth) {
    md += `::: warning Authentication Required\nThis endpoint requires a valid JWT token.\n:::\n\n`;
  }

  // Parameters
  if (endpoint.params.length > 0) {
    md += `#### Path Parameters\n\n`;
    md += `| Parameter | Type | Required | Description |\n`;
    md += `|-----------|------|----------|-------------|\n`;
    for (const param of endpoint.params) {
      md += `| \`${param.name}\` | ${param.type} | ${param.required ? 'Yes' : 'No'} | ${param.description || '-'} |\n`;
    }
    md += '\n';
  }

  // Query parameters
  if (endpoint.queryParams.length > 0) {
    md += `#### Query Parameters\n\n`;
    md += `| Parameter | Type | Required | Description |\n`;
    md += `|-----------|------|----------|-------------|\n`;
    for (const param of endpoint.queryParams) {
      md += `| \`${param.name}\` | ${param.type} | ${param.required ? 'Yes' : 'No'} | ${param.description || '-'} |\n`;
    }
    md += '\n';
  }

  // Response
  if (endpoint.responseType !== 'unknown') {
    md += `#### Response\n\n`;
    md += `\`\`\`typescript\ntype Response = ${endpoint.responseType}\n\`\`\`\n\n`;
  }

  // Source file reference
  md += `<small>📁 Source: \`${endpoint.file}\`</small>\n\n`;
  md += `---\n\n`;

  return md;
}

/**
 * Generate markdown for a category
 */
function generateCategoryMarkdown(category: CategoryInfo): string {
  let md = `# ${category.name.charAt(0).toUpperCase() + category.name.slice(1)} API\n\n`;
  md += `${category.description}\n\n`;

  // Quick reference table
  md += `## Quick Reference\n\n`;
  md += `| Method | Endpoint | Auth | Description |\n`;
  md += `|--------|----------|------|-------------|\n`;

  for (const endpoint of category.endpoints) {
    const authIcon = endpoint.auth ? '🔒' : '🔓';
    const shortDesc = endpoint.description.substring(0, 50) + (endpoint.description.length > 50 ? '...' : '');
    md += `| \`${endpoint.method}\` | \`${endpoint.path}\` | ${authIcon} | ${escapeForVitePress(shortDesc)} |\n`;
  }

  md += '\n## Endpoints\n\n';

  // Detailed endpoint docs
  for (const endpoint of category.endpoints) {
    md += generateEndpointMarkdown(endpoint);
  }

  return md;
}

/**
 * Generate index page
 */
function generateIndexMarkdown(categories: Map<string, CategoryInfo>): string {
  let md = `# API Reference\n\n`;
  md += `This documentation is auto-generated from the source code.\n\n`;
  md += `::: tip Last Updated\n${new Date().toISOString()}\n:::\n\n`;

  md += `## Overview\n\n`;
  md += `The CS2Inspect API provides RESTful endpoints for managing user loadouts, weapon customizations, and CS2 item data.\n\n`;

  md += `### Base URL\n\n`;
  md += `\`\`\`\nDevelopment: http://localhost:3210/api\nProduction:  https://your-domain.com/api\n\`\`\`\n\n`;

  md += `## Categories\n\n`;

  for (const [name, category] of categories) {
    md += `### [${name.charAt(0).toUpperCase() + name.slice(1)}](./api-${name})\n\n`;
    md += `${category.description}\n\n`;
    md += `- **${category.endpoints.length}** endpoints\n`;
    md += `- **${category.endpoints.filter(e => e.auth).length}** require authentication\n\n`;
  }

  md += `## All Endpoints\n\n`;
  md += `| Method | Endpoint | Category | Auth |\n`;
  md += `|--------|----------|----------|------|\n`;

  for (const [_, category] of categories) {
    for (const endpoint of category.endpoints) {
      const authIcon = endpoint.auth ? '🔒' : '🔓';
      md += `| \`${endpoint.method}\` | \`${endpoint.path}\` | ${category.name} | ${authIcon} |\n`;
    }
  }

  return md;
}

/**
 * Main execution
 */
async function main() {
  console.log('🔍 Scanning API directory...');
  
  const endpoints = scanDirectory(API_DIR);
  console.log(`📊 Found ${endpoints.length} endpoints`);

  const categories = groupByCategory(endpoints);
  console.log(`📁 Organized into ${categories.size} categories`);

  // Ensure output directory exists
  if (!existsSync(DOCS_OUTPUT_DIR)) {
    mkdirSync(DOCS_OUTPUT_DIR, { recursive: true });
  }

  // Generate index
  const indexMd = generateIndexMarkdown(categories);
  writeFileSync(join(DOCS_OUTPUT_DIR, 'api-reference.md'), indexMd);
  console.log('📝 Generated api-reference.md');

  // Generate category pages
  for (const [name, category] of categories) {
    const categoryMd = generateCategoryMarkdown(category);
    writeFileSync(join(DOCS_OUTPUT_DIR, `api-${name}.md`), categoryMd);
    console.log(`📝 Generated api-${name}.md`);
  }

  console.log('✅ API documentation generation complete!');
}

main().catch(console.error);
