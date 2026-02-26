/**
 * Admin Authentication Middleware
 *
 * Validates that the authenticated user has admin privileges for /api/admin/* routes
 */
import { createError, defineEventHandler } from 'h3'
import { eq } from 'drizzle-orm'
import { ADMIN_API_PATHS } from '~/server/utils/constants'
import { adminUsers } from '~/server/database/schema'
import { useDatabase } from '~/server/utils/database'
import { getRequestLogger } from '~/server/logging/request'

export interface AdminContext {
  steamId: string
  role: 'admin' | 'superadmin'
  permissions: string[]
}

declare module 'h3' {
  interface H3EventContext {
    admin?: AdminContext
  }
}

export default defineEventHandler(async (event) => {
  const path = event.node.req.url

  // Skip admin check for non-admin routes
  if (!path || !ADMIN_API_PATHS.some(route => path.startsWith(route))) {
    return
  }

  const requestLogger = getRequestLogger(event).child({ tag: 'Auth', component: 'admin-auth' })

  // Auth middleware runs first and sets event.context.auth
  const auth = event.context.auth as { steamId?: string } | undefined
  requestLogger.debug({ authPresent: !!auth?.steamId, path }, 'Admin check start')

  if (!auth?.steamId) {
    requestLogger.warn({ reason: 'no_auth', path }, 'Admin deny')

    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized',
      message: 'Authentication required for admin access. Please log in first.',
      data: { reason: 'no_auth', path },
    })
  }

  const db = useDatabase()

  // Check if user is an admin
  const [admin] = await db
    .select({
      steamid: adminUsers.steamid,
      role: adminUsers.role,
      permissions: adminUsers.permissions,
    })
    .from(adminUsers)
    .where(eq(adminUsers.steamid, auth.steamId))
    .limit(1)

  if (!admin) {
    requestLogger.warn({ reason: 'not_admin', steamId: auth.steamId }, 'Admin deny')

    throw createError({
      statusCode: 403,
      statusMessage: 'Forbidden',
      message: `User ${auth.steamId} does not have admin access`,
      data: { reason: 'not_admin', steamId: auth.steamId },
    })
  }

  requestLogger.info({ steamId: admin.steamid, role: admin.role }, 'Admin allow')

  // Set admin context for use in API routes
  event.context.admin = {
    steamId: admin.steamid,
    role: admin.role as 'admin' | 'superadmin',
    permissions: admin.permissions || [],
  }
})
