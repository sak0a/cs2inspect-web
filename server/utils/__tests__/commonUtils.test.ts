import { describe, it, expect } from 'bun:test'
import {
  detectItemType,
  safeParseNumber,
  safeParseInt,
  clamp,
  isEmpty,
  capitalize,
  toKebabCase,
  toCamelCase,
  uniqueBy,
  groupBy,
} from '../commonUtils'

describe('commonUtils', () => {
  describe('detectItemType', () => {
    it('should detect weapons', () => {
      expect(detectItemType(7)).toBe('weapon') // AK-47
      expect(detectItemType(1)).toBe('weapon') // Desert Eagle
    })

    it('should detect knives', () => {
      expect(detectItemType(500)).toBe('knife') // Bayonet
      expect(detectItemType(508)).toBe('knife') // M9 Bayonet
      expect(detectItemType(42)).toBe('knife') // Knife (Additional)
    })

    it('should detect gloves', () => {
      expect(detectItemType(5027)).toBe('glove') // Bloodhound Gloves
      expect(detectItemType(5035)).toBe('glove') // Hand Wraps
    })
  })

  describe('safeParseNumber', () => {
    it('should parse valid numbers', () => {
      expect(safeParseNumber(10.5)).toBe(10.5)
      expect(safeParseNumber('10.5')).toBe(10.5)
    })

    it('should return default for invalid input', () => {
      expect(safeParseNumber(NaN)).toBe(0)
      expect(safeParseNumber('abc', 5)).toBe(5)
      expect(safeParseNumber(undefined, 10)).toBe(10)
    })
  })

  describe('safeParseInt', () => {
    it('should parse valid integers', () => {
      expect(safeParseInt(10)).toBe(10)
      expect(safeParseInt('10.9')).toBe(10)
    })

    it('should return default for invalid input', () => {
      expect(safeParseInt('abc', 5)).toBe(5)
    })
  })

  describe('clamp', () => {
    it('should clamp values', () => {
      expect(clamp(5, 0, 10)).toBe(5)
      expect(clamp(-5, 0, 10)).toBe(0)
      expect(clamp(15, 0, 10)).toBe(10)
    })
  })

  describe('string utilities', () => {
    it('isEmpty', () => {
      expect(isEmpty('')).toBe(true)
      expect(isEmpty('  ')).toBe(true)
      expect(isEmpty('a')).toBe(false)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(isEmpty(null as any)).toBe(true)
    })

    it('capitalize', () => {
      expect(capitalize('hello')).toBe('Hello')
      expect(capitalize('HELLO')).toBe('Hello')
      expect(capitalize('')).toBe('')
    })

    it('toKebabCase', () => {
      expect(toKebabCase('CamelCase')).toBe('camel-case')
      expect(toKebabCase('Space Case')).toBe('space-case')
      expect(toKebabCase('snake_case')).toBe('snake-case')
    })

    it('toCamelCase', () => {
      expect(toCamelCase('kebab-case')).toBe('kebabCase')
      expect(toCamelCase('snake_case')).toBe('snakeCase')
      expect(toCamelCase('Space Case')).toBe('spaceCase')
    })
  })

  describe('collection utilities', () => {
    it('uniqueBy', () => {
      const data = [
        { id: 1, name: 'a' },
        { id: 1, name: 'b' },
        { id: 2, name: 'c' },
      ]
      const result = uniqueBy(data, (item) => item.id)
      expect(result).toHaveLength(2)
      expect(result[0]!.name).toBe('a')
      expect(result[1]!.name).toBe('c')
    })

    it('groupBy', () => {
      const data = [
        { type: 'a', val: 1 },
        { type: 'b', val: 2 },
        { type: 'a', val: 3 },
      ]
      const result = groupBy(data, (item) => item.type)
      expect(result.a).toHaveLength(2)
      expect(result.b).toHaveLength(1)
      expect(result.a![0]!.val).toBe(1)
      expect(result.a![1]!.val).toBe(3)
    })
  })
})
