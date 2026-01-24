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
            expect(() => validateTeam(3)).toThrow('Invalid team: 3');
            expect(() => validateTeam(null)).toThrow('Team is required');
        });
    });

    describe('validateStatTrak', () => {
        it('should validate valid StatTrak data', () => {
            expect(() => validateStatTrak({ statTrak: true, statTrakCount: 100 })).not.toThrow();
            expect(() => validateStatTrak({ statTrak: false, statTrakCount: 0 })).not.toThrow();
        });

        it('should throw for invalid StatTrak flag', () => {
            expect(() => validateStatTrak({ statTrak: 'true', statTrakCount: 100 } as any)).toThrow('Invalid StatTrak');
        });

        it('should throw for negative count', () => {
            expect(() => validateStatTrak({ statTrak: true, statTrakCount: -1 })).toThrow('Invalid StatTrak Count: -1');
        });
    });

    describe('validateNameTag', () => {
        it('should allow valid name tags', () => {
            expect(() => validateNameTag('Cool AK')).not.toThrow();
            expect(() => validateNameTag('')).not.toThrow();
            expect(() => validateNameTag(null)).not.toThrow();
        });

        it('should throw for long name tags', () => {
            expect(() => validateNameTag('A'.repeat(33))).toThrow('Invalid Name Tag');
        });
    });

    describe('validatePaintIndex', () => {
        it('should allow non-negative indices', () => {
            expect(() => validatePaintIndex(0)).not.toThrow();
            expect(() => validatePaintIndex(123)).not.toThrow();
        });

        it('should throw for negative indices', () => {
            expect(() => validatePaintIndex(-1)).toThrow('Invalid paint index: -1');
        });
    });

    describe('validatePaintSeed', () => {
        it('should allow non-negative seeds', () => {
            expect(() => validatePaintSeed(0)).not.toThrow();
            expect(() => validatePaintSeed(123)).not.toThrow();
        });

        it('should throw for negative seeds', () => {
            expect(() => validatePaintSeed(-1)).toThrow('Invalid paint seed: -1');
        });
    });

    describe('validatePaintWear', () => {
        it('should allow wear between 0 and 1', () => {
            expect(() => validatePaintWear(0)).not.toThrow();
            expect(() => validatePaintWear(0.5)).not.toThrow();
            expect(() => validatePaintWear(1)).not.toThrow();
        });

        it('should throw for wear out of range', () => {
            expect(() => validatePaintWear(-0.1)).toThrow('Invalid paint wear: -0.1');
            expect(() => validatePaintWear(1.1)).toThrow('Invalid paint wear: 1.1');
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
