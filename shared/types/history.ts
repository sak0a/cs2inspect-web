/**
 * Shared history types used by both app and server
 *
 * Extracted from server/database/schema/itemHistory.ts
 * so app components can import without crossing the server boundary.
 */

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
  | 'reset'

/**
 * Item types that can have history tracked
 */
export type HistoryItemType = 'weapon' | 'knife' | 'glove'

/**
 * Weapon categories for more specific tracking
 */
export type HistoryItemCategory = 'rifles' | 'pistols' | 'smgs' | 'heavys' | null
