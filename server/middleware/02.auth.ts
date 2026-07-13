import jwt from 'jsonwebtoken'
import { createError, defineEventHandler, parseCookies } from 'h3'
import { eq, and } from 'drizzle-orm'
import { PUBLIC_API_PATHS } from '~/server/utils/constants'
import { bannedUsers } from '~/server/database/schema'
import { useDatabase } from '~/server/utils/database'
import { isDevAuthEnabled } from '~/server/utils/devAuth'
import { Logger } from '~/server/utils/logger'

const JWT_SECRET = process.env.JWT_TOKEN
if (!JWT_SECRET) {
  throw new Error('JWT_TOKEN environment variable is required. Set it before starting the server.')
}

export default defineEventHandler(async (event) => {
  const path = event.node.req.url

  if (path?.startsWith('/api/auth/dev/') && isDevAuthEnabled()) {
    return
  }

  // Deny-by-default: skip auth only for explicitly public routes and non-API paths
  if (
    !path ||
    !path.startsWith('/api/') ||
    PUBLIC_API_PATHS.some((route) => path.startsWith(route))
  ) {
    return
  }

  const isAdminRoute = path.startsWith('/api/admin/')
  if (isAdminRoute) {
    Logger.debug(`Admin auth check path=${path}`, 'auth')
  }

  const cookies: Record<string, string> = parseCookies(event)
  const token = cookies.auth_token

  if (!token) {
    if (isAdminRoute) {
      Logger.warn('Auth deny reason=no_token', 'auth')
    }
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized',
      message: 'Authentication required. Please log in.',
      data: { reason: 'no_token', path },
    })
  }

  let decoded: { steamId?: string; type?: string }

  try {
    decoded = jwt.verify(token, JWT_SECRET) as { steamId?: string; type?: string }
  } catch (error) {
    if (isAdminRoute) {
      Logger.warn(
        `Auth deny reason=invalid_token error=${error instanceof Error ? error.message : error}`,
        'auth'
      )
    }
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized',
      message: 'Invalid or expired token. Please log in again.',
      data: { reason: 'invalid_token', path },
    })
  }

  if (decoded.type === 'dev_auth' && !isDevAuthEnabled()) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized',
      message: 'Dev authentication is disabled.',
      data: { reason: 'dev_auth_disabled', path },
    })
  }

  event.context.auth = decoded

  if (isAdminRoute) {
    Logger.debug(`JWT valid steamId=${decoded.steamId}`, 'auth')
  }

  if (decoded.steamId) {
    try {
      const db = useDatabase()
      const [ban] = await db
        .select({ id: bannedUsers.id, reason: bannedUsers.reason })
        .from(bannedUsers)
        .where(and(eq(bannedUsers.steamid, decoded.steamId), eq(bannedUsers.active, 1)))
        .limit(1)

      if (ban) {
        throw createError({
          statusCode: 403,
          message: ban.reason
            ? `Your account has been banned: ${ban.reason}`
            : 'Your account has been banned',
        })
      }
    } catch (error) {
      if (error && typeof error === 'object' && 'statusCode' in error) {
        throw error
      }

      Logger.error(
        `Ban check failed error=${error instanceof Error ? error.message : String(error)}`,
        'auth'
      )
      throw createError({
        statusCode: 503,
        statusMessage: 'Service Unavailable',
        message: 'Authentication service temporarily unavailable.',
        data: { reason: 'ban_check_failed', path },
      })
    }
  }
})
