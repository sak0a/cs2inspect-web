import { describe, it, expect } from 'bun:test';
import {
    weaponSaveBodySchema,
    knifeSaveBodySchema,
    gloveSaveBodySchema,
    loadoutCreateBodySchema,
    resetRequestSchema,
} from '../../database/schema/zod';
import { parseBodyWithSchema } from '../validation/zodHelpers';

const validWeaponBody = {
    team: 1,
    defindex: 7,
    paintindex: 38,
    paintseed: 123,
    paintwear: 0.05,
    active: true,
    stattrak_enabled: false,
    stattrak_count: 0,
    nametag: null,
};

const validKnifeBody = {
    team: 2,
    defindex: 500,
    paintindex: 12,
    paintseed: 50,
    paintwear: 0.2,
    active: true,
    stattrak_enabled: true,
    stattrak_count: 100,
    nametag: 'My Knife',
};

const validGloveBody = {
    team: 1,
    defindex: 5027,
    paintindex: 10006,
    paintseed: 0,
    paintwear: 0.0,
    active: true,
};

describe('Zod schema validation', () => {
    describe('weaponSaveBodySchema', () => {
        it('should accept valid weapon body', () => {
            expect(() => weaponSaveBodySchema.parse(validWeaponBody)).not.toThrow();
        });

        it('should reject invalid team', () => {
            expect(() => weaponSaveBodySchema.parse({ ...validWeaponBody, team: 3 })).toThrow();
            expect(() => weaponSaveBodySchema.parse({ ...validWeaponBody, team: 0 })).toThrow();
        });

        it('should reject negative paintindex', () => {
            expect(() => weaponSaveBodySchema.parse({ ...validWeaponBody, paintindex: -1 })).toThrow();
        });

        it('should reject negative paintseed', () => {
            expect(() => weaponSaveBodySchema.parse({ ...validWeaponBody, paintseed: -1 })).toThrow();
        });

        it('should reject paintwear out of range', () => {
            expect(() => weaponSaveBodySchema.parse({ ...validWeaponBody, paintwear: -0.1 })).toThrow();
            expect(() => weaponSaveBodySchema.parse({ ...validWeaponBody, paintwear: 1.1 })).toThrow();
        });

        it('should accept paintwear at boundaries', () => {
            expect(() => weaponSaveBodySchema.parse({ ...validWeaponBody, paintwear: 0 })).not.toThrow();
            expect(() => weaponSaveBodySchema.parse({ ...validWeaponBody, paintwear: 1 })).not.toThrow();
        });

        it('should reject non-boolean stattrak_enabled', () => {
            expect(() => weaponSaveBodySchema.parse({ ...validWeaponBody, stattrak_enabled: 'true' })).toThrow();
        });

        it('should reject negative stattrak_count', () => {
            expect(() => weaponSaveBodySchema.parse({ ...validWeaponBody, stattrak_count: -1 })).toThrow();
        });

        it('should accept null/undefined nametag', () => {
            expect(() => weaponSaveBodySchema.parse({ ...validWeaponBody, nametag: null })).not.toThrow();
            expect(() => weaponSaveBodySchema.parse({ ...validWeaponBody, nametag: undefined })).not.toThrow();
        });

        it('should reject nametag over 32 characters', () => {
            expect(() => weaponSaveBodySchema.parse({ ...validWeaponBody, nametag: 'A'.repeat(33) })).toThrow();
        });

        it('should reject non-boolean active', () => {
            expect(() => weaponSaveBodySchema.parse({ ...validWeaponBody, active: 'true' })).toThrow();
        });
    });

    describe('knifeSaveBodySchema', () => {
        it('should accept valid knife body', () => {
            expect(() => knifeSaveBodySchema.parse(validKnifeBody)).not.toThrow();
        });

        it('should reject invalid team', () => {
            expect(() => knifeSaveBodySchema.parse({ ...validKnifeBody, team: 0 })).toThrow();
        });

        it('should reject non-integer defindex', () => {
            expect(() => knifeSaveBodySchema.parse({ ...validKnifeBody, defindex: 1.5 })).toThrow();
        });
    });

    describe('gloveSaveBodySchema', () => {
        it('should accept valid glove body', () => {
            expect(() => gloveSaveBodySchema.parse(validGloveBody)).not.toThrow();
        });

        it('should reject paintwear above 1', () => {
            expect(() => gloveSaveBodySchema.parse({ ...validGloveBody, paintwear: 1.5 })).toThrow();
        });
    });

    describe('loadoutCreateBodySchema', () => {
        it('should accept valid loadout name', () => {
            expect(() => loadoutCreateBodySchema.parse({ name: 'My Loadout' })).not.toThrow();
        });

        it('should reject empty name', () => {
            expect(() => loadoutCreateBodySchema.parse({ name: '' })).toThrow();
        });

        it('should reject name over 25 characters', () => {
            expect(() => loadoutCreateBodySchema.parse({ name: 'A'.repeat(26) })).toThrow();
        });
    });

    describe('resetRequestSchema', () => {
        it('should accept valid reset request', () => {
            expect(() => resetRequestSchema.parse({ defindex: 7, team: 1, reset: true })).not.toThrow();
        });

        it('should reject reset without required fields', () => {
            expect(() => resetRequestSchema.parse({ reset: true })).toThrow();
        });
    });

    describe('parseBodyWithSchema', () => {
        it('should return parsed data on success', () => {
            const result = parseBodyWithSchema(weaponSaveBodySchema, validWeaponBody);
            expect(result.team).toBe(1);
            expect(result.defindex).toBe(7);
        });

        it('should throw H3 error with status 400 on failure', () => {
            try {
                parseBodyWithSchema(weaponSaveBodySchema, { ...validWeaponBody, team: 99 });
                expect(true).toBe(false); // should not reach here
            } catch (error: unknown) {
                const e = error as { statusCode: number; message: string };
                expect(e.statusCode).toBe(400);
                expect(e.message).toContain('Team');
            }
        });
    });
});
