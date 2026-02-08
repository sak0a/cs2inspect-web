/**
 * GET /api/admin/users/:steamId
 * Fetches detailed user information including item counts by category and ban status
 */
import { createError } from 'h3'
import { eq, sql, and, or } from 'drizzle-orm'
import { useDatabase } from '~/server/utils/database'
import {
    loadouts,
    pistols,
    rifles,
    smgs,
    heavys,
    knives,
    gloves,
    agents,
    music,
    pins,
    bannedUsers
} from '~/server/database/schema'
import {
    createSuccessResponse,
    createResponseMeta
} from '~/server/utils/api/responseHelpers'
import { useErrorHandling } from '~/server/utils/errorHandler'
import { getSteamIdParam } from '~/server/utils/request/routeParams'
import { ADMIN_ERROR_CODES } from '~/server/utils/constants'
import { Logger } from '~/server/utils/logger'

interface UserDetailResponse {
    steamId: string
    loadoutCount: number
    itemCounts: {
        pistols: number
        rifles: number
        smgs: number
        heavys: number
        knives: number
        gloves: number
        agents: number
        music: number
        pins: number
        total: number
    }
    firstActivity: string | null
    lastActivity: string | null
    isBanned: boolean
    banInfo: {
        reason: string | null
        bannedBy: string
        bannedAt: string
        expiresAt: string | null
    } | null
}

export default useErrorHandling(async (event) => {
    const startTime = Date.now()

    // Check admin authentication
    if (!event.context.admin) {
        throw createError({
            statusCode: 403,
            message: 'Admin access required'
        })
    }

    const steamId = getSteamIdParam(event)
    if (!steamId) {
        throw createError({
            statusCode: 400,
            message: 'Steam ID is required'
        })
    }

    Logger.header(`Admin User Detail GET request: ${steamId}`)

    const db = useDatabase()

    // Check if user exists (has at least one loadout)
    const [userLoadouts] = await db
        .select({
            count: sql<number>`COUNT(*)`,
            firstActivity: sql<string>`MIN(${loadouts.created_at})`,
            lastActivity: sql<string>`MAX(${loadouts.updated_at})`
        })
        .from(loadouts)
        .where(eq(loadouts.steamid, steamId))

    if (!userLoadouts || Number(userLoadouts.count) === 0) {
        throw createError({
            statusCode: 404,
            message: `User with Steam ID ${steamId} not found`
        })
    }

    // Get item counts for each category
    const [pistolCount] = await db
        .select({ count: sql<number>`COUNT(*)` })
        .from(pistols)
        .where(eq(pistols.steamid, steamId))

    const [rifleCount] = await db
        .select({ count: sql<number>`COUNT(*)` })
        .from(rifles)
        .where(eq(rifles.steamid, steamId))

    const [smgCount] = await db
        .select({ count: sql<number>`COUNT(*)` })
        .from(smgs)
        .where(eq(smgs.steamid, steamId))

    const [heavyCount] = await db
        .select({ count: sql<number>`COUNT(*)` })
        .from(heavys)
        .where(eq(heavys.steamid, steamId))

    const [knifeCount] = await db
        .select({ count: sql<number>`COUNT(*)` })
        .from(knives)
        .where(eq(knives.steamid, steamId))

    const [gloveCount] = await db
        .select({ count: sql<number>`COUNT(*)` })
        .from(gloves)
        .where(eq(gloves.steamid, steamId))

    const [agentCount] = await db
        .select({ count: sql<number>`COUNT(*)` })
        .from(agents)
        .where(eq(agents.steamid, steamId))

    const [musicCount] = await db
        .select({ count: sql<number>`COUNT(*)` })
        .from(music)
        .where(eq(music.steamid, steamId))

    const [pinCount] = await db
        .select({ count: sql<number>`COUNT(*)` })
        .from(pins)
        .where(eq(pins.steamid, steamId))

    const itemCounts = {
        pistols: Number(pistolCount?.count || 0),
        rifles: Number(rifleCount?.count || 0),
        smgs: Number(smgCount?.count || 0),
        heavys: Number(heavyCount?.count || 0),
        knives: Number(knifeCount?.count || 0),
        gloves: Number(gloveCount?.count || 0),
        agents: Number(agentCount?.count || 0),
        music: Number(musicCount?.count || 0),
        pins: Number(pinCount?.count || 0),
        total: 0
    }

    itemCounts.total = Object.values(itemCounts).reduce((sum, count) => sum + count, 0)

    // Check ban status
    const [banRecord] = await db
        .select({
            reason: bannedUsers.reason,
            banned_by: bannedUsers.banned_by,
            banned_at: bannedUsers.banned_at,
            expires_at: bannedUsers.expires_at,
            active: bannedUsers.active
        })
        .from(bannedUsers)
        .where(
            and(
                eq(bannedUsers.steamid, steamId),
                eq(bannedUsers.active, 1),
                or(
                    sql`${bannedUsers.expires_at} IS NULL`,
                    sql`${bannedUsers.expires_at} > NOW()`
                )
            )
        )
        .limit(1)

    const isBanned = !!banRecord
    const banInfo = banRecord
        ? {
            reason: banRecord.reason,
            bannedBy: banRecord.banned_by,
            bannedAt: banRecord.banned_at?.toISOString() || '',
            expiresAt: banRecord.expires_at?.toISOString() || null
        }
        : null

    const response: UserDetailResponse = {
        steamId,
        loadoutCount: Number(userLoadouts.count),
        itemCounts,
        firstActivity: userLoadouts.firstActivity,
        lastActivity: userLoadouts.lastActivity,
        isBanned,
        banInfo
    }

    Logger.success(`User detail fetched for ${steamId}`)

    const meta = createResponseMeta(startTime, {
        adminSteamId: event.context.admin.steamId,
        method: 'GET',
        targetSteamId: steamId
    })

    return createSuccessResponse(response, meta, 'User details fetched successfully')
}, ADMIN_ERROR_CODES.USER_NOT_FOUND)
