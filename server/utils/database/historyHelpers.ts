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

/**
 * Parse a JSON column value that might be a string or object
 * MariaDB/Drizzle may return JSON columns as strings
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
 * Convert a weapon database record to a history snapshot
 */
function weaponToSnapshot(record: {
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
}): ItemHistorySnapshot {
  return {
    paintindex: record.paintindex,
    paintseed: record.paintseed,
    paintwear: record.paintwear,
    active: record.active === 1,
    stattrak_enabled: record.stattrak_enabled === 1,
    stattrak_count: record.stattrak_count ?? 0,
    nametag: record.nametag ?? undefined,
    stickers: [
      parseJsonColumn<StickerJSON>(record.sticker_0),
      parseJsonColumn<StickerJSON>(record.sticker_1),
      parseJsonColumn<StickerJSON>(record.sticker_2),
      parseJsonColumn<StickerJSON>(record.sticker_3),
      parseJsonColumn<StickerJSON>(record.sticker_4)
    ],
    keychain: parseJsonColumn<KeychainJSON>(record.keychain)
  }
}

/**
 * Convert a knife database record to a history snapshot
 */
function knifeToSnapshot(record: {
  paintindex: number
  paintseed: number
  paintwear: number
  active?: number | null
  stattrak_enabled?: number | null
  stattrak_count?: number | null
  nametag?: string | null
}): ItemHistorySnapshot {
  return {
    paintindex: record.paintindex,
    paintseed: record.paintseed,
    paintwear: record.paintwear,
    active: record.active === 1,
    stattrak_enabled: record.stattrak_enabled === 1,
    stattrak_count: record.stattrak_count ?? 0,
    nametag: record.nametag ?? undefined
  }
}

/**
 * Convert a glove database record to a history snapshot
 */
function gloveToSnapshot(record: {
  paintindex: number
  paintseed: number
  paintwear: number
  active?: number | null
}): ItemHistorySnapshot {
  return {
    paintindex: record.paintindex,
    paintseed: record.paintseed,
    paintwear: record.paintwear,
    active: record.active === 1
  }
}

/**
 * Extract just the skin name part (e.g., "Asiimov" from "AK-47 | Asiimov")
 */
function extractSkinName(fullName: string): string {
  const parts = fullName.split(' | ')
  return parts.length > 1 ? parts[1]! : fullName
}

/**
 * Extract just the keychain name part (e.g., "Biomech" from "Charm | Biomech")
 */
function extractKeychainName(fullName: string): string {
  const parts = fullName.split(' | ')
  return parts.length > 1 ? parts[1]! : fullName
}

/**
 * Find a keychain by its numeric ID
 */
function findKeychainById(keychainId: number, keychainData: APIKeychain[]): APIKeychain | undefined {
  // API keychain IDs are like "keychain-37", database stores just 37
  return keychainData.find(k => {
    const apiId = typeof k.id === 'string' ? parseInt(k.id.replace('keychain-', ''), 10) : k.id
    return apiId === keychainId
  })
}

/**
 * Helper to get a normalized sticker ID (always a number, 0 for empty)
 * Treats null, undefined, id=0, and id="0" as empty (returns 0)
 */
function getStickerIdNormalized(sticker: StickerJSON | null | undefined): number {
  if (!sticker) return 0
  const id = typeof sticker.id === 'string' ? parseInt(sticker.id, 10) : sticker.id
  return (id && !isNaN(id)) ? id : 0
}

/**
 * Helper to get a normalized keychain ID (always a number, 0 for empty)
 * Treats null, undefined, id=0, and id="0" as empty (returns 0)
 * Also handles the case where keychain is stored as a JSON string in the database
 */
