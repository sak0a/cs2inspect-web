import { describe, expect, it } from 'bun:test'
import { formatTaggedMessage, resolveCanonicalTag, stripManualPrefix } from '../tags'

describe('log tag normalization', () => {
    it('maps known contexts to canonical tags', () => {
        expect(resolveCanonicalTag({ context: 'healthcheck' })).toBe('Health')
        expect(resolveCanonicalTag({ context: 'migrations' })).toBe('DB')
        expect(resolveCanonicalTag({ context: 'startup' })).toBe('Boot')
        expect(resolveCanonicalTag({ context: 'sync-cleanup' })).toBe('Sync')
    })

    it('formats unknown contexts as title tags', () => {
        expect(resolveCanonicalTag({ context: 'my feature' })).toBe('MyFeature')
        expect(resolveCanonicalTag({ context: 'image_proxy' })).toBe('ImageProxy')
    })

    it('strips manual prefixes and renders canonical pretty output', () => {
        expect(stripManualPrefix('[Healthcheck] Sampler start interval=60s')).toBe(
            'Sampler start interval=60s'
        )
        expect(formatTaggedMessage('healthcheck', '[Healthcheck] Sampler start interval=60s')).toBe(
            '[Health] Sampler start interval=60s'
        )
    })
})
