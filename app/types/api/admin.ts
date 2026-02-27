/**
 * Admin Panel API Types
 *
 * Type definitions for admin panel API responses
 */
import type { ISOTimestamp, SteamId } from '../core/branded';

// ============================================================================
// OVERVIEW STATS
// ============================================================================

/**
 * Dashboard overview statistics
 */
export interface AdminOverviewStats {
    totalUsers: number;
    activeUsers7d: number;
    activeUsers30d: number;
    totalLoadouts: number;
    totalItems: {
        weapons: number;
        knives: number;
        gloves: number;
        agents: number;
        musicKits: number;
        pins: number;
    };
    bannedUsers: number;
}

// ============================================================================
// USER MANAGEMENT
// ============================================================================

/**
 * User details for admin view
 */
export interface AdminUserDetails {
    steamId: SteamId;
    personaName: string | null;
    avatarFull: string | null;
    loadoutCount: number;
    itemCounts: {
        weapons: number;
        knives: number;
        gloves: number;
        agents: number;
        musicKits: number;
        pins: number;
    };
    firstActivity: ISOTimestamp;
    lastActivity: ISOTimestamp;
    isBanned: boolean;
    banInfo?: {
        reason: string | null;
        bannedAt: ISOTimestamp;
        bannedBy: SteamId;
        expiresAt: ISOTimestamp | null;
    };
}

/**
 * User list item (summary for table display)
 */
export interface AdminUserSummary {
    steamId: SteamId;
    personaName: string | null;
    avatarFull: string | null;
    loadoutCount: number;
    totalItems: number;
    lastActivity: ISOTimestamp | null;
    isBanned: boolean;
}

// ============================================================================
// ACTIVITY ANALYTICS
// ============================================================================

/**
 * Activity data point for time-series charts
 */
export interface AdminActivityData {
    date: string;
    newUsers: number;
    activeUsers: number;
    loadoutsCreated: number;
    itemsSaved: number;
}

/**
 * Heatmap data for calendar visualization
 */
export interface AdminHeatmapData {
    date: string;
    value: number;
}

/**
 * Top user for leaderboard display
 */
export interface AdminTopUser {
    steamId: SteamId;
    loadoutCount: number;
    totalItems: number;
}

// ============================================================================
// SETTINGS
// ============================================================================

/**
 * Application setting
 */
export interface AdminSetting {
    key: string;
    value: string;
    type: 'string' | 'boolean' | 'number' | 'json';
    description: string | null;
    updatedAt: ISOTimestamp;
    updatedBy: SteamId | null;
}

// ============================================================================
// PLUGIN SETTINGS
// ============================================================================

/**
 * Plugin configuration setting
 */
export interface PluginSetting {
    key: string;
    value: string;
    type: 'string' | 'boolean' | 'number' | 'json';
    category: PluginSettingCategory;
    label: string | null;
    description: string | null;
    reloadBehavior: 'immediate' | 'restart';
    sortOrder: number;
    updatedAt: ISOTimestamp;
    updatedBy: SteamId | null;
}

export type PluginSettingCategory = 'general' | 'features' | 'permissions' | 'commands' | 'sync' | 'logging';

/**
 * Update plugin setting request body
 */
export interface PluginSettingUpdateRequest {
    key: string;
    value: string | number | boolean | Record<string, unknown> | unknown[];
}

// ============================================================================
// ADMIN MANAGEMENT
// ============================================================================

/**
 * Admin user info
 */
export interface AdminInfo {
    id: number;
    steamId: SteamId;
    role: 'admin' | 'superadmin';
    permissions: string[];
    createdBy: SteamId | null;
    createdAt: ISOTimestamp;
}

// ============================================================================
// ACTIVITY LOG
// ============================================================================

/**
 * Admin activity log entry
 */
export interface AdminActivityLogEntry {
    id: number;
    adminSteamId: SteamId;
    action: string;
    targetSteamId: SteamId | null;
    details: Record<string, unknown> | null;
    createdAt: ISOTimestamp;
}

// ============================================================================
// API REQUEST/RESPONSE TYPES
// ============================================================================

/**
 * Ban user request body
 */
export interface AdminBanUserRequest {
    reason: string;
    duration?: number; // hours, undefined = permanent
}

/**
 * Update setting request body
 */
export interface AdminUpdateSettingRequest {
    key: string;
    value: string | number | boolean;
}

/**
 * Add admin request body
 */
export interface AdminAddAdminRequest {
    steamId: string;
    role: 'admin' | 'superadmin';
}

/**
 * User search query params
 */
export interface AdminUserSearchParams {
    search?: string;
    page?: number;
    limit?: number;
    bannedOnly?: boolean;
    activeOnly?: boolean;
    sortBy?: 'name' | 'loadouts' | 'items' | 'lastActivity';
    sortDir?: 'asc' | 'desc';
}

/**
 * Activity data query params
 */
export interface AdminActivityParams {
    range: '7d' | '30d' | '90d';
}
