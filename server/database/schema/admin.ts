/**
 * Admin Panel Database Schema
 *
 * Tables for admin users, banned users, app settings, and activity logging
 */
import { mysqlTable, int, varchar, text, tinyint, timestamp, index, json } from 'drizzle-orm/mysql-core';

// ============================================================================
// ADMIN USERS TABLE
// ============================================================================

/**
 * Admin users table - stores designated administrators
 *
 * Roles:
 * - 'admin': Can view analytics, manage users (ban/unban)
 * - 'superadmin': Can also manage other admins and app settings
 */
export const adminUsers = mysqlTable('admin_users', {
    id: int('id').primaryKey().autoincrement(),
    steamid: varchar('steamid', { length: 64 }).notNull().unique(),
    role: varchar('role', { length: 20 }).default('admin').notNull(),
    permissions: json('permissions').$type<string[]>().default([]),
    created_by: varchar('created_by', { length: 64 }),
    created_at: timestamp('created_at').defaultNow().notNull(),
    updated_at: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
}, (table) => ([
    index('idx_admin_steamid').on(table.steamid),
]));

// ============================================================================
// BANNED USERS TABLE
// ============================================================================

/**
 * Banned users table - tracks user bans
 *
 * Users with active bans are prevented from accessing the application
 */
export const bannedUsers = mysqlTable('banned_users', {
    id: int('id').primaryKey().autoincrement(),
    steamid: varchar('steamid', { length: 64 }).notNull().unique(),
    reason: text('reason'),
    banned_by: varchar('banned_by', { length: 64 }).notNull(),
    banned_at: timestamp('banned_at').defaultNow().notNull(),
    expires_at: timestamp('expires_at'),
    active: tinyint('active').default(1).notNull(),
}, (table) => ([
    index('idx_banned_steamid').on(table.steamid),
    index('idx_banned_active').on(table.active),
]));

// ============================================================================
// APP SETTINGS TABLE
// ============================================================================

/**
 * App settings table - stores application configuration
 *
 * Types:
 * - 'string': Plain text value
 * - 'boolean': 'true' or 'false'
 * - 'number': Numeric value as string
 * - 'json': JSON-encoded value
 */
export const appSettings = mysqlTable('app_settings', {
    id: int('id').primaryKey().autoincrement(),
    key: varchar('key', { length: 64 }).notNull().unique(),
    value: text('value').notNull(),
    type: varchar('type', { length: 20 }).default('string').notNull(),
    description: text('description'),
    updated_by: varchar('updated_by', { length: 64 }),
    updated_at: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
});

// ============================================================================
// ADMIN ACTIVITY LOG TABLE
// ============================================================================

/**
 * Admin activity log - audit trail for admin actions
 *
 * Actions logged:
 * - ban_user, unban_user, delete_user_data
 * - update_setting
 * - add_admin, remove_admin
 */
export const adminActivityLog = mysqlTable('admin_activity_log', {
    id: int('id').primaryKey().autoincrement(),
    admin_steamid: varchar('admin_steamid', { length: 64 }).notNull(),
    action: varchar('action', { length: 64 }).notNull(),
    target_steamid: varchar('target_steamid', { length: 64 }),
    details: json('details').$type<Record<string, unknown>>(),
    created_at: timestamp('created_at').defaultNow().notNull(),
}, (table) => ([
    index('idx_activity_admin').on(table.admin_steamid),
    index('idx_activity_action').on(table.action),
    index('idx_activity_created').on(table.created_at),
]));

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type AdminUser = typeof adminUsers.$inferSelect;
export type NewAdminUser = typeof adminUsers.$inferInsert;
export type BannedUser = typeof bannedUsers.$inferSelect;
export type NewBannedUser = typeof bannedUsers.$inferInsert;
export type AppSetting = typeof appSettings.$inferSelect;
export type NewAppSetting = typeof appSettings.$inferInsert;
export type AdminActivityLogEntry = typeof adminActivityLog.$inferSelect;
export type NewAdminActivityLogEntry = typeof adminActivityLog.$inferInsert;

export type AdminRole = 'admin' | 'superadmin';
export type SettingType = 'string' | 'boolean' | 'number' | 'json';
export type AdminAction =
    | 'ban_user'
    | 'unban_user'
    | 'delete_user_data'
    | 'update_setting'
    | 'update_plugin_setting'
    | 'reset_plugin_settings'
    | 'add_admin'
    | 'remove_admin';
