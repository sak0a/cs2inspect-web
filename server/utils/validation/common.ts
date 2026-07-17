/**
 * Common validation utilities
 *
 * Most field-level validation has been replaced by Zod schemas in
 * server/database/schema/zod.ts via drizzle-zod integration.
 *
 * This file retains validators that are still used outside of the
 * schema-based validation pipeline.
 */

// Currently empty — the export marker keeps this a module so
// `export * from './common'` in index.ts remains valid (TS7 flags it otherwise).
export {}
