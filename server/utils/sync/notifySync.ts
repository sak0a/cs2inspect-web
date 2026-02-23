import { db } from '~/server/database/client'
import { syncNotifications } from '~/server/database/schema/syncNotifications'
import { Logger } from '~/server/utils/logger'

export type SyncItemType = 'knife' | 'glove' | 'weapon' | 'agent' | 'music' | 'pin' | 'loadout'
export type SyncItemCategory = 'rifles' | 'pistols' | 'smgs' | 'heavys' | null

/**
 * Insert a sync notification so the plugin knows the web changed something.
 * Fire-and-forget: a failure here should NOT block the save response.
 */
export async function notifyPluginOfWebChange(
    steamId: string,
    loadoutId: number,
    itemType: SyncItemType,
    itemCategory?: SyncItemCategory
): Promise<void> {
    try {
        await db.insert(syncNotifications).values({
            steamid: steamId,
            loadoutid: loadoutId,
            source: 'web',
            item_type: itemType,
            item_category: itemCategory ?? null,
        })
    } catch (error) {
        Logger.error(`Failed to insert sync notification: ${error instanceof Error ? error.message : error}`)
    }
}
