import { describe, it, expect } from 'bun:test'
import type { APISkin, IDefaultItem } from '~/server/types'
import {
  findMatchingSkin,
  findSkinsByWeapon,
  findSkinsByRarity,
  findSkinByPaintIndex,
  filterSkins,
  detectDopplerPattern,
  removeStatTrakDuplicates,
  createDefaultItem,
  createEnhancedItemFromSkin,
  hasStickers,
  getStickerNames,
  hasKeychain,
  isValidPaintIndex,
  isValidFloat,
  formatSkinNameForDisplay,
  getRarityColorWithAlpha,
  getSkinCardGradient,
} from '../skinUtils'

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

function makeSkin(overrides: Partial<APISkin> = {}): APISkin {
  return {
    id: 'skin_1',
    name: 'AK-47 | Asiimov',
    image: 'https://example.com/skin.png',
    paint_index: '801',
    min_float: 0.05,
    max_float: 0.7,
    rarity: { id: 'covert', name: 'Covert', color: '#eb4b4b' },
    weapon: { id: 'weapon_ak47', name: 'AK-47', weapon_id: '7' },
    category: { id: 'rifles', name: 'Rifles' },
    pattern: { id: 'am_ak47_asiimov', name: 'Asiimov' },
    ...overrides,
  }
}

