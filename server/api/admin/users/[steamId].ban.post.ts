/**
 * POST /api/admin/users/:steamId/ban
 * Bans a user with a reason and optional duration
 *
 * Body:
 * - reason: string (required, 1-500 chars)
 * - duration: number (optional, hours - null for permanent)
 */
import { createError, readBody } from 'h3'
import { eq, sql, and, or } from 'drizzle-orm'
import { useDatabase } from '~/server/utils/database'
import { loadouts, bannedUsers, adminActivityLog } from '~/server/database/schema'
import { createSuccessResponse, createResponseMeta } from '~/server/utils/api/responseHelpers'
import { useErrorHandling } from '~/server/utils/errorHandler'
import { getSteamIdParam } from '~/server/utils/request/routeParams'
import { parseBodyWithSchema } from '~/server/utils/validation/zodHelpers'
import { adminBanUserSchema } from '~/server/utils/validation/adminSchemas'
import { ADMIN_ERROR_CODES } from '~/server/utils/constants'
import { Logger } from '~/server/utils/logger'

export default useErrorHandling(async (event) => {
    const startTime = Date.now()

    // Check admin authentication
    if (!event.context.admin) {
        throw createError({
            statusCode: 403,
            message: 'Admin access required',
        })
    }

    const steamId = getSteamIdParam(event)
    if (!steamId) {
        throw createError({
            statusCode: 400,
            message: 'Steam ID is required',
        })
    }

    Logger.header(`Admin Ban User POST request: ${steamId}`)

    const body = await readBody(event)
    const { reason, duration } = parseBodyWithSchema(adminBanUserSchema, body)

    const db = useDatabase()

    // Verify user exists
    const [userExists] = await db
        .select({ count: sql<number>`COUNT(*)` })
        .from(loadouts)
        .where(eq(loadouts.steamid, steamId))

    if (!userExists || Number(userExists.count) === 0) {
        throw createError({
            statusCode: 404,
            message: `User with Steam ID ${steamId} not found`,
        })
    }

    // Check if user is already banned
    const [existingBan] = await db
        .select({ id: bannedUsers.id })
        .from(bannedUsers)
        .where(
            and(
                eq(bannedUsers.steamid, steamId),
                eq(bannedUsers.active, 1),
                or(sql`${bannedUsers.expires_at} IS NULL`, sql`${bannedUsers.expires_at} > NOW()`)
            )
        )
        .limit(1)

    if (existingBan) {
        throw createError({
            statusCode: 409,
            message: `User ${steamId} is already banned`,
        })
    }

    // Calculate expiration date if duration is provided
    const expiresAt = duration ? new Date(Date.now() + duration * 60 * 60 * 1000) : null

    // Insert ban record
    await db.insert(bannedUsers).values({
        steamid: steamId,
        reason,
        banned_by: event.context.admin.steamId,
        expires_at: expiresAt,
        active: 1,
    })

    // Log admin action
    await db.insert(adminActivityLog).values({
        admin_steamid: event.context.admin.steamId,
        action: 'ban_user',
        target_steamid: steamId,
        details: {
            reason,
            duration: duration || 'permanent',
            expiresAt: expiresAt?.toISOString() || null,
        },
    })

    Logger.success(`User ${steamId} banned by admin ${event.context.admin.steamId}`)

    const meta = createResponseMeta(startTime, {
        adminSteamId: event.context.admin.steamId,
        method: 'POST',
        action: 'ban_user',
        targetSteamId: steamId,
    })

    return createSuccessResponse(
        {
            steamId,
            reason,
            duration: duration || null,
            expiresAt: expiresAt?.toISOString() || null,
            isPermanent: !duration,
        },
        meta,
        `User ${steamId} has been banned successfully`
    )
}, ADMIN_ERROR_CODES.BAN_ERROR)
