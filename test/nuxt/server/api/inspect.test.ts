import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp, toNodeListener } from 'h3'
import { fetchNodeRequestHandler, type NodeRequestHandler } from 'node-mock-http'
import { resolve } from 'node:path'

interface InspectTestMocks {
    createInspectUrl: ReturnType<typeof vi.fn>
    analyzeUrl: ReturnType<typeof vi.fn>
    decodeMaskedData: ReturnType<typeof vi.fn>
    requiresSteamClient: ReturnType<typeof vi.fn>
    validateUrl: ReturnType<typeof vi.fn>
    getCS2Client: ReturnType<typeof vi.fn>
    getCachedSetting: ReturnType<typeof vi.fn>
    localClient: {
        isSteamClientReady: ReturnType<typeof vi.fn>
        inspectItem: ReturnType<typeof vi.fn>
        decodeMaskedUrl: ReturnType<typeof vi.fn>
        getSteamClientStats: ReturnType<typeof vi.fn>
    }
    service: {
        createInspectUrl: ReturnType<typeof vi.fn>
        inspectItem: ReturnType<typeof vi.fn>
        decodeMaskedOnly: ReturnType<typeof vi.fn>
        decodeHexData: ReturnType<typeof vi.fn>
        validateUrl: ReturnType<typeof vi.fn>
        analyzeUrl: ReturnType<typeof vi.fn>
        getStatus: ReturnType<typeof vi.fn>
    }
}

function createMocks(): InspectTestMocks {
    const localClient = {
        isSteamClientReady: vi.fn(),
        inspectItem: vi.fn(),
        decodeMaskedUrl: vi.fn(),
        getSteamClientStats: vi.fn(),
    }

    return {
        createInspectUrl: vi.fn(),
        analyzeUrl: vi.fn(),
        decodeMaskedData: vi.fn(),
        requiresSteamClient: vi.fn(),
        validateUrl: vi.fn(),
        getCS2Client: vi.fn(() => localClient),
        getCachedSetting: vi.fn(),
        localClient,
        service: {
            createInspectUrl: vi.fn(),
            inspectItem: vi.fn(),
            decodeMaskedOnly: vi.fn(),
            decodeHexData: vi.fn(),
            validateUrl: vi.fn(),
            analyzeUrl: vi.fn(),
            getStatus: vi.fn(),
        },
    }
}

function seedMockDefaults(mocks: InspectTestMocks) {
    mocks.getCachedSetting.mockResolvedValue(true)
    mocks.createInspectUrl.mockReturnValue('steam://created-url')
    mocks.analyzeUrl.mockReturnValue({
        url_type: 'masked',
        hex_data: 'abcdef',
        is_quoted: false,
    })
    mocks.decodeMaskedData.mockReturnValue({ defindex: 7, paintindex: 180 })
    mocks.requiresSteamClient.mockReturnValue(false)
    mocks.validateUrl.mockReturnValue({ valid: true })

    mocks.localClient.isSteamClientReady.mockReturnValue(true)
    mocks.localClient.inspectItem.mockResolvedValue({ defindex: 7, paintindex: 180 })
    mocks.localClient.decodeMaskedUrl.mockReturnValue({ defindex: 7, paintindex: 180 })
    mocks.localClient.getSteamClientStats.mockReturnValue({
        isAvailable: true,
        status: 'ready',
        queueLength: 1,
        unmaskedSupport: true,
    })

    mocks.service.createInspectUrl.mockResolvedValue({
        success: true,
        data: { inspectUrl: 'steam://service-created', itemData: {}, itemType: 'weapon' },
    })
    mocks.service.inspectItem.mockResolvedValue({ success: true, data: { defindex: 7 } })
    mocks.service.decodeMaskedOnly.mockResolvedValue({ success: true, data: { defindex: 7 } })
    mocks.service.decodeHexData.mockResolvedValue({ success: true, data: { defindex: 7 } })
    mocks.service.validateUrl.mockResolvedValue({
        success: true,
        data: { valid: true, urlInfo: { url_type: 'masked' } },
    })
    mocks.service.analyzeUrl.mockResolvedValue({
        success: true,
        data: { url_type: 'masked' },
    })
    mocks.service.getStatus.mockResolvedValue({
        success: true,
        data: {
            steamClient: { available: true, status: 'ready' },
            queue: { pending: 0, processing: 0, maxSize: 100 },
            server: { uptime: 1, version: 'test' },
        },
    })
}

async function buildHandler(
    mocks: InspectTestMocks,
    useService = false
): Promise<NodeRequestHandler> {
    const initModulePath = resolve(process.cwd(), 'server/plugins/init.ts')
    const settingsCachePath = resolve(process.cwd(), 'server/utils/settingsCache.ts')
    const steamServiceClientPath = resolve(process.cwd(), 'server/utils/api/steamServiceClient.ts')

    vi.resetModules()
    process.env.STEAM_SERVICE_URL = useService ? 'http://steam-service.local' : ''
    process.env.STEAM_SERVICE_API_KEY = useService ? 'test-key' : ''

    vi.doMock('cs2-inspect-lib', () => ({
        WeaponType: { AK_47: 7, KARAMBIT: 507 },
        WeaponPaint: { AK_47_FIRE_SERPENT: 180, KARAMBIT_DOPPLER: 420 },
        ItemRarity: { COVERT: 6 },
        createInspectUrl: mocks.createInspectUrl,
        analyzeUrl: mocks.analyzeUrl,
        decodeMaskedData: mocks.decodeMaskedData,
        requiresSteamClient: mocks.requiresSteamClient,
        validateUrl: mocks.validateUrl,
    }))

    vi.doMock(initModulePath, () => ({
        getCS2Client: mocks.getCS2Client,
    }))

    vi.doMock(settingsCachePath, () => ({
        getCachedSetting: mocks.getCachedSetting,
    }))

    vi.doMock(steamServiceClientPath, () => ({
        steamServiceClient: mocks.service,
    }))

    const mod = await import('../../../../server/api/inspect/index')
    const app = createApp()
    app.use('/api/inspect', mod.default)
    return toNodeListener(app) as NodeRequestHandler
}

