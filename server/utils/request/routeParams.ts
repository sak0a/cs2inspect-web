import { getRouterParam, type H3Event } from 'h3'

/**
 * Safely reads the Steam ID route parameter from admin API routes.
 * Falls back to path parsing for runtimes where `event.context.params` is not populated.
 */
export function getSteamIdParam(event: H3Event): string {
  const fromRouter = getRouterParam(event, 'steamId')
  if (typeof fromRouter === 'string' && fromRouter.trim()) {
    return fromRouter
  }

  const fromContext = event.context.params?.steamId
  if (typeof fromContext === 'string' && fromContext.trim()) {
    return fromContext
  }

  const path = event.path || event.node.req.url || ''
  const match = path.match(/\/api\/admin\/(?:users|admins)\/([^/?#]+)/)
  return match?.[1] ? decodeURIComponent(match[1]) : ''
}
