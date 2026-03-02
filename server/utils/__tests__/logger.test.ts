import { describe, it, expect, spyOn, afterEach } from 'bun:test'
import { Logger } from '../logger'
import { logger } from '~/server/logging/logger'

describe('Logger wrapper', () => {
  const spies: ReturnType<typeof spyOn>[] = []

  afterEach(() => {
    for (const spy of spies) spy.mockRestore()
    spies.length = 0
  })

  function spy(method: 'info' | 'warn' | 'error' | 'debug') {
    const s = spyOn(logger, method)
    spies.push(s)
    return s
  }

  it('info delegates to logger.info with resolved tag', () => {
    const s = spy('info')
    Logger.info('server started', 'startup')
    expect(s).toHaveBeenCalledWith({ tag: 'Boot', context: 'startup' }, 'server started')
  })

  it('warn delegates to logger.warn with resolved tag', () => {
    const s = spy('warn')
    Logger.warn('slow query', 'migrations')
    expect(s).toHaveBeenCalledWith({ tag: 'DB', context: 'migrations' }, 'slow query')
  })

  it('error delegates to logger.error with resolved tag', () => {
    const s = spy('error')
    Logger.error('connection lost', 'healthcheck')
    expect(s).toHaveBeenCalledWith({ tag: 'Health', context: 'healthcheck' }, 'connection lost')
  })

  it('debug delegates to logger.debug with resolved tag', () => {
    const s = spy('debug')
    Logger.debug('cache miss', 'sync-cleanup')
    expect(s).toHaveBeenCalledWith({ tag: 'Sync', context: 'sync-cleanup' }, 'cache miss')
  })

  it('success delegates to logger.debug with event: success', () => {
    const s = spy('debug')
    Logger.success('migration done', 'migrations')
    expect(s).toHaveBeenCalledWith(
      { tag: 'DB', context: 'migrations', event: 'success' },
      'migration done'
    )
  })

  it('header delegates to logger.debug with Req tag and header event', () => {
    const s = spy('debug')
    Logger.header('Auth Section')
    expect(s).toHaveBeenCalledWith(
      { tag: 'Req', event: 'header', section: 'Auth Section' },
      'Auth Section'
    )
  })

  it('responseTime delegates to logger.debug with computed durationMs', () => {
    const s = spy('debug')
    const startTime = Date.now() - 150
    Logger.responseTime(startTime)

    const call = s.mock.calls[0]!
    const metadata = call[0] as { tag: string; durationMs: number }
    expect(metadata.tag).toBe('Req')
    expect(metadata.durationMs).toBeGreaterThanOrEqual(140)
    expect(metadata.durationMs).toBeLessThan(500)
    expect(call[1]).toBe('Response time')
  })

  it('passes undefined context when no context provided', () => {
    const s = spy('info')
    Logger.info('bare message')
    expect(s).toHaveBeenCalledWith({ tag: 'App', context: undefined }, 'bare message')
  })
})