async function post(
    handler: NodeRequestHandler,
    action: string | undefined,
    body: Record<string, unknown>
) {
    const query = action ? `?action=${encodeURIComponent(action)}` : ''
    return fetchNodeRequestHandler(handler, `/api/inspect${query}`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
    })
}

describe('/api/inspect route contracts', () => {
    beforeEach(() => {
        vi.restoreAllMocks()
        process.env.STEAM_SERVICE_URL = ''
        process.env.STEAM_SERVICE_API_KEY = ''
    })

    it('returns 400 when action is missing', async () => {
        const mocks = createMocks()
        seedMockDefaults(mocks)
        const handler = await buildHandler(mocks, false)

        const response = await post(handler, undefined, {})
        const body = (await response.json()) as { statusCode?: number }

        expect(response.status).toBe(400)
        expect(body.statusCode).toBe(400)
    })

    it('returns 403 when inspect URL creation feature is disabled', async () => {
        const mocks = createMocks()
        seedMockDefaults(mocks)
        mocks.getCachedSetting.mockResolvedValueOnce(false)
        const handler = await buildHandler(mocks, false)

        const response = await post(handler, 'create-url', { itemType: 'weapon' })
        const body = (await response.json()) as { statusCode?: number }

        expect(response.status).toBe(403)
        expect(body.statusCode).toBe(403)
    })

    it('creates inspect URL through local path', async () => {
        const mocks = createMocks()
        seedMockDefaults(mocks)
        const handler = await buildHandler(mocks, false)

        const response = await post(handler, 'create-url', { itemType: 'weapon', defindex: 7 })
        const body = (await response.json()) as { success: boolean; inspectUrl: string }

        expect(response.status).toBe(200)
        expect(body.success).toBe(true)
        expect(body.inspectUrl).toBe('steam://created-url')
        expect(mocks.createInspectUrl).toHaveBeenCalledTimes(1)
    })

    it('returns 400 for URL actions when inspectUrl is missing', async () => {
        const mocks = createMocks()
        seedMockDefaults(mocks)
        const handler = await buildHandler(mocks, false)

        const response = await post(handler, 'analyze-url', {})
        const body = (await response.json()) as { statusCode?: number }

        expect(response.status).toBe(400)
        expect(body.statusCode).toBe(400)
    })

    it('returns 503 for unmasked URL when local steam client is unavailable', async () => {
        const mocks = createMocks()
        seedMockDefaults(mocks)
        mocks.analyzeUrl.mockReturnValueOnce({
            url_type: 'unmasked',
            is_quoted: false,
            hex_data: null,
        })
        mocks.localClient.isSteamClientReady.mockReturnValueOnce(false)
        const handler = await buildHandler(mocks, false)

        const response = await post(handler, 'inspect-item', {
            inspectUrl: 'steam://unmasked',
            itemType: 'weapon',
        })
        const body = (await response.json()) as { statusCode?: number }

        expect(response.status).toBe(503)
        expect(body.statusCode).toBe(503)
    })

    it('returns 400 for decode-masked-only when local decoder receives unmasked URL', async () => {
        const mocks = createMocks()
        seedMockDefaults(mocks)
        mocks.localClient.decodeMaskedUrl.mockImplementationOnce(() => {
            throw new Error('unmasked URL provided')
        })
        const handler = await buildHandler(mocks, false)

        const response = await post(handler, 'decode-masked-only', {
            inspectUrl: 'steam://not-masked',
        })
        const body = (await response.json()) as { statusCode?: number }

        expect(response.status).toBe(400)
        expect(body.statusCode).toBe(400)
    })

    it('returns 400 for invalid hex payload in decode-hex-data', async () => {
        const mocks = createMocks()
        seedMockDefaults(mocks)
        mocks.decodeMaskedData.mockImplementationOnce(() => {
            throw new Error('bad hex')
        })
        const handler = await buildHandler(mocks, false)

        const response = await post(handler, 'decode-hex-data', { hexData: 'bad' })
        const body = (await response.json()) as { statusCode?: number }

        expect(response.status).toBe(400)
        expect(body.statusCode).toBe(400)
    })

    it('uses steam-service client for analyze-url when service mode is enabled', async () => {
        const mocks = createMocks()
        seedMockDefaults(mocks)
        const handler = await buildHandler(mocks, true)

        const response = await post(handler, 'analyze-url', { inspectUrl: 'steam://service-url' })
        const body = (await response.json()) as {
            success: boolean
            analysis: { url_type: string }
            requiresSteamClient: boolean
        }

        expect(response.status).toBe(200)
        expect(body.success).toBe(true)
        expect(body.analysis.url_type).toBe('masked')
        expect(mocks.service.analyzeUrl).toHaveBeenCalledWith({ inspectUrl: 'steam://service-url' })
        expect(mocks.getCS2Client).not.toHaveBeenCalled()
    })
})
