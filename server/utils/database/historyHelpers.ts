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
import { getSkinsDataAsync } from '~/server/utils/csgoAPI'
import { findSkinByPaintIndex } from '~/server/utils/data/skinUtils'
import type { APISkin } from '~/server/types'
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
  sticker_0?: StickerJSON | null
  sticker_1?: StickerJSON | null
  sticker_2?: StickerJSON | null
  sticker_3?: StickerJSON | null
  sticker_4?: StickerJSON | null
  keychain?: KeychainJSON | null
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
      record.sticker_0 ?? null,
      record.sticker_1 ?? null,
      record.sticker_2 ?? null,
      record.sticker_3 ?? null,
      record.sticker_4 ?? null
    ],
    keychain: record.keychain ?? null
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
 * Detect changes between old and new snapshots
 */
function detectChangeType(
  oldSnapshot: ItemHistorySnapshot | null,
  newSnapshot: ItemHistorySnapshot,
  skinsData?: APISkin[]
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

  // Check stickers (if present)
  if (oldSnapshot.stickers && newSnapshot.stickers) {
    for (let i = 0; i < 5; i++) {
      const oldSticker = oldSnapshot.stickers[i]
      const newSticker = newSnapshot.stickers[i]

      if (!oldSticker && newSticker) {
        changes.push(`sticker ${i + 1} added`)
      } else if (oldSticker && !newSticker) {
        changes.push(`sticker ${i + 1} removed`)
      } else if (oldSticker && newSticker && oldSticker.id !== newSticker.id) {
        changes.push(`sticker ${i + 1} changed`)
      }
    }
  }

  // Check keychain
  if (oldSnapshot.keychain?.id !== newSnapshot.keychain?.id) {
    if (!oldSnapshot.keychain && newSnapshot.keychain) {
      changes.push('keychain added')
    } else if (oldSnapshot.keychain && !newSnapshot.keychain) {
      changes.push('keychain removed')
    } else {
      changes.push('keychain changed')
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
    else if (changes[0]?.includes('keychain') && changes[0]?.includes('added')) changeType = 'keychain_added'
    else if (changes[0]?.includes('keychain') && changes[0]?.includes('removed')) changeType = 'keychain_removed'
    else if (changes[0]?.includes('keychain') && changes[0]?.includes('changed')) changeType = 'keychain_modified'
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

    // Get skins data for skin name lookup
    const skinsData = await getSkinsDataAsync()

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
    const { changeType, description } = detectChangeType(oldSnapshot, newSnapshot, skinsData)

    // Don't record if nothing changed
    if (oldSnapshot && changeType === 'multiple_changes' && description === 'Configuration updated') {
      return
    }

    // Insert history record
    const versionId = generateVersionId()
    await db.insert(itemHistory).values({
      steamid: steamId,
      loadoutid: loadoutIdNum,
      item_type: 'weapon' as HistoryItemType,
      item_category: category as HistoryItemCategory,
      defindex,
      team,
      configuration: oldSnapshot || newSnapshot,
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

    // Insert history record
    const versionId = generateVersionId()
    await db.insert(itemHistory).values({
      steamid: steamId,
      loadoutid: loadoutIdNum,
      item_type: 'knife' as HistoryItemType,
      item_category: null,
      defindex,
      team,
      configuration: oldSnapshot || newSnapshot,
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

    // Insert history record
    const versionId = generateVersionId()
    await db.insert(itemHistory).values({
      steamid: steamId,
      loadoutid: loadoutIdNum,
      item_type: 'glove' as HistoryItemType,
      item_category: null,
      defindex,
      team,
      configuration: oldSnapshot || newSnapshot,
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
