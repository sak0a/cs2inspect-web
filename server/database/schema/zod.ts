/**
 * Zod Schemas derived from Drizzle ORM table definitions
 *
 * Uses drizzle-zod to auto-generate validation schemas from database tables,
 * with refinements for business rules (team range, paint wear range, etc.)
 */

import { z } from 'zod'
import { createInsertSchema, createSelectSchema } from 'drizzle-zod'
import { loadouts } from './loadouts'
import { pistols } from './weapons'
import { knives } from './knives'
import { gloves } from './gloves'
import { agents } from './agents'
import { music } from './music'
import { pins } from './pins'

// ============================================================================
// LOADOUT SCHEMAS
// ============================================================================

export const insertLoadoutSchema = createInsertSchema(loadouts, {
    name: z.string().min(1, 'Loadout name is required').max(25, 'Loadout name is too long'),
    steamid: z.string().min(1, 'Steam ID is required'),
})

export const selectLoadoutSchema = createSelectSchema(loadouts)

/** Schema for loadout creation request body (omits server-managed fields) */
export const loadoutCreateBodySchema = insertLoadoutSchema.pick({
    name: true,
})

/** Schema for loadout update request body */
export const loadoutUpdateBodySchema = z.object({
    name: z.string().min(1, 'Loadout name is required').max(25, 'Loadout name is too long'),
    steamId: z.string().min(1, 'Steam ID is required').optional(),
})

// ============================================================================
// SHARED REFINEMENTS
// ============================================================================

const teamSchema = z.coerce
    .number()
    .int('Team must be an integer')
    .min(1, 'Team must be 1 (Terrorist) or 2 (Counter-Terrorist)')
    .max(2, 'Team must be 1 (Terrorist) or 2 (Counter-Terrorist)')
const defindexSchema = z.coerce
    .number()
    .int('Defindex must be an integer')
    .nonnegative('Defindex must be non-negative')
const paintIndexSchema = z.coerce
    .number()
    .int('Paint index must be an integer')
    .nonnegative('Paint index must be non-negative')
const paintSeedSchema = z.coerce
    .number()
    .int('Paint seed must be an integer')
    .nonnegative('Paint seed must be non-negative')
const paintWearSchema = z.coerce
    .number()
    .min(0, 'Paint wear must be between 0 and 1')
    .max(1, 'Paint wear must be between 0 and 1')
const activeSchema = z.boolean({ message: 'Active must be true or false' })
const stattrakEnabledSchema = z.boolean({ message: 'stattrak_enabled must be true or false' })
const stattrakCountSchema = z.coerce
    .number()
    .int('StatTrak count must be an integer')
    .nonnegative('StatTrak count must be non-negative')
const nametagSchema = z
    .string()
    .max(32, 'Name tag must be at most 32 characters')
    .nullable()
    .optional()

// ============================================================================
// WEAPON SCHEMAS
// ============================================================================

export const insertWeaponSchema = createInsertSchema(pistols, {
    team: teamSchema,
    defindex: defindexSchema,
    paintindex: paintIndexSchema,
    paintseed: paintSeedSchema,
    paintwear: paintWearSchema,
    stattrak_count: stattrakCountSchema,
})

export const selectWeaponSchema = createSelectSchema(pistols)

/** Schema for weapon save request body */
export const weaponSaveBodySchema = z.object({
    team: teamSchema,
    defindex: defindexSchema,
    paintindex: paintIndexSchema,
    paintseed: paintSeedSchema,
    paintwear: paintWearSchema,
    active: activeSchema,
    stattrak_enabled: stattrakEnabledSchema,
    stattrak_count: stattrakCountSchema,
    nametag: nametagSchema,
    stickers: z.array(z.unknown()).optional(),
    keychain: z.unknown().optional().nullable(),
    reset: z.boolean().optional(),
})

// ============================================================================
// KNIFE SCHEMAS
// ============================================================================

export const insertKnifeSchema = createInsertSchema(knives, {
    team: teamSchema,
    defindex: defindexSchema,
    paintindex: paintIndexSchema,
    paintseed: paintSeedSchema,
    paintwear: paintWearSchema,
    stattrak_count: stattrakCountSchema,
})

export const selectKnifeSchema = createSelectSchema(knives)

/** Schema for knife save request body */
export const knifeSaveBodySchema = z.object({
    team: teamSchema,
    defindex: defindexSchema,
    paintindex: paintIndexSchema,
    paintseed: paintSeedSchema,
    paintwear: paintWearSchema,
    active: activeSchema,
    stattrak_enabled: stattrakEnabledSchema,
    stattrak_count: stattrakCountSchema,
    nametag: nametagSchema,
    reset: z.boolean().optional(),
})

// ============================================================================
// GLOVE SCHEMAS
// ============================================================================

export const insertGloveSchema = createInsertSchema(gloves, {
    team: teamSchema,
    defindex: defindexSchema,
    paintindex: paintIndexSchema,
    paintseed: paintSeedSchema,
    paintwear: paintWearSchema,
})

export const selectGloveSchema = createSelectSchema(gloves)

/** Schema for glove save request body */
export const gloveSaveBodySchema = z.object({
    team: teamSchema,
    defindex: defindexSchema,
    paintindex: paintIndexSchema,
    paintseed: paintSeedSchema,
    paintwear: paintWearSchema,
    active: activeSchema,
    reset: z.boolean().optional(),
})

// ============================================================================
// AGENT SCHEMAS
// ============================================================================

export const insertAgentSchema = createInsertSchema(agents, {
    team: teamSchema,
    defindex: defindexSchema,
})

export const selectAgentSchema = createSelectSchema(agents)

// ============================================================================
// MUSIC SCHEMAS
// ============================================================================

export const insertMusicSchema = createInsertSchema(music, {
    team: teamSchema,
})

export const selectMusicSchema = createSelectSchema(music)

// ============================================================================
// PIN SCHEMAS
// ============================================================================

export const insertPinSchema = createInsertSchema(pins, {
    defindex: defindexSchema,
})

export const selectPinSchema = createSelectSchema(pins)

// ============================================================================
// RESET REQUEST SCHEMA (shared across item types)
// ============================================================================

export const resetRequestSchema = z.object({
    defindex: defindexSchema,
    team: teamSchema,
    reset: z.literal(true),
})
