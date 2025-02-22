import { defineEventHandler, createError } from 'h3'
import { executeQuery } from '~/server/database/database'
import { validateQueryParam, verifyUserAccess } from '~/server/utils/helpers'
import { APIRequestLogger as Logger } from '~/server/utils/logger'
import {KnifeCustomization} from "~/server/utils/interfaces";

export default defineEventHandler(async (event) => {
    const query = getQuery(event)

    Logger.header(`Save knife request: ${event.method} ${event.req.url}`)

    const steamId = query.steamId as string
    validateQueryParam(steamId, 'Steam ID')
    verifyUserAccess(steamId, event)

    const loadoutId = query.loadoutId as string
    validateQueryParam(loadoutId, 'Loadout ID')

    const body = await readBody(event)
    validateQueryParam(body, 'Body')

    try {
        const knife: KnifeCustomization = body;

        if (!knife.paintIndex || knife.paintIndex <= 0) {
            throw createError({
                statusCode: 400,
                message: 'Invalid paint index'
            })
        }

        // Handle both Terrorist and Counter-Terrorist knives
        const existingKnife = await executeQuery<DBKnife[]>(
            'SELECT * FROM wp_player_knifes WHERE steamid = ? AND loadoutid = ? AND team = ? AND defindex = ?',
            [steamId, loadoutId, knife.team, knife.defindex],
            'Failed to check if knife exists'
        );

        if (existingKnife.length > 0) {
            await executeQuery<void>(
                `UPDATE wp_player_knifes SET
                                            active = ?,
                                            paintindex = ?,
                                            paintseed = ?,
                                            paintwear = ?,
                                            stattrak_enabled = ?,
                                            stattrak_count = ?,
                                            nametag = ?
                 WHERE steamid = ? AND loadoutid = ? AND team = ? AND defindex = ?`,
                [
                    knife.active || false,
                    knife.paintIndex,
                    knife.pattern || 0,
                    knife.wear || 0,
                    knife.statTrak || false,
                    knife.statTrakCount || 0,
                    knife.nameTag || '',
                    steamId,
                    loadoutId,
                    knife.team,
                    knife.defindex
                ],
                'Failed to update knife'
            );
        } else {
            await executeQuery<void>(
                `INSERT INTO wp_player_knifes (
                    steamid, loadoutid, active, team, defindex, paintindex, paintseed,
                    paintwear, stattrak_enabled, stattrak_count, nametag
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    steamId,
                    loadoutId,
                    knife.active || true,
                    knife.team,
                    knife.defindex,
                    knife.paintIndex,
                    knife.pattern || 0,
                    knife.wear || 0,
                    knife.statTrak || false,
                    knife.statTrakCount || 0,
                    knife.nameTag || '',
                ],
                'Failed to create knife'
            );
        }
        return {
            success: true,
            message: 'Knifes updated successfully'
        };
    } catch (error: any) {
        Logger.error(`Failed to save knifes: ${error.message}`)
        throw createError({
            statusCode: 500,
            message: 'Failed to save knifes'
        })
    }
});