function getKeychainIdNormalized(keychain: KeychainJSON | string | null | undefined): number {
  if (!keychain) return 0

  // Handle case where keychain is stored as a JSON string
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

  // Check paint index - try to get skin names
  if (oldSnapshot.paintindex !== newSnapshot.paintindex) {
    let skinChangeDesc = 'skin changed'
    if (skinsData) {
      const oldSkin = findSkinByPaintIndex(oldSnapshot.paintindex, skinsData)
      const newSkin = findSkinByPaintIndex(newSnapshot.paintindex, skinsData)
      if (oldSkin && newSkin) {
        const oldName = extractSkinName(oldSkin.name)
        const newName = extractSkinName(newSkin.name)
        skinChangeDesc = `${oldName} → ${newName}`
      } else if (newSkin) {
        skinChangeDesc = `→ ${extractSkinName(newSkin.name)}`
      }
    }
    changes.push(skinChangeDesc)
  }

  // Check wear
  if (oldSnapshot.paintwear !== newSnapshot.paintwear) {
    changes.push(`wear: ${oldSnapshot.paintwear.toFixed(4)} → ${newSnapshot.paintwear.toFixed(4)}`)
  }

  // Check pattern
  if (oldSnapshot.paintseed !== newSnapshot.paintseed) {
    changes.push(`pattern: ${oldSnapshot.paintseed} → ${newSnapshot.paintseed}`)
  }

  // Check StatTrak
  if (oldSnapshot.stattrak_enabled !== newSnapshot.stattrak_enabled) {
    changes.push(newSnapshot.stattrak_enabled ? 'StatTrak enabled' : 'StatTrak disabled')
  }

  if (oldSnapshot.stattrak_count !== newSnapshot.stattrak_count) {
    changes.push(`StatTrak count: ${newSnapshot.stattrak_count}`)
  }

  // Check nametag
  if (oldSnapshot.nametag !== newSnapshot.nametag) {
    if (!oldSnapshot.nametag && newSnapshot.nametag) {
      changes.push(`nametag added: "${newSnapshot.nametag}"`)
    } else if (oldSnapshot.nametag && !newSnapshot.nametag) {
      changes.push('nametag removed')
    } else {
      changes.push(`nametag changed: "${newSnapshot.nametag}"`)
    }
  }

  // Check stickers (if present) - use normalized IDs to handle string/number and null/0 differences
  if (oldSnapshot.stickers || newSnapshot.stickers) {
    const oldStickers = oldSnapshot.stickers || []
    const newStickers = newSnapshot.stickers || []

    for (let i = 0; i < 5; i++) {
      const oldId = getStickerIdNormalized(oldStickers[i])
      const newId = getStickerIdNormalized(newStickers[i])

      // Only report change if the actual sticker ID changed
      if (oldId !== newId) {
        if (oldId === 0 && newId !== 0) {
          changes.push(`sticker ${i + 1} added`)
        } else if (oldId !== 0 && newId === 0) {
          changes.push(`sticker ${i + 1} removed`)
        } else {
          changes.push(`sticker ${i + 1} changed`)
        }
      }
    }
  }

  // Check keychain - use normalized IDs to handle string/number and null/0 differences
  const oldKeychainId = getKeychainIdNormalized(oldSnapshot.keychain)
  const newKeychainId = getKeychainIdNormalized(newSnapshot.keychain)

  // Debug logging for keychain comparison
  Logger.info(`Keychain comparison - Old ID: ${oldKeychainId}, New ID: ${newKeychainId}, Old keychain: ${JSON.stringify(oldSnapshot.keychain)}, New keychain: ${JSON.stringify(newSnapshot.keychain)}`)

  if (oldKeychainId !== newKeychainId) {
    if (oldKeychainId === 0 && newKeychainId !== 0) {
      // Keychain added - try to get the name
      let keychainDesc = 'Keychain added'
      if (keychainData) {
        const newKeychain = findKeychainById(newKeychainId, keychainData)
        if (newKeychain) {
          keychainDesc = `Keychain added: ${extractKeychainName(newKeychain.name)}`
        }
      }
      changes.push(keychainDesc)
    } else if (oldKeychainId !== 0 && newKeychainId === 0) {
      // Keychain removed - try to get the old name
      let keychainDesc = 'Keychain removed'
      if (keychainData) {
        const oldKeychain = findKeychainById(oldKeychainId, keychainData)
        if (oldKeychain) {
          keychainDesc = `Keychain removed: ${extractKeychainName(oldKeychain.name)}`
        }
      }
      changes.push(keychainDesc)
    } else {
      // Keychain changed - try to get both names
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
  try {
    const table = weaponTableMap[category]
    const loadoutIdNum = toLoadoutId(loadoutId)

    // Get skins and keychain data for name lookups
    const [skinsData, keychainData] = await Promise.all([
      getSkinsDataAsync(),
      getKeychainDataAsync()
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

    const oldSnapshot = current[0] ? weaponToSnapshot(current[0]) : null

    // Debug: Log the raw database record and converted snapshot
    Logger.info(`recordWeaponHistory - Raw DB record keychain: ${JSON.stringify(current[0]?.keychain)}`)
    Logger.info(`recordWeaponHistory - Old snapshot keychain: ${JSON.stringify(oldSnapshot?.keychain)}`)
    Logger.info(`recordWeaponHistory - New snapshot keychain: ${JSON.stringify(newSnapshot.keychain)}`)

    const { changeType, description } = detectChangeType(oldSnapshot, newSnapshot, skinsData, keychainData)

    // Don't record if nothing changed
    if (oldSnapshot && changeType === 'multiple_changes' && description === 'Configuration updated') {
      return
    }

    // Insert history record with the NEW state (result of the change)
    // This way "sticker added" entries contain the config WITH the sticker
    const versionId = generateVersionId()
    await db.insert(itemHistory).values({
      steamid: steamId,
      loadoutid: loadoutIdNum,
      item_type: 'weapon' as HistoryItemType,
      item_category: category as HistoryItemCategory,
      defindex,
      team,
      configuration: newSnapshot,
      change_type: changeType,
      change_description: description,
      version_id: versionId,
      is_snapshot: 0
    })

    Logger.info(`Recorded weapon history [${versionId}]: ${description}`)
  } catch (error) {
    Logger.error(`Failed to record weapon history: ${error instanceof Error ? error.message : String(error)}`)
    // Don't throw - history recording should not block saves
  }
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
  try {
    const loadoutIdNum = toLoadoutId(loadoutId)

    // Get skins data for skin name lookup
    const skinsData = await getSkinsDataAsync()

    // Get current state from database
    const current = await db.select()
      .from(knives)
      .where(and(
        eq(knives.steamid, steamId),
        eq(knives.loadoutid, loadoutIdNum),
        eq(knives.defindex, defindex),
        eq(knives.team, team)
      ))
      .limit(1)

    const oldSnapshot = current[0] ? knifeToSnapshot(current[0]) : null
    const { changeType, description } = detectChangeType(oldSnapshot, newSnapshot, skinsData)

    // Don't record if nothing changed
    if (oldSnapshot && changeType === 'multiple_changes' && description === 'Configuration updated') {
      return
    }

    // Insert history record with the NEW state (result of the change)
    const versionId = generateVersionId()
    await db.insert(itemHistory).values({
      steamid: steamId,
      loadoutid: loadoutIdNum,
      item_type: 'knife' as HistoryItemType,
      item_category: null,
      defindex,
      team,
      configuration: newSnapshot,
      change_type: changeType,
      change_description: description,
      version_id: versionId,
      is_snapshot: 0
    })

    Logger.info(`Recorded knife history [${versionId}]: ${description}`)
  } catch (error) {
    Logger.error(`Failed to record knife history: ${error instanceof Error ? error.message : String(error)}`)
  }
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
  try {
    const loadoutIdNum = toLoadoutId(loadoutId)

    // Get skins data for skin name lookup
    const skinsData = await getSkinsDataAsync()

    // Get current state from database
    const current = await db.select()
      .from(gloves)
      .where(and(
        eq(gloves.steamid, steamId),
        eq(gloves.loadoutid, loadoutIdNum),
        eq(gloves.defindex, defindex),
        eq(gloves.team, team)
      ))
      .limit(1)

    const oldSnapshot = current[0] ? gloveToSnapshot(current[0]) : null
    const { changeType, description } = detectChangeType(oldSnapshot, newSnapshot, skinsData)

    // Don't record if nothing changed
    if (oldSnapshot && changeType === 'multiple_changes' && description === 'Configuration updated') {
      return
    }

    // Insert history record with the NEW state (result of the change)
    const versionId = generateVersionId()
    await db.insert(itemHistory).values({
      steamid: steamId,
      loadoutid: loadoutIdNum,
      item_type: 'glove' as HistoryItemType,
      item_category: null,
      defindex,
      team,
      configuration: newSnapshot,
      change_type: changeType,
      change_description: description,
      version_id: versionId,
      is_snapshot: 0
    })

    Logger.info(`Recorded glove history [${versionId}]: ${description}`)
  } catch (error) {
    Logger.error(`Failed to record glove history: ${error instanceof Error ? error.message : String(error)}`)
  }
}
