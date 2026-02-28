import { describe, it, expect } from 'bun:test'
import {
    createDefaultEnhancedKnife,
    validateRequiredRequestData,
    verifyUserAccess,
} from '../helpers'

describe('validateRequiredRequestData', () => {
    it('should throw error for missing param', () => {
        expect(() => validateRequiredRequestData(null, 'Test Param')).toThrow(
            'Test Param is required'
        )
    })

    it('should throw error for empty string', () => {
        expect(() => validateRequiredRequestData('', 'Test Param')).toThrow(
            'Test Param is required'
        )
    })

    it('should not throw for valid string', () => {
        expect(() => validateRequiredRequestData('value', 'Test Param')).not.toThrow()
    })

    it('should throw for 0 if allowZero is false (default)', () => {
        expect(() => validateRequiredRequestData(0, 'Test Param')).toThrow('Test Param is required')
    })

    it('should not throw for 0 when allowZero is true', () => {
        expect(() => validateRequiredRequestData(0, 'Test Param', true)).not.toThrow()
    })

    it('should not throw for number 100', () => {
        expect(() => validateRequiredRequestData(100, 'Test Param')).not.toThrow()
    })
})

describe('verifyUserAccess', () => {
    it('allows access when steamId matches auth context', () => {
        const event = { context: { auth: { steamId: '7656119' } } }
        expect(() => verifyUserAccess('7656119', event as never)).not.toThrow()
    })

    it('throws 401 when steamId mismatches auth context', () => {
        const event = { context: { auth: { steamId: 'other' } } }
        try {
            verifyUserAccess('7656119', event as never)
            throw new Error('expected throw')
        } catch (error: unknown) {
            const e = error as { statusCode: number; message: string }
            expect(e.statusCode).toBe(401)
            expect(e.message).toBe('Unauthorized access')
        }
    })
})

describe('createDefaultEnhancedKnife', () => {
    it('creates a knife fallback entry from base item', () => {
        const result = createDefaultEnhancedKnife<{
            weapon_name: string
            category: string
            paintIndex: number
            availableTeams: string
        }>({
            weapon_defindex: 507,
            weapon_name: 'weapon_knife_karambit',
            defaultName: 'Karambit',
            paintindex: 0,
            defaultImage: 'https://example.com/knife.png',
            category: 'knife',
            availableTeams: 'both',
        })

        expect(result).toHaveLength(1)
        expect(result[0]).toMatchObject({
            weapon_name: 'weapon_knife_karambit',
            category: 'knife',
            paintIndex: 0,
            availableTeams: 'both',
        })
    })
})
