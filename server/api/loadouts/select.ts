// server/api/loadout/select.ts
import { defineEventHandler, createError } from 'h3'
import { executeQuery } from '~/server/database/database'
import { APIRequestLogger as Logger } from '~/server/utils/logger'

type SelectionType = 'knife' | 'glove'

interface SelectionFields {
    t: string;
    ct: string;
}

const SELECTION_FIELDS: Record<SelectionType, SelectionFields> = {
    knife: {
        t: 'selected_knife_t',
        ct: 'selected_knife_ct'
    },
    glove: {
        t: 'selected_glove_t',
        ct: 'selected_glove_ct'
    }
}

export default defineEventHandler(async (event) => {
    const query = getQuery(event)

    Logger.header(`Select Loadout Item request: ${event.method} ${event.req.url}`)

    const steamId = query.steamId as string
    validateRequiredRequestData(steamId, 'Steam ID')

    const loadoutId = query.loadoutId as string
    validateRequiredRequestData(loadoutId, 'Loadout ID')

    const type = query.type as SelectionType
    validateRequiredRequestData(type, 'Type')

    if (!SELECTION_FIELDS[type]) {
        Logger.error(`Invalid selection type: ${type}`)
        throw createError({
            statusCode: 400,
            message: 'Invalid selection type. Must be "knife" or "glove"'
        })
    }

    const body = await readBody(event)
    validateRequiredRequestData(body, 'Body')

    try {
        const { team, defindex } = body

        validateRequiredRequestData(team, 'Team')
        if (team !== 1 && team !== 2 && team !== 0) {
            throw createError({
                statusCode: 400,
                message: 'Invalid team. Must be 0, 1 or 2'
            })
        }

        validateRequiredRequestData(defindex, 'Defindex')

        // Get the correct field to update based on type and team
        const updateField = team === 1
            ? SELECTION_FIELDS[type].t
            : SELECTION_FIELDS[type].ct

        const updateValue = defindex || null // Use null if no defindex provided

        await executeQuery<void>(
            `UPDATE wp_player_loadouts 
             SET ${updateField} = ?
             WHERE id = ? AND steamid = ?`,
            [updateValue, loadoutId, steamId],
            `Failed to update selected ${type}`
        )

        Logger.success(`Updated ${team.toString().toUpperCase()} ${type} selection for loadout ${loadoutId}`)
        return {
            success: true,
            message: `Successfully updated ${team.toString().toUpperCase()} side ${type} selection`
        }
    } catch (error: any) {
        Logger.error(`Failed to update ${type} selection: ${error.message}`)
        throw createError({
            statusCode: 500,
            message: error.message || `Failed to update ${type} selection`
        })
    }
})