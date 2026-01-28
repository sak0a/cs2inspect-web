import { describe, it, expect } from 'bun:test';
import {
    validateTeam,
    validateStatTrak,
    validateNameTag,
    validatePaintIndex,
    validatePaintSeed,
    validatePaintWear,
    validateActive
} from '../validation/common';

describe('validation/common', () => {
    describe('validateTeam', () => {
        it('should allow team 1 and 2', () => {
            expect(() => validateTeam(1)).not.toThrow();
            expect(() => validateTeam(2)).not.toThrow();
        });

        it('should throw for invalid teams', () => {
            // Updated error message includes context about valid values
            expect(() => validateTeam(3)).toThrow('Invalid team: 3. Must be 1 (Terrorist) or 2 (Counter-Terrorist)');
            expect(() => validateTeam(null)).toThrow('Team is required');
        });
    });

    describe('validateStatTrak', () => {
        it('should validate valid StatTrak data', () => {
            // Uses database column names: stattrak_enabled, stattrak_count
            expect(() => validateStatTrak({ stattrak_enabled: true, stattrak_count: 100 })).not.toThrow();
            expect(() => validateStatTrak({ stattrak_enabled: false, stattrak_count: 0 })).not.toThrow();
        });

        it('should throw for invalid StatTrak flag', () => {
            expect(() => validateStatTrak({ stattrak_enabled: 'true', stattrak_count: 100 } as any)).toThrow('Invalid StatTrak');
        });

        it('should throw for negative count', () => {
            expect(() => validateStatTrak({ stattrak_enabled: true, stattrak_count: -1 })).toThrow('Invalid StatTrak Count');
        });
    });

    describe('validateNameTag', () => {
        it('should allow valid name tags', () => {
            expect(() => validateNameTag('Cool AK')).not.toThrow();
            expect(() => validateNameTag('')).not.toThrow();
            expect(() => validateNameTag(null)).not.toThrow();
            expect(() => validateNameTag(undefined)).not.toThrow();
        });

        it('should throw for long name tags', () => {
            // Updated error message includes constraint info
            expect(() => validateNameTag('A'.repeat(33))).toThrow('Invalid Name Tag: must be a string with max 32 characters');
        });
    });

    describe('validatePaintIndex', () => {
        it('should allow non-negative indices', () => {
            expect(() => validatePaintIndex(0)).not.toThrow();
            expect(() => validatePaintIndex(123)).not.toThrow();
        });

        it('should allow string numbers', () => {
            expect(() => validatePaintIndex('0')).not.toThrow();
            expect(() => validatePaintIndex('123')).not.toThrow();
        });

        it('should throw for negative indices', () => {
            // Updated error message includes constraint info
            expect(() => validatePaintIndex(-1)).toThrow('Invalid paint index: -1. Must be a non-negative integer');
        });
    });

    describe('validatePaintSeed', () => {
        it('should allow non-negative seeds', () => {
            expect(() => validatePaintSeed(0)).not.toThrow();
            expect(() => validatePaintSeed(123)).not.toThrow();
        });

        it('should allow string numbers', () => {
            expect(() => validatePaintSeed('0')).not.toThrow();
            expect(() => validatePaintSeed('123')).not.toThrow();
        });

        it('should throw for negative seeds', () => {
            // Updated error message includes constraint info
            expect(() => validatePaintSeed(-1)).toThrow('Invalid paint seed: -1. Must be a non-negative integer');
        });
    });

    describe('validatePaintWear', () => {
        it('should allow wear between 0 and 1', () => {
            expect(() => validatePaintWear(0)).not.toThrow();
            expect(() => validatePaintWear(0.5)).not.toThrow();
            expect(() => validatePaintWear(1)).not.toThrow();
        });

        it('should throw for wear out of range', () => {
            // Updated error message includes constraint info
            expect(() => validatePaintWear(-0.1)).toThrow('Invalid paint wear: -0.1. Must be a number between 0 and 1');
            expect(() => validatePaintWear(1.1)).toThrow('Invalid paint wear: 1.1. Must be a number between 0 and 1');
        });
    });

    describe('validateActive', () => {
        it('should allow boolean active flag', () => {
            expect(() => validateActive(true)).not.toThrow();
            expect(() => validateActive(false)).not.toThrow();
        });

        it('should throw for non-boolean active flag', () => {
            expect(() => validateActive('true' as any)).toThrow('Invalid Active');
        });
    });
});
