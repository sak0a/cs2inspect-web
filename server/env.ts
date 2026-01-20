import { createEnv } from '@t3-oss/env-nuxt'
import { z } from 'zod'

/**
 * Type-safe environment variables with runtime validation.
 * 
 * Benefits:
 * - Fails fast at startup if required env vars are missing
 * - Full TypeScript support with autocompletion
 * - Clear error messages for invalid config
 * 
 * Usage:
 * ```typescript
 * import { env } from '~/server/env'
 * const host = env.DATABASE_HOST // TypeScript knows this is a string
 * ```
 */
export const env = createEnv({
    /**
     * Server-side environment variables
     * These are validated at runtime and not exposed to the client
     */
    server: {
        // Server Configuration
        PORT: z.string().default('3000').transform(Number),
        HOST: z.string().default('127.0.0.1'),

        // JWT Configuration
        JWT_TOKEN: z.string().min(1, 'JWT_TOKEN is required'),
        JWT_EXPIRY: z.string().default('7d'),

        // Database Configuration
        DATABASE_HOST: z.string().min(1, 'DATABASE_HOST is required'),
        DATABASE_PORT: z.string().default('3306').transform(Number),
        DATABASE_USER: z.string().min(1, 'DATABASE_USER is required'),
        DATABASE_PASSWORD: z.string().min(1, 'DATABASE_PASSWORD is required'),
        DATABASE_NAME: z.string().min(1, 'DATABASE_NAME is required'),
        DATABASE_CONNECTION_LIMIT: z.string().default('5').transform(Number),

        // Steam API Configuration
        STEAM_API_KEY: z.string().min(1, 'STEAM_API_KEY is required'),

        // Steam Account (deprecated, optional)
        STEAM_USERNAME: z.string().optional(),
        STEAM_PASSWORD: z.string().optional(),

        // Steam Service (recommended)
        STEAM_SERVICE_URL: z.string().url().optional(),
        STEAM_SERVICE_API_KEY: z.string().optional(),

        // Logging
        LOG_API_REQUESTS: z.string().default('false').transform((val) => val === 'true'),

        // Proxy Health Check
        PROXY_HEALTH_BASE_URL: z.string().url().optional(),
    },

    /**
     * Client-side environment variables (exposed via NUXT_PUBLIC_*)
     * These are embedded in the client bundle
     */
    client: {
        NUXT_PUBLIC_ASSETS_URL: z.string().url().optional(),
        NUXT_PUBLIC_ASSETS_STICKER_PATH: z.string().optional(),
        NUXT_PUBLIC_ASSETS_CHARMS_PATH: z.string().optional(),
        NUXT_PUBLIC_ASSETS_WEAPONS_PATH: z.string().optional(),
    },
})

export type Env = typeof env
