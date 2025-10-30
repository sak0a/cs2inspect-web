// filepath: /server/api/proxy/image.ts
import { defineEventHandler, getQuery, setHeader, H3Event } from 'h3'

// Very small allowlist to reduce abuse surface
const ALLOWED_HOST_PATTERNS: RegExp[] = [
  /(^|\.)steamstatic\.com$/i,
  /(^|\.)akamaihd\.net$/i,
  /(^|\.)steamcommunity\.com$/i,
  /(^|\.)akamai\.steamstatic\.com$/i,
  /(^|\.)community\.akamai\.steamstatic\.com$/i,
]

function isAllowedUrl(rawUrl: string): boolean {
  try {
    const u = new URL(rawUrl)
    const host = u.hostname
    return ALLOWED_HOST_PATTERNS.some((re) => re.test(host))
  } catch {
    return false
  }
}

function setCorsHeaders(event: H3Event) {
  setHeader(event, 'Access-Control-Allow-Origin', '*')
  setHeader(event, 'Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS')
  setHeader(event, 'Access-Control-Allow-Headers', 'Content-Type, Range, Accept')
}

export default defineEventHandler(async (event) => {
  setCorsHeaders(event)

  if (event.method === 'OPTIONS') {
    // Preflight response
    return new Response(null, { status: 204 })
  }

  const { url } = getQuery(event)
  if (!url || typeof url !== 'string') {
    return new Response(JSON.stringify({ success: false, error: 'Missing url parameter' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    })
  }

  if (!isAllowedUrl(url)) {
    return new Response(JSON.stringify({ success: false, error: 'URL not allowed' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    })
  }

  try {
    // Fetch upstream image; pass a minimal header set
    const upstream = await fetch(url, {
      method: 'GET',
      // No credentials or cookies
      redirect: 'follow'
    })

    if (!upstream.ok) {
      return new Response(JSON.stringify({ success: false, error: `Upstream error ${upstream.status}` }), {
        status: 502,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Read as arrayBuffer to construct a Response we control
    const body = await upstream.arrayBuffer()

    // Forward content-type if present
    const contentType = upstream.headers.get('content-type') || 'application/octet-stream'

    // Basic cache headers (tune as needed)
    const headers: Record<string, string> = {
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=86400, immutable',
      'Access-Control-Allow-Origin': '*'
    }

    const etag = upstream.headers.get('etag')
    if (etag) headers['ETag'] = etag

    const lastMod = upstream.headers.get('last-modified')
    if (lastMod) headers['Last-Modified'] = lastMod

    return new Response(body, { status: 200, headers })
  } catch (err) {
    // Network or other failure
    return new Response(JSON.stringify({ success: false, error: 'Failed to fetch upstream image' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
})

