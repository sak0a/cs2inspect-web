import { describe, expect, it } from 'bun:test'
import {
    createEmptyKeychain,
    createEmptySticker,
    fuzzySearch,
    getNestedValue,
    isValidGloveDefindex,
    isValidKnifeDefindex,
    isValidStickerSlot,
    isValidWeaponDefindex,
    multiFilter,
    multiSort,
    omit,
    parseKeychainString,
    parseStickerString,
    pick,
    setNestedValue,
    truncateString,
} from '../commonUtils'

describe('commonUtils extended coverage', () => {
    it('validates defindex ranges', () => {
        expect(isValidWeaponDefindex(1)).toBe(true)
        expect(isValidWeaponDefindex(64)).toBe(true)
        expect(isValidWeaponDefindex(65)).toBe(false)

        expect(isValidKnifeDefindex(500)).toBe(true)
        expect(isValidKnifeDefindex(42)).toBe(true)
        expect(isValidKnifeDefindex(499)).toBe(false)

        expect(isValidGloveDefindex(5000)).toBe(true)
        expect(isValidGloveDefindex(5035)).toBe(true)
        expect(isValidGloveDefindex(5036)).toBe(false)
    })

    it('parses sticker/keychain strings and handles empty placeholders', () => {
        expect(createEmptySticker()).toBe('0;0;0;0;0;0')
        expect(createEmptyKeychain()).toBe('0;0;0;0;0')
        expect(parseStickerString(createEmptySticker())).toBeNull()
        expect(parseKeychainString(createEmptyKeychain())).toBeNull()

        expect(parseStickerString('5032;0.2;0.3;0.1;1.0;7')).toEqual({
            id: 5032,
            x: 0.2,
            y: 0.3,
            wear: 0.1,
            scale: 1,
            rotation: 7,
        })

        expect(parseKeychainString('6001;0.5;0.25;0.75;9')).toEqual({
            id: 6001,
            x: 0.5,
            y: 0.25,
            z: 0.75,
            seed: 9,
        })
    })

    it('validates sticker slot bounds', () => {
        expect(isValidStickerSlot(0)).toBe(true)
        expect(isValidStickerSlot(4)).toBe(true)
        expect(isValidStickerSlot(5)).toBe(false)
    })

    it('handles string/object utilities', () => {
        expect(truncateString('abcdef', 4)).toBe('a...')
        expect(truncateString('abc', 10)).toBe('abc')

        const source = { a: 1, b: 2, c: 3 }
        expect(pick(source, ['a', 'c'])).toEqual({ a: 1, c: 3 })
        expect(omit(source, ['b'])).toEqual({ a: 1, c: 3 })
    })

    it('supports fuzzy matching and multi-filter', () => {
        expect(fuzzySearch('asiimov', 'AK-47 | Asiimov')).toBe(true)
        expect(fuzzySearch('asiimov', 'Hyper Beast', 0.9)).toBe(false)

        const items = [
            { name: 'AK-47 | Asiimov', rarity: { name: 'Covert' }, stats: { likes: 10 } },
            { name: 'M4A1-S | Printstream', rarity: { name: 'Classified' }, stats: { likes: 5 } },
        ]

        const filtered = multiFilter(
            items,
            {
                'rarity.name': 'covert',
                name: 'asi',
            },
            { caseSensitive: false }
        )
        expect(filtered).toHaveLength(1)

        const fuzzyFiltered = multiFilter(
            items,
            { name: 'Asiimov' },
            { fuzzySearch: true, fuzzyThreshold: 0.5 }
        )
        expect(fuzzyFiltered).toHaveLength(1)
    })

    it('gets/sets nested values and performs multi-sort', () => {
        const obj: Record<string, unknown> = {}
        setNestedValue(obj, 'skin.meta.rarity', 'covert')
        expect(getNestedValue(obj, 'skin.meta.rarity')).toBe('covert')
        expect(getNestedValue(obj, 'skin.meta.unknown')).toBeUndefined()

        const data = [
            { name: 'Bravo', price: 12, createdAt: '2024-01-01' },
            { name: 'Alpha', price: 12, createdAt: '2024-03-01' },
            { name: 'Charlie', price: 5, createdAt: '2023-12-01' },
        ]

        const sorted = multiSort(data, [
            { key: 'price', type: 'number', direction: 'desc' },
            { key: 'name', type: 'string', direction: 'asc' },
        ])
        expect(sorted.map((x) => x.name)).toEqual(['Alpha', 'Bravo', 'Charlie'])

        const byDate = multiSort(data, [{ key: 'createdAt', type: 'date', direction: 'asc' }])
        expect(byDate.map((x) => x.name)).toEqual(['Charlie', 'Bravo', 'Alpha'])
    })
})
