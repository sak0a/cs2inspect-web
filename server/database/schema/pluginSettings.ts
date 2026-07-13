/**
 * Plugin Settings Database Schema
 *
 * Stores CS2 plugin configuration settings manageable from the admin web panel.
 * The plugin reads these on startup (falling back to config.json if empty)
 * and hot-reloads settings marked as 'immediate' via sync notifications.
 */
import { mysqlTable, int, varchar, text, timestamp, index } from 'drizzle-orm/mysql-core'

// ============================================================================
// PLUGIN SETTINGS TABLE
// ============================================================================

/**
 * Plugin settings table - stores plugin configuration overrides
 *
 * Categories:
 * - 'general': Language, menu type
 * - 'features': Feature toggles (knife, glove, music, etc.)
 * - 'permissions': Command permissions
 * - 'commands': Weapon/knife/glove shortcut commands
 * - 'sync': Sync poller configuration
 * - 'logging': Logging configuration
 *
 * Reload behaviors:
 * - 'immediate': Applied live via sync poller hot-reload
 * - 'restart': Requires plugin restart to take effect
 */
export const pluginSettings = mysqlTable(
  'plugin_settings',
  {
    id: int('id').primaryKey().autoincrement(),
    key: varchar('key', { length: 128 }).notNull().unique(),
    value: text('value').notNull(),
    type: varchar('type', { length: 20 }).default('string').notNull(),
    category: varchar('category', { length: 32 }).notNull(),
    label: varchar('label', { length: 128 }),
    description: text('description'),
    reload_behavior: varchar('reload_behavior', { length: 20 }).default('immediate').notNull(),
    sort_order: int('sort_order').default(0).notNull(),
    updated_by: varchar('updated_by', { length: 64 }),
    updated_at: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
  },
  (table) => [
    index('idx_plugin_settings_category').on(table.category),
    index('idx_plugin_settings_key').on(table.key),
  ]
)

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type PluginSetting = typeof pluginSettings.$inferSelect
export type NewPluginSetting = typeof pluginSettings.$inferInsert
export type PluginSettingCategory =
  | 'general'
  | 'features'
  | 'permissions'
  | 'commands'
  | 'sync'
  | 'logging'
export type PluginSettingReloadBehavior = 'immediate' | 'restart'
export type PluginSettingType = 'string' | 'boolean' | 'number' | 'json'
