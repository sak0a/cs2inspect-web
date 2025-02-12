// server/api/loadouts.ts
import { defineEventHandler, createError } from 'h3'
import { APIRequestLogger as Logger } from '~/server/utils/logger'
import { DBLoadout } from '~/server/utils/interfaces'
import { verifyUserAccess, validateSteamId } from '~/server/utils/helpers'
import {
    createLoadout,
    getLoadoutsBySteamId,
    updateLoadout, getLoadout, deleteLoadout, getLoadoutByName
} from "~/server/database/loadoutHelpers";
import {toJSON} from "flatted";


/**
 * Client uses the loadoutStore on the client side to interact with the loadouts API
 * loadout API fetches with the loadoutHelpers the datq from the database
 */
export default defineEventHandler(async (event) => {
    const method = event.req.method
    const query = getQuery(event)
    Logger.header(`Loadouts API request: ${method} ${event.req.url}`)
    try {
        // GET request - Fetch loadouts
        if (method === 'GET') {
            const steamId = query.steamId as string

            validateSteamId(steamId)
            verifyUserAccess(event, steamId)

            const data: DBLoadout[] = await getLoadoutsBySteamId(steamId)
            Logger.success(`Loadouts fetched for Steam ID: ${steamId}`)
            return { loadouts: data}
        }

        // POST request - Create loadout
        if (method === 'POST') {
            const steamId = query.steamId as string
            const body = await readBody(event)

            validateSteamId(steamId)
            verifyUserAccess(event, steamId)

            if (!body.name) {
                Logger.error('Loadout name is required')
                throw createError({
                    statusCode: 400,
                    message: 'Loadout name is required'
                })
            }

            await createLoadout(steamId, body.name)
            const data: DBLoadout = await getLoadoutByName(steamId, body.name)

            Logger.success(`Loadout created for Steam ID: ${steamId}, ID: ${data.id}, Name: ${data.name}`)
            return { loadout: data, message: 'Loadout created successfully' }
        }

        // PUT request - Update loadout
        if (method === 'PUT') {
            const steamId = query.steamId as string
            const id = query.id as string
            const body = await readBody(event)

            validateSteamId(steamId)
            verifyUserAccess(event, query.steamId as string)

            if (!id) {
                throw createError({
                    statusCode: 400,
                    message: 'Loadout ID is required'
                })
            }

            if (!body.name) {
                throw createError({
                    statusCode: 400,
                    message: 'Loadout name is required'
                })
            }

            await updateLoadout(id, steamId, body.name)
            const data = await getLoadout(id, steamId)

            Logger.success(`Loadout updated for Steam ID: ${steamId}, ID: ${id}`)
            return { loadout: data, message: 'Loadout updated successfully' }
        }

        if (method === 'DELETE') {
            const id = query.id as string
            const steamId = query.steamId as string

            validateSteamId(steamId)
            verifyUserAccess(event, steamId)

            if (!id) {
                throw createError({
                    statusCode: 400,
                    message: 'ID is required'
                })
            }

            await deleteLoadout(id, steamId)

            Logger.success(`Loadout deleted for Steam ID: ${steamId}, ID: ${id}`)
            return { message: 'Loadout deleted successfully' }
        }

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