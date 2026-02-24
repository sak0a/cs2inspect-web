/**
 * History Helper Functions
 *
 * Utilities for recording item history when configurations change.
 */

import { db } from '~/server/database/client'
import { itemHistory, pistols, rifles, smgs, heavys, knives, gloves } from '~/server/database/schema'
import { eq, and } from 'drizzle-orm'
import { toLoadoutId } from '~/types/core/common'
import { Logger } from '~/server/utils/logger'
import { generateVersionId } from '~/server/utils/versionIdGenerator'
import { getSkinsDataAsync, getKeychainDataAsync } from '~/server/utils/csgoAPI'
import { findSkinByPaintIndex } from '~/server/utils/data/skinUtils'
import type { APISkin, APIKeychain } from '~/server/types'
import type {
  HistoryItemType,
  HistoryItemCategory,
  ItemHistorySnapshot,
  ChangeType
} from '~/server/database/schema/itemHistory'
import type { StickerJSON, KeychainJSON } from '~/server/types/jsonSchemas'

// Map category to table
const weaponTableMap = {
  pistols,
  rifles,
  smgs,
  heavys
} as const

type WeaponCategory = keyof typeof weaponTableMap

// ============================================================================
// JSON & SNAPSHOT HELPERS
// ============================================================================

/**
 * Parse a JSON column value that might be a string or object
 */
function parseJsonColumn<T>(value: T | string | null | undefined): T | null {
  if (!value) return null
  if (typeof value === 'string') {
    try {
      return JSON.parse(value) as T
    } catch {
      return null
    }
  }
  return value as T
}

/**
 * Convert a database record to a history snapshot.
 * Handles weapon records (with stickers/keychain), knife records (with stattrak/nametag),
 * and glove records (basic paint fields only).
 */
function dbRecordToSnapshot(record: {
  paintindex: number
  paintseed: number
  paintwear: number
  active?: number | null
  stattrak_enabled?: number | null
  stattrak_count?: number | null
  nametag?: string | null
  sticker_0?: StickerJSON | string | null
  sticker_1?: StickerJSON | string | null
  sticker_2?: StickerJSON | string | null
  sticker_3?: StickerJSON | string | null
  sticker_4?: StickerJSON | string | null
  keychain?: KeychainJSON | string | null
}, options?: { includeStickers?: boolean; includeStattrak?: boolean }): ItemHistorySnapshot {
  const snapshot: ItemHistorySnapshot = {
    paintindex: record.paintindex,
    paintseed: record.paintseed,
    paintwear: record.paintwear,
    active: record.active === 1,
  }

  if (options?.includeStattrak !== false) {
    snapshot.stattrak_enabled = record.stattrak_enabled === 1
    snapshot.stattrak_count = record.stattrak_count ?? 0
    snapshot.nametag = record.nametag ?? undefined
  }

  if (options?.includeStickers) {
    snapshot.stickers = [
      parseJsonColumn<StickerJSON>(record.sticker_0),
      parseJsonColumn<StickerJSON>(record.sticker_1),
      parseJsonColumn<StickerJSON>(record.sticker_2),
      parseJsonColumn<StickerJSON>(record.sticker_3),
      parseJsonColumn<StickerJSON>(record.sticker_4)
    ]
    snapshot.keychain = parseJsonColumn<KeychainJSON>(record.keychain)
  }

  return snapshot
}

// ============================================================================
// NAME EXTRACTION HELPERS
// ============================================================================

function extractSkinName(fullName: string): string {
  const parts = fullName.split(' | ')
  return parts.length > 1 ? parts[1]! : fullName
}

function extractKeychainName(fullName: string): string {
  const parts = fullName.split(' | ')
  return parts.length > 1 ? parts[1]! : fullName
}

function findKeychainById(keychainId: number, keychainData: APIKeychain[]): APIKeychain | undefined {
  return keychainData.find(k => {
    const apiId = typeof k.id === 'string' ? parseInt(k.id.replace('keychain-', ''), 10) : k.id
    return apiId === keychainId
  })
}

