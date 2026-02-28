/**
 * Sticker effect constants and helpers shared by StickerModal and WrappedStickerModal.
 */

/**
 * Map UI-facing effect labels to actual dataset values.
 * In the dataset, "Other" is effectively the "Paper" / non-special category.
 */
export const EFFECT_VALUE_MAP: Record<string, string[]> = {
    Paper: ['Paper', 'Other'],
    Holo: ['Holo'],
    Foil: ['Foil'],
    Glitter: ['Glitter'],
    Gold: ['Gold'],
    Lenticular: ['Lenticular'],
}

export const EFFECT_ORDER = ['Paper', 'Holo', 'Foil', 'Glitter', 'Gold', 'Lenticular'] as const

/**
 * Normalize a sticker's effect string to a UI-facing label.
 * Maps `undefined` / `"Other"` to `"Paper"`.
 */
export function effectLabelForSticker(effect: string | undefined): string {
    const v = effect || 'Other'
    return v === 'Other' ? 'Paper' : v
}

export interface EffectOption {
    id: string
    label: string
}

/**
 * Derive the list of available effect filter options from a set of items.
 * Each item is expected to have an optional `effect` string field.
 */
export function buildAvailableEffects(items: { effect?: string }[]): EffectOption[] {
    const present = new Set<string>()
    for (const item of items) {
        present.add(item.effect || 'Other')
    }

    const opts: EffectOption[] = []
    const mappedValues = new Set<string>()

    for (const id of EFFECT_ORDER) {
        const values = EFFECT_VALUE_MAP[id] || [id]
        for (const v of values) mappedValues.add(v)
    }

    for (const id of EFFECT_ORDER) {
        const values = EFFECT_VALUE_MAP[id] || [id]
        if (values.some((v) => present.has(v))) {
            opts.push({ id, label: id })
        }
    }

    // Include any additional effect values present in the dataset (e.g., "Embroidered")
    const extras = Array.from(present)
        .filter((v) => !mappedValues.has(v))
        .sort((a, b) => a.localeCompare(b))
    for (const effect of extras) {
        opts.push({ id: effect, label: effect })
    }

    return opts
}

/**
 * Build a set of allowed raw effect values from a set of selected effect filter IDs.
 */
export function buildAllowedEffectSet(effectFilterIds: string[]): Set<string> {
    const allowed = new Set<string>()
    for (const id of effectFilterIds) {
        const values = EFFECT_VALUE_MAP[id] || [id]
        for (const v of values) allowed.add(v)
    }
    return allowed
}
