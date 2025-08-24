import { defineEventHandler, createError } from 'h3'
import { executeQuery } from '~/server/database/database'
import { APIRequestLogger as Logger } from '~/server/utils/logger'
import { DBPin } from '~/server/utils/interfaces'

export default defineEventHandler(async (event) => {
    const query = getQuery(event)
    
    Logger.header(`Pins API request: ${event.method} ${event.req.url}`)
    
    const steamId = query.steamId as string
    validateRequiredRequestData(steamId, 'Steam ID')
    
    const loadoutId = query.loadoutId as string
    validateRequiredRequestData(loadoutId, 'Loadout ID')
    
    try {
        const pins = await executeQuery<DBPin[]>(
            'SELECT * FROM wp_player_pins WHERE steamid = ? AND loadoutid = ?',
            [steamId, loadoutId],
            'Failed to fetch pins'
        )
        
        return {
            pins,
            meta: {
                rows: pins.length,
                steamId,
                loadoutId
            }
        }
    } catch (error: any) {
        Logger.error(`Error fetching pins: ${error.message}`)
        throw createError({
            statusCode: 500,
            message: error.message
        })
    }
})
