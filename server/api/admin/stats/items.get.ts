/**
 * GET /api/admin/stats/items
 *
 * Returns item statistics for the admin dashboard:
 * - Item counts broken down by category (weapons, knives, gloves, agents, musicKits, pins)
 * - Detailed weapon breakdown (pistols, rifles, smgs, heavys)
 * - Total items across all categories
 */
import { createError } from 'h3'
import { useErrorHandling } from '~/server/utils/errorHandler'
import { createSuccessResponse, createResponseMeta } from '~/server/utils/api/responseHelpers'
import { ADMIN_ERROR_CODES } from '~/server/utils/constants'
import {
    countItemsByCategory,
    getWeaponBreakdown,
    type ItemCategoryCount
} from '~/server/utils/admin/statsQueries'

export interface WeaponBreakdown {
    pistols: number
    rifles: number
    smgs: number
    heavys: number
}

export interface AdminItemStats {
    categories: ItemCategoryCount
    weaponBreakdown: WeaponBreakdown
    totalItems: number
}

export default useErrorHandling(async (event) => {
    const startTime = Date.now()

    // Verify admin access
    if (!event.context.admin) {
        throw createError({
            statusCode: 403,
            message: 'Admin access required'
        })
    }

    // Fetch item statistics in parallel
    const [categories, weaponBreakdown] = await Promise.all([
        countItemsByCategory(),
        getWeaponBreakdown()
    ])

    // Calculate total items
    const totalItems = categories.weapons +
        categories.knives +
        categories.gloves +
        categories.agents +
        categories.musicKits +
        categories.pins

    const stats: AdminItemStats = {
        categories,
        weaponBreakdown,
        totalItems
    }

    const meta = createResponseMeta(startTime, {
        adminSteamId: event.context.admin.steamId,
        endpoint: 'admin/stats/items'
    })

    return createSuccessResponse(stats, meta, 'Item stats fetched successfully')
}, ADMIN_ERROR_CODES.STATS_ERROR)
