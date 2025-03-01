/**
 * Checks if the selected weapon/knife has a skin configured for the other team
 */
export function useOtherTeamSkin(
    selectedItem: Ref<IEnhancedItem | null> | ComputedRef<IEnhancedItem | null>,
    skins: Ref<any[]> | ComputedRef<any[]>
): ComputedRef<boolean> {
    return computed(() => {
        if (!selectedItem.value) return false

        const currentTeam = selectedItem.value.databaseInfo?.team || 0

        return skins.value.some(weaponGroup =>
            weaponGroup.some((weapon: IEnhancedItem) =>
                weapon.weapon_defindex === selectedItem.value?.weapon_defindex &&
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