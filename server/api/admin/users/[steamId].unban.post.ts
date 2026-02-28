/**
 * POST /api/admin/users/:steamId/unban
 * Unbans a user by setting active=0 on their ban record
 */
import { createError } from 'h3'
import { eq, sql, and, or } from 'drizzle-orm'
import { useDatabase } from '~/server/utils/database'
import { loadouts, bannedUsers, adminActivityLog } from '~/server/database/schema'
import { createSuccessResponse, createResponseMeta } from '~/server/utils/api/responseHelpers'
import { useErrorHandling } from '~/server/utils/errorHandler'
import { getSteamIdParam } from '~/server/utils/request/routeParams'
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

    Logger.header(`Admin Unban User POST request: ${steamId}`)

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

    // Check if user has an active ban
    const [activeBan] = await db
        .select({
            id: bannedUsers.id,
            reason: bannedUsers.reason,
        })
        .from(bannedUsers)
        .where(
            and(
                eq(bannedUsers.steamid, steamId),
                eq(bannedUsers.active, 1),
                or(sql`${bannedUsers.expires_at} IS NULL`, sql`${bannedUsers.expires_at} > NOW()`)
            )
        )
        .limit(1)

    if (!activeBan) {
        throw createError({
            statusCode: 404,
            message: `User ${steamId} is not currently banned`,
        })
    }

    // Deactivate the ban
    await db.update(bannedUsers).set({ active: 0 }).where(eq(bannedUsers.id, activeBan.id))

    // Log admin action
    await db.insert(adminActivityLog).values({
        admin_steamid: event.context.admin.steamId,
        action: 'unban_user',
        target_steamid: steamId,
        details: {
            previousBanId: activeBan.id,
            previousReason: activeBan.reason,
        },
    })

    Logger.success(`User ${steamId} unbanned by admin ${event.context.admin.steamId}`)

    const meta = createResponseMeta(startTime, {
        adminSteamId: event.context.admin.steamId,
        method: 'POST',
        action: 'unban_user',
        targetSteamId: steamId,
    })

    return createSuccessResponse(
        {
            steamId,
            previousReason: activeBan.reason,
        },
        meta,
        `User ${steamId} has been unbanned successfully`
    )
}, ADMIN_ERROR_CODES.BAN_ERROR)