// ============================================================================
// NORMALIZED ID HELPERS
// ============================================================================

function getStickerIdNormalized(sticker: StickerJSON | null | undefined): number {
  if (!sticker) return 0
  const id = typeof sticker.id === 'string' ? parseInt(sticker.id, 10) : sticker.id
  return (id && !isNaN(id)) ? id : 0
}

function getKeychainIdNormalized(keychain: KeychainJSON | string | null | undefined): number {
  if (!keychain) return 0

  let keychainObj: KeychainJSON | null = null
  if (typeof keychain === 'string') {
    try {
      keychainObj = JSON.parse(keychain) as KeychainJSON
    } catch {
      return 0
    }
  } else {
    keychainObj = keychain
  }

  if (!keychainObj) return 0
  const id = typeof keychainObj.id === 'string' ? parseInt(keychainObj.id, 10) : keychainObj.id
  return (id && !isNaN(id)) ? id : 0
}

// ============================================================================
// CHANGE DETECTION
// ============================================================================

/**
 * Detect changes between old and new snapshots
 */
function detectChangeType(
  oldSnapshot: ItemHistorySnapshot | null,
  newSnapshot: ItemHistorySnapshot,
  skinsData?: APISkin[],
  keychainData?: APIKeychain[]
): { changeType: ChangeType; description: string } {
  if (!oldSnapshot) {
    return { changeType: 'initial_save', description: 'Initial configuration' }
  }

  const changes: string[] = []

  // Check paint index
  if (oldSnapshot.paintindex !== newSnapshot.paintindex) {
    let skinChangeDesc = 'skin changed'
    if (skinsData) {
      const oldSkin = findSkinByPaintIndex(oldSnapshot.paintindex, skinsData)
      const newSkin = findSkinByPaintIndex(newSnapshot.paintindex, skinsData)
      const oldName = oldSkin ? extractSkinName(oldSkin.name) : (oldSnapshot.paintindex === 0 ? 'Default' : null)
      const newName = newSkin ? extractSkinName(newSkin.name) : (newSnapshot.paintindex === 0 ? 'Default' : null)
      if (oldName && newName) {
        skinChangeDesc = `${oldName} → ${newName}`
      } else if (newName) {
        skinChangeDesc = `→ ${newName}`
      }
    }
    changes.push(skinChangeDesc)
  }

  if (oldSnapshot.paintwear !== newSnapshot.paintwear) {
    changes.push(`wear: ${oldSnapshot.paintwear.toFixed(4)} → ${newSnapshot.paintwear.toFixed(4)}`)
  }

  if (oldSnapshot.paintseed !== newSnapshot.paintseed) {
    changes.push(`pattern: ${oldSnapshot.paintseed} → ${newSnapshot.paintseed}`)
  }

  if (oldSnapshot.stattrak_enabled !== newSnapshot.stattrak_enabled) {
    changes.push(newSnapshot.stattrak_enabled ? 'StatTrak enabled' : 'StatTrak disabled')
  }

  if (oldSnapshot.stattrak_count !== newSnapshot.stattrak_count) {
    changes.push(`StatTrak count: ${newSnapshot.stattrak_count}`)
  }

  if (oldSnapshot.nametag !== newSnapshot.nametag) {
    if (!oldSnapshot.nametag && newSnapshot.nametag) {
      changes.push(`nametag added: "${newSnapshot.nametag}"`)
    } else if (oldSnapshot.nametag && !newSnapshot.nametag) {
      changes.push('nametag removed')
    } else {
      changes.push(`nametag changed: "${newSnapshot.nametag}"`)
    }
  }

  // Check stickers
  if (oldSnapshot.stickers || newSnapshot.stickers) {
    const oldStickers = oldSnapshot.stickers || []
    const newStickers = newSnapshot.stickers || []

    for (let i = 0; i < 5; i++) {
      const oldId = getStickerIdNormalized(oldStickers[i])
      const newId = getStickerIdNormalized(newStickers[i])

      if (oldId !== newId) {
        if (oldId === 0 && newId !== 0) changes.push(`sticker ${i + 1} added`)
        else if (oldId !== 0 && newId === 0) changes.push(`sticker ${i + 1} removed`)
        else changes.push(`sticker ${i + 1} changed`)
      }
    }
  }

  // Check keychain
  const oldKeychainId = getKeychainIdNormalized(oldSnapshot.keychain)
  const newKeychainId = getKeychainIdNormalized(newSnapshot.keychain)

  if (oldKeychainId !== newKeychainId) {
    if (oldKeychainId === 0 && newKeychainId !== 0) {
      let keychainDesc = 'Keychain added'
      if (keychainData) {
        const newKeychain = findKeychainById(newKeychainId, keychainData)
        if (newKeychain) keychainDesc = `Keychain added: ${extractKeychainName(newKeychain.name)}`
      }
      changes.push(keychainDesc)
    } else if (oldKeychainId !== 0 && newKeychainId === 0) {
      let keychainDesc = 'Keychain removed'
      if (keychainData) {
        const oldKeychain = findKeychainById(oldKeychainId, keychainData)
        if (oldKeychain) keychainDesc = `Keychain removed: ${extractKeychainName(oldKeychain.name)}`
      }
      changes.push(keychainDesc)
    } else {
      let keychainDesc = 'Keychain changed'
      if (keychainData) {
        const oldKeychain = findKeychainById(oldKeychainId, keychainData)
        const newKeychain = findKeychainById(newKeychainId, keychainData)
        if (oldKeychain && newKeychain) {
          keychainDesc = `Keychain changed: ${extractKeychainName(oldKeychain.name)} → ${extractKeychainName(newKeychain.name)}`
        } else if (newKeychain) {
          keychainDesc = `Keychain changed: → ${extractKeychainName(newKeychain.name)}`
        }
      }
      changes.push(keychainDesc)
    }
  }

  // Determine primary change type
  let changeType: ChangeType = 'multiple_changes'

  if (changes.length === 0) {
    return { changeType: 'multiple_changes', description: 'Configuration updated' }
  }

  if (changes.length === 1) {
    if (changes[0]?.includes('→') && !changes[0]?.includes('pattern') && !changes[0]?.includes('wear')) changeType = 'paint_changed'
    else if (changes[0]?.includes('wear')) changeType = 'wear_changed'
    else if (changes[0]?.includes('pattern')) changeType = 'pattern_changed'
    else if (changes[0]?.includes('StatTrak enabled') || changes[0]?.includes('StatTrak disabled')) changeType = 'stattrak_toggled'
    else if (changes[0]?.includes('StatTrak count')) changeType = 'stattrak_count_changed'
    else if (changes[0]?.includes('nametag')) changeType = 'nametag_changed'
    else if (changes[0]?.includes('sticker') && changes[0]?.includes('added')) changeType = 'sticker_added'
    else if (changes[0]?.includes('sticker') && changes[0]?.includes('removed')) changeType = 'sticker_removed'
    else if (changes[0]?.includes('sticker') && changes[0]?.includes('changed')) changeType = 'sticker_modified'
    else if (changes[0]?.includes('Keychain') && changes[0]?.includes('added')) changeType = 'keychain_added'
    else if (changes[0]?.includes('Keychain') && changes[0]?.includes('removed')) changeType = 'keychain_removed'
    else if (changes[0]?.includes('Keychain') && changes[0]?.includes('changed')) changeType = 'keychain_modified'
  }

  const description = changes.slice(0, 3).join(', ')
  return { changeType, description: changes.length > 3 ? `${description}, +${changes.length - 3} more` : description }
}

