/**
 * POST /api/items/history/snapshot
 *
 * Create an explicit snapshot (pinned version) of an item's configuration
 *
 * Body:
 * - steamId: string (required)
 * - loadoutId: number (required)
 * - itemType: 'weapon' | 'knife' | 'glove' (required)
 * - category: string (optional, for weapons: rifles, pistols, smgs, heavys)
 * - defindex: number (required)
 * - team: number (required)
 * - configuration: ItemHistorySnapshot (required)
 * - description: string (optional)
 */

import { createError, readBody } from 'h3'
import { db } from '~/server/database/client'
import { itemHistory } from '~/server/database/schema'
import { Logger } from '~/server/utils/logger'
import { generateVersionId } from '~/server/utils/versionIdGenerator'
import type {
  HistoryItemType,
  HistoryItemCategory,
  ItemHistorySnapshot,
} from '~/server/database/schema/itemHistory'

interface SnapshotRequestBody {
  steamId: string
  loadoutId: number
  itemType: HistoryItemType
  category?: HistoryItemCategory
  defindex: number
  team: number
  configuration: ItemHistorySnapshot
  description?: string
}

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody<SnapshotRequestBody>(event)

    // Validate required fields
    if (!body.steamId) {
      throw createError({
        statusCode: 400,
        message: 'steamId is required',
      })
    }

    if (!body.loadoutId || body.loadoutId <= 0) {
      throw createError({
        statusCode: 400,
        message: 'Valid loadoutId is required',
      })
    }

    if (!['weapon', 'knife', 'glove'].includes(body.itemType)) {
      throw createError({
        statusCode: 400,
        message: `Invalid itemType: ${body.itemType}. Must be weapon, knife, or glove.`,
      })
    }

    if (!body.defindex || body.defindex <= 0) {
      throw createError({
        statusCode: 400,
        message: 'Valid defindex is required',
      })
    }

    if (body.team !== 1 && body.team !== 2) {
      throw createError({
        statusCode: 400,
        message: 'Valid team (1 or 2) is required',
      })
    }

    if (!body.configuration) {
      throw createError({
        statusCode: 400,
        message: 'configuration is required',
      })
    }

    // Insert snapshot record
    const versionId = generateVersionId()
    await db.insert(itemHistory).values({
      steamid: body.steamId,
      loadoutid: body.loadoutId,
      item_type: body.itemType,
      item_category: body.itemType === 'weapon' ? body.category || null : null,
      defindex: body.defindex,
      team: body.team,
      configuration: body.configuration,
      change_type: 'initial_save',
      change_description: body.description || 'Manual snapshot',
      version_id: versionId,
      is_snapshot: 1,
    })

    Logger.success(
      `Created snapshot [${versionId}] for ${body.itemType} (defindex: ${body.defindex}, team: ${body.team})`
    )

    return {
      success: true,
      message: 'Snapshot created successfully',
    }
  } catch (error) {
    if (error instanceof Error && 'statusCode' in error) {
      throw error
    }

    Logger.error(
      `Failed to create snapshot: ${error instanceof Error ? error.message : String(error)}`
    )
    throw createError({
      statusCode: 500,
      message: 'Failed to create snapshot',
    })
  }
})
