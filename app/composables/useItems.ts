// Generic type for any weapon-like data
type WeaponLikeData = {
    databaseInfo?: { defindex?: number; team?: number } | undefined
    defaultName: string
    availableTeams: string
    weapon_defindex?: number
    [key: string]: unknown
}

/**
 * Helper function to get the defindex from item data
 */
function getItemDefindex(item: WeaponLikeData): number {
    return item.databaseInfo?.defindex || (item.weapon_defindex as number) || 0
}

/**
 * Checks if the selected weapon/knife has a skin configured for the other team
 */
export function useOtherTeamSkin<T extends WeaponLikeData>(
    selectedItem: Ref<T | null> | ComputedRef<T | null>,
    skins: Ref<Array<T>> | ComputedRef<Array<T>>
): ComputedRef<boolean> {
    return computed(() => {
        if (!selectedItem.value) return false

        const currentTeam = selectedItem.value.databaseInfo?.team || 0
        const selectedDefindex = getItemDefindex(selectedItem.value)
        const targetTeam = oppositeTeam(currentTeam)

        return skins.value.some(
            (weapon: T) =>
                getItemDefindex(weapon) === selectedDefindex &&
                weapon.databaseInfo?.team === targetTeam
        )
    })
}

export const oppositeTeam = (current: number) => {
    // If T, return CT and vice versa
    return current === 1 ? 2 : 1
}

/**
 * Groups weapons by their default name and returns a computed property
 * @param skins Ref or ComputedRef containing array of weapon groups
 * @returns ComputedRef with grouped weapons
 */
export function useGroupedWeapons<T extends WeaponLikeData>(
    skins: Ref<Array<T>> | ComputedRef<Array<T>>
): ComputedRef<Record<string, { weapons: Array<T>; availableTeams: string; defaultName: string }>> {
    return computed(() => {
        return skins.value.reduce<
            Record<string, { weapons: Array<T>; availableTeams: string; defaultName: string }>
        >((acc, itemOrGroup) => {
            if (!itemOrGroup) return acc

            // Helper to process a single item
            const processItem = (weapon: T) => {
                const name = weapon.defaultName
                if (!acc[name]) {
                    acc[name] = {
                        weapons: [],
                        availableTeams: weapon.availableTeams,
                        defaultName: name,
                    }
                }

                // Avoid duplicates if needed, or just push
                acc[name].weapons.push(weapon)

                // Update availability logic if mixed teams found (optional optimization)
            }

            // Handle nested arrays (legacy structure) or flat items
            if (Array.isArray(itemOrGroup)) {
                // It's a group/array of items
                ;(itemOrGroup as Array<T>).forEach((item) => processItem(item))
            } else {
                // It's a single item
                processItem(itemOrGroup as T)
            }

            return acc
        }, {})
    })
}
