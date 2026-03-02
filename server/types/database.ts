/**
 * Database record type definitions
 * Types are inferred from Drizzle ORM schema definitions
 */
import type { InferSelectModel, InferInsertModel } from 'drizzle-orm'
import type {
  loadouts,
  pistols,
  rifles,
  smgs,
  heavys,
  knives,
  gloves,
  agents,
  music,
  pins,
  healthCheckHistory,
} from '../database/schema'

// Re-export DBLoadout from loadoutHelpers for backward compatibility
export type { DBLoadout } from '../database/loadoutHelpers'

/**
 * Base database record interface (for backward compatibility)
 */
export interface BaseDBRecord {
  id: number
  created_at?: Date
  updated_at?: Date
}

/**
 * Base database item interface (for backward compatibility)
 */
export interface BaseDBItem extends BaseDBRecord {
  steamid: string
  defindex: number
  paintindex: number
  paintwear: number
  paintseed: number
}

// Drizzle inferred types for loadouts
export type LoadoutSelect = InferSelectModel<typeof loadouts>
export type LoadoutInsert = InferInsertModel<typeof loadouts>

// Drizzle inferred types for weapons
export type PistolSelect = InferSelectModel<typeof pistols>
export type PistolInsert = InferInsertModel<typeof pistols>
export type RifleSelect = InferSelectModel<typeof rifles>
export type RifleInsert = InferInsertModel<typeof rifles>
export type SMGSelect = InferSelectModel<typeof smgs>
export type SMGInsert = InferInsertModel<typeof smgs>
export type HeavySelect = InferSelectModel<typeof heavys>
export type HeavyInsert = InferInsertModel<typeof heavys>

// Drizzle inferred types for knives
export type KnifeSelect = InferSelectModel<typeof knives>
export type KnifeInsert = InferInsertModel<typeof knives>

// Drizzle inferred types for gloves
export type GloveSelect = InferSelectModel<typeof gloves>
export type GloveInsert = InferInsertModel<typeof gloves>

// Drizzle inferred types for agents
export type AgentSelect = InferSelectModel<typeof agents>
export type AgentInsert = InferInsertModel<typeof agents>

// Drizzle inferred types for music
export type MusicSelect = InferSelectModel<typeof music>
export type MusicInsert = InferInsertModel<typeof music>

// Drizzle inferred types for pins
export type PinSelect = InferSelectModel<typeof pins>
export type PinInsert = InferInsertModel<typeof pins>

// Drizzle inferred types for health check history
export type HealthCheckHistorySelect = InferSelectModel<typeof healthCheckHistory>
export type HealthCheckHistoryInsert = InferInsertModel<typeof healthCheckHistory>

/**
 * Backward compatible type aliases
 * These map to the Drizzle inferred types for existing code
 */
export type DBWeapon = PistolSelect | RifleSelect | SMGSelect | HeavySelect
export type DBKnife = KnifeSelect
export type DBGlove = GloveSelect
export type DBAgent = AgentSelect
export type DBPin = PinSelect
export type DBMusicKit = MusicSelect
