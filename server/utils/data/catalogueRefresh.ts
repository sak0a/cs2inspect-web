/** Shared refresh policy with the game plugin: six hours, five-minute outage retry. */
export const CATALOGUE_REFRESH_MS = 6 * 60 * 60 * 1000
export const CATALOGUE_RETRY_MS = 5 * 60 * 1000

/** One in-flight refresh; failed attempts are throttled without discarding usable data. */
export class CatalogueRefreshGate {
  private pending: Promise<void> | null = null
  private nextAttempt = 0
  private lastError: unknown = null

  constructor(private readonly now: () => number = Date.now) {}

  run(load: () => Promise<boolean>): Promise<void> {
    if (this.pending) return this.pending
    if (this.now() < this.nextAttempt) {
      return this.lastError ? Promise.reject(this.lastError) : Promise.resolve()
    }
    this.pending = Promise.resolve()
      .then(load)
      .then((fresh) => {
        this.lastError = null
        this.nextAttempt = this.now() + (fresh ? CATALOGUE_REFRESH_MS : CATALOGUE_RETRY_MS)
      })
      .catch((error: unknown) => {
        this.lastError = error
        this.nextAttempt = this.now() + CATALOGUE_RETRY_MS
        throw error
      })
      .finally(() => {
        this.pending = null
      })
    return this.pending
  }
}

type CatalogueSkin = {
  name: string
  weapon: { id: string; weapon_id: number }
  paint_index: string | number | null
  legacy_model?: boolean
  [key: string]: unknown
}

/** Validate the full response before it can replace a working catalogue or cache file. */
export function validateSkinCatalogue(data: unknown): asserts data is CatalogueSkin[] {
  if (!Array.isArray(data) || data.length < 1000 || data.length > 20000) {
    throw new Error('Unexpected skin catalogue size')
  }
  const keys = new Set<string>()
  for (const skin of data) {
    if (
      !skin ||
      typeof skin.name !== 'string' ||
      !skin.name.trim() ||
      typeof skin.weapon?.id !== 'string' ||
      !Number.isInteger(skin.weapon.weapon_id) ||
      skin.weapon.weapon_id <= 0
    )
      throw new Error('Invalid skin catalogue entry')
    if (skin.weapon.id.startsWith('sfui_') || skin.paint_index === null) continue
    const paint = Number(skin.paint_index)
    if (!Number.isInteger(paint) || paint <= 0 || typeof skin.legacy_model !== 'boolean') {
      throw new Error('Invalid skin paint/model data')
    }
    const key = `${skin.weapon.weapon_id}:${paint}`
    if (keys.has(key)) throw new Error('Duplicate skin catalogue entry')
    keys.add(key)
  }
}

/** Keep known IDs omitted upstream, so existing loadouts can still resolve their metadata. */
export function mergeSkinCatalogue(previous: unknown, incoming: unknown): CatalogueSkin[] {
  validateSkinCatalogue(incoming)
  if (!Array.isArray(previous) || previous.length === 0) return incoming
  validateSkinCatalogue(previous)
  if (incoming.length < previous.length * 0.9) throw new Error('Skin catalogue unexpectedly shrank')
  const key = (skin: CatalogueSkin) => `${skin.weapon.weapon_id}:${skin.paint_index}`
  const updates = new Map(incoming.map((skin) => [key(skin), skin]))
  const merged = previous.map((old: CatalogueSkin) => {
    const fresh = updates.get(key(old))
    updates.delete(key(old))
    return fresh ?? old
  })
  return merged.concat([...updates.values()])
}
