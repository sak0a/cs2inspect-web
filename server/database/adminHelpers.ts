/**
 * Admin Database Helper Functions
 *
 * Comprehensive helpers for admin panel operations including:
 * - Admin user management
 * - User ban management
 * - App settings management
 * - Activity logging
 * - User statistics
 */
import { eq, and, sql, desc, count, min, max } from 'drizzle-orm'
import { db } from '~/server/database/client'
import {
    adminUsers,
    bannedUsers,
    appSettings,
    adminActivityLog,
    loadouts,
    pistols,
    rifles,
    smgs,
    heavys,
    knives,
    gloves,
    agents,
    music,
    pins,
    type AdminRole,
    type AdminAction,
} from '~/server/database/schema'

// ============================================================================
// ADMIN USER HELPERS
// ============================================================================

/**
 * Check if a user is an admin
 */
export async function isUserAdmin(steamId: string): Promise<boolean> {
    const result = await db
        .select({ id: adminUsers.id })
        .from(adminUsers)
        .where(eq(adminUsers.steamid, steamId))
        .limit(1)

    return result.length > 0
}

/**
 * Get admin role for a user (null if not admin)
 */
export async function getAdminRole(steamId: string): Promise<AdminRole | null> {
    const result = await db
        .select({ role: adminUsers.role })
        .from(adminUsers)
        .where(eq(adminUsers.steamid, steamId))
        .limit(1)

    const admin = result[0]
    if (!admin) {
        return null
    }

    return admin.role as AdminRole
}

/**
 * Get full admin info
 */
export async function getAdminInfo(steamId: string): Promise<{
    id: number
    steamId: string
    role: AdminRole
    permissions: string[]
    createdBy: string | null
    createdAt: Date
} | null> {
    const result = await db
        .select({
            id: adminUsers.id,
            steamId: adminUsers.steamid,
            role: adminUsers.role,
            permissions: adminUsers.permissions,
            createdBy: adminUsers.created_by,
            createdAt: adminUsers.created_at,
        })
        .from(adminUsers)
        .where(eq(adminUsers.steamid, steamId))
        .limit(1)

    const admin = result[0]
    if (!admin) {
        return null
    }

    return {
        id: admin.id,
        steamId: admin.steamId,
        role: admin.role as AdminRole,
        permissions: admin.permissions || [],
        createdBy: admin.createdBy,
        createdAt: admin.createdAt,
    }
}

// ============================================================================
// BAN HELPERS
// ============================================================================

/**
 * Check if a user is currently banned
 * Returns true if user has an active ban that hasn't expired
 */
export async function isUserBanned(steamId: string): Promise<boolean> {
    const now = new Date()

    const result = await db
        .select({ id: bannedUsers.id })
        .from(bannedUsers)
        .where(
            and(
                eq(bannedUsers.steamid, steamId),
                eq(bannedUsers.active, 1),
                // Either no expiration or expiration is in the future
                sql`(${bannedUsers.expires_at} IS NULL OR ${bannedUsers.expires_at} > ${now})`
            )
        )
        .limit(1)

    return result.length > 0
}

/**
 * Get ban info for a user (null if not banned or ban expired)
 */
export async function getBanInfo(steamId: string): Promise<{
    id: number
    reason: string | null
    bannedBy: string
    bannedAt: Date
    expiresAt: Date | null
} | null> {
    const now = new Date()

    const result = await db
        .select({
            id: bannedUsers.id,
            reason: bannedUsers.reason,
            bannedBy: bannedUsers.banned_by,
            bannedAt: bannedUsers.banned_at,
            expiresAt: bannedUsers.expires_at,
        })
        .from(bannedUsers)
        .where(
            and(
                eq(bannedUsers.steamid, steamId),
                eq(bannedUsers.active, 1),
                sql`(${bannedUsers.expires_at} IS NULL OR ${bannedUsers.expires_at} > ${now})`
            )
        )
        .limit(1)

    const ban = result[0]
    if (!ban) {
        return null
    }

    return {
        id: ban.id,
        reason: ban.reason,
        bannedBy: ban.bannedBy,
        bannedAt: ban.bannedAt,
        expiresAt: ban.expiresAt,
    }
}

/**
 * Ban a user
 * Uses a transaction to insert the ban and log the action
 * @returns The ID of the new ban record
 */
