import { describe, it, expect } from 'bun:test'
import { isWeaponMatch, getPossibleApiWeaponIds, normalizeWeaponName } from '../weaponNameMapping'

describe('weaponNameMapping', () => {
  describe('isWeaponMatch', () => {
    it('should match identical weapon names', () => {
      expect(isWeaponMatch('weapon_ak47', 'weapon_ak47')).toBe(true)
      expect(isWeaponMatch('weapon_awp', 'weapon_awp')).toBe(true)
    })

    it('should match case-insensitively', () => {
      expect(isWeaponMatch('weapon_ak47', 'WEAPON_AK47')).toBe(true)
      expect(isWeaponMatch('WEAPON_AWP', 'weapon_awp')).toBe(true)
    })

    it('should match knives to their sfui_wpnhud variants', () => {
      expect(isWeaponMatch('weapon_bayonet', 'sfui_wpnhud_knifebayonet')).toBe(true)
      expect(isWeaponMatch('weapon_knife_karambit', 'sfui_wpnhud_knifekarambit')).toBe(true)
      expect(isWeaponMatch('weapon_knife_m9_bayonet', 'sfui_wpnhud_knifem9')).toBe(true)
    })

    it('should not cross-contaminate different knife types', () => {
      expect(isWeaponMatch('weapon_bayonet', 'sfui_wpnhud_knifekarambit')).toBe(false)
      expect(isWeaponMatch('weapon_knife_butterfly', 'sfui_wpnhud_knifebayonet')).toBe(false)
      expect(isWeaponMatch('weapon_knife_flip', 'weapon_knife_gut')).toBe(false)
    })

    it('should return false for empty inputs', () => {
      expect(isWeaponMatch('', 'weapon_ak47')).toBe(false)
      expect(isWeaponMatch('weapon_ak47', '')).toBe(false)
      expect(isWeaponMatch('', '')).toBe(false)
    })

    it('should return false for unrelated weapons', () => {
      expect(isWeaponMatch('weapon_ak47', 'weapon_m4a1')).toBe(false)
      expect(isWeaponMatch('weapon_awp', 'weapon_ssg08')).toBe(false)
    })
  })

  describe('getPossibleApiWeaponIds', () => {
    it('should return mapped IDs for weapons with mappings', () => {
      const ids = getPossibleApiWeaponIds('weapon_bayonet')
      expect(ids).toContain('weapon_bayonet')
      expect(ids).toContain('sfui_wpnhud_knifebayonet')
      expect(ids).toHaveLength(2)
    })

    it('should return single-element array for simple weapons', () => {
      const ids = getPossibleApiWeaponIds('weapon_ak47')
      expect(ids).toEqual(['weapon_ak47'])
    })

    it('should return the original query for unmapped weapons', () => {
      const ids = getPossibleApiWeaponIds('some_unknown_weapon')
      expect(ids).toEqual(['some_unknown_weapon'])
    })

    it('should return empty array for empty input', () => {
      expect(getPossibleApiWeaponIds('')).toEqual([])
    })

    it('should return a copy, not a reference to the internal mapping', () => {
      const ids1 = getPossibleApiWeaponIds('weapon_bayonet')
      const ids2 = getPossibleApiWeaponIds('weapon_bayonet')
      expect(ids1).not.toBe(ids2)
      expect(ids1).toEqual(ids2)
    })
  })

  describe('normalizeWeaponName', () => {
    it('should strip weapon_ prefix', () => {
      expect(normalizeWeaponName('weapon_ak47')).toBe('ak47')
      expect(normalizeWeaponName('weapon_knife_karambit')).toBe('knife_karambit')
    })

    it('should strip sfui_wpnhud_ prefix', () => {
      expect(normalizeWeaponName('sfui_wpnhud_knifebayonet')).toBe('knifebayonet')
    })

    it('should lowercase and trim', () => {
      expect(normalizeWeaponName('  WEAPON_AK47  ')).toBe('ak47')
    })

    it('should return empty string for empty input', () => {
      expect(normalizeWeaponName('')).toBe('')
    })

    it('should pass through names without known prefixes', () => {
      expect(normalizeWeaponName('studded_bloodhound_gloves')).toBe('studded_bloodhound_gloves')
    })
  })
})
