import { describe, expect, it } from 'bun:test'
import { Writable } from 'node:stream'
import { createServerLogger } from '../logger'

class MemoryDestination extends Writable {
  public chunks: string[] = []

  _write(chunk: Buffer | string, _encoding: BufferEncoding, callback: (error?: Error | null) => void): void {
    this.chunks.push(chunk.toString())
    callback()
  }
}

async function flushWrites(): Promise<void> {
  await new Promise(resolve => setTimeout(resolve, 0))
}

function parseLogLines(destination: MemoryDestination): Record<string, unknown>[] {
  return destination.chunks
    .join('')
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean)
    .map(line => JSON.parse(line) as Record<string, unknown>)
}

describe('server logging core', () => {
  it('applies level gating', async () => {
    const destination = new MemoryDestination()
    const testLogger = createServerLogger({
      config: {
        level: 'warn',
        format: 'json',
        logApiRequests: false,
        logHealthRequests: false,
      },
      destination,
    })

    testLogger.info('suppressed info')
    testLogger.warn('visible warn')

    await flushWrites()

    const logs = parseLogLines(destination)
    expect(logs.length).toBe(1)
    expect(logs[0]?.level).toBe('warn')
    expect(logs[0]?.msg).toBe('visible warn')
  })

  it('redacts sensitive fields', async () => {
    const destination = new MemoryDestination()
    const testLogger = createServerLogger({
      config: {
        level: 'info',
        format: 'json',
        logApiRequests: false,
        logHealthRequests: false,
      },
      destination,
    })

    testLogger.info(
      {
        token: 'secret-token',
        req: {
          headers: {
            authorization: 'Bearer abc',
            cookie: 'session=abc',
          },
        },
        nested: {
          token: 'nested-token',
        },
      },
      'redaction test'
    )

    await flushWrites()

    const [entry] = parseLogLines(destination)
    expect(entry?.token).toBe('[REDACTED]')

    const req = entry?.req as { headers?: { authorization?: string; cookie?: string } }
    expect(req.headers?.authorization).toBe('[REDACTED]')
    expect(req.headers?.cookie).toBe('[REDACTED]')

    const nested = entry?.nested as { token?: string }
    expect(nested.token).toBe('[REDACTED]')
  })

  it('keeps child logger bindings', async () => {
    const destination = new MemoryDestination()
    const testLogger = createServerLogger({
      config: {
        level: 'info',
        format: 'json',
        logApiRequests: false,
        logHealthRequests: false,
      },
      destination,
    })

    const child = testLogger.child({ requestId: 'req-123', path: '/api/test' })
    child.info('child log')

    await flushWrites()

    const [entry] = parseLogLines(destination)
    expect(entry?.requestId).toBe('req-123')
    expect(entry?.path).toBe('/api/test')
    expect(entry?.msg).toBe('child log')
  })

  it('preserves structured tag field in json logs', async () => {
    const destination = new MemoryDestination()
    const testLogger = createServerLogger({
      config: {
        level: 'info',
        format: 'json',
        logApiRequests: false,
        logHealthRequests: false,
      },
      destination,
    })

    testLogger.info({ tag: 'Health', check: 'sampler' }, 'Sampler start interval=60s')
    await flushWrites()

    const [entry] = parseLogLines(destination)
    expect(entry?.tag).toBe('Health')
    expect(entry?.check).toBe('sampler')
    expect(entry?.msg).toBe('Sampler start interval=60s')
  })
})
