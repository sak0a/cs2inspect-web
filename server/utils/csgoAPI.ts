import type {
  APISkin,
  APISticker,
  APIAgent,
  APIKeychain,
  APIMusicKit,
  APICollectible,
  APIHighlight,
} from '~/server/types'
import { EXTERNAL_API_URLS, DATA_STALENESS_THRESHOLD } from './constants'
import { processSkinData } from './data/skinUtils'
import { processKeychainData } from './data/keychainUtils'
import { Logger } from '~/server/utils/logger'
import fs from 'fs'
import path from 'path'
import {
  CatalogueRefreshGate,
  mergeSkinCatalogue,
  validateSkinCatalogue,
} from './data/catalogueRefresh'

let rawSkinCatalogue: unknown = []
let skinsData: APISkin[]
let stickerData: APISticker[]
let agentData: APIAgent[]
let keychainData: APIKeychain[]
let musicKitData: APIMusicKit[]
let collectibleData: APICollectible[]
let highlightData: APIHighlight[]

// Data freshness tracking
let dataLoadTimestamp: string | null = null
let dataLoadDuration: number | null = null

// In-memory cache for serverless environments
let isDataInitialized = false
const refreshGate = new CatalogueRefreshGate()
let refreshUsedFallback = false
let oldestFallbackTime: number | null = null

// Promise to track initialization status (for non-blocking startup)
let initializationPromise: Promise<void> | null = null
let refreshTimer: ReturnType<typeof setInterval> | null = null

// Define storage directory and file paths
// Use /tmp in serverless environments (like Vercel), fallback to local storage
const STORAGE_DIR =
  process.env.VERCEL || process.env.NETLIFY || process.env.AWS_LAMBDA_FUNCTION_NAME
    ? path.resolve('/tmp/csgo-api')
    : path.resolve('./storage/csgo-api')

// Define the type for API file configuration
type ApiFileConfig = {
  url: string
  path: string
  processor?: <T>(data: T[]) => T[]
  /** Transform applied to raw API data before saving to cache (runs only on fresh fetch) */
  postFetchTransform?: (data: unknown) => unknown
}

// Define the API files with their configurations
const API_FILES: Record<string, ApiFileConfig> = {
  skins: {
    url: EXTERNAL_API_URLS.SKINS,
    path: path.join(STORAGE_DIR, 'skins.json'),
    processor: processSkinData as <T>(data: T[]) => T[],
    // The API returns "sg556" but the game uses "sg553" (weapon ID, pattern IDs, etc.)
    postFetchTransform: (data: unknown) => {
      const json = JSON.stringify(data)
      return JSON.parse(json.replaceAll('sg556', 'sg553'))
    },
  },
  stickers: {
    url: EXTERNAL_API_URLS.STICKERS,
    path: path.join(STORAGE_DIR, 'stickers.json'),
  },
  keychains: {
    url: EXTERNAL_API_URLS.KEYCHAINS,
    path: path.join(STORAGE_DIR, 'keychains.json'),
    processor: processKeychainData as <T>(data: T[]) => T[],
  },
  agents: {
    url: EXTERNAL_API_URLS.AGENTS,
    path: path.join(STORAGE_DIR, 'agents.json'),
  },
  music_kits: {
    url: EXTERNAL_API_URLS.MUSIC_KITS,
    path: path.join(STORAGE_DIR, 'music_kits.json'),
  },
  collectibles: {
    url: EXTERNAL_API_URLS.COLLECTIBLES,
    path: path.join(STORAGE_DIR, 'collectibles.json'),
  },
  highlights: {
    url: EXTERNAL_API_URLS.HIGHLIGHTS,
    path: path.join(STORAGE_DIR, 'highlights.json'),
  },
}

// Skin processing is now handled by skinUtils module

export function getKeychainData(): APIKeychain[] {
  return keychainData
}

export function getSkinsData(): APISkin[] {
  return skinsData
}

export function getStickerData(): APISticker[] {
  return stickerData
}

export function getMusicKitData(): APIMusicKit[] {
  return musicKitData
}

export function getAgentData(): APIAgent[] {
  return agentData
}

export function getCollectibleData(): APICollectible[] {
  return collectibleData
}

export function getHighlightData(): APIHighlight[] {
  return highlightData
}

/**
 * Async getters that wait for initialization if needed
 * Use these in API endpoints that need the data
 */
export async function getKeychainDataAsync(): Promise<APIKeychain[]> {
  await ensureDataInitialized()
  return keychainData
}

export async function getSkinsDataAsync(): Promise<APISkin[]> {
  await ensureDataInitialized()
  return skinsData
}

