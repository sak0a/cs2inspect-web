/**
 * Drizzle ORM Schema Index
 * Exports all table schemas for the CS2 Inspect database
 */

// Core tables
export { loadouts } from './loadouts';

// Item tables
export { agents } from './agents';
export { gloves } from './gloves';
export { knives } from './knives';
export { music } from './music';
export { pins } from './pins';
export { pistols, rifles, smgs, heavys } from './weapons';

// System tables
export { healthCheckHistory, healthCheckConfig } from './health';
export { migrations } from './migrations';

// History tables
export { itemHistory } from './itemHistory';
export type { ItemHistorySnapshot, ChangeType, HistoryItemType, HistoryItemCategory, ItemHistoryRecord, NewItemHistoryRecord } from './itemHistory';

// Zod validation schemas (drizzle-zod)
export {
    insertLoadoutSchema,
    selectLoadoutSchema,
    loadoutCreateBodySchema,
    insertWeaponSchema,
    selectWeaponSchema,
    weaponSaveBodySchema,
    insertKnifeSchema,
    selectKnifeSchema,
    knifeSaveBodySchema,
    insertGloveSchema,
    selectGloveSchema,
    gloveSaveBodySchema,
    insertAgentSchema,
    selectAgentSchema,
    insertMusicSchema,
    selectMusicSchema,
    insertPinSchema,
    selectPinSchema,
    resetRequestSchema,
} from './zod';