// ============================================================================
// GENERIC RECORD HISTORY
// ============================================================================

interface RecordHistoryConfig {
  /** The database table to query for current state */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  table: any
  /** Item type for the history record */
  itemType: HistoryItemType
  /** Item category (only for weapons) */
  itemCategory: HistoryItemCategory | null
  /** Options for converting DB record to snapshot */
  snapshotOptions?: { includeStickers?: boolean; includeStattrak?: boolean }
  /** Whether to load keychain data for change detection */
  needsKeychainData?: boolean
}

/**
 * Generic function to record item history before an update
 */
async function recordItemHistory(
  config: RecordHistoryConfig,
  steamId: string,
  loadoutId: string,
  defindex: number,
  team: number,
  newSnapshot: ItemHistorySnapshot
): Promise<void> {
  try {
    const loadoutIdNum = toLoadoutId(loadoutId)
    const { table } = config

    // Get skins data (and optionally keychain data) for name lookups
    const [skinsData, keychainData] = await Promise.all([
      getSkinsDataAsync(),
      config.needsKeychainData ? getKeychainDataAsync() : Promise.resolve(undefined)
    ])

    // Get current state from database
    const current = await db.select()
      .from(table)
      .where(and(
        eq(table.steamid, steamId),
        eq(table.loadoutid, loadoutIdNum),
        eq(table.defindex, defindex),
        eq(table.team, team)
      ))
      .limit(1)

    const oldSnapshot = current[0] ? dbRecordToSnapshot(current[0] as Parameters<typeof dbRecordToSnapshot>[0], config.snapshotOptions) : null
    const { changeType, description } = detectChangeType(oldSnapshot, newSnapshot, skinsData, keychainData)

    // Don't record if nothing changed
    if (oldSnapshot && changeType === 'multiple_changes' && description === 'Configuration updated') {
      return
    }

    const versionId = generateVersionId()
    await db.insert(itemHistory).values({
      steamid: steamId,
      loadoutid: loadoutIdNum,
      item_type: config.itemType,
      item_category: config.itemCategory,
      defindex,
      team,
      configuration: newSnapshot,
      change_type: changeType,
      change_description: description,
      version_id: versionId,
      is_snapshot: 0
    })

    Logger.info(`Recorded ${config.itemType} history [${versionId}]: ${description}`)
  } catch (error) {
    Logger.error(`Failed to record ${config.itemType} history: ${error instanceof Error ? error.message : String(error)}`)
    // Don't throw - history recording should not block saves
  }
}

