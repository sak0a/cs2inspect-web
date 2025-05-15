import { defineEventHandler, createError } from 'h3'
import { executeQuery } from '~/server/database/database'
import { APIRequestLogger as Logger } from '~/server/utils/logger'
import {VALID_GLOVE_DEFINDEXES, VALID_KNIFE_DEFINDEXES} from "~/server/utils/constants";

type SelectionType = 'knife' | 'glove' | 'agent'

export default defineEventHandler(async (event) => {
    const query = getQuery(event)

    Logger.header(`Select Loadout Item request: ${event.method} ${event.req.url}`)

    const steamId = query.steamId as string
    validateRequiredRequestData(steamId, 'Steam ID')

    const loadoutId = query.loadoutId as string
    validateRequiredRequestData(loadoutId, 'Loadout ID')

    const type = query.type as SelectionType
    validateRequiredRequestData(type, 'Type')

    if (type != 'knife' && type != 'glove' && type != 'agent') {
        Logger.error(`Invalid selection type: ${type}`)
        throw createError({
            statusCode: 400,
            message: 'Invalid selection type.'
        })
    }

    const body = await readBody(event)

    const team: number = body.team

    validateRequiredRequestData(team, 'Team')
    if (team !== 1 && team !== 2) {
        throw createError({
            statusCode: 400,
            message: 'Invalid team.'
        })
    }

    const defindex: number = body.defindex

    const updateField = team === 1
        ? "selected_" + type + "_t"
        : "selected_" + type + "_ct"

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

    await executeQuery<void>(
        `UPDATE wp_player_loadouts
             SET ${updateField} = ?
             WHERE id = ? AND steamid = ?`,
        [defindex, loadoutId, steamId],
        `Failed to update selected ${type}`
    )
    Logger.success(`Updated ${type} selection for loadout ${loadoutId}`)
    return { message: `Updated ${type} selection for loadout ${loadoutId}` }
})