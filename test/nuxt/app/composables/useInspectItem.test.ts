import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { ItemConfiguration } from '~/types'
import { useInspectItem } from '~/composables/useInspectItem'

const STORAGE_KEY_ITEM = 'cs2inspect-item'
const STORAGE_KEY_CUSTOMIZATION = 'cs2inspect-customization'
const STORAGE_KEY_ITEM_TYPE = 'cs2inspect-item-type'

describe('useInspectItem composable', () => {
    const fetchMock = vi.fn()

    beforeEach(() => {
        vi.clearAllMocks()
        fetchMock.mockReset()
        vi.stubGlobal('$fetch', fetchMock)
        localStorage.clear()
    })

    it('analyzes inspect link, normalizes data, and persists state', async () => {
        fetchMock
            .mockResolvedValueOnce({
                item: {
                    defindex: 60,
                    paintindex: 38,
                    paintseed: 123,
                    paintwear: 1.8,
                    killeatervalue: 77,
                    killeaterscoretype: 1,
                    customname: 'Test Name',
                    stickers: null,
                    keychain: null,
                },
            })
            .mockResolvedValueOnce({
                name: 'M4A1-S | Printstream',
                image: 'https://example.com/printstream.png',
                min_float: 0.0,
                max_float: 0.8,
                rarity: { id: 'classified', name: 'Classified', color: '#d32ce6' },
                category: 'rifles',
            })

        const inspect = useInspectItem()
        await inspect.analyzeInspectLink('steam://inspect-url', '7656119')

        expect(inspect.itemType.value).toBe('weapon')
        expect(inspect.hasItem.value).toBe(true)
        expect((inspect.customization.value as { paintwear?: number }).paintwear).toBe(1)

        expect(localStorage.getItem(STORAGE_KEY_ITEM)).toBeTruthy()
        expect(localStorage.getItem(STORAGE_KEY_CUSTOMIZATION)).toBeTruthy()
        expect(localStorage.getItem(STORAGE_KEY_ITEM_TYPE)).toBe('weapon')
    })

    it('clears invalid persisted JSON on initialization', () => {
        localStorage.setItem(STORAGE_KEY_ITEM, '{bad-json')
        localStorage.setItem(STORAGE_KEY_CUSTOMIZATION, '{"active":true}')
        localStorage.setItem(STORAGE_KEY_ITEM_TYPE, 'weapon')

        useInspectItem()

        expect(localStorage.getItem(STORAGE_KEY_ITEM)).toBeNull()
        expect(localStorage.getItem(STORAGE_KEY_CUSTOMIZATION)).toBeNull()
        expect(localStorage.getItem(STORAGE_KEY_ITEM_TYPE)).toBeNull()
    })

    it('maps weapon customization into create-url payload for generateInspectLink', async () => {
        fetchMock
            .mockResolvedValueOnce({
                item: {
                    defindex: 60,
                    paintindex: 12,
                    paintseed: 7,
                    paintwear: 0.2,
                    killeatervalue: 3,
                    killeaterscoretype: 1,
                },
            })
            .mockResolvedValueOnce({
                name: 'M4A1-S | Player Two',
                image: 'https://example.com/m4a1s.png',
                min_float: 0.1,
                max_float: 0.7,
                rarity: { id: 'restricted', name: 'Restricted', color: '#8847ff' },
                category: 'rifles',
            })

        const inspect = useInspectItem()
        await inspect.analyzeInspectLink('steam://inspect-url', '7656119')

        const nextConfig = {
            ...(inspect.customization.value as Record<string, unknown>),
            stickers: [{ id: 5032, wear: 0.15, scale: 1, rotation: 12, x: 0.5, y: 0.1 }, null],
            keychain: { id: 6001, x: 0.2, y: 0.3, z: 0.4, seed: 11 },
        } as ItemConfiguration
        inspect.updateCustomization(nextConfig)

        fetchMock.mockResolvedValueOnce({ inspectUrl: 'steam://generated-url' })

        const result = await inspect.generateInspectLink('7656119')
        const [, requestOptions] = fetchMock.mock.calls[2] as [
            string,
            { body: Record<string, unknown> },
        ]
        const requestBody = requestOptions.body

        expect(result).toBe('steam://generated-url')
        expect(requestBody.itemType).toBe('weapon')
        expect((requestBody.stickers as unknown[]).length).toBe(1)
        expect((requestBody.keychain as { sticker_id?: number }).sticker_id).toBe(6001)
    })

    it('resets state and storage on clearItem', async () => {
        fetchMock
            .mockResolvedValueOnce({
                item: {
                    defindex: 60,
                    paintindex: 1,
                    paintseed: 1,
                    paintwear: 0.1,
                    killeatervalue: 0,
                    killeaterscoretype: 0,
                },
            })
            .mockResolvedValueOnce({
                name: 'M4A1-S | Nitro',
                image: 'https://example.com/nitro.png',
                min_float: 0,
                max_float: 1,
                rarity: { id: 'industrial', name: 'Industrial', color: '#5e98d9' },
                category: 'rifles',
            })

        const inspect = useInspectItem()
        await inspect.analyzeInspectLink('steam://inspect-url', '7656119')
        inspect.clearItem()

        expect(inspect.hasItem.value).toBe(false)
        expect(inspect.itemType.value).toBeNull()
        expect(localStorage.getItem(STORAGE_KEY_ITEM)).toBeNull()
        expect(localStorage.getItem(STORAGE_KEY_CUSTOMIZATION)).toBeNull()
        expect(localStorage.getItem(STORAGE_KEY_ITEM_TYPE)).toBeNull()
    })
})