export async function getStickerDataAsync(): Promise<APISticker[]> {
  await ensureDataInitialized()
  return stickerData
}

export async function getMusicKitDataAsync(): Promise<APIMusicKit[]> {
  await ensureDataInitialized()
  return musicKitData
}

export async function getAgentDataAsync(): Promise<APIAgent[]> {
  await ensureDataInitialized()
  return agentData
}

export async function getCollectibleDataAsync(): Promise<APICollectible[]> {
  await ensureDataInitialized()
  return collectibleData
}

export async function getHighlightDataAsync(): Promise<APIHighlight[]> {
  await ensureDataInitialized()
  return highlightData
}

/**
 * Ensures the storage directory exists
 * Returns true if successful, false if filesystem is read-only
 */
function ensureStorageDirectoryExists(): boolean {
  try {
    if (!fs.existsSync(STORAGE_DIR)) {
      fs.mkdirSync(STORAGE_DIR, { recursive: true })
      Logger.info(`Created storage directory: ${STORAGE_DIR}`, 'csgo-api')
    }
    return true
  } catch {
    Logger.warn(
      `Cannot create storage directory (read-only filesystem): ${STORAGE_DIR}`,
      'csgo-api'
    )
    return false
  }
}

/**
 * Fetches data from API and saves it to a file
 */
async function fetchAndSaveData(
  url: string,
  filePath: string,
  postFetchTransform?: (data: unknown) => unknown
): Promise<unknown> {
  try {
    Logger.info(`Fetching data from ${url}`, 'csgo-api')
    const response = await fetch(url, { signal: AbortSignal.timeout(30_000) })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const body = await response.text()
    if (Buffer.byteLength(body) > (url === EXTERNAL_API_URLS.SKINS ? 16 : 128) * 1024 * 1024)
      throw new Error('Oversized catalogue response')
    let data = JSON.parse(body)
    if (!Array.isArray(data) || data.length === 0) throw new Error('Invalid catalogue response')

    // Apply post-fetch transform before caching (e.g. fix API inconsistencies)
    if (postFetchTransform) {
      data = postFetchTransform(data)
    }

    if (url === EXTERNAL_API_URLS.SKINS) {
      validateSkinCatalogue(data)
      // Merge raw cached data, never processed Doppler display names.
      let previous: unknown = rawSkinCatalogue
      if (Array.isArray(previous) && previous.length === 0 && fs.existsSync(filePath)) {
        try {
          previous = readDataFromFile(filePath)
          validateSkinCatalogue(previous)
        } catch {
          previous = []
        }
      }
      data = mergeSkinCatalogue(previous, data)
      rawSkinCatalogue = data
    }

    // Try to save to file, but don't fail if we can't (serverless environment)
    try {
      const temporary = `${filePath}.tmp`
      fs.writeFileSync(temporary, JSON.stringify(data, null, 2))
      fs.renameSync(temporary, filePath)
      Logger.debug(`Saved data to ${filePath}`, 'csgo-api')
    } catch {
      Logger.warn(
        `Cannot save data to ${filePath} (read-only filesystem), using in-memory cache`,
        'csgo-api'
      )
    }

    return data
  } catch (error) {
    Logger.error(
      `Error fetching data from ${url}: ${error instanceof Error ? error.message : String(error)}`,
      'csgo-api'
    )
    throw error
  }
}

/**
 * Reads data from a file
 */
function readDataFromFile(filePath: string): unknown {
  try {
    const data = fs.readFileSync(filePath, 'utf8')
    return JSON.parse(data)
  } catch (error) {
    Logger.error(
      `Error reading data from ${filePath}: ${error instanceof Error ? error.message : String(error)}`,
      'csgo-api'
    )
    throw error
  }
}

/**
 * Generic function to load data from file or API
 */
async function loadData<T>(type: keyof typeof API_FILES): Promise<T[]> {
  const config = API_FILES[type]!

  try {
    let data: T[]

    // The refresh gate controls cadence. Always revalidate upstream on a due refresh.
    data = (await fetchAndSaveData(config.url, config.path, config.postFetchTransform)) as T[]

    // Apply processor function if provided
    if (config.processor && typeof config.processor === 'function') {
      data = config.processor(data) as T[]
    }

    return data
  } catch (error) {
    Logger.error(
      `Failed to load ${type} data: ${error instanceof Error ? error.message : String(error)}`,
      'csgo-api'
    )

    // If file exists but is invalid or we failed to fetch, try to use it anyway
    if (fs.existsSync(config.path)) {
      Logger.warn(`Falling back to existing ${type} data file`, 'csgo-api')
      const cached = readDataFromFile(config.path) as T[]
      if (!Array.isArray(cached) || cached.length === 0) throw new Error('Invalid cached catalogue', { cause: error })
      if (type === 'skins') {
        validateSkinCatalogue(cached)
        rawSkinCatalogue = cached
      }
      refreshUsedFallback = true
      const mtime = fs.statSync(config.path).mtimeMs
      oldestFallbackTime = Math.min(oldestFallbackTime ?? mtime, mtime)
      return config.processor ? (config.processor(cached) as T[]) : cached
    }

    throw error
  }
}