export async function banUser(
    steamId: string,
    bannedBy: string,
    reason: string,
    durationHours?: number
): Promise<number> {
    // Calculate expiration if duration is provided
    const expiresAt = durationHours ? new Date(Date.now() + durationHours * 60 * 60 * 1000) : null

    // First, deactivate any existing active bans for this user
    await db
        .update(bannedUsers)
        .set({ active: 0 })
        .where(and(eq(bannedUsers.steamid, steamId), eq(bannedUsers.active, 1)))

    // Insert the new ban
    const insertResult = await db.insert(bannedUsers).values({
        steamid: steamId,
        reason: reason,
        banned_by: bannedBy,
        expires_at: expiresAt,
        active: 1,
    })

    const banId = Number(insertResult[0].insertId)

    // Log the admin action
    await logAdminAction(bannedBy, 'ban_user', steamId, {
        reason,
        durationHours: durationHours || 'permanent',
        expiresAt: expiresAt?.toISOString() || null,
    })

    return banId
}

/**
 * Unban a user
 * @returns true if a ban was found and deactivated, false if no active ban existed
 */
export async function unbanUser(steamId: string): Promise<boolean> {
    const result = await db
        .update(bannedUsers)
        .set({ active: 0 })
        .where(and(eq(bannedUsers.steamid, steamId), eq(bannedUsers.active, 1)))

    // Check if any rows were affected
    return result[0].affectedRows > 0
}

// ============================================================================
// SETTINGS HELPERS
// ============================================================================

/**
 * Get a setting by key
 */
export async function getSetting(key: string): Promise<string | null> {
    const result = await db
        .select({ value: appSettings.value })
        .from(appSettings)
        .where(eq(appSettings.key, key))
        .limit(1)

    const setting = result[0]
    if (!setting) {
        return null
    }

    return setting.value
}

/**
 * Get a setting with type conversion
 */
export async function getSettingTyped<T>(key: string, defaultValue: T): Promise<T> {
    const result = await db
        .select({
            value: appSettings.value,
            type: appSettings.type,
        })
        .from(appSettings)
        .where(eq(appSettings.key, key))
        .limit(1)

    const setting = result[0]
    if (!setting) {
        return defaultValue
    }

    const { value, type } = setting

    try {
        switch (type) {
            case 'boolean':
                return (value === 'true') as T
            case 'number':
                return Number(value) as T
            case 'json':
                return JSON.parse(value) as T
            case 'string':
            default:
                return value as T
        }
    } catch {
        return defaultValue
    }
}

/**
 * Set a setting value
 * Uses upsert pattern (insert on duplicate key update)
 */
export async function setSetting(
    key: string,
    value: string,
    type: 'string' | 'boolean' | 'number' | 'json',
    description: string | null,
    updatedBy: string
): Promise<void> {
    // Check if setting exists
    const existing = await db
        .select({ id: appSettings.id })
        .from(appSettings)
        .where(eq(appSettings.key, key))
        .limit(1)

    if (existing.length > 0) {
        // Update existing setting
        await db
            .update(appSettings)
            .set({
                value,
                type,
                description,
                updated_by: updatedBy,
            })
            .where(eq(appSettings.key, key))
    } else {
        // Insert new setting
        await db.insert(appSettings).values({
            key,
            value,
            type,
            description,
            updated_by: updatedBy,
        })
    }

    // Log the setting change
    await logAdminAction(updatedBy, 'update_setting', undefined, {
        key,
        value,
        type,
    })
}

/**
 * Get all settings
 */
export async function getAllSettings(): Promise<
    Array<{
        key: string
        value: string
        type: string
        description: string | null
        updatedAt: Date
        updatedBy: string | null
    }>
> {
    const result = await db
        .select({
            key: appSettings.key,
            value: appSettings.value,
            type: appSettings.type,
            description: appSettings.description,
            updatedAt: appSettings.updated_at,
            updatedBy: appSettings.updated_by,
        })
        .from(appSettings)
        .orderBy(appSettings.key)

    return result.map((setting) => ({
        key: setting.key,
        value: setting.value,
        type: setting.type,
        description: setting.description,
        updatedAt: setting.updatedAt,
        updatedBy: setting.updatedBy,
    }))
}

// ============================================================================
// ACTIVITY LOG HELPERS
// ============================================================================

/**
 * Log an admin action
 */
export async function logAdminAction(
    adminSteamId: string,
    action: AdminAction,
    targetSteamId?: string,
    details?: Record<string, unknown>
): Promise<void> {
    await db.insert(adminActivityLog).values({
        admin_steamid: adminSteamId,
        action,
        target_steamid: targetSteamId || null,
        details: details || null,
    })
}

