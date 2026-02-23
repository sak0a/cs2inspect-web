import { createError, getQuery, readBody } from 'h3'
import { eq, and } from 'drizzle-orm'
import { db } from '~/server/database/client'
import { loadouts } from '~/server/database/schema'
import { Logger } from '~/server/utils/logger'
import { validateRequiredRequestData } from '~/server/utils/helpers'
import { VALID_GLOVE_DEFINDEXES, VALID_KNIFE_DEFINDEXES } from "~/server/utils/constants";
import { toLoadoutId } from '~/types/core/common';
import { useErrorHandling, ErrorCodes } from '~/server/utils/errorHandler'
import { notifyPluginOfWebChange } from '~/server/utils/sync/notifySync'

type SelectionType = 'knife' | 'glove' | 'agent' | 'music' | 'pin'

export default useErrorHandling(async (event) => {
    const query = getQuery(event)

    Logger.header(`Select Loadout Item request: ${event.method} ${event.req.url}`)

    const steamId = query.steamId as string
    validateRequiredRequestData(steamId, 'Steam ID')

    const loadoutId = query.loadoutId as string
    validateRequiredRequestData(loadoutId, 'Loadout ID')

    const type = query.type as SelectionType
    validateRequiredRequestData(type, 'Type')

    if (type != 'knife' && type != 'glove' && type != 'agent' && type != 'music' && type != 'pin') {
        Logger.error(`Invalid selection type: ${type}`)
        throw createError({
            statusCode: 400,
            message: 'Invalid selection type.'
        })
    }

    const body = await readBody(event)
    const loadoutIdNum = toLoadoutId(loadoutId)

    // Music kits and pins don't require team selection
    if (type === 'music') {
        const musicid: number | null = body.musicid

        // For music kits, we directly update the loadout table using Drizzle
        await db.update(loadouts)
            .set({ selected_music: musicid })
            .where(and(eq(loadouts.id, loadoutIdNum), eq(loadouts.steamid, steamId)))

        Logger.success(`Updated music kit selection for loadout ${loadoutId}`)
        notifyPluginOfWebChange(steamId, loadoutIdNum, 'music').catch(() => {})
        return { message: `Updated music kit selection for loadout ${loadoutId}` }
    }

    if (type === 'pin') {
        const pinid: number | null = body.pinid

        try {
            // For pins, we directly update the loadout table using Drizzle
            await db.update(loadouts)
                .set({ selected_pin: pinid })
                .where(and(eq(loadouts.id, loadoutIdNum), eq(loadouts.steamid, steamId)))

            Logger.success(`Updated pin selection for loadout ${loadoutId}`)
            notifyPluginOfWebChange(steamId, loadoutIdNum, 'pin').catch(() => {})
            return { message: `Updated pin selection for loadout ${loadoutId}` }
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : String(error)
            // Check if the error is about missing column
            if (errorMessage.includes('Unknown column') && errorMessage.includes('selected_pin')) {
                Logger.error(`Database column 'selected_pin' does not exist. Database schema is out of date.`)
                throw createError({
                    statusCode: 500,
                    message: 'Database schema is out of date. Please contact the administrator to update the database schema.'
                })
            }
            // Re-throw other errors
            throw error
        }
    }

    // For other types (knife, glove, agent), continue with team-based selection
    const team: number = body.team

    validateRequiredRequestData(team, 'Team')
    if (team !== 1 && team !== 2) {
        throw createError({
            statusCode: 400,
            message: 'Invalid team.'
        })
    }

    const defindex: number = body.defindex

    if (type === 'knife') {
        if (defindex && !VALID_KNIFE_DEFINDEXES[defindex]) {
            throw createError({
                statusCode: 400,
                message: 'Invalid Knife Defindex'
            })
        }
    } else if (type === 'glove') {
        if (defindex && !VALID_GLOVE_DEFINDEXES[defindex]) {
            throw createError({
                statusCode: 400,
                message: 'Invalid Glove Defindex'
            })
        }
    }

    // Build the update object based on type and team
    const updateObj: Record<string, number | null> = {}
    if (type === 'knife') {
        if (team === 1) {
            updateObj.selected_knife_t = defindex
        } else {
            updateObj.selected_knife_ct = defindex
        }
    } else if (type === 'glove') {
        if (team === 1) {
            updateObj.selected_glove_t = defindex
        } else {
            updateObj.selected_glove_ct = defindex
        }
    } else if (type === 'agent') {
        if (team === 1) {
            updateObj.selected_agent_t = defindex
        } else {
            updateObj.selected_agent_ct = defindex
        }
    }

    await db.update(loadouts)
        .set(updateObj)
        .where(and(eq(loadouts.id, loadoutIdNum), eq(loadouts.steamid, steamId)))

    Logger.success(`Updated ${type} selection for loadout ${loadoutId}`)
    notifyPluginOfWebChange(steamId, loadoutIdNum, type).catch(() => {})
    return { message: `Updated ${type} selection for loadout ${loadoutId}` }
}, ErrorCodes.LOADOUT_SELECT_ERROR)
