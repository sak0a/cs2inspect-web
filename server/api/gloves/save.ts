import { defineEventHandler, createError } from 'h3'
import { executeQuery } from '~/server/database/database'
import { APIRequestLogger as Logger } from '~/server/utils/logger'
import {KnifeCustomization} from "~/server/utils/interfaces";

export default defineEventHandler(async (event) => {
  const query = getQuery(event)

  Logger.header(`Save glove request: ${event.method} ${event.req.url}`)

  const steamId = query.steamId as string
  validateRequiredRequestData(steamId, 'Steam ID')

  const loadoutId = query.loadoutId as string
  validateRequiredRequestData(loadoutId, 'Loadout ID')

  const body = await readBody(event) as KnifeCustomization
  validateRequiredRequestData(body, 'Body')

  try {
    validateRequiredRequestData(body.defindex, 'Defindex')

    if (body.paintIndex <= 0) {
      Logger.error('Invalid paint index ')
      throw createError({
        statusCode: 400,
        message: 'Invalid paint index'
      })
    }

    if (body.reset && body.reset === true) {
      await executeQuery<void>(
          `DELETE
                 FROM wp_player_gloves
                 WHERE steamid = ?
                   AND loadoutid = ?
                   AND defindex = ?
                   AND team = ?`,
          [steamId, loadoutId, body.defindex, body.team],
          'Failed to delete weapon'
      )

      Logger.success(`Glove deleted successfully`)
      return {
        success: true,
        message: 'Glove deleted successfully'
      }
    }

    // Handle both Terrorist and Counter-Terrorist knives
    const existingGlove = await executeQuery<DBKnife[]>(
        'SELECT * FROM wp_player_gloves WHERE steamid = ? AND loadoutid = ? AND team = ? AND defindex = ?',
        [steamId, loadoutId, body.team, body.defindex],
        'Failed to check if glove exists'
    );

    if (existingGlove.length > 0) {
      Logger.info('There is an existing glove')
      await executeQuery<void>(
          `UPDATE wp_player_gloves SET
                                            active = ?,
                                            paintindex = ?,
                                            paintseed = ?,
                                            paintwear = ?
                 WHERE steamid = ? AND loadoutid = ? AND team = ? AND defindex = ?`,
          [
            body.active,
            body.paintIndex,
            body.paintSeed,
            body.wear,
            steamId,
            loadoutId,
            body.team,
            body.defindex
          ],
          'Failed to update glove'
      );
      Logger.success('Glove updated successfully')
    } else {
      Logger.info('Creating a new Glove')
      await executeQuery<void>(
          `INSERT INTO wp_player_gloves (
                    steamid, loadoutid, active, team, defindex, paintindex, paintseed,
                    paintwear
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            steamId,
            loadoutId,
            body.active,
            body.team,
            body.defindex,
            body.paintIndex,
            body.paintSeed,
            body.wear
          ],
          'Failed to create glove'
      );
      Logger.success('Glove created successfully')
    }

    return {
      success: true,
      message: 'Gloves updated successfully'
    };
  } catch (error: any) {
    Logger.error(`Failed to save gloves: ${error.message}`)
    throw createError({
      statusCode: 500,
      message: 'Failed to save gloves'
    })
  }
});