/**
 * Get activity log entries with pagination
 */
export async function getActivityLog(
    page: number,
    limit: number,
    action?: string
): Promise<{
    entries: Array<{
        id: number
        adminSteamId: string
        action: string
        targetSteamId: string | null
        details: Record<string, unknown> | null
        createdAt: Date
    }>
    total: number
}> {
    const offset = (page - 1) * limit

    // Build the where clause
    const whereClause = action ? eq(adminActivityLog.action, action) : undefined

    // Get total count
    const countResult = await db
        .select({ total: count() })
        .from(adminActivityLog)
        .where(whereClause)

    const total = countResult[0]?.total || 0

    // Get entries with pagination
    const entriesQuery = db
        .select({
            id: adminActivityLog.id,
            adminSteamId: adminActivityLog.admin_steamid,
            action: adminActivityLog.action,
            targetSteamId: adminActivityLog.target_steamid,
            details: adminActivityLog.details,
            createdAt: adminActivityLog.created_at,
        })
        .from(adminActivityLog)
        .orderBy(desc(adminActivityLog.created_at))
        .limit(limit)
        .offset(offset)

    // Apply where clause if action filter is provided
    const entries = action ? await entriesQuery.where(whereClause) : await entriesQuery

    return {
        entries: entries.map((entry) => ({
            id: entry.id,
            adminSteamId: entry.adminSteamId,
            action: entry.action,
            targetSteamId: entry.targetSteamId,
            details: entry.details,
            createdAt: entry.createdAt,
        })),
        total,
    }
}

// ============================================================================
// USER STATS HELPERS
// ============================================================================

/**
 * Get user stats for admin view
 * Queries all item tables to build comprehensive statistics
 */
export async function getUserStats(steamId: string): Promise<{
    loadoutCount: number
    itemCounts: {
        weapons: number
        knives: number
        gloves: number
        agents: number
        musicKits: number
        pins: number
    }
    firstActivity: Date | null
    lastActivity: Date | null
}> {
    // Get loadout count
    const loadoutResult = await db
        .select({ count: count() })
        .from(loadouts)
        .where(eq(loadouts.steamid, steamId))

    const loadoutCount = loadoutResult[0]?.count || 0

    // Get weapon counts from all weapon tables
    const [pistolCount, rifleCount, smgCount, heavyCount] = await Promise.all([
        db.select({ count: count() }).from(pistols).where(eq(pistols.steamid, steamId)),
        db.select({ count: count() }).from(rifles).where(eq(rifles.steamid, steamId)),
        db.select({ count: count() }).from(smgs).where(eq(smgs.steamid, steamId)),
        db.select({ count: count() }).from(heavys).where(eq(heavys.steamid, steamId)),
    ])

    const weaponCount =
        (pistolCount[0]?.count || 0) +
        (rifleCount[0]?.count || 0) +
        (smgCount[0]?.count || 0) +
        (heavyCount[0]?.count || 0)

    // Get counts for other item types
    const [knifeResult, gloveResult, agentResult, musicResult, pinResult] = await Promise.all([
        db.select({ count: count() }).from(knives).where(eq(knives.steamid, steamId)),
        db.select({ count: count() }).from(gloves).where(eq(gloves.steamid, steamId)),
        db.select({ count: count() }).from(agents).where(eq(agents.steamid, steamId)),
        db.select({ count: count() }).from(music).where(eq(music.steamid, steamId)),
        db.select({ count: count() }).from(pins).where(eq(pins.steamid, steamId)),
    ])

    // Get first and last activity timestamps by checking loadout created_at and updated_at
    const activityResult = await db
        .select({
            firstActivity: min(loadouts.created_at),
            lastActivity: max(loadouts.updated_at),
        })
        .from(loadouts)
        .where(eq(loadouts.steamid, steamId))

    return {
        loadoutCount,
        itemCounts: {
            weapons: weaponCount,
            knives: knifeResult[0]?.count || 0,
            gloves: gloveResult[0]?.count || 0,
            agents: agentResult[0]?.count || 0,
            musicKits: musicResult[0]?.count || 0,
            pins: pinResult[0]?.count || 0,
        },
        firstActivity: activityResult[0]?.firstActivity || null,
        lastActivity: activityResult[0]?.lastActivity || null,
    }
}
