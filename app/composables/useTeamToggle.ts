type TeamSide = 'ct' | 't'

// Module-level shared state so all components using useTeamToggle() share the same ref
const teamSide = ref<TeamSide>('ct')
let initialized = false

export function useTeamToggle() {
  const teamSideCookie = useCookie<TeamSide>('team-side', {
    default: () => 'ct' as TeamSide,
    maxAge: 60 * 60 * 24 * 365,
    path: '/',
  })

  // Initialize from cookie only once
  if (!initialized) {
    teamSide.value = teamSideCookie.value
    initialized = true
  }

  // Maps 'ct' -> 2 (CounterTerrorist), 't' -> 1 (Terrorist)
  // Matches TeamSide enum in shared/types/common.ts
  const teamNumber = computed(() => (teamSide.value === 'ct' ? 2 : 1))

  function toggleTeam() {
    teamSide.value = teamSide.value === 'ct' ? 't' : 'ct'
  }

  function setTeam(side: TeamSide) {
    teamSide.value = side
  }

  // Sync reactive state back to cookie on client
  if (import.meta.client) {
    watch(teamSide, (val) => {
      teamSideCookie.value = val
    })
  }

  return { teamSide, teamNumber, toggleTeam, setTeam }
}
