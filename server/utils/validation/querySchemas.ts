/**
 * Reusable Zod schemas for query parameter validation
 */

import { z } from 'zod'

// ============================================================================
// PRIMITIVE PARAM SCHEMAS
// ============================================================================

export const steamIdParam = z.string().min(1, 'steamId is required')
export const loadoutIdParam = z.coerce.number().int().positive('loadoutId must be a positive integer')
export const teamParam = z.coerce.number().int().min(1, 'team must be 1 or 2').max(2, 'team must be 1 or 2')
export const defindexParam = z.coerce.number().int().nonnegative('defindex must be non-negative')

// ============================================================================
// PAGINATION SCHEMA
// ============================================================================

export const paginationSchema = z.object({
    limit: z.coerce.number().int().min(1).max(100).default(20),
    offset: z.coerce.number().int().nonnegative().default(0),
})

// ============================================================================
// COMPOSITE SCHEMAS
// ============================================================================

/** Query schema for item endpoints needing steamId + loadoutId */
export const itemQuerySchema = z.object({
    steamId: steamIdParam,
    loadoutId: loadoutIdParam,
})

/** Query schema for item history endpoint */
export const itemHistoryQuerySchema = z.object({
    steamId: steamIdParam,
    loadoutId: loadoutIdParam,
    defindex: defindexParam,
    team: teamParam,
    category: z.string().optional(),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    offset: z.coerce.number().int().nonnegative().default(0),
})

/** Query schema for save item endpoints */
export const saveItemQuerySchema = z.object({
    steamId: steamIdParam,
    loadoutId: loadoutIdParam,
    type: z.string().optional(),
})

/** Query schema for endpoints needing only steamId */
export const steamIdQuerySchema = z.object({
    steamId: steamIdParam,
})
