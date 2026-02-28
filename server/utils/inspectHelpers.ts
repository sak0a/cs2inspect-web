import type { Sticker } from 'cs2-inspect-lib'

interface StickerInput {
    id: number
    x?: number
    y?: number
    wear?: number
    scale?: number
    rotation?: number
}

interface KeychainInput {
    id: number | string
    x?: number
    y?: number
    z?: number
    seed?: number
    wrapped_sticker_id?: number
    highlight_reel_id?: number
}

export interface CustomizationInput {
    stickers: (StickerInput | null)[]
    keychain?: KeychainInput | null
}

/**
 * Maps the customization data from the frontend format to the format required by the inspect URL generator
 */
export function mapCustomizationToRepresentation(customization: CustomizationInput) {
    // Map stickers to the format required by the inspect URL generator
    const stickers = customization.stickers
        .map((sticker, index) => {
            if (!sticker) return null
            return {
                slot: index,
                sticker_id: sticker.id,
                wear: sticker.wear,
                scale: sticker.scale,
                rotation: sticker.rotation,
                offset_x: sticker.x,
                offset_y: sticker.y,
            } as Sticker
        })
        .filter((sticker): sticker is Sticker => sticker !== null)

    // Map keychain to the format required by the inspect URL generator
    // Special handling for different keychain types:
    // - Sticker Slab (ID 37): uses wrapped_sticker for the sticker inside
    // - Austin 2025 Highlight (ID 36) and Budapest 2025 Highlight (ID 83): use highlight_reel
    const STICKER_SLAB_ID = 37
    const AUSTIN_HIGHLIGHT_ID = 36
    const BUDAPEST_HIGHLIGHT_ID = 83

    const keychain = customization.keychain
        ? (() => {
              const keychainId = Number(customization.keychain!.id)
              const isStickerSlab = keychainId === STICKER_SLAB_ID
              const isHighlightReel =
                  keychainId === AUSTIN_HIGHLIGHT_ID || keychainId === BUDAPEST_HIGHLIGHT_ID

              // Determine pattern value based on keychain type
              let patternValue = customization.keychain!.seed
              if (isStickerSlab && customization.keychain!.wrapped_sticker_id) {
                  patternValue = customization.keychain!.wrapped_sticker_id
              } else if (isHighlightReel && customization.keychain!.highlight_reel_id) {
                  patternValue = customization.keychain!.highlight_reel_id
              }

              return {
                  slot: 0,
                  sticker_id: keychainId,
                  offset_x: customization.keychain!.x,
                  offset_y: customization.keychain!.y,
                  offset_z: customization.keychain!.z,
                  pattern: patternValue,
                  // Only set wrapped_sticker for sticker slabs
                  wrapped_sticker: isStickerSlab
                      ? customization.keychain!.wrapped_sticker_id
                      : undefined,
                  // Only set highlight_reel for highlight reel keychains
                  highlight_reel: isHighlightReel
                      ? customization.keychain!.highlight_reel_id
                      : undefined,
              } as Sticker
          })()
        : null

    return {
        stickers,
        keychain,
    }
}
