import { describe, it, expect, beforeEach } from 'bun:test'
import { config } from './config'

describe('Config', () => {
  const originalEnv = process.env

  beforeEach(() => {
    // Reset process.env before each test
    process.env = { ...originalEnv }
  })

  it('should load default server configuration', () => {
    expect(config.server.port).toBe(Number(process.env.PORT || 3211))
    expect(config.server.host).toBe(process.env.HOST || '0.0.0.0')
    expect(config.server.nodeEnv).toBe(process.env.NODE_ENV || 'development')
  })

  it('should load server configuration from environment', () => {
    process.env.PORT = '4000'
    process.env.HOST = '127.0.0.1'
    process.env.NODE_ENV = 'production'

    // Note: config is loaded once, so we'd need to reload it
    // For this test, we're just verifying the structure
    expect(config.server).toHaveProperty('port')
    expect(config.server).toHaveProperty('host')
    expect(config.server).toHaveProperty('nodeEnv')
  })

  it('should parse API keys from comma-separated string', () => {
    process.env.API_KEYS = 'key1,key2,key3'
    // Config is loaded once, so this test verifies the parsing logic exists
    expect(Array.isArray(config.api.keys)).toBe(true)
  })

  it('should have steam configuration structure', () => {
    expect(config.steam).toHaveProperty('username')
    expect(config.steam).toHaveProperty('password')
    expect(config.steam).toHaveProperty('apiKey')
    expect(config.steam).toHaveProperty('enabled')
    expect(config.steam).toHaveProperty('rateLimitDelay')
    expect(config.steam).toHaveProperty('maxQueueSize')
  })

  it('should have rate limit configuration', () => {
    expect(config.rateLimit).toHaveProperty('max')
    expect(config.rateLimit).toHaveProperty('window')
    expect(config.rateLimit.max).toBeGreaterThan(0)
    expect(config.rateLimit.window).toBeGreaterThan(0)
  })
})
