import { describe, expect, it } from 'bun:test'
import {
  calculatePagination,
  createCollectionResponse,
  createErrorInfo,
  createErrorResponse,
  createPaginatedResponse,
  createPaginationMeta,
  createResponseMeta,
  createSuccessResponse,
  extractFilterOptions,
  withErrorHandling,
} from '../responseHelpers'

function makeEvent(requestId = 'req-1') {
  const calls: unknown[][] = []
  return {
    event: {
      context: {
        requestId,
        requestLogger: {
          error: (...args: unknown[]) => {
            calls.push(args)
          },
        },
      },
    } as unknown,
    calls,
  }
}

describe('responseHelpers', () => {
  it('creates response meta with requestId and processingTime', () => {
    const start = Date.now() - 25
    const meta = createResponseMeta(start, { source: 'test' }, {
      context: { requestId: 'abc-123' },
    } as unknown as never)

    expect(meta.requestId).toBe('abc-123')
    expect(meta.source).toBe('test')
    expect(meta.apiVersion).toBe('1.0.0')
    expect(typeof meta.timestamp).toBe('string')
    expect(meta.processingTime).toBeGreaterThanOrEqual(20)
  })

  it('builds pagination metadata correctly', () => {
    const meta = createPaginationMeta(2, 43, 10, 10)
    expect(meta).toEqual({
      currentPage: 2,
      totalPages: 5,
      totalItems: 43,
      limit: 10,
      count: 10,
      hasNext: true,
      hasPrevious: true,
    })
  })

  it('creates success response variants with optional fields', () => {
    const meta = createResponseMeta()
    const success = createSuccessResponse({ ok: true }, meta)
    expect(success.success).toBe(true)
    expect(success.message).toBeUndefined()

    const paginated = createPaginatedResponse(
      [{ id: 1 }],
      createPaginationMeta(1, 1, 10, 1),
      meta,
      { rarity: 'covert' },
      { rarity: ['covert'] },
      'done'
    )
    expect(paginated.appliedFilters).toEqual({ rarity: 'covert' })
    expect(paginated.availableFilters).toEqual({ rarity: ['covert'] })
    expect(paginated.message).toBe('done')

    const collection = createCollectionResponse([{ id: 1 }], 1, meta)
    expect(collection.collection.totalCount).toBe(1)
    expect(collection.collection.categories).toBeUndefined()
  })

  it('creates error info with optional details and field errors', () => {
    const info = createErrorInfo('BAD_INPUT', 'Validation failed', { reason: 'x' }, { name: ['x'] })
    expect(info.code).toBe('BAD_INPUT')
    expect(info.details).toEqual({ reason: 'x' })
    expect(info.fieldErrors).toEqual({ name: ['x'] })
  })

  it('throws standardized error response payload', () => {
    const meta = createResponseMeta()
    try {
      createErrorResponse({ code: 'FAIL', message: 'bad' }, meta, 418)
      throw new Error('expected throw')
    } catch (error: unknown) {
      const e = error as {
        statusCode: number
        data: { success: boolean; error: { code: string } }
      }
      expect(e.statusCode).toBe(418)
      expect(e.data.success).toBe(false)
      expect(e.data.error.code).toBe('FAIL')
    }
  })

  it('withErrorHandling rethrows already-structured errors', async () => {
    const structured = { statusCode: 409, data: { reason: 'conflict' } }
    const wrapped = withErrorHandling(async () => {
      throw structured
    }, 'SHOULD_NOT_WRAP')

    try {
      await wrapped({ context: {} } as never)
      throw new Error('expected throw')
    } catch (error: unknown) {
      expect(error).toBe(structured)
    }
  })

  it('withErrorHandling logs 5xx errors and preserves requestId in meta', async () => {
    const { event, calls } = makeEvent('req-500')
    const wrapped = withErrorHandling(async () => {
      throw new Error('boom')
    }, 'TEST_ERROR')

    try {
      await wrapped(event as never)
      throw new Error('expected throw')
    } catch (error: unknown) {
      const e = error as {
        statusCode: number
        data: { meta: { requestId?: string }; error: { code: string } }
      }
      expect(e.statusCode).toBe(500)
      expect(e.data.meta.requestId).toBe('req-500')
      expect(e.data.error.code).toBe('TEST_ERROR')
    }

    expect(calls.length).toBe(1)
    expect(calls[0]?.[1]).toBe('Unhandled API error')
  })

  it('withErrorHandling does not log for 4xx errors', async () => {
    const { event, calls } = makeEvent('req-400')
    const wrapped = withErrorHandling(async () => {
      const err = new Error('bad request') as Error & { statusCode: number }
      err.statusCode = 400
      throw err
    }, 'VALIDATION')

    try {
      await wrapped(event as never)
      throw new Error('expected throw')
    } catch (error: unknown) {
      const e = error as { statusCode: number; data: { error: { code: string } } }
      expect(e.statusCode).toBe(400)
      expect(e.data.error.code).toBe('VALIDATION')
    }

    expect(calls.length).toBe(0)
  })

  it('calculates pagination with clamping and extracts nested filter options', () => {
    const pagination = calculatePagination({ page: '-5', limit: '9999' })
    expect(pagination).toEqual({ page: 1, limit: 100, offset: 0 })

    const filters = extractFilterOptions(
      [
        { rarity: { name: 'Covert' }, category: 'rifles' },
        { rarity: { name: 'Classified' }, category: 'rifles' },
        { rarity: { name: 'Covert' }, category: 'pistols' },
      ],
      { rarity: 'rarity.name', category: 'category' }
    )

    expect(filters.rarity).toEqual(['Classified', 'Covert'])
    expect(filters.category).toEqual(['pistols', 'rifles'])
  })
})
