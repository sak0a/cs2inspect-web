/**
 * POST /api/admin/health/fetch-test
 *
 * Dev/debug tool: executes an HTTP request from the server process
 * so admins can test connectivity to external services (e.g. steam-service)
 * using the same network context as the running app.
 */
import { createError, readBody } from 'h3'
import { useErrorHandling } from '~/server/utils/errorHandler'
import { createSuccessResponse, createResponseMeta } from '~/server/utils/api/responseHelpers'
import { ADMIN_ERROR_CODES } from '~/server/utils/constants'

/** Hosts that the fetch-test endpoint is allowed to reach. */
const ALLOWED_HOSTS = new Set([
  'api.steampowered.com',
  'steamcommunity.com',
  'community.cloudflare.steamstatic.com',
])

function isAllowedUrl(urlString: string): boolean {
  let parsed: URL
  try {
    parsed = new URL(urlString)
  } catch {
    return false
  }

  // Only allow http and https schemes
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return false
  }

  // Allow configured steam service URL (internal network)
  const steamServiceUrl = process.env.STEAM_SERVICE_URL
  if (steamServiceUrl) {
    try {
      const steamServiceHost = new URL(steamServiceUrl).hostname
      if (parsed.hostname === steamServiceHost) return true
    } catch {
      // ignore invalid STEAM_SERVICE_URL
    }
  }

  // Allow configured proxy health base URL
  const proxyHealthUrl = process.env.PROXY_HEALTH_BASE_URL
  if (proxyHealthUrl) {
    try {
      const proxyHost = new URL(proxyHealthUrl).hostname
      if (parsed.hostname === proxyHost) return true
    } catch {
      // ignore
    }
  }

  if (ALLOWED_HOSTS.has(parsed.hostname)) return true

  // Allow localhost/127.0.0.1 for local service connectivity testing
  if (parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1') return true

  return false
}

interface FetchTestRequest {
  url: string
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS'
  headers?: Record<string, string>
  body?: string
  timeout?: number
}

export default useErrorHandling(async (event) => {
  const startTime = Date.now()

  if (!event.context.admin) {
    throw createError({ statusCode: 403, message: 'Admin access required' })
  }

  const input = await readBody<FetchTestRequest>(event)

  if (!input.url || typeof input.url !== 'string') {
    throw createError({ statusCode: 400, message: 'url is required' })
  }

  // Validate URL against allowlist to prevent SSRF
  if (!isAllowedUrl(input.url)) {
    throw createError({
      statusCode: 403,
      message: 'URL not allowed. Only Steam API, configured services, and localhost are permitted.',
    })
  }

  const method = input.method || 'GET'
  const timeout = Math.min(input.timeout || 15000, 30000)

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeout)

  let responseStatus = 0
  let responseStatusText = ''
  const responseHeaders: Record<string, string> = {}
  let responseBody = ''
  let errorMessage: string | null = null
  let errorCode: string | null = null

  try {
    const fetchOptions: RequestInit = {
      method,
      headers: input.headers || {},
      signal: controller.signal,
    }

    if (input.body && method !== 'GET' && method !== 'HEAD') {
      fetchOptions.body = input.body
    }

    const resp = await fetch(input.url, fetchOptions)

    responseStatus = resp.status
    responseStatusText = resp.statusText

    // Collect response headers
    resp.headers.forEach((value, key) => {
      responseHeaders[key] = value
    })

    // Read body (limit to 50KB to avoid memory issues)
    const text = await resp.text()
    responseBody = text.length > 50000 ? text.slice(0, 50000) + '\n... (truncated)' : text
  } catch (err: unknown) {
    if (err instanceof Error) {
      errorMessage = err.message
      errorCode = err.name
      if ('cause' in err && err.cause) {
        const cause = err.cause as Record<string, unknown>
        errorMessage += ` | cause: ${cause.code || cause.message || JSON.stringify(cause)}`
        errorCode = (cause.code as string) || errorCode
      }
    } else {
      errorMessage = String(err)
    }
  } finally {
    clearTimeout(timer)
  }

  const latency = Date.now() - startTime

  const data = {
    request: {
      url: input.url,
      method,
      headers: input.headers || {},
      hasBody: !!input.body,
    },
    response: errorMessage
      ? null
      : {
          status: responseStatus,
          statusText: responseStatusText,
          headers: responseHeaders,
          body: responseBody,
        },
    error: errorMessage ? { code: errorCode, message: errorMessage } : null,
    latencyMs: latency,
  }

  const meta = createResponseMeta(startTime, {
    adminSteamId: event.context.admin.steamId,
    endpoint: 'admin/health/fetch-test',
  })

  return createSuccessResponse(data, meta, errorMessage ? 'Request failed' : 'Request completed')
}, ADMIN_ERROR_CODES.STATS_ERROR)
