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

import { createError, getRouterParam } from 'h3'
import { db } from '~/server/database/client'
import { itemHistory } from '~/server/database/schema'
import { eq, and, desc } from 'drizzle-orm'
import { Logger } from '~/server/utils/logger'
import type { HistoryItemType, HistoryItemCategory } from '~/server/database/schema/itemHistory'
import { toSteamId, toLoadoutId, toDefindex, toTeamId } from '~/types/core/branded'
import {
    createPaginatedResponse,
    createPaginationMeta,
    createResponseMeta,
} from '~/server/utils/api/responseHelpers'
import { parseQueryWithSchema } from '~/server/utils/validation/zodHelpers'
import { itemHistoryQuerySchema } from '~/server/utils/validation/querySchemas'

export default defineEventHandler(async (event) => {
    try {
        const startTime = Date.now()
        const itemType = getRouterParam(event, 'itemType') as HistoryItemType

        // Validate item type
        if (!['weapon', 'knife', 'glove'].includes(itemType)) {
            throw createError({
                statusCode: 400,
                message: `Invalid item type: ${itemType}. Must be weapon, knife, or glove.`,
            })
        }

        // Validate query parameters with Zod
        const params = parseQueryWithSchema(itemHistoryQuerySchema, event)
        const { limit, offset } = params
        const category = params.category as HistoryItemCategory | undefined

        // Convert to branded types
        const steamId = toSteamId(params.steamId)
        const loadoutId = toLoadoutId(params.loadoutId)
        const defindex = toDefindex(params.defindex)
        const team = toTeamId(params.team)

        // Build query conditions
        const conditions = [
            eq(itemHistory.steamid, steamId),
            eq(itemHistory.loadoutid, loadoutId),
            eq(itemHistory.item_type, itemType),
            eq(itemHistory.defindex, defindex),
            eq(itemHistory.team, team),
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
        const currentPage = Math.floor(offset / limit) + 1

        Logger.info(
            `Fetched ${records.length} history records for ${itemType} (defindex: ${defindex}, team: ${team})`
        )

        const meta = createResponseMeta(startTime, { itemType, defindex, team })
        const pagination = createPaginationMeta(currentPage, totalCount, limit, records.length)

        return createPaginatedResponse(records, pagination, meta)
    } catch (error) {
        if (error instanceof Error && 'statusCode' in error) {
            throw error
        }

        Logger.error(
            `Failed to fetch item history: ${error instanceof Error ? error.message : String(error)}`
        )
        throw createError({
            statusCode: 500,
            message: 'Failed to fetch item history',
        })
    }
})
