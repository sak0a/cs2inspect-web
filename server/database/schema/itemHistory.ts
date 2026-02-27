/**
 * Item History Schema
 *
 * Tracks version history for item customizations (weapons, knives, gloves).
 * Each row represents a snapshot of an item's configuration at a point in time.
 */

import { mysqlTable, int, varchar, tinyint, timestamp, index, json } from 'drizzle-orm/mysql-core';
import { loadouts } from './loadouts';
import type { StickerJSON, KeychainJSON } from '~/server/types/jsonSchemas';
import type { ChangeType, HistoryItemType, HistoryItemCategory } from '#shared/types/history'

/**
 * Snapshot of an item's configuration stored as JSON
 *
 * ## Branded Types Conversion
 *
 * When restoring history or using snapshot values in business logic,
 * convert to branded types for type safety:
 * - `paintindex` → `toPaintIndex(paintindex)` for PaintIndex
 * - `paintseed` → `toPaintSeed(paintseed)` for PaintSeed (0-999)
 * - `paintwear` → `toFloatValue(paintwear)` for FloatValue (0-1)
 * - `stattrak_count` → `toStatTrakCount(stattrak_count)` for StatTrakCount
 * - `nametag` → `toNameTag(nametag)` for NameTag (max 32 chars)
 * - Sticker IDs → `toStickerId(sticker.id)` for StickerId
 * - Sticker positions → `toNormalizedCoordinate(value)` for NormalizedCoordinate
 * - Keychain IDs → `toKeychainId(keychain.id)` for KeychainId
 *
 * @see {@link ~/types/core/branded.ts} for branded type definitions
 */
export interface ItemHistorySnapshot {
  /** Paint index for the skin - convert to PaintIndex */
  paintindex: number;
  /** Pattern seed (0-999) - convert to PaintSeed */
  paintseed: number;
  /** Wear value (0-1) - convert to FloatValue */
  paintwear: number;
  /** Whether StatTrak is enabled */
  stattrak_enabled?: boolean;
  /** StatTrak kill count - convert to StatTrakCount */
  stattrak_count?: number;
  /** Custom name tag (max 32 chars) - convert to NameTag */
  nametag?: string;
  /** Sticker configurations (with StickerId for id field) */
  stickers?: Array<StickerJSON | null>;
  /** Keychain configuration (with KeychainId for id field) */
  keychain?: KeychainJSON | null;
  /** Whether item is active/equipped */
  active?: boolean;
}

// Re-export shared types so existing server imports continue to work
export type { ChangeType, HistoryItemType, HistoryItemCategory } from '#shared/types/history'

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