async function loadCatalogueSnapshot(): Promise<boolean> {
  const startTime = Date.now()

  try {
    refreshUsedFallback = false
    oldestFallbackTime = null
    const canWriteToStorage = ensureStorageDirectoryExists()
    if (!canWriteToStorage) {
      Logger.info('Running in serverless environment - using in-memory caching only', 'csgo-api')
    }

    // Load all data types in parallel
    const results = await Promise.allSettled([
      loadData<APISkin>('skins'),
      loadData<APISticker>('stickers'),
      loadData<APIKeychain>('keychains'),
      loadData<APIAgent>('agents'),
      loadData<APIMusicKit>('music_kits'),
      loadData<APICollectible>('collectibles'),
      loadData<APIHighlight>('highlights'),
    ] as const)
    const keepUsable = <T>(result: PromiseSettledResult<T[]>, previous: T[]): T[] => {
      if (result.status === 'fulfilled') return result.value
      if (!isDataInitialized || !previous) throw result.reason
      refreshUsedFallback = true
      return previous
    }
    const skins = keepUsable(results[0]!, skinsData)
    const stickers = keepUsable(results[1]!, stickerData)
    const keychains = keepUsable(results[2]!, keychainData)
    const agents = keepUsable(results[3]!, agentData)
    const musicKits = keepUsable(results[4]!, musicKitData)
    const collectibles = keepUsable(results[5]!, collectibleData)
    const highlights = keepUsable(results[6]!, highlightData)

    // Assign to global variables
    skinsData = skins
    stickerData = stickers
    keychainData = keychains
    agentData = agents
    musicKitData = musicKits
    collectibleData = collectibles
    highlightData = highlights

    // Track data freshness
    dataLoadTimestamp = refreshUsedFallback
      ? (dataLoadTimestamp ?? new Date(oldestFallbackTime ?? startTime).toISOString())
      : new Date().toISOString()
    dataLoadDuration = Date.now() - startTime

    // Update cache flags for serverless environments
    isDataInitialized = true

    Logger.info('CSGO API data loaded successfully', 'csgo-api')
    return !refreshUsedFallback
  } catch (error) {
    Logger.error(
      `Failed to initialize CSGO API data: ${error instanceof Error ? error.message : String(error)}`,
      'csgo-api'
    )
    // Reset promise on error so it can be retried
    initializationPromise = null
    throw error
  }
}

/**
 * Starts initialization in the background and returns the promise
 * Use this in server plugins to start initialization non-blocking
 */
export function initCSGOApiData(): Promise<void> {
  return refreshGate.run(loadCatalogueSnapshot)
}

export function startDataInitialization(): Promise<void> {
  if (initializationPromise) return initializationPromise
  initializationPromise = initCSGOApiData().finally(() => {
    initializationPromise = null
  })
  return initializationPromise
}

/** Serve the previous complete snapshot while a due refresh runs in the background. */
export async function ensureDataInitialized(): Promise<void> {
  const refresh = startDataInitialization()
  if (!isDataInitialized) {
    await refresh
    return
  }
  void refresh.catch(() => {
    /* loadCatalogueSnapshot logs failures; keep last good memory */
  })
}

/** Also refresh idle persistent servers. Request-driven refresh covers serverless deployments. */
export function startCatalogueRefresh(): () => void {
  if (!refreshTimer) {
    refreshTimer = setInterval(() => {
      void ensureDataInitialized().catch(() => {})
    }, 60_000)
    refreshTimer.unref?.()
  }
  return () => {
    if (refreshTimer) clearInterval(refreshTimer)
    refreshTimer = null
  }
}

/**
 * Gets data freshness information
 * @returns Object containing data load timestamp and duration
 */
export function getDataFreshness() {
  return {
    lastUpdated: dataLoadTimestamp,
    loadDuration: dataLoadDuration,
    isStale: dataLoadTimestamp
      ? Date.now() - new Date(dataLoadTimestamp).getTime() > DATA_STALENESS_THRESHOLD
      : true,
  }
}
