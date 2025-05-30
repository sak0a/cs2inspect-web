// server/api/loadouts.ts
import { defineEventHandler, createError } from 'h3'
import { APIRequestLogger as Logger } from '~/server/utils/logger'
import { DBLoadout } from '~/server/utils/interfaces'
import {
    createLoadout,
    getLoadoutsBySteamId,
    updateLoadout, getLoadout, deleteLoadout, getLoadoutByName
} from "~/server/database/loadoutHelpers";


/**
 * Client uses the loadoutStore on the client side to interact with the loadouts API
 * loadout API fetches with the loadoutHelpers the data from the database
 */
export default defineEventHandler(async (event) => {
    const method = event.method
    const query = getQuery(event)

    Logger.header(`Loadouts API request: ${method} ${event.req.url}`)

    const steamId = query.steamId as string
    validateRequiredRequestData(steamId, 'Steam ID')

    if (method === 'GET') {
        const data: DBLoadout[] = await getLoadoutsBySteamId(steamId)
        Logger.success(`Loadouts fetched successfully.`)
        return { loadouts: data, message: 'Loadouts fetched successfully!' }
    }

    if (method === 'POST') {
        const body = await readBody(event)
        validateRequiredRequestData(body.name, 'Loadout Name')

        await createLoadout(steamId, body.name)
        Logger.success(`Loadout created successfully!`)

        const data: DBLoadout = await getLoadoutByName(steamId, body.name)
        Logger.success(`Loadout ${data.id} retrieved successfully for response`)

        return { loadout: data, message: 'Loadout created successfully' }
    }

    if (method === 'PUT') {
        const id = query.id as string
        validateRequiredRequestData(id, 'Loadout ID')

        const body = await readBody(event)
        validateRequiredRequestData(body.name, 'Loadout name')

        await updateLoadout(id, steamId, body.name)
        Logger.success(`Loadout ${id} updated successfully!`)

        const data = await getLoadout(id, steamId)
        Logger.success(`Loadout ${id} retrieved successfully for response`)

        return { loadout: data, message: 'Loadout updated successfully' }
    }

    if (method === 'DELETE') {
        const id = query.id as string
        validateRequiredRequestData(id, 'Loadout ID')

        await deleteLoadout(id, steamId)
        Logger.success(`Loadout ${id} deleted successfully!`)

        return { message: 'Loadout deleted successfully' }
    }

    Logger.error('Method not allowed')
    throw createError({
        statusCode: 405,
        message: 'Method not allowed'
    })
})