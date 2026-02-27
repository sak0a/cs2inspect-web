/**
 * GET /api/admin/users
 * Fetches paginated list of users with their loadout counts, total items, and ban status
 *
 * Query params:
 * - search: steamId prefix or persona name to filter by
 * - page: page number (default: 1)
 * - limit: items per page (default: 20)
 * - bannedOnly: filter to only show banned users
 * - activeOnly: filter to only show active (non-banned) users
 * - sortBy: name | loadouts | items | lastActivity
 * - sortDir: asc | desc
 */
import { createError } from 'h3'
import { eq, sql, like, and, or, inArray } from 'drizzle-orm'
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
    adminUsers,
    userProfiles
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
    personaName: string | null
    avatarFull: string | null
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

    const { search, page, limit, bannedOnly, activeOnly, sortBy, sortDir } = parseQueryWithSchema(adminUserSearchSchema, event)
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

    // Apply search filter if provided (steamid prefix match)
    if (search) {
        steamIdsQuery = steamIdsQuery.where(like(loadouts.steamid, `${search}%`))
    }

    // Get all users matching the criteria
    let allUsersResult = await steamIdsQuery

    // If searching, also find users by persona name match
    let nameMatchedSteamIds: string[] = []
    if (search) {
        const nameMatches = await db
            .select({ steamid: userProfiles.steamid })
            .from(userProfiles)
            .where(like(userProfiles.personaname, `%${search}%`))
        nameMatchedSteamIds = nameMatches.map(n => n.steamid)

        // Fetch loadout data for name-matched users not already in results
        const existingSteamIds = new Set(allUsersResult.map(u => u.steamid))
        const missingNameMatches = nameMatchedSteamIds.filter(id => !existingSteamIds.has(id))
        if (missingNameMatches.length > 0) {
            const nameMatchedUsers = await db
                .select({
                    steamid: loadouts.steamid,
                    loadoutCount: sql<number>`COUNT(DISTINCT ${loadouts.id})`.as('loadoutCount'),
                    lastActivity: sql<string | null>`MAX(${loadouts.updated_at})`.as('lastActivity')
                })
                .from(loadouts)
                .where(inArray(loadouts.steamid, missingNameMatches))
                .groupBy(loadouts.steamid)

            allUsersResult = allUsersResult.concat(nameMatchedUsers)
        }
    }

    // Include admins even if they have no loadouts
    const adminIdsResult = await db
        .select({
            steamid: adminUsers.steamid
        })
        .from(adminUsers)

    const nameMatchedSet = new Set(nameMatchedSteamIds)
    const adminIds = adminIdsResult
        .map(a => a.steamid)
        .concat(event.context.admin?.steamId ? [event.context.admin.steamId] : [])
        .filter(Boolean)
        .filter(id => (search ? (id.startsWith(search) || nameMatchedSet.has(id)) : true))

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

    // Filter by banned/active status
    let filteredUsers = allUsersResult
    if (bannedOnly) {
        filteredUsers = allUsersResult.filter(u => bannedSteamIds.has(u.steamid))
    } else if (activeOnly) {
        filteredUsers = allUsersResult.filter(u => !bannedSteamIds.has(u.steamid))
    }

    // Batch-fetch profile data for ALL filtered users (needed for name sorting)
    const allFilteredSteamIds = filteredUsers.map(u => u.steamid)
    const profilesResult = allFilteredSteamIds.length > 0
        ? await db
            .select({
                steamid: userProfiles.steamid,
                personaname: userProfiles.personaname,
                avatarfull: userProfiles.avatarfull,
            })
            .from(userProfiles)
            .where(inArray(userProfiles.steamid, allFilteredSteamIds))
        : []
    const profileMap = new Map(profilesResult.map(p => [p.steamid, p]))

    // For items sorting, compute item counts for all filtered users via a single aggregate query
    let itemCountMap: Map<string, number> | undefined
    if (sortBy === 'items' && allFilteredSteamIds.length > 0) {
        const itemCounts = await db.execute(sql`
            SELECT steamid, SUM(cnt) as total FROM (
                SELECT ${pistols.steamid} as steamid, COUNT(*) as cnt FROM ${pistols} WHERE ${pistols.steamid} IN (${sql.join(allFilteredSteamIds.map(id => sql`${id}`), sql`, `)}) GROUP BY ${pistols.steamid}
                UNION ALL
                SELECT ${rifles.steamid}, COUNT(*) FROM ${rifles} WHERE ${rifles.steamid} IN (${sql.join(allFilteredSteamIds.map(id => sql`${id}`), sql`, `)}) GROUP BY ${rifles.steamid}
                UNION ALL
                SELECT ${smgs.steamid}, COUNT(*) FROM ${smgs} WHERE ${smgs.steamid} IN (${sql.join(allFilteredSteamIds.map(id => sql`${id}`), sql`, `)}) GROUP BY ${smgs.steamid}
                UNION ALL
                SELECT ${heavys.steamid}, COUNT(*) FROM ${heavys} WHERE ${heavys.steamid} IN (${sql.join(allFilteredSteamIds.map(id => sql`${id}`), sql`, `)}) GROUP BY ${heavys.steamid}
                UNION ALL
                SELECT ${knives.steamid}, COUNT(*) FROM ${knives} WHERE ${knives.steamid} IN (${sql.join(allFilteredSteamIds.map(id => sql`${id}`), sql`, `)}) GROUP BY ${knives.steamid}
                UNION ALL
                SELECT ${gloves.steamid}, COUNT(*) FROM ${gloves} WHERE ${gloves.steamid} IN (${sql.join(allFilteredSteamIds.map(id => sql`${id}`), sql`, `)}) GROUP BY ${gloves.steamid}
                UNION ALL
                SELECT ${agents.steamid}, COUNT(*) FROM ${agents} WHERE ${agents.steamid} IN (${sql.join(allFilteredSteamIds.map(id => sql`${id}`), sql`, `)}) GROUP BY ${agents.steamid}
                UNION ALL
                SELECT ${music.steamid}, COUNT(*) FROM ${music} WHERE ${music.steamid} IN (${sql.join(allFilteredSteamIds.map(id => sql`${id}`), sql`, `)}) GROUP BY ${music.steamid}
                UNION ALL
                SELECT ${pins.steamid}, COUNT(*) FROM ${pins} WHERE ${pins.steamid} IN (${sql.join(allFilteredSteamIds.map(id => sql`${id}`), sql`, `)}) GROUP BY ${pins.steamid}
            ) as item_counts GROUP BY steamid
        `)
        itemCountMap = new Map()
        for (const row of itemCounts[0] as { steamid: string; total: number }[]) {
            itemCountMap.set(row.steamid, Number(row.total))
        }
    }

    // Sort filtered users
    if (sortBy) {
        const dir = sortDir === 'asc' ? 1 : -1
        filteredUsers.sort((a, b) => {
            let cmp = 0
            switch (sortBy) {
                case 'name': {
                    const nameA = (profileMap.get(a.steamid)?.personaname || a.steamid).toLowerCase()
                    const nameB = (profileMap.get(b.steamid)?.personaname || b.steamid).toLowerCase()
                    cmp = nameA.localeCompare(nameB)
                    break
                }
                case 'loadouts':
                    cmp = Number(a.loadoutCount) - Number(b.loadoutCount)
                    break
                case 'items':
                    cmp = (itemCountMap?.get(a.steamid) ?? 0) - (itemCountMap?.get(b.steamid) ?? 0)
                    break
                case 'lastActivity': {
                    const dateA = a.lastActivity ? new Date(a.lastActivity).getTime() : 0
                    const dateB = b.lastActivity ? new Date(b.lastActivity).getTime() : 0
                    cmp = dateA - dateB
                    break
                }
            }
            return cmp * dir
        })
    }

    const totalItems = filteredUsers.length

    // Apply pagination
    const paginatedUsers = filteredUsers.slice(offset, offset + limit)

    // Get item counts for each user in the paginated result
    const users: AdminUserListItem[] = await Promise.all(
        paginatedUsers.map(async (user) => {
            // If we already computed item counts for sorting, reuse them
            if (itemCountMap) {
                const profile = profileMap.get(user.steamid)
                return {
                    steamId: user.steamid,
                    personaName: profile?.personaname ?? null,
                    avatarFull: profile?.avatarfull ?? null,
                    loadoutCount: Number(user.loadoutCount),
                    totalItems: itemCountMap.get(user.steamid) ?? 0,
                    lastActivity: user.lastActivity,
                    isBanned: bannedSteamIds.has(user.steamid)
                }
            }

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

            const profile = profileMap.get(user.steamid)
            return {
                steamId: user.steamid,
                personaName: profile?.personaname ?? null,
                avatarFull: profile?.avatarfull ?? null,
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
        { search, bannedOnly, activeOnly, sortBy, sortDir },
        undefined,
        'Users fetched successfully'
    )
}, ADMIN_ERROR_CODES.USER_NOT_FOUND)
