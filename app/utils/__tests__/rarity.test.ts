import { describe, it, expect } from 'bun:test'
import { skinRarityRank, stickerRarityRank, toggleFilterId } from '../rarity'

describe('rarity', () => {
  describe('skinRarityRank', () => {
    it('should return correct ranks for all skin rarities', () => {
      expect(skinRarityRank('consumer')).toBe(1)
      expect(skinRarityRank('industrial')).toBe(2)
      expect(skinRarityRank('milspec')).toBe(3)
      expect(skinRarityRank('restricted')).toBe(4)
      expect(skinRarityRank('classified')).toBe(5)
      expect(skinRarityRank('covert')).toBe(6)
      expect(skinRarityRank('extraordinary')).toBe(7)
    })

    it('should be case-insensitive', () => {
      expect(skinRarityRank('COVERT')).toBe(6)
      expect(skinRarityRank('Restricted')).toBe(4)
    })

    it('should return 0 for unknown rarities', () => {
      expect(skinRarityRank('legendary')).toBe(0)
      expect(skinRarityRank('nonexistent')).toBe(0)
    })

    it('should return 0 for undefined', () => {
      expect(skinRarityRank(undefined)).toBe(0)
    })

    it('should return 0 for empty string', () => {
      expect(skinRarityRank('')).toBe(0)
    })
  })

  describe('stickerRarityRank', () => {
    it('should return correct ranks for all sticker rarities', () => {
      expect(stickerRarityRank('default')).toBe(1)
      expect(stickerRarityRank('rare')).toBe(2)
      expect(stickerRarityRank('mythical')).toBe(3)
      expect(stickerRarityRank('legendary')).toBe(4)
      expect(stickerRarityRank('ancient')).toBe(5)
      expect(stickerRarityRank('contraband')).toBe(6)
    })

    it('should strip rarity_ prefix', () => {
      expect(stickerRarityRank('rarity_default')).toBe(1)
      expect(stickerRarityRank('rarity_rare')).toBe(2)
      expect(stickerRarityRank('rarity_contraband')).toBe(6)
    })

    it('should be case-insensitive', () => {
      expect(stickerRarityRank('RARE')).toBe(2)
      expect(stickerRarityRank('Rarity_Mythical')).toBe(3)
    })

    it('should return 0 for unknown rarities', () => {
      expect(stickerRarityRank('covert')).toBe(0)
      expect(stickerRarityRank('nonexistent')).toBe(0)
    })

    it('should return 0 for undefined', () => {
      expect(stickerRarityRank(undefined)).toBe(0)
    })
  })

  describe('toggleFilterId', () => {
    it('should add a new ID', () => {
      expect(toggleFilterId([], 'covert')).toEqual(['covert'])
      expect(toggleFilterId(['rare'], 'covert')).toEqual(['rare', 'covert'])
    })

    it('should remove an existing ID', () => {
      expect(toggleFilterId(['rare', 'covert'], 'rare')).toEqual(['covert'])
    })

    it('should handle toggling the only element', () => {
      expect(toggleFilterId(['rare'], 'rare')).toEqual([])
    })

    it('should not create duplicates if ID already exists', () => {
      const result = toggleFilterId(['rare', 'covert'], 'rare')
      expect(result.filter((id) => id === 'rare')).toHaveLength(0)
    })

    it('should return a new array, not mutate the input', () => {
      const original = ['rare', 'covert']
      const result = toggleFilterId(original, 'mythical')
      expect(result).not.toBe(original)
      expect(original).toHaveLength(2)
    })
  })
})
