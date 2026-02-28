import { describe, it, expect } from 'bun:test'
import {
    effectLabelForSticker,
    buildAvailableEffects,
    buildAllowedEffectSet,
} from '../stickerEffects'

describe('stickerEffects', () => {
    describe('effectLabelForSticker', () => {
        it('should return "Paper" for undefined', () => {
            expect(effectLabelForSticker(undefined)).toBe('Paper')
        })

        it('should return "Paper" for "Other"', () => {
            expect(effectLabelForSticker('Other')).toBe('Paper')
        })

        it('should pass through named effects', () => {
            expect(effectLabelForSticker('Holo')).toBe('Holo')
            expect(effectLabelForSticker('Foil')).toBe('Foil')
            expect(effectLabelForSticker('Glitter')).toBe('Glitter')
            expect(effectLabelForSticker('Gold')).toBe('Gold')
            expect(effectLabelForSticker('Lenticular')).toBe('Lenticular')
        })
    })

    describe('buildAvailableEffects', () => {
        it('should return empty array for empty items', () => {
            expect(buildAvailableEffects([])).toEqual([])
        })

        it('should include Paper when items have no effect', () => {
            const items = [{ effect: undefined }, { effect: 'Other' }]
            const effects = buildAvailableEffects(items)
            expect(effects).toContainEqual({ id: 'Paper', label: 'Paper' })
        })

        it('should respect EFFECT_ORDER', () => {
            const items = [
                { effect: 'Gold' },
                { effect: 'Holo' },
                { effect: undefined },
                { effect: 'Foil' },
            ]
            const effects = buildAvailableEffects(items)
            const ids = effects.map((e) => e.id)
            expect(ids).toEqual(['Paper', 'Holo', 'Foil', 'Gold'])
        })

        it('should include extra effects not in the standard map', () => {
            const items = [{ effect: 'Embroidered' }, { effect: 'Holo' }]
            const effects = buildAvailableEffects(items)
            const ids = effects.map((e) => e.id)
            expect(ids).toContain('Holo')
            expect(ids).toContain('Embroidered')
            // Extras come after standard effects
            expect(ids.indexOf('Holo')).toBeLessThan(ids.indexOf('Embroidered'))
        })

        it('should not include effects that are not present in items', () => {
            const items = [{ effect: 'Holo' }]
            const effects = buildAvailableEffects(items)
            const ids = effects.map((e) => e.id)
            expect(ids).toEqual(['Holo'])
            expect(ids).not.toContain('Paper')
            expect(ids).not.toContain('Foil')
        })
    })

    describe('buildAllowedEffectSet', () => {
        it('should map Paper to both Paper and Other', () => {
            const set = buildAllowedEffectSet(['Paper'])
            expect(set.has('Paper')).toBe(true)
            expect(set.has('Other')).toBe(true)
        })

        it('should map standard effects to their values', () => {
            const set = buildAllowedEffectSet(['Holo'])
            expect(set.has('Holo')).toBe(true)
            expect(set.size).toBe(1)
        })

        it('should handle multiple filters', () => {
            const set = buildAllowedEffectSet(['Paper', 'Holo', 'Gold'])
            expect(set.has('Paper')).toBe(true)
            expect(set.has('Other')).toBe(true)
            expect(set.has('Holo')).toBe(true)
            expect(set.has('Gold')).toBe(true)
        })

        it('should use the ID itself for unknown effects', () => {
            const set = buildAllowedEffectSet(['Embroidered'])
            expect(set.has('Embroidered')).toBe(true)
            expect(set.size).toBe(1)
        })

        it('should return empty set for empty input', () => {
            const set = buildAllowedEffectSet([])
            expect(set.size).toBe(0)
        })
    })
})
