import { defineEventHandler, createError } from 'h3'
import { APIRequestLogger as Logger } from '~/server/utils/logger'
import { DBKnife, IEnhancedItem, APISkin, IDefaultItem } from "~/server/utils/interfaces"
import { getSkinsData } from '~/server/utils/csgoAPI'
import { executeQuery } from '~/server/database/database'
import { DEFAULT_GLOVES } from '~/server/utils/constants'


export default defineEventHandler(async (event) => {
  Logger.header(`Gloves API request: ${event.method} ${event.req.url}`);

  const query = getQuery(event);

  const steamId = query.steamId as string;
  validateRequiredRequestData(steamId, 'Steam ID');

  const loadoutId = query.loadoutId as string;
  validateRequiredRequestData(loadoutId, 'Loadout ID');

  try {
    const skinData = getSkinsData();

    Logger.info(`Fetching gloves for Steam ID: ${steamId}`);
    const gloves = await executeQuery<any[]>(
        'SELECT * FROM wp_player_gloves WHERE steamid = ? AND loadoutid = ?',
        [steamId, loadoutId],
        'Failed to fetch gloves'
    );

    const gloveSkins: APISkin[] = skinData.filter(skin =>
        skin.weapon?.id.includes('glove')
    );

    // Map through default gloves and enhance them with skin data
    const enhancedGloves = DEFAULT_GLOVES.map((baseGlove: IDefaultItem) => {

      // Find the database entries for these gloves if they exist
      const matchingDatabaseResults: DBGlove[] = gloves.filter(
          (glove: DBGlove) => glove.defindex === baseGlove.weapon_defindex
      );

      let data: IEnhancedItem[] = [];

      // Process each database result for this glove type
      for (const databaseResult of matchingDatabaseResults) {
        const skinInfo = gloveSkins.find(skin =>
          Number(skin.paint_index) === databaseResult.paintindex
        );

        data.push({
          weapon_defindex: baseGlove.weapon_defindex,
          weapon_name: baseGlove.weapon_name,
          name: skinInfo?.name || baseGlove.defaultName,
          defaultName: baseGlove.defaultName,

          image: skinInfo?.image || baseGlove.defaultImage,
          defaultImage: baseGlove.defaultImage,

          category: 'glove',
          minFloat: skinInfo?.min_float || 0,
          maxFloat: skinInfo?.max_float || 1,
          paintIndex: skinInfo?.paint_index || baseGlove.paintIndex,
          rarity: skinInfo?.rarity,
          availableTeams: 'both',
          databaseInfo: databaseResult
        } as IEnhancedItem);
      }

      // If there are any custom skins for these gloves, return them
      if (data.length > 0) {
        return data;
      }

      // If no custom skins found, return the default gloves
      return createDefaultEnhancedWeapon(baseGlove, false, true);
    });

    Logger.success(`Fetched ${gloves.length} gloves for Steam ID: ${steamId}`);
    return {
      gloves: enhancedGloves,
      meta: {
        rows: gloves.length,
        steamId,
        loadoutId
      }
    };

  } catch (error: any) {
    Logger.error('Failed to fetch gloves: ' + error.message);
    throw createError({
      statusCode: 500,
      message: error.message || 'Failed to fetch gloves'
    });
  }
});