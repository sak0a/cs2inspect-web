// server/api/loadouts.ts
import { defineEventHandler, createError } from 'h3'
import { APIRequestLogger as Logger } from '~/server/utils/logger'
import { DBLoadout } from '~/server/utils/interfaces'
import { verifyUserAccess, validateQueryParam} from '~/server/utils/helpers'
import {
    createLoadout,
    getLoadoutsBySteamId,
    updateLoadout, getLoadout, deleteLoadout, getLoadoutByName
} from "~/server/database/loadoutHelpers";


/**
 * Client uses the loadoutStore on the client side to interact with the loadouts API
 * loadout API fetches with the loadoutHelpers the datq from the database
 */
export default defineEventHandler(async (event) => {
    const method = event.method
    const query = getQuery(event)

    Logger.header(`Loadouts API request: ${method} ${event.req.url}`)

    const steamId = query.steamId as string
    validateQueryParam(steamId, 'Steam ID')
    verifyUserAccess(steamId, event)

    try {
        if (method === 'GET') {
            const data: DBLoadout[] = await getLoadoutsBySteamId(steamId)
            Logger.success(`Loadouts fetched for Steam ID: ${steamId}`)
            return { loadouts: data }
        }

        if (method === 'POST') {
            const body = await readBody(event)
            if (!body.name) {
                Logger.error('Loadout name is required')
                throw createError({
                    statusCode: 400,
                    message: 'Loadout name is required'
                })
            }

            await createLoadout(steamId, body.name)
            const data: DBLoadout = await getLoadoutByName(steamId, body.name)

            Logger.success(`Loadout created for Steam ID: ${steamId}`)
            return { loadout: data, message: 'Loadout created successfully' }
        }

        // PUT request - Update loadout
        if (method === 'PUT') {
            const id = query.id as string
            const body = await readBody(event)

            if (!id) {
                Logger.error('Loadout ID is required')
                throw createError({
                    statusCode: 400,
                    message: 'Loadout ID is required'
                })
            }

            if (!body.name) {
                Logger.error('Loadout name is required')
                throw createError({
                    statusCode: 400,
                    message: 'Loadout name is required'
                })
            }

            await updateLoadout(id, steamId, body.name)
            const data = await getLoadout(id, steamId)

            Logger.success(`Loadout updated for Steam ID: ${steamId}`)
            return { loadout: data, message: 'Loadout updated successfully' }
        }

        if (method === 'DELETE') {
            const id = query.id as string

            if (!id) {
                Logger.error('Loadout ID is required')
                throw createError({
                    statusCode: 400,
                    message: 'ID is required'
                })
            }

            await deleteLoadout(id, steamId)

            Logger.success(`Loadout deleted for Steam ID: ${steamId}`)
            return { message: 'Loadout deleted successfully' }
        }

        Logger.error('Method not allowed')
        throw createError({
            statusCode: 405,
            message: 'Method not allowed'
        })
    } catch (error) {
        Logger.error("Failed to process loadout operation: " + error)
        throw createError({
            statusCode: 500,
            message: 'Failed to process loadout operation'
        })
    }
})