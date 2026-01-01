import type { WeaponItemData, KnifeItemData, GloveItemData } from "~/types"

/**
 * Helper function to get the defindex from modern item data
 */
function getItemDefindex(item: WeaponItemData | KnifeItemData | GloveItemData): number {
    return item.databaseInfo?.defindex || 0
}

/**
 * Checks if the selected weapon/knife has a skin configured for the other team
 */
export function useOtherTeamSkin(
    selectedItem: Ref<WeaponItemData | KnifeItemData | GloveItemData | null> | ComputedRef<WeaponItemData | KnifeItemData | GloveItemData | null>,
    skins: Ref<Array<WeaponItemData | KnifeItemData | GloveItemData>> | ComputedRef<Array<WeaponItemData | KnifeItemData | GloveItemData>>
): ComputedRef<boolean> {
    return computed(() => {
        if (!selectedItem.value) return false

        const currentTeam = selectedItem.value.databaseInfo?.team || 0
        const selectedDefindex = getItemDefindex(selectedItem.value)
        const targetTeam = oppositeTeam(currentTeam)

        return skins.value.some((weapon: WeaponItemData | KnifeItemData | GloveItemData) =>
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
export function useGroupedWeapons(
    skins: Ref<Array<WeaponItemData | KnifeItemData | GloveItemData>> | ComputedRef<Array<WeaponItemData | KnifeItemData | GloveItemData>>
): ComputedRef<Record<string, { weapons: Array<WeaponItemData | KnifeItemData | GloveItemData>, availableTeams: string, defaultName: string }>> {
    return computed(() => {
        return skins.value.reduce<Record<string, { weapons: Array<WeaponItemData | KnifeItemData | GloveItemData>, availableTeams: string, defaultName: string }>>((acc, weapon) => {
            if (!weapon) return acc;

            const name = weapon.defaultName;
            if (!acc[name]) {
                acc[name] = {
                    weapons: [],
                    availableTeams: weapon.availableTeams,
                    defaultName: name
                };
            }

            acc[name].weapons.push(weapon);

            // Update availability to 'both' if we have both teams represented
            if (acc[name].availableTeams !== 'both' && weapon.availableTeams !== acc[name].availableTeams) {
                // Optimization: if we see T and CT separately, logic might need check
                // For now, simpler grouping
            }

            return acc;
        }, {});
    });
}