// ============================================================================
// ITEM-SPECIFIC HISTORY WRAPPERS
// ============================================================================

/**
 * Record weapon history before an update
 */
export async function recordWeaponHistory(
  steamId: string,
  loadoutId: string,
  defindex: number,
  team: number,
  category: WeaponCategory,
  newSnapshot: ItemHistorySnapshot
): Promise<void> {
  return recordItemHistory({
    table: weaponTableMap[category],
    itemType: 'weapon' as HistoryItemType,
    itemCategory: category as HistoryItemCategory,
    snapshotOptions: { includeStickers: true, includeStattrak: true },
    needsKeychainData: true
  }, steamId, loadoutId, defindex, team, newSnapshot)
}

/**
 * Record knife history before an update
 */
export async function recordKnifeHistory(
  steamId: string,
  loadoutId: string,
  defindex: number,
  team: number,
  newSnapshot: ItemHistorySnapshot
): Promise<void> {
  return recordItemHistory({
    table: knives,
    itemType: 'knife' as HistoryItemType,
    itemCategory: null,
    snapshotOptions: { includeStickers: false, includeStattrak: true },
    needsKeychainData: false
  }, steamId, loadoutId, defindex, team, newSnapshot)
}

/**
 * Record glove history before an update
 */
export async function recordGloveHistory(
  steamId: string,
  loadoutId: string,
  defindex: number,
  team: number,
  newSnapshot: ItemHistorySnapshot
): Promise<void> {
  return recordItemHistory({
    table: gloves,
    itemType: 'glove' as HistoryItemType,
    itemCategory: null,
    snapshotOptions: { includeStickers: false, includeStattrak: false },
    needsKeychainData: false
  }, steamId, loadoutId, defindex, team, newSnapshot)
}
