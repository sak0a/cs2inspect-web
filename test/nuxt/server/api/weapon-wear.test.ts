import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { createApp, defineEventHandler, toNodeListener } from 'h3'
import { fetchNodeRequestHandler, type NodeRequestHandler } from 'node-mock-http'
import { resolve } from 'node:path'

const { rows } = vi.hoisted(() => ({ rows: [] as Record<string, unknown>[] }))
let handler: typeof import('../../../../server/api/items/weapons/[type]').default
beforeAll(async () => {
  vi.doMock(resolve('server/database/client.ts'), () => ({
    db: { select: () => ({ from: () => ({ where: async () => rows }) }) },
  }))
  vi.doMock(resolve('server/utils/csgoAPI.ts'), () => ({
    getSkinsDataAsync: async () => [],
    getStickerDataAsync: async () => [],
    getKeychainDataAsync: async () => [],
  }))
  handler = (await import('../../../../server/api/items/weapons/[type]')).default
})

afterEach(() => {
  rows.length = 0
})

describe('weapon API wear preservation', () => {
  it.each([0, 0.000123, 0.75, null])(
    'returns stored wear %s without replacing zero',
    async (wear) => {
      rows.push({
        id: 220,
        steamid: '76561198117084164',
        loadoutid: 128,
        defindex: 16,
        paintindex: 1463,
        paintwear: wear,
        paintseed: 0,
        active: 1,
        team: 2,
        stattrak_enabled: 0,
        stattrak_count: 0,
        nametag: '',
      })
      const app = createApp()
      app.use(
        defineEventHandler((event) => {
          event.context.auth = { steamId: '76561198117084164' }
          event.context.params = { type: 'rifles' }
        })
      )
      app.use(handler)
      const response = await fetchNodeRequestHandler(
        toNodeListener(app) as NodeRequestHandler,
        '/?loadoutId=128',
        { method: 'GET' }
      )
      expect(response.status).toBe(200)
      type Weapon = {
        weapon_defindex: number
        databaseInfo: { paintwear: number; paintseed: number }
      }
      const body = (await response.json()) as { data: Array<Weapon | Weapon[]> }
      const weapon = body.data.flat().find((item) => item.weapon_defindex === 16)!
      expect(weapon.databaseInfo.paintwear).toBe(wear ?? 0.01)
      expect(weapon.databaseInfo.paintseed).toBe(0)
    }
  )
})
