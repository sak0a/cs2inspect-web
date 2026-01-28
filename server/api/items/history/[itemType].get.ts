/**
 * GET /api/items/history/[itemType]
 *
 * Fetch history for a specific item (weapon, knife, or glove)
 *
 * Query parameters:
 * - steamId: string (required)
 * - loadoutId: number (required)
 * - defindex: number (required)
 * - team: number (required)
 * - category: string (optional, for weapons: rifles, pistols, smgs, heavys)
 * - limit: number (optional, default 20)
 * - offset: number (optional, default 0)
 */

import { createError, getQuery, getRouterParam } from 'h3'
import { db } from '~/server/database/client'
import { itemHistory } from '~/server/database/schema'
import { eq, and, desc } from 'drizzle-orm'
import { Logger } from '~/server/utils/logger'
import type { HistoryItemType, HistoryItemCategory } from '~/server/database/schema/itemHistory'

export default defineEventHandler(async (event) => {
  try {
    const itemType = getRouterParam(event, 'itemType') as HistoryItemType

    // Validate item type
    if (!['weapon', 'knife', 'glove'].includes(itemType)) {
      throw createError({
        statusCode: 400,
        message: `Invalid item type: ${itemType}. Must be weapon, knife, or glove.`
      })
    }

    const query = getQuery(event)

    // Validate required parameters
    const steamId = query.steamId as string
    const loadoutId = Number(query.loadoutId)
    const defindex = Number(query.defindex)
    const team = Number(query.team)
    const category = query.category as HistoryItemCategory | undefined
    const limit = Math.min(Number(query.limit) || 20, 100) // Max 100
    const offset = Number(query.offset) || 0

    if (!steamId) {
      throw createError({
        statusCode: 400,
        message: 'steamId is required'
      })
    }

    if (isNaN(loadoutId) || loadoutId <= 0) {
      throw createError({
        statusCode: 400,
        message: 'Valid loadoutId is required'
      })
    }

    if (isNaN(defindex) || defindex <= 0) {
      throw createError({
        statusCode: 400,
        message: 'Valid defindex is required'
      })
    }

    if (isNaN(team) || (team !== 1 && team !== 2)) {
      throw createError({
        statusCode: 400,
        message: 'Valid team (1 or 2) is required'
      })
    }

    // Build query conditions
    const conditions = [
      eq(itemHistory.steamid, steamId),
      eq(itemHistory.loadoutid, loadoutId),
      eq(itemHistory.item_type, itemType),
      eq(itemHistory.defindex, defindex),
      eq(itemHistory.team, team)
    ]

    // Add category filter for weapons
    if (itemType === 'weapon' && category) {
      conditions.push(eq(itemHistory.item_category, category))
    }

    // Fetch history records
    const records = await db
      .select()
      .from(itemHistory)
      .where(and(...conditions))
      .orderBy(desc(itemHistory.created_at))
      .limit(limit)
      .offset(offset)

    // Get total count for pagination
    const countResult = await db
      .select({ count: itemHistory.id })
      .from(itemHistory)
      .where(and(...conditions))

    const totalCount = countResult.length

    Logger.info(`Fetched ${records.length} history records for ${itemType} (defindex: ${defindex}, team: ${team})`)

    return {
      success: true,
      data: records,
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: offset + records.length < totalCount
      }
    }
  } catch (error) {
    if (error instanceof Error && 'statusCode' in error) {
      throw error
    }

    Logger.error(`Failed to fetch item history: ${error instanceof Error ? error.message : String(error)}`)
    throw createError({
      statusCode: 500,
      message: 'Failed to fetch item history'
    })
  }
})
