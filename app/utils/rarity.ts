/**
 * Rarity ranking utilities for sorting and filtering items.
 *
 * Two rank maps exist because skins (weapons/knives/gloves) and
 * sticker-like items (stickers, keychains, wrapped stickers) use
 * different rarity ID schemes in the CS2 dataset.
 */

/** Rank map for weapon / knife / glove skins */
const SKIN_RARITY_RANK: Record<string, number> = {
  consumer: 1,
  industrial: 2,
  milspec: 3,
  restricted: 4,
  classified: 5,
  covert: 6,
  extraordinary: 7,
}

/** Rank map for stickers / keychains (ids are prefixed with "rarity_") */
const STICKER_RARITY_RANK: Record<string, number> = {
  default: 1,
  rare: 2,
  mythical: 3,
  legendary: 4,
  ancient: 5,
  contraband: 6,
}

/**
 * Get a numeric rank for a skin rarity id (consumer → 1, covert → 6, etc.)
 */
export function skinRarityRank(rarityId: string | undefined): number {
  const id = (rarityId || '').toLowerCase()
  return SKIN_RARITY_RANK[id] ?? 0
}

/**
 * Get a numeric rank for a sticker/keychain rarity id.
 * Handles the `rarity_` prefix used in the sticker dataset.
 */
export function stickerRarityRank(rarityId: string | undefined): number {
  const raw = (rarityId || '').toLowerCase()
  const id = raw.replace(/^rarity_/, '')
  return STICKER_RARITY_RANK[id] ?? 0
}

/**
 * Toggle a value in a string array – returns a new array with the value
 * added (if absent) or removed (if present). Useful for rarity / effect
 * filter toggle buttons.
 */
export function toggleFilterId(currentIds: string[], id: string): string[] {
  const set = new Set(currentIds)
  if (set.has(id)) set.delete(id)
  else set.add(id)
  return Array.from(set)
}
