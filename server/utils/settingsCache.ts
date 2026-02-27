/**
 * Settings Cache
 *
 * In-memory TTL cache for app settings to avoid hitting the database on every request.
 * Used primarily by middleware (e.g., maintenance mode) and hot-path feature checks.
 */

import { getSettingTyped } from '~/server/database/adminHelpers'

const cache = new Map<string, { value: unknown; expiresAt: number }>()
const DEFAULT_TTL = 30_000 // 30 seconds

/**
 * Get a typed setting with in-memory caching.
 * Falls back to `getSettingTyped()` on cache miss or expiry.
 */
export async function getCachedSetting<T>(key: string, defaultValue: T, ttlMs = DEFAULT_TTL): Promise<T> {
    const now = Date.now()
    const cached = cache.get(key)
    if (cached && cached.expiresAt > now) {
        return cached.value as T
    }

    const value = await getSettingTyped<T>(key, defaultValue)
    cache.set(key, { value, expiresAt: now + ttlMs })
    return value
}

/**
 * Invalidate one or all cached settings.
 * Call after a setting is updated in the admin panel.
 */
export function invalidateSettingsCache(key?: string): void {
    if (key) {
        cache.delete(key)
    } else {
        cache.clear()
    }
}
