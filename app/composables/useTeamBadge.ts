/**
 * useTeamBadge – returns reactive team label text and badge CSS classes.
 *
 * Accepts either a raw `Ref<number | undefined>` for the team value,
 * or a getter function that returns the team number.
 */
export function useTeamBadge(team: Ref<number | undefined> | (() => number | undefined)) {
    const { t } = useI18n()

    const teamValue = typeof team === 'function' ? computed(team) : team

    const teamLabel = computed((): string | null => {
        if (teamValue.value === 1) return t('modals.weaponSkin.team.terrorist') as string
        if (teamValue.value === 2) return t('modals.weaponSkin.team.counterTerrorist') as string
        return null
    })

    const teamBadgeClasses = computed(() => {
        if (teamValue.value === 1) return 'border-orange-500/30 bg-orange-500/15 text-orange-300'
        if (teamValue.value === 2) return 'border-blue-500/30 bg-blue-500/15 text-blue-300'
        return ''
    })

    return { teamLabel, teamBadgeClasses }
}
