import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const rootDir = resolve(fileURLToPath(new URL('../../..', import.meta.url)))

export const e2eRootDir = rootDir

export const e2eTestEnv: Record<string, string> = {
  JWT_TOKEN: 'test-jwt-secret-key-32-characters-min!!',
  JWT_EXPIRY: '1h',
  DEV_AUTH_ENABLED: 'true',
  DEV_AUTH_USERNAME: 'dev',
  DEV_AUTH_PASSWORD: 'devpassword',
  DEV_MOCK_ADMIN_USERNAME: 'admin',
  DEV_MOCK_ADMIN_PASSWORD: 'adminpassword',
  NUXT_PUBLIC_DEV_AUTH_ENABLED: 'true',
  NODE_ENV: 'development',
  DATABASE_HOST: process.env.DATABASE_HOST || '127.0.0.1',
  DATABASE_PORT: process.env.DATABASE_PORT || '3306',
  DATABASE_USER: process.env.DATABASE_USER || 'test',
  DATABASE_PASSWORD: process.env.DATABASE_PASSWORD || 'test',
  DATABASE_NAME: process.env.DATABASE_NAME || 'test',
  DATABASE_CONNECTION_LIMIT: '5',
  STEAM_API_KEY: '00000000000000000000000000000000',
  NUXT_TELEMETRY_DISABLED: 'true',
  E2E_DISABLE_BACKGROUND_JOBS: 'true',
}

export function applyE2eTestEnv(): void {
  Object.assign(process.env, e2eTestEnv)
}
