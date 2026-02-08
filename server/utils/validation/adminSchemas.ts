/**
 * Admin Panel Validation Schemas
 *
 * Zod schemas for validating admin API requests
 */
import { z } from 'zod';

// ============================================================================
// USER MANAGEMENT SCHEMAS
// ============================================================================

/**
 * Schema for banning a user
 */
export const adminBanUserSchema = z.object({
    reason: z.string().min(1, 'Reason is required').max(500, 'Reason must be 500 characters or less'),
    duration: z.number().int().positive().optional(), // hours, undefined = permanent
});

/**
 * Schema for searching users
 */
export const adminUserSearchSchema = z.object({
    search: z.string().optional(),
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    bannedOnly: z.preprocess(
        (val) => val === 'true' || val === '1' || val === true,
        z.boolean().optional()
    ),
});

// ============================================================================
// SETTINGS SCHEMAS
// ============================================================================

/**
 * Schema for updating a setting
 */
export const adminUpdateSettingSchema = z.object({
    key: z.string().min(1).max(64),
    value: z.union([z.string(), z.number(), z.boolean()]),
});

// ============================================================================
// ADMIN MANAGEMENT SCHEMAS
// ============================================================================

/**
 * Schema for adding a new admin
 */
export const adminAddAdminSchema = z.object({
    steamId: z.string().min(1).max(64),
    role: z.enum(['admin', 'superadmin']),
});

// ============================================================================
// ACTIVITY LOG SCHEMAS
// ============================================================================

/**
 * Schema for querying activity log
 */
export const adminActivityLogQuerySchema = z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().min(1).max(100).default(50),
    action: z.string().optional(),
});

// ============================================================================
// STATS SCHEMAS
// ============================================================================

/**
 * Schema for activity data range query
 */
export const adminActivityRangeSchema = z.object({
    range: z.enum(['7d', '30d', '90d']).default('7d'),
});

/**
 * Schema for top users query
 */
export const adminTopUsersSchema = z.object({
    limit: z.coerce.number().int().min(1).max(100).default(10),
});

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type AdminBanUserInput = z.infer<typeof adminBanUserSchema>;
export type AdminUserSearchInput = z.infer<typeof adminUserSearchSchema>;
export type AdminUpdateSettingInput = z.infer<typeof adminUpdateSettingSchema>;
export type AdminAddAdminInput = z.infer<typeof adminAddAdminSchema>;
export type AdminActivityLogQueryInput = z.infer<typeof adminActivityLogQuerySchema>;
export type AdminActivityRangeInput = z.infer<typeof adminActivityRangeSchema>;
export type AdminTopUsersInput = z.infer<typeof adminTopUsersSchema>;
