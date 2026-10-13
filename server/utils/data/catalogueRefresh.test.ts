import { describe, expect, test } from 'bun:test'
import {
  CatalogueRefreshGate,
  CATALOGUE_REFRESH_MS,
  CATALOGUE_RETRY_MS,
  mergeSkinCatalogue,
  validateSkinCatalogue,
} from './catalogueRefresh'

const catalogue = () =>
  Array.from({ length: 1100 }, (_, i) => ({
    name: `M4A4 | Test ${i}`,
    weapon: { id: 'weapon_m4a1', weapon_id: 16 },
    paint_index: String(i + 1),
    legacy_model: false,
  }))

describe('catalogue refresh', () => {
  test('overlapping refreshes coalesce and expire after six hours', async () => {
    let now = 1
    const gate = new CatalogueRefreshGate(() => now)
    let calls = 0
    let finish!: (value: boolean) => void
    const load = () => {
      calls++
      return new Promise<boolean>((resolve) => {
        finish = resolve
      })
    }
    const first = gate.run(load)
    const second = gate.run(load)
    await Promise.resolve()
    expect(calls).toBe(1)
    finish(true)
    await Promise.all([first, second])
    await gate.run(load)
    expect(calls).toBe(1)
    now += CATALOGUE_REFRESH_MS
    const third = gate.run(load)
    await Promise.resolve()
    expect(calls).toBe(2)
    finish(true)
    await third
  })
  test('failed requests back off then retry', async () => {
    let now = 1
    const gate = new CatalogueRefreshGate(() => now)
    let calls = 0
    const load = async () => {
      calls++
      throw new Error('offline')
    }
    await expect(gate.run(load)).rejects.toThrow('offline')
    await expect(gate.run(load)).rejects.toThrow('offline')
    expect(calls).toBe(1)
    now += CATALOGUE_RETRY_MS
    await gate.run(async () => {
      calls++
      return true
    })
    expect(calls).toBe(2)
  })
  test('cached fallback retries in five minutes rather than six hours', async () => {
    let now = 1
    const gate = new CatalogueRefreshGate(() => now)
    let calls = 0
    const load = async () => {
      calls++
      return false
    }
    await gate.run(load)
    now += CATALOGUE_RETRY_MS - 1
    await gate.run(load)
    expect(calls).toBe(1)
    now++
    await gate.run(load)
    expect(calls).toBe(2)
  })
  test('new skins merge without losing omitted loadout IDs', () => {
    const old = catalogue()
    const fresh = catalogue().slice(1)
    fresh.push({ ...old[0]!, paint_index: '99999', name: 'M4A4 | Future' })
    const merged = mergeSkinCatalogue(old, fresh)
    expect(merged.length).toBe(1101)
    expect(merged[0]!.paint_index).toBe('1')
    expect(merged.at(-1)!.paint_index).toBe('99999')
    expect(old.length).toBe(1100)
  })
  test('rejects invalid, duplicate and truncated responses', () => {
    for (const input of [null, {}, [], [{ name: 'bad' }], [...catalogue(), catalogue()[0]]]) {
      expect(() => validateSkinCatalogue(input)).toThrow()
    }
    expect(() =>
      mergeSkinCatalogue(
        [
          ...catalogue(),
          ...catalogue().map((s) => ({ ...s, paint_index: String(Number(s.paint_index) + 2000) })),
        ],
        catalogue()
      )
    ).toThrow('shrank')
  })
})
