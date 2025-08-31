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
    skins: Ref<any[]> | ComputedRef<any[]>
): ComputedRef<boolean> {
    return computed(() => {
        if (!selectedItem.value) return false

        const currentTeam = selectedItem.value.databaseInfo?.team || 0
        const selectedDefindex = getItemDefindex(selectedItem.value)

        return skins.value.some(weaponGroup =>
            weaponGroup.some((weapon: WeaponItemData | KnifeItemData | GloveItemData) =>
                getItemDefindex(weapon) === selectedDefindex &&
                weapon.databaseInfo?.team === oppositeTeam(currentTeam)
            )
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
    skins: Ref<any[]> | ComputedRef<any[]>
): ComputedRef<Record<string, { weapons: any[], availableTeams: string, defaultName: string }>> {
    return computed(() => {
        return skins.value.reduce((acc, weaponGroup) => {
            // Skip empty groups
            if (!weaponGroup || !weaponGroup[0]) return acc;

            const weapon = weaponGroup[0];
            if (!acc[weapon.defaultName]) {
                acc[weapon.defaultName] = {
                    weapons: weaponGroup,
                    availableTeams: weapon.availableTeams,
                    defaultName: weapon.defaultName
                };
            }
            return acc;
        }, {});
    });
}