function makeDefaultItem(overrides: Partial<IDefaultItem> = {}): IDefaultItem {
  return {
    weapon_defindex: 7,
    weapon_name: 'weapon_ak47',
    defaultName: 'AK-47',
    paintindex: 0,
    defaultImage: 'https://example.com/default.png',
    category: 'rifles',
    availableTeams: 'both',
    ...overrides,
  }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('skinUtils', () => {
  // ===== MATCHING & FINDING =====

  describe('findMatchingSkin', () => {
    const skins = [
      makeSkin({
        paint_index: '38',
        weapon: { id: 'weapon_ak47', name: 'AK-47', weapon_id: '7' },
      }),
      makeSkin({
        paint_index: '344',
        weapon: { id: 'weapon_m4a1', name: 'M4A1-S', weapon_id: '16' },
        name: 'M4A1-S | Howl',
      }),
    ]

    it('should find a matching skin by weapon and paint index', () => {
      const base = { weapon_name: 'weapon_ak47' }
      const db = { paintindex: 38 }
      const result = findMatchingSkin(base, db, skins)
      expect(result).toBeDefined()
      expect(result!.paint_index).toBe('38')
    })

    it('should handle string paintindex from database', () => {
      const base = { weapon_name: 'weapon_ak47' }
      const db = { paintindex: '38' }
      const result = findMatchingSkin(base, db, skins)
      expect(result).toBeDefined()
    })

    it('should return undefined when databaseItem is undefined', () => {
      const base = { weapon_name: 'weapon_ak47' }
      expect(findMatchingSkin(base, undefined, skins)).toBeUndefined()
    })

    it('should return undefined when no match exists', () => {
      const base = { weapon_name: 'weapon_ak47' }
      const db = { paintindex: 9999 }
      expect(findMatchingSkin(base, db, skins)).toBeUndefined()
    })
  })

  describe('findSkinsByWeapon', () => {
    const skins = [
      makeSkin({ weapon: { id: 'weapon_ak47', name: 'AK-47', weapon_id: '7' } }),
      makeSkin({
        weapon: { id: 'weapon_ak47', name: 'AK-47', weapon_id: '7' },
        name: 'AK-47 | Redline',
        paint_index: '282',
      }),
      makeSkin({
        weapon: { id: 'weapon_m4a1', name: 'M4A1-S', weapon_id: '16' },
        name: 'M4A1-S | Howl',
      }),
    ]

    it('should return all skins for a given weapon', () => {
      const result = findSkinsByWeapon('weapon_ak47', skins)
      expect(result).toHaveLength(2)
    })

    it('should return empty array for unknown weapon', () => {
      expect(findSkinsByWeapon('weapon_unknown', skins)).toHaveLength(0)
    })
  })

  describe('findSkinsByRarity', () => {
    const skins = [
      makeSkin({ rarity: { id: 'covert', name: 'Covert', color: '#eb4b4b' } }),
      makeSkin({
        rarity: { id: 'classified', name: 'Classified', color: '#d32ce6' },
        name: 'AK-47 | Vulcan',
      }),
    ]

    it('should find skins by rarity name (case-insensitive)', () => {
      expect(findSkinsByRarity('covert', skins)).toHaveLength(1)
      expect(findSkinsByRarity('COVERT', skins)).toHaveLength(1)
    })

    it('should return empty array for unknown rarity', () => {
      expect(findSkinsByRarity('consumer', skins)).toHaveLength(0)
    })
  })

  describe('findSkinByPaintIndex', () => {
    const skins = [
      makeSkin({ paint_index: '801' }),
      makeSkin({ paint_index: '282', name: 'AK-47 | Redline' }),
    ]

    it('should find by string paint index', () => {
      expect(findSkinByPaintIndex('801', skins)?.name).toBe('AK-47 | Asiimov')
    })

    it('should find by numeric paint index', () => {
      expect(findSkinByPaintIndex(282, skins)?.name).toBe('AK-47 | Redline')
    })

    it('should return undefined for unknown index', () => {
      expect(findSkinByPaintIndex('9999', skins)).toBeUndefined()
    })
  })

  // ===== FILTERING =====

  describe('filterSkins', () => {
    const skins = [
      makeSkin({
        name: 'AK-47 | Asiimov',
        description: 'A sci-fi skin',
        weapon: { id: 'weapon_ak47', name: 'AK-47', weapon_id: '7' },
        rarity: { id: 'covert', name: 'Covert', color: '#eb4b4b' },
        category: { id: 'rifles', name: 'Rifles' },
        min_float: 0.05,
        max_float: 0.7,
        stattrak: true,
        souvenir: false,
        team: { id: 'both', name: 'Both' },
      }),
      makeSkin({
        name: 'USP-S | Kill Confirmed',
        description: 'Zombie themed',
        weapon: { id: 'weapon_usp_silencer', name: 'USP-S', weapon_id: '61' },
        rarity: { id: 'covert', name: 'Covert', color: '#eb4b4b' },
        category: { id: 'pistols', name: 'Pistols' },
        min_float: 0.0,
        max_float: 0.5,
        stattrak: false,
        souvenir: true,
        team: { id: 'ct', name: 'Counter-Terrorist' },
      }),
    ]

    it('should filter by search term in name', () => {
      expect(filterSkins(skins, { search: 'asiimov' })).toHaveLength(1)
    })

    it('should filter by search term in description', () => {
      expect(filterSkins(skins, { search: 'zombie' })).toHaveLength(1)
    })

    it('should filter by weapon', () => {
      expect(filterSkins(skins, { weapon: 'ak47' })).toHaveLength(1)
    })

    it('should filter by rarity', () => {
      expect(filterSkins(skins, { rarity: 'Covert' })).toHaveLength(2)
    })

    it('should filter by category', () => {
      expect(filterSkins(skins, { category: 'Pistols' })).toHaveLength(1)
    })

    it('should filter by minFloat', () => {
      expect(filterSkins(skins, { minFloat: 0.01 })).toHaveLength(1)
    })

    it('should filter by maxFloat', () => {
      expect(filterSkins(skins, { maxFloat: 0.6 })).toHaveLength(1)
    })

    it('should filter by stattrak', () => {
      expect(filterSkins(skins, { stattrak: true })).toHaveLength(1)
    })

    it('should filter by souvenir', () => {
      expect(filterSkins(skins, { souvenir: true })).toHaveLength(1)
    })

    it('should filter by team', () => {
      expect(filterSkins(skins, { team: 'Counter-Terrorist' })).toHaveLength(1)
    })

    it('should combine multiple criteria', () => {
      expect(filterSkins(skins, { rarity: 'Covert', stattrak: true })).toHaveLength(1)
    })

    it('should return all skins when no criteria provided', () => {
      expect(filterSkins(skins, {})).toHaveLength(2)
    })

    it('should support case-sensitive search', () => {
      expect(filterSkins(skins, { search: 'Asiimov' }, { caseSensitive: true })).toHaveLength(1)
      expect(filterSkins(skins, { search: 'asiimov' }, { caseSensitive: true })).toHaveLength(0)
    })
  })

  // ===== DATA PROCESSING =====

  describe('detectDopplerPattern', () => {
    it('should append phase name for known patterns', () => {
      const patterns: [string, string][] = [
        ['emerald_marbleized', 'Emerald'],
        ['ruby_marbleized', 'Ruby'],
        ['sapphire_marbleized', 'Sapphire'],
        ['blackpearl_marbleized', 'Black Pearl'],
        ['phase1', 'Phase 1'],
        ['phase2', 'Phase 2'],
        ['phase3', 'Phase 3'],
        ['phase4', 'Phase 4'],
      ]

      for (const [patternId, expectedSuffix] of patterns) {
        const skin = makeSkin({
          name: 'Karambit | Doppler',
          pattern: { id: `am_${patternId}`, name: 'Doppler' },
        })
        const result = detectDopplerPattern(skin)
        expect(result.name).toBe(`Karambit | Doppler (${expectedSuffix})`)
      }
    })

    it('should not modify skins without pattern id', () => {
      const skin = makeSkin({ name: 'AK-47 | Redline', pattern: { id: '', name: '' } })
      const result = detectDopplerPattern(skin)
      expect(result.name).toBe('AK-47 | Redline')
    })

    it('should not modify skins with non-Doppler patterns', () => {
      const skin = makeSkin({
        name: 'AK-47 | Asiimov',
        pattern: { id: 'am_ak47_asiimov', name: 'Asiimov' },
      })
      const result = detectDopplerPattern(skin)
      expect(result.name).toBe('AK-47 | Asiimov')
    })
  })

  describe('removeStatTrakDuplicates', () => {
    it('should keep first occurrence and non-StatTrak duplicates', () => {
      const skins = [
        makeSkin({
          stattrak: true,
          weapon: { id: 'weapon_ak47', name: 'AK-47', weapon_id: '7' },
          paint_index: '801',
        }),
        makeSkin({
          stattrak: false,
          weapon: { id: 'weapon_ak47', name: 'AK-47', weapon_id: '7' },
          paint_index: '801',
        }),
      ]
      const result = removeStatTrakDuplicates(skins)
      // First is kept (first seen), second is kept (not stattrak)
      expect(result).toHaveLength(2)
    })

    it('should remove StatTrak duplicates that appear after the first', () => {
      const skins = [
        makeSkin({
          stattrak: false,
          weapon: { id: 'weapon_ak47', name: 'AK-47', weapon_id: '7' },
          paint_index: '801',
        }),
        makeSkin({
          stattrak: true,
          weapon: { id: 'weapon_ak47', name: 'AK-47', weapon_id: '7' },
          paint_index: '801',
        }),
      ]
      const result = removeStatTrakDuplicates(skins)
      // First is kept (first seen), second is removed (stattrak duplicate)
      expect(result).toHaveLength(1)
      expect(result[0]!.stattrak).toBe(false)
    })

    it('should keep skins with different weapon/paint_index combos', () => {
      const skins = [
        makeSkin({
          weapon: { id: 'weapon_ak47', name: 'AK-47', weapon_id: '7' },
          paint_index: '801',
        }),
        makeSkin({
          weapon: { id: 'weapon_ak47', name: 'AK-47', weapon_id: '7' },
          paint_index: '282',
        }),
      ]
      const result = removeStatTrakDuplicates(skins)
      expect(result).toHaveLength(2)
    })

    it('should handle empty array', () => {
      expect(removeStatTrakDuplicates([])).toHaveLength(0)
    })
  })

  // ===== ENHANCEMENT =====

  describe('createDefaultItem', () => {
    it('should create a single-element array with default values', () => {
      const base = makeDefaultItem()
      const result = createDefaultItem(base)
      expect(result).toHaveLength(1)
      expect(result[0]).toMatchObject({
        weapon_defindex: 7,
        weapon_name: 'weapon_ak47',
        name: 'AK-47',
        defaultName: 'AK-47',
        paintindex: 0,
        minFloat: 0,
        maxFloat: 1,
      })
    })
  })

  describe('createEnhancedItemFromSkin', () => {
    it('should merge base item with skin data', () => {
      const base = makeDefaultItem()
      const skin = makeSkin({
        name: 'AK-47 | Asiimov',
        image: 'https://example.com/asiimov.png',
        min_float: 0.05,
        max_float: 0.7,
        paint_index: '801',
        rarity: { id: 'covert', name: 'Covert', color: '#eb4b4b' },
      })
      const result = createEnhancedItemFromSkin(base, skin)
      expect(result.name).toBe('AK-47 | Asiimov')
      expect(result.image).toBe('https://example.com/asiimov.png')
      expect(result.minFloat).toBe(0.05)
      expect(result.maxFloat).toBe(0.7)
      expect(result.paintindex).toBe(801)
      expect(result.rarity?.name).toBe('Covert')
    })

    it('should set team to 1 for terrorist skins', () => {
      const base = makeDefaultItem()
      const skin = makeSkin({ team: { id: 't', name: 'Terrorist' } })
      const result = createEnhancedItemFromSkin(base, skin)
      expect(result.team).toBe(1)
    })

    it('should set team to 2 for CT skins', () => {
      const base = makeDefaultItem()
      const skin = makeSkin({ team: { id: 'ct', name: 'Counter-Terrorist' } })
      const result = createEnhancedItemFromSkin(base, skin)
      expect(result.team).toBe(2)
    })

    it('should set team to null when no team', () => {
      const base = makeDefaultItem()
      const skin = makeSkin({ team: undefined })
      const result = createEnhancedItemFromSkin(base, skin)
      expect(result.team).toBeNull()
    })
  })

  // ===== VALIDATION =====

  describe('hasStickers', () => {
    it('should return true when stickers array is non-empty', () => {
      expect(hasStickers({ stickers: [{ id: 1 }] })).toBe(true)
    })

    it('should return false when stickers array is empty', () => {
      expect(hasStickers({ stickers: [] })).toBe(false)
    })

    it('should return false when stickers is undefined', () => {
      expect(hasStickers({})).toBe(false)
    })

    it('should return false when stickers is not an array', () => {
      expect(hasStickers({ stickers: 'invalid' })).toBe(false)
    })
  })

  describe('getStickerNames', () => {
    it('should extract names from api field', () => {
      const skin = {
        stickers: [{ api: { name: 'Sticker A' } }, { api: { name: 'Sticker B' } }],
      }
      expect(getStickerNames(skin)).toEqual(['Sticker A', 'Sticker B'])
    })

    it('should fall back to name field', () => {
      const skin = {
        stickers: [{ name: 'Sticker C' }],
      }
      expect(getStickerNames(skin)).toEqual(['Sticker C'])
    })

    it('should filter out empty names', () => {
      const skin = {
        stickers: [{ api: { name: 'Sticker A' } }, {}],
      }
      expect(getStickerNames(skin)).toEqual(['Sticker A'])
    })

    it('should return empty array when no stickers', () => {
      expect(getStickerNames({})).toEqual([])
    })
  })

  describe('hasKeychain', () => {
    it('should return true for valid keychain', () => {
      expect(hasKeychain({ keychain: { id: 5 } })).toBe(true)
    })

    it('should return false for id 0', () => {
      expect(hasKeychain({ keychain: { id: 0 } })).toBe(false)
    })

    it('should return false for undefined keychain', () => {
      expect(hasKeychain({})).toBe(false)
    })

    it('should return false for keychain without id', () => {
      expect(hasKeychain({ keychain: {} })).toBe(false)
    })
  })

  describe('isValidPaintIndex', () => {
    it('should accept valid paint indices', () => {
      expect(isValidPaintIndex(0)).toBe(true)
      expect(isValidPaintIndex(801)).toBe(true)
      expect(isValidPaintIndex('282')).toBe(true)
    })

    it('should reject negative values', () => {
      expect(isValidPaintIndex(-1)).toBe(false)
    })

    it('should reject NaN-producing values', () => {
      expect(isValidPaintIndex('abc')).toBe(false)
    })
  })

  describe('isValidFloat', () => {
    it('should accept values within default range', () => {
      expect(isValidFloat(0)).toBe(true)
      expect(isValidFloat(0.5)).toBe(true)
      expect(isValidFloat(1)).toBe(true)
    })

    it('should reject values outside default range', () => {
      expect(isValidFloat(-0.1)).toBe(false)
      expect(isValidFloat(1.1)).toBe(false)
    })

    it('should accept values within custom range', () => {
      expect(isValidFloat(0.3, 0.2, 0.8)).toBe(true)
    })

    it('should reject values outside custom range', () => {
      expect(isValidFloat(0.1, 0.2, 0.8)).toBe(false)
      expect(isValidFloat(0.9, 0.2, 0.8)).toBe(false)
    })

    it('should accept boundary values', () => {
      expect(isValidFloat(0.2, 0.2, 0.8)).toBe(true)
      expect(isValidFloat(0.8, 0.2, 0.8)).toBe(true)
    })
  })

  // ===== DISPLAY =====

  describe('formatSkinNameForDisplay', () => {
    it('should remove weapon name prefix', () => {
      expect(formatSkinNameForDisplay('AK-47 | Asiimov', 'AK-47')).toBe('Asiimov')
    })

    it('should remove star prefix and weapon name', () => {
      expect(formatSkinNameForDisplay('★ Karambit | Doppler', 'Karambit')).toBe('Doppler')
    })

    it('should handle names without pipe separator', () => {
      expect(formatSkinNameForDisplay('Vanilla', 'Karambit')).toBe('Vanilla')
    })

    it('should trim result whitespace', () => {
      expect(formatSkinNameForDisplay('AK-47 | Redline  ', 'AK-47')).toBe('Redline')
    })
  })

  describe('getRarityColorWithAlpha', () => {
    it('should convert rarity color to rgba', () => {
      const result = getRarityColorWithAlpha({ color: '#eb4b4b' }, '0.15')
      expect(result).toBe('rgba(235, 75, 75, 0.15)')
    })

    it('should use fallback color when rarity is undefined', () => {
      const result = getRarityColorWithAlpha(undefined)
      expect(result).toBe('rgba(49, 48, 48, 0.15)')
    })

    it('should accept numeric alpha', () => {
      const result = getRarityColorWithAlpha({ color: '#ffffff' }, 0.5)
      expect(result).toBe('rgba(255, 255, 255, 0.5)')
    })
  })

  describe('getSkinCardGradient', () => {
    it('should return a linear gradient string', () => {
      const result = getSkinCardGradient({ color: '#eb4b4b' })
      expect(result).toContain('linear-gradient(135deg, #101010,')
      expect(result).toContain('rgba(235, 75, 75,')
    })

    it('should use fallback for undefined rarity', () => {
      const result = getSkinCardGradient(undefined)
      expect(result).toContain('linear-gradient(135deg, #101010,')
      expect(result).toContain('rgba(49, 48, 48,')
    })
  })
})
