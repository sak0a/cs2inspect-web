import jwt from 'jsonwebtoken'
import { createError, defineEventHandler, parseCookies } from 'h3'
import { eq, and } from 'drizzle-orm'
import { PUBLIC_API_PATHS } from '~/server/utils/constants'
import { bannedUsers } from '~/server/database/schema'
import { useDatabase } from '~/server/utils/database'
import { Logger } from '~/server/utils/logger'

const JWT_SECRET = process.env.JWT_TOKEN
if (!JWT_SECRET) {
  throw new Error('JWT_TOKEN environment variable is required. Set it before starting the server.')
}

export default defineEventHandler(async (event) => {
  const path = event.node.req.url
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

  try {
    // Verify JWT token
    // Add user info to event context for use in API routes
    const decoded = jwt.verify(token, JWT_SECRET) as { steamId?: string }
    event.context.auth = decoded

    if (isAdminRoute) {
      Logger.debug(`JWT valid steamId=${decoded.steamId}`, 'auth')
    }

    // Check if user is banned
    if (decoded.steamId) {
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
    }
  } catch (error) {
    // Re-throw H3 errors (like our ban error)
    if (error && typeof error === 'object' && 'statusCode' in error) {
      throw error
    }
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
})
