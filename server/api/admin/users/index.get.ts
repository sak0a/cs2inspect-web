/**
 * GET /api/admin/users
 * Fetches paginated list of users with their loadout counts, total items, and ban status
 *
 * Query params:
 * - search: steamId prefix to filter by
 * - page: page number (default: 1)
 * - limit: items per page (default: 20)
 * - bannedOnly: filter to only show banned users
 */
import { createError } from 'h3'
import { eq, sql, like, and, or } from 'drizzle-orm'
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
    bannedUsers,
    adminUsers
} from '~/server/database/schema'
import {
    createPaginatedResponse,
    createPaginationMeta,
    createResponseMeta
} from '~/server/utils/api/responseHelpers'
import { useErrorHandling } from '~/server/utils/errorHandler'
import { parseQueryWithSchema } from '~/server/utils/validation/zodHelpers'
import { adminUserSearchSchema } from '~/server/utils/validation/adminSchemas'
import { ADMIN_ERROR_CODES } from '~/server/utils/constants'
import { Logger } from '~/server/utils/logger'

interface AdminUserListItem {
    steamId: string
    loadoutCount: number
    totalItems: number
    lastActivity: string | null
    isBanned: boolean
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

    Logger.header(`Admin Users GET request: ${event.req.url}`)

    const { search, page, limit, bannedOnly } = parseQueryWithSchema(adminUserSearchSchema, event)
    const offset = (page - 1) * limit

    const db = useDatabase()

    // Get distinct steamIds from loadouts table with pagination
    // We use loadouts as the primary source since every user has at least one loadout
    let steamIdsQuery = db
        .select({
            steamid: loadouts.steamid,
            loadoutCount: sql<number>`COUNT(DISTINCT ${loadouts.id})`.as('loadoutCount'),
            lastActivity: sql<string | null>`MAX(${loadouts.updated_at})`.as('lastActivity')
        })
        .from(loadouts)
        .groupBy(loadouts.steamid)
        .$dynamic()

    // Apply search filter if provided
    if (search) {
        steamIdsQuery = steamIdsQuery.where(like(loadouts.steamid, `${search}%`))
    }

    // Get all users matching the criteria
    let allUsersResult = await steamIdsQuery

    // Include admins even if they have no loadouts
    const adminIdsResult = await db
        .select({
            steamid: adminUsers.steamid
        })
        .from(adminUsers)

    const adminIds = adminIdsResult
        .map(a => a.steamid)
        .concat(event.context.admin?.steamId ? [event.context.admin.steamId] : [])
        .filter(Boolean)
        .filter(id => (search ? id.startsWith(search) : true))

    if (adminIds.length > 0) {
        const existingIds = new Set(allUsersResult.map(u => u.steamid))
        const missingAdmins = adminIds.filter(id => !existingIds.has(id))
        if (missingAdmins.length > 0) {
            allUsersResult = allUsersResult.concat(
                missingAdmins.map(id => ({
                    steamid: id,
                    loadoutCount: 0,
                    lastActivity: null
                }))
            )
        }
    }

    // Get banned users
    const bannedUsersResult = await db
        .select({
            steamid: bannedUsers.steamid
        })
        .from(bannedUsers)
        .where(
            and(
                eq(bannedUsers.active, 1),
                or(
                    sql`${bannedUsers.expires_at} IS NULL`,
                    sql`${bannedUsers.expires_at} > NOW()`
                )
            )
        )

    const bannedSteamIds = new Set(bannedUsersResult.map(b => b.steamid))

    // Filter by banned status if requested
    let filteredUsers = allUsersResult
    if (bannedOnly) {
        filteredUsers = allUsersResult.filter(u => bannedSteamIds.has(u.steamid))
    }

    const totalItems = filteredUsers.length

    // Apply pagination
    const paginatedUsers = filteredUsers.slice(offset, offset + limit)

    // Get item counts for each user in the paginated result
    const users: AdminUserListItem[] = await Promise.all(
        paginatedUsers.map(async (user) => {
            // Count items across all tables
            const [pistolCount] = await db
                .select({ count: sql<number>`COUNT(*)` })
                .from(pistols)
                .where(eq(pistols.steamid, user.steamid))

            const [rifleCount] = await db
                .select({ count: sql<number>`COUNT(*)` })
                .from(rifles)
                .where(eq(rifles.steamid, user.steamid))

            const [smgCount] = await db
                .select({ count: sql<number>`COUNT(*)` })
                .from(smgs)
                .where(eq(smgs.steamid, user.steamid))

            const [heavyCount] = await db
                .select({ count: sql<number>`COUNT(*)` })
                .from(heavys)
                .where(eq(heavys.steamid, user.steamid))

            const [knifeCount] = await db
                .select({ count: sql<number>`COUNT(*)` })
                .from(knives)
                .where(eq(knives.steamid, user.steamid))

            const [gloveCount] = await db
                .select({ count: sql<number>`COUNT(*)` })
                .from(gloves)
                .where(eq(gloves.steamid, user.steamid))

            const [agentCount] = await db
                .select({ count: sql<number>`COUNT(*)` })
                .from(agents)
                .where(eq(agents.steamid, user.steamid))

            const [musicCount] = await db
                .select({ count: sql<number>`COUNT(*)` })
                .from(music)
                .where(eq(music.steamid, user.steamid))

            const [pinCount] = await db
                .select({ count: sql<number>`COUNT(*)` })
                .from(pins)
                .where(eq(pins.steamid, user.steamid))

            const totalItemCount =
                Number(pistolCount?.count || 0) +
                Number(rifleCount?.count || 0) +
                Number(smgCount?.count || 0) +
                Number(heavyCount?.count || 0) +
                Number(knifeCount?.count || 0) +
                Number(gloveCount?.count || 0) +
                Number(agentCount?.count || 0) +
                Number(musicCount?.count || 0) +
                Number(pinCount?.count || 0)

            return {
                steamId: user.steamid,
                loadoutCount: Number(user.loadoutCount),
                totalItems: totalItemCount,
                lastActivity: user.lastActivity,
                isBanned: bannedSteamIds.has(user.steamid)
            }
        })
    )

    Logger.success(`Fetched ${users.length} users (page ${page})`)

    const meta = createResponseMeta(startTime, {
        adminSteamId: event.context.admin.steamId,
        method: 'GET'
    })

    const pagination = createPaginationMeta(page, totalItems, limit, users.length)

    return createPaginatedResponse(
        users,
        pagination,
        meta,
        { search, bannedOnly },
        undefined,
        'Users fetched successfully'
    )
}, ADMIN_ERROR_CODES.USER_NOT_FOUND)
