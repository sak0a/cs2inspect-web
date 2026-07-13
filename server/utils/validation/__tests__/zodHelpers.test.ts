import { describe, expect, it } from 'bun:test'
import { z } from 'zod'
import { createApp, eventHandler, toNodeListener } from 'h3'
import { fetchNodeRequestHandler, type NodeRequestHandler } from 'node-mock-http'
import { parseQueryWithSchema } from '../zodHelpers'

describe('parseQueryWithSchema', () => {
  const schema = z.object({
    page: z.coerce.number().int().min(1),
    q: z.string().min(1),
  })

  it('returns parsed query values on success', async () => {
    const app = createApp()
    app.use(
      '/query',
      eventHandler((event) => {
        return parseQueryWithSchema(schema, event)
      })
    )
    const handler = toNodeListener(app) as NodeRequestHandler

    const response = await fetchNodeRequestHandler(handler, '/query?page=2&q=ak47')
    const body = (await response.json()) as { page: number; q: string }

    expect(response.status).toBe(200)
    expect(body).toEqual({ page: 2, q: 'ak47' })
  })

  it('throws standardized 400 error shape on invalid query', async () => {
    const app = createApp()
    app.use(
      '/query',
      eventHandler((event) => {
        return parseQueryWithSchema(schema, event)
      })
    )
    const handler = toNodeListener(app) as NodeRequestHandler

    const response = await fetchNodeRequestHandler(handler, '/query?page=0&q=')
    const body = (await response.json()) as { statusCode?: number }

    expect(response.status).toBe(400)
    expect(body.statusCode).toBe(400)
  })
})
