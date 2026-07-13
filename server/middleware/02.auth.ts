import jwt from 'jsonwebtoken'
import { createError, defineEventHandler, parseCookies } from 'h3'
import { eq, and } from 'drizzle-orm'
import { PROTECTED_API_PATHS } from '~/server/utils/constants'
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

  // Dev login is public when dev auth is enabled
  if (path?.startsWith('/api/auth/dev/') && isDevAuthEnabled()) {
    return
  }

  // Skip auth check for non-protected routes
  if (!path || !PROTECTED_API_PATHS.some((route) => path.startsWith(route))) {
    return
  }

  const isAdminRoute = path.startsWith('/api/admin/')
  if (isAdminRoute) {
    Logger.header('ADMIN ROUTE AUTHENTICATION')
    Logger.info(`Path: ${path}`, 'auth')
  }

  const cookies: Record<string, string> = parseCookies(event)
  const token = cookies.auth_token

  if (!token) {
    if (isAdminRoute) {
      Logger.error('FAILED - No auth_token cookie found', 'auth')
      Logger.info('User needs to log in first', 'auth')
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
      Logger.error('FAILED - JWT verification error', 'auth')
      Logger.error(`Error: ${error instanceof Error ? error.message : error}`, 'auth')
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
    Logger.success(`JWT valid - Steam ID: ${decoded.steamId}`, 'auth')
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

      console.error('[Auth] Ban check failed:', error)
      throw createError({
        statusCode: 503,
        statusMessage: 'Service Unavailable',
        message: 'Authentication service temporarily unavailable.',
        data: { reason: 'ban_check_failed', path },
      })
    }
  }
})
