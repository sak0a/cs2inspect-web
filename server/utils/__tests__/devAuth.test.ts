import { describe, it, expect, beforeEach, afterEach } from 'bun:test'
import {
  DEFAULT_DEV_MOCK_ADMIN_STEAMID,
  DEFAULT_DEV_MOCK_STEAMID,
  DEV_STEAM_ID_PREFIX,
  getDevAuthConfig,
  isDevAuthEnabled,
  isMockSteamId,
  validateDevCredentials,
} from '../devAuth'

describe('devAuth', () => {
  const originalEnv = { ...process.env }

  beforeEach(() => {
    process.env.NODE_ENV = 'development'
    delete process.env.DEV_AUTH_ENABLED
    delete process.env.DEV_AUTH_USERNAME
    delete process.env.DEV_AUTH_PASSWORD
    delete process.env.DEV_MOCK_ADMIN_USERNAME
    delete process.env.DEV_MOCK_ADMIN_PASSWORD
  })

  afterEach(() => {
    process.env = { ...originalEnv }
  })

  describe('isDevAuthEnabled', () => {
    it('returns false by default', () => {
      expect(isDevAuthEnabled()).toBe(false)
    })

    it('returns true when enabled in development', () => {
      process.env.DEV_AUTH_ENABLED = 'true'
      expect(isDevAuthEnabled()).toBe(true)
    })

    it('returns false in production even when flag is set', () => {
      process.env.DEV_AUTH_ENABLED = 'true'
      process.env.NODE_ENV = 'production'
      expect(isDevAuthEnabled()).toBe(false)
    })
  })

  describe('isMockSteamId', () => {
    it('accepts reserved mock steam IDs', () => {
      expect(isMockSteamId(DEFAULT_DEV_MOCK_STEAMID)).toBe(true)
      expect(isMockSteamId(DEFAULT_DEV_MOCK_ADMIN_STEAMID)).toBe(true)
      expect(isMockSteamId(`${DEV_STEAM_ID_PREFIX}123`)).toBe(true)
    })

    it('rejects real-looking steam IDs outside the reserved block', () => {
      expect(isMockSteamId('76561198012345678')).toBe(false)
      expect(isMockSteamId('not-a-steam-id')).toBe(false)
    })
  })

  describe('getDevAuthConfig', () => {
    it('returns defaults for user and admin roles', () => {
      expect(getDevAuthConfig('user').steamid).toBe(DEFAULT_DEV_MOCK_STEAMID)
      expect(getDevAuthConfig('admin').steamid).toBe(DEFAULT_DEV_MOCK_ADMIN_STEAMID)
      expect(getDevAuthConfig('admin').adminRole).toBe('superadmin')
    })
  })

  describe('validateDevCredentials', () => {
    it('allows login when credential gate is disabled', () => {
      expect(validateDevCredentials('user')).toBe(true)
      expect(validateDevCredentials('admin')).toBe(true)
    })

    it('validates user credentials when configured', () => {
      process.env.DEV_AUTH_USERNAME = 'dev'
      process.env.DEV_AUTH_PASSWORD = 'secret'

      expect(validateDevCredentials('user', 'dev', 'secret')).toBe(true)
      expect(validateDevCredentials('user', 'dev', 'wrong')).toBe(false)
    })

    it('validates admin credentials when configured', () => {
      process.env.DEV_AUTH_USERNAME = 'dev'
      process.env.DEV_AUTH_PASSWORD = 'secret'
      process.env.DEV_MOCK_ADMIN_USERNAME = 'admin'
      process.env.DEV_MOCK_ADMIN_PASSWORD = 'admin-secret'

      expect(validateDevCredentials('admin', 'admin', 'admin-secret')).toBe(true)
      expect(validateDevCredentials('admin', 'admin', 'wrong')).toBe(false)
    })
  })
})
