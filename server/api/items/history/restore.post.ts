/**
 * POST /api/items/history/restore
 *
 * Restore an item to a previous version from history
 *
 * Body:
 * - historyId: number (required) - The ID of the history record to restore
 * - steamId: string (required) - Must match the history record owner
 */

import { createError, readBody } from 'h3'
import { db } from '~/server/database/client'
import { itemHistory, pistols, rifles, smgs, heavys, knives, gloves } from '~/server/database/schema'
import { eq, and } from 'drizzle-orm'
import { Logger } from '~/server/utils/logger'
import { toLoadoutId } from '~/types/core/common'
import { generateVersionId } from '~/server/utils/versionIdGenerator'
import type { ItemHistorySnapshot, HistoryItemCategory } from '~/server/database/schema/itemHistory'
import type { StickerJSON, KeychainJSON } from '~/server/types/jsonSchemas'

interface RestoreRequestBody {
  historyId: number
  steamId: string
}

// Map category to table
const weaponTableMap = {
  pistols,
  rifles,
  smgs,
  heavys
} as const

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody<RestoreRequestBody>(event)

    // Validate required fields
    if (!body.historyId || body.historyId <= 0) {
      throw createError({
        statusCode: 400,
        message: 'Valid historyId is required'
      })
    }

    if (!body.steamId) {
      throw createError({
        statusCode: 400,
        message: 'steamId is required'
      })
    }

    // Fetch the history record
    const historyRecords = await db
      .select()
      .from(itemHistory)
      .where(eq(itemHistory.id, body.historyId))
      .limit(1)

    if (historyRecords.length === 0) {
      throw createError({
        statusCode: 404,
        message: 'History record not found'
      })
    }

    const record = historyRecords[0]!

    // Verify ownership
    if (record.steamid !== body.steamId) {
      throw createError({
        statusCode: 403,
        message: 'You do not have permission to restore this item'
      })
    }

    const config = record.configuration as ItemHistorySnapshot
    const loadoutIdNum = toLoadoutId(String(record.loadoutid))

    // Restore based on item type
    if (record.item_type === 'weapon') {
      const category = record.item_category as HistoryItemCategory
      if (!category || !(category in weaponTableMap)) {
        throw createError({
          statusCode: 400,
          message: 'Invalid weapon category'
        })
      }

      const table = weaponTableMap[category as keyof typeof weaponTableMap]

      // Helper to validate sticker - must have a valid id (handle both number and string IDs)
      const getSticker = (sticker: unknown): StickerJSON | null => {
        if (!sticker || typeof sticker !== 'object') return null
        const s = sticker as Record<string, unknown>
        const id = typeof s.id === 'string' ? parseInt(s.id, 10) : s.id
        if (!id || typeof id !== 'number' || isNaN(id) || id === 0) return null
        // Return with normalized numeric ID
        return {
          id: id,
          x: typeof s.x === 'number' ? s.x : 0,
          y: typeof s.y === 'number' ? s.y : 0,
          wear: typeof s.wear === 'number' ? s.wear : 0,
          scale: typeof s.scale === 'number' ? s.scale : 1,
          rotation: typeof s.rotation === 'number' ? s.rotation : 0
        } as StickerJSON
      }

      // Helper to validate keychain - must have a valid id (handle both number and string IDs)
      const getKeychain = (keychain: unknown): KeychainJSON | null => {
        if (!keychain || typeof keychain !== 'object') return null
        const k = keychain as Record<string, unknown>
        const id = typeof k.id === 'string' ? parseInt(k.id, 10) : k.id
        if (!id || typeof id !== 'number' || isNaN(id) || id === 0) return null
        // Return with normalized values
        return {
          id: id,
          x: typeof k.x === 'number' ? k.x : 0,
          y: typeof k.y === 'number' ? k.y : 0,
          z: typeof k.z === 'number' ? k.z : 0,
          seed: typeof k.seed === 'number' ? k.seed : 0
        } as KeychainJSON
      }

      await db.update(table)
        .set({
          active: config.active ? 1 : 0,
          paintindex: config.paintindex,
          paintseed: config.paintseed,
          paintwear: config.paintwear,
          stattrak_enabled: config.stattrak_enabled ? 1 : 0,
          stattrak_count: config.stattrak_count ?? 0,
          nametag: config.nametag ?? null,
          sticker_0: getSticker(config.stickers?.[0]),
          sticker_1: getSticker(config.stickers?.[1]),
          sticker_2: getSticker(config.stickers?.[2]),
          sticker_3: getSticker(config.stickers?.[3]),
          sticker_4: getSticker(config.stickers?.[4]),
          keychain: getKeychain(config.keychain)
        })
        .where(and(
          eq(table.steamid, record.steamid),
          eq(table.loadoutid, loadoutIdNum),
          eq(table.defindex, record.defindex),
          eq(table.team, record.team)
        ))

      Logger.success(`Restored weapon to version ${body.historyId}`)
    } else if (record.item_type === 'knife') {
      await db.update(knives)
        .set({
          active: config.active ? 1 : 0,
          paintindex: config.paintindex,
          paintseed: config.paintseed,
          paintwear: config.paintwear,
          stattrak_enabled: config.stattrak_enabled ? 1 : 0,
          stattrak_count: config.stattrak_count || 0,
          nametag: config.nametag || null
        })
        .where(and(
          eq(knives.steamid, record.steamid),
          eq(knives.loadoutid, loadoutIdNum),
          eq(knives.defindex, record.defindex),
          eq(knives.team, record.team)
        ))

      Logger.success(`Restored knife to version ${body.historyId}`)
    } else if (record.item_type === 'glove') {
      await db.update(gloves)
        .set({
          active: config.active ? 1 : 0,
          paintindex: config.paintindex,
          paintseed: config.paintseed,
          paintwear: config.paintwear
        })
        .where(and(
          eq(gloves.steamid, record.steamid),
          eq(gloves.loadoutid, loadoutIdNum),
          eq(gloves.defindex, record.defindex),
          eq(gloves.team, record.team)
        ))

      Logger.success(`Restored glove to version ${body.historyId}`)
    }

    // Record the restore as a new history entry
    const versionId = generateVersionId()
    await db.insert(itemHistory).values({
      steamid: record.steamid,
      loadoutid: record.loadoutid,
      item_type: record.item_type,
      item_category: record.item_category,
      defindex: record.defindex,
      team: record.team,
      configuration: config,
      change_type: 'reset',
      change_description: `Restored to ${record.version_id}`,
      version_id: versionId,
      is_snapshot: 0
    })

    return {
      success: true,
      message: 'Item restored successfully',
      restoredConfiguration: config
    }
  } catch (error) {
    if (error instanceof Error && 'statusCode' in error) {
      throw error
    }

    Logger.error(`Failed to restore item: ${error instanceof Error ? error.message : String(error)}`)
    throw createError({
      statusCode: 500,
      message: 'Failed to restore item'
    })
  }
})
