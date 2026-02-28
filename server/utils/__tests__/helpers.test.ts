import { describe, it, expect } from 'bun:test'
import { validateRequiredRequestData } from '../helpers'

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
