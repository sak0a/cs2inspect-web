/**
 * DELETE /api/admin/users/:steamId
 * Deletes all user data including loadouts and all items
 * Requires superadmin role
 */
import { createError } from 'h3'
import { eq, sql } from 'drizzle-orm'
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
    adminActivityLog
} from '~/server/database/schema'
import {
    createSuccessResponse,
    createResponseMeta
} from '~/server/utils/api/responseHelpers'
import { useErrorHandling } from '~/server/utils/errorHandler'
import { ADMIN_ERROR_CODES } from '~/server/utils/constants'
import { Logger } from '~/server/utils/logger'

interface DeletedCounts {
    loadouts: number
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

export default useErrorHandling(async (event) => {
    const startTime = Date.now()

    // Check admin authentication
    if (!event.context.admin) {
        throw createError({
            statusCode: 403,
            message: 'Admin access required'
        })
    }

    // Check superadmin role
    if (event.context.admin.role !== 'superadmin') {
        throw createError({
            statusCode: 403,
            message: 'Superadmin access required to delete user data'
        })
    }

    const steamId = event.context.params?.steamId as string
    if (!steamId) {
        throw createError({
            statusCode: 400,
            message: 'Steam ID is required'
        })
    }

    Logger.header(`Admin Delete User Data DELETE request: ${steamId}`)

    const db = useDatabase()

    // Verify user exists
    const [userExists] = await db
        .select({ count: sql<number>`COUNT(*)` })
        .from(loadouts)
        .where(eq(loadouts.steamid, steamId))

    if (!userExists || Number(userExists.count) === 0) {
        throw createError({
            statusCode: 404,
            message: `User with Steam ID ${steamId} not found`
        })
    }

    // Count items before deletion for reporting
    const counts: DeletedCounts = {
        loadouts: 0,
        pistols: 0,
        rifles: 0,
        smgs: 0,
        heavys: 0,
        knives: 0,
        gloves: 0,
        agents: 0,
        music: 0,
        pins: 0,
        total: 0
    }

    // Get counts before deletion
    const [pistolCount] = await db
        .select({ count: sql<number>`COUNT(*)` })
        .from(pistols)
        .where(eq(pistols.steamid, steamId))
    counts.pistols = Number(pistolCount?.count || 0)

    const [rifleCount] = await db
        .select({ count: sql<number>`COUNT(*)` })
        .from(rifles)
        .where(eq(rifles.steamid, steamId))
    counts.rifles = Number(rifleCount?.count || 0)

    const [smgCount] = await db
        .select({ count: sql<number>`COUNT(*)` })
        .from(smgs)
        .where(eq(smgs.steamid, steamId))
    counts.smgs = Number(smgCount?.count || 0)

    const [heavyCount] = await db
        .select({ count: sql<number>`COUNT(*)` })
        .from(heavys)
        .where(eq(heavys.steamid, steamId))
    counts.heavys = Number(heavyCount?.count || 0)

    const [knifeCount] = await db
        .select({ count: sql<number>`COUNT(*)` })
        .from(knives)
        .where(eq(knives.steamid, steamId))
    counts.knives = Number(knifeCount?.count || 0)

    const [gloveCount] = await db
        .select({ count: sql<number>`COUNT(*)` })
        .from(gloves)
        .where(eq(gloves.steamid, steamId))
    counts.gloves = Number(gloveCount?.count || 0)

    const [agentCount] = await db
        .select({ count: sql<number>`COUNT(*)` })
        .from(agents)
        .where(eq(agents.steamid, steamId))
    counts.agents = Number(agentCount?.count || 0)

    const [musicCount] = await db
        .select({ count: sql<number>`COUNT(*)` })
        .from(music)
        .where(eq(music.steamid, steamId))
    counts.music = Number(musicCount?.count || 0)

    const [pinCount] = await db
        .select({ count: sql<number>`COUNT(*)` })
        .from(pins)
        .where(eq(pins.steamid, steamId))
    counts.pins = Number(pinCount?.count || 0)

    const [loadoutCount] = await db
        .select({ count: sql<number>`COUNT(*)` })
        .from(loadouts)
        .where(eq(loadouts.steamid, steamId))
    counts.loadouts = Number(loadoutCount?.count || 0)

    // Delete items from all tables
    // Note: Items have foreign key constraints with ON DELETE CASCADE to loadouts,
    // but we delete them explicitly first for accurate counting

    await db.delete(pistols).where(eq(pistols.steamid, steamId))
    await db.delete(rifles).where(eq(rifles.steamid, steamId))
    await db.delete(smgs).where(eq(smgs.steamid, steamId))
    await db.delete(heavys).where(eq(heavys.steamid, steamId))
    await db.delete(knives).where(eq(knives.steamid, steamId))
    await db.delete(gloves).where(eq(gloves.steamid, steamId))
    await db.delete(agents).where(eq(agents.steamid, steamId))
    await db.delete(music).where(eq(music.steamid, steamId))
    await db.delete(pins).where(eq(pins.steamid, steamId))

    // Delete loadouts last (they are the parent records)
    await db.delete(loadouts).where(eq(loadouts.steamid, steamId))

    // Calculate total deleted items
    counts.total =
        counts.pistols +
        counts.rifles +
        counts.smgs +
        counts.heavys +
        counts.knives +
        counts.gloves +
        counts.agents +
        counts.music +
        counts.pins +
        counts.loadouts

    // Log admin action
    await db.insert(adminActivityLog).values({
        admin_steamid: event.context.admin.steamId,
        action: 'delete_user_data',
        target_steamid: steamId,
        details: {
            deletedCounts: counts
        }
    })

    Logger.success(`User data for ${steamId} deleted by superadmin ${event.context.admin.steamId}`)

    const meta = createResponseMeta(startTime, {
        adminSteamId: event.context.admin.steamId,
        method: 'DELETE',
        action: 'delete_user_data',
        targetSteamId: steamId
    })

    return createSuccessResponse(
        {
            steamId,
            deletedCounts: counts
        },
        meta,
        `All data for user ${steamId} has been deleted successfully`
    )
}, ADMIN_ERROR_CODES.USER_NOT_FOUND)
