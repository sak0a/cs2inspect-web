/**
 * Item History Schema
 *
 * Tracks version history for item customizations (weapons, knives, gloves).
 * Each row represents a snapshot of an item's configuration at a point in time.
 */

import { mysqlTable, int, varchar, tinyint, timestamp, index, json } from 'drizzle-orm/mysql-core';
import { loadouts } from './loadouts';
import type { StickerJSON, KeychainJSON } from '~/server/types/jsonSchemas';

/**
 * Snapshot of an item's configuration stored as JSON
 */
export interface ItemHistorySnapshot {
  paintindex: number;
  paintseed: number;
  paintwear: number;
  stattrak_enabled?: boolean;
  stattrak_count?: number;
  nametag?: string;
  stickers?: Array<StickerJSON | null>;
  keychain?: KeychainJSON | null;
  active?: boolean;
}

/**
 * Types of changes that can be tracked
 */
export type ChangeType =
  | 'sticker_added'
  | 'sticker_removed'
  | 'sticker_modified'
  | 'keychain_added'
  | 'keychain_removed'
  | 'keychain_modified'
  | 'wear_changed'
  | 'pattern_changed'
  | 'paint_changed'
  | 'nametag_changed'
  | 'stattrak_toggled'
  | 'stattrak_count_changed'
  | 'active_toggled'
  | 'multiple_changes'
  | 'initial_save'
  | 'reset';

/**
 * Item types that can have history tracked
 */
export type HistoryItemType = 'weapon' | 'knife' | 'glove';

/**
 * Weapon categories for more specific tracking
 */
export type HistoryItemCategory = 'rifles' | 'pistols' | 'smgs' | 'heavys' | null;

/**
 * Item History Table
 *
 * Stores snapshots of item configurations for version history and restore functionality.
 * Each entry captures the state of an item before a change was made.
 */
export const itemHistory = mysqlTable('wp_item_history', {
  id: int('id').primaryKey().autoincrement(),

  // Owner identification
  steamid: varchar('steamid', { length: 64 }).notNull(),
  loadoutid: int('loadoutid').notNull().references(() => loadouts.id, { onDelete: 'cascade' }),

  // Item identification
  item_type: varchar('item_type', { length: 20 }).notNull().$type<HistoryItemType>(),
  item_category: varchar('item_category', { length: 20 }).$type<HistoryItemCategory>(),
  defindex: int('defindex').notNull(),
  team: tinyint('team').notNull(),

  // Configuration snapshot (JSON blob of the item state)
  configuration: json('configuration').$type<ItemHistorySnapshot>().notNull(),

  // Change tracking
  change_type: varchar('change_type', { length: 50 }).notNull().$type<ChangeType>(),
  change_description: varchar('change_description', { length: 255 }),

  // Human-readable version identifier (e.g., "blue-tiger", "swift-arrow")
  version_id: varchar('version_id', { length: 30 }).notNull(),

  // Metadata
  is_snapshot: tinyint('is_snapshot').default(0), // 1 = explicit save, 0 = auto-recorded

  // Timestamps
  created_at: timestamp('created_at').defaultNow().notNull(),
}, (table) => ([
  // Index for looking up history for a specific item
  index('idx_item_history_item').on(
    table.steamid,
    table.loadoutid,
    table.item_type,
    table.defindex,
    table.team
  ),
  // Index for looking up all history for a user's loadout
  index('idx_item_history_loadout').on(table.steamid, table.loadoutid),
  // Index for chronological queries
  index('idx_item_history_created').on(table.created_at),
]));

/**
 * Type inference for the item history record
 */
export type ItemHistoryRecord = typeof itemHistory.$inferSelect;
export type NewItemHistoryRecord = typeof itemHistory.$inferInsert;
