<script setup lang="ts">
import type { SteamUser } from '~/services/steamAuth'
import { steamAuth } from '~/services/steamAuth'
import type { APIAgent } from '~/types'
import { toSteamId } from '~/types/core/branded'
import agentSilhouette from '~/assets/svg/agent.svg'

const user = ref<SteamUser | null>(null)
const isLoading = ref<boolean>(true)
const error = ref<string | null>(null)
const tAgentType = ref<number | null>(null)
const ctAgentType = ref<number | null>(null)
const agents = ref<APIAgent[]>([])

const loadoutStore = useLoadoutStore()
const message = useToast()
const { t } = useI18n()
const { teamSide } = useTeamToggle()

// Initialize agents with an empty array to prevent undefined errors
agents.value = []

// Filter agents by team
const tAgents = computed(() => {
  if (!agents.value) return []
  return agents.value.filter((agent) => agent.team.id === 'terrorists')
})

const ctAgents = computed(() => {
  if (!agents.value) return []
  return agents.value.filter((agent) => agent.team.id === 'counter-terrorists')
})

// Current team's agents and options based on global toggle
const currentAgents = computed(() => (teamSide.value === 't' ? tAgents.value : ctAgents.value))
const currentAgentOptions = computed(() =>
  teamSide.value === 't' ? tAgentOptions.value : ctAgentOptions.value
)
const currentAgentType = computed({
  get: () => (teamSide.value === 't' ? tAgentType.value : ctAgentType.value),
  set: (val) => {
    if (teamSide.value === 't') tAgentType.value = val
    else ctAgentType.value = val
  },
})

// Create options for the dropdowns
const tAgentOptions = computed(() => {
  return [
    { label: 'Player Inventory', value: -1 },
    { label: 'Default', value: 0 },
    ...(tAgents.value || []).map((agent) => ({
      label: agent.name,
      value: parseInt(agent.id.replace('agent-', '')),
    })),
  ]
})

const ctAgentOptions = computed(() => {
  return [
    { label: 'Player Inventory', value: -1 },
    { label: 'Default', value: 0 },
    ...(ctAgents.value || []).map((agent) => ({
      label: agent.name,
      value: parseInt(agent.id.replace('agent-', '')),
    })),
  ]
})

const handleAgentTypeChange = async (team: 't' | 'ct', agentDefindex: number) => {
  if (!loadoutStore.selectedLoadoutId || !loadoutStore.selectedLoadout || !user.value?.steamId) {
    message.error('Please select a loadout first')
    return
  }

  await $fetch(
    `/api/loadouts/select?steamId=${user.value.steamId}&loadoutId=${loadoutStore.selectedLoadoutId}&type=agent`,
    {
      method: 'POST',
      body: {
        team: team === 't' ? 1 : 2,
        defindex: agentDefindex === -1 ? null : agentDefindex,
      },
    }
  )
    .then(async () => {
      if (!loadoutStore.selectedLoadout) {
        return
      }
      if (team === 't') {
        loadoutStore.selectedLoadout.selected_agent_t = agentDefindex === -1 ? null : agentDefindex
      } else {
        loadoutStore.selectedLoadout.selected_agent_ct = agentDefindex === -1 ? null : agentDefindex
      }

      message.success(`${team === 't' ? 'Terrorist' : 'Counter-Terrorist'} agent updated`)
    })
    .catch((error) => {
      console.error(error)
      message.error('Failed to update Agent Type')
    })
}

// Display label for the current selection (reka Select won't show a preselected
// option's label until the menu is opened, so derive it from the options list).
const currentAgentLabel = computed(
  () => currentAgentOptions.value.find((o) => o.value === currentAgentType.value)?.label
)

const onAgentTypeChange = (val: unknown) => {
  const defindex = Number(val)
  currentAgentType.value = defindex
  handleAgentTypeChange(teamSide.value, defindex)
}

const handleAgentSelect = (agent: APIAgent) => {
  const team = agent.team.id === 'terrorists' ? 't' : 'ct'
  const agentDefindex = parseInt(agent.id.replace('agent-', ''))

  if (team === 't') {
    tAgentType.value = agentDefindex
  } else {
    ctAgentType.value = agentDefindex
  }

  handleAgentTypeChange(team, agentDefindex)
}

const fetchAgents = async () => {
  isLoading.value = true
  try {
    // Make sure agents is initialized as an empty array
    if (!agents.value) {
      agents.value = []
    }

    const response = await $fetch<{ data: APIAgent[] }>('/api/data/agents')
    console.log('Received agents data:', response)
    agents.value = response.data ?? []

    // Set initial selected agents if available in loadout
    if (loadoutStore.selectedLoadout) {
      tAgentType.value = loadoutStore.selectedLoadout.selected_agent_t ?? -1
      ctAgentType.value = loadoutStore.selectedLoadout.selected_agent_ct ?? -1
    }
  } catch (error) {
    console.error('Error fetching agents:', error)
    message.error('Failed to load agents')
    agents.value = [] // Ensure agents is at least an empty array on error
  } finally {
    isLoading.value = false
  }
}

// Scroll container (team-keyed, remounts on team switch). The wheel listener
// is bound via an element watch so every remounted container gets one — the
// old element's listener dies with the element.
const scrollContainer = ref<HTMLDivElement | null>(null)
watch(scrollContainer, (container) => {
  if (!container) return
  container.addEventListener(
    'wheel',
    (event: WheelEvent) => {
      if (event.deltaY) {
        event.preventDefault()
        // Adjust scroll speed for smoother scrolling
        container.scrollLeft += event.deltaY * 0.5
      }
    },
    { passive: false }
  )
})

// Motion: cards stagger in once the skeletons swap out; team switches run the
// directional wipe (teamSide is deliberately NOT a reveal watch source).
useGridReveal(scrollContainer, { watch: () => isLoading.value })
const teamSwap = useTeamSwapMotion(teamSide)

onMounted(async () => {
  user.value = steamAuth.getSavedUser()
  if (user.value?.steamId) {
    try {
      await loadoutStore.fetchLoadouts(toSteamId(user.value.steamId))
      await fetchAgents()
    } catch (error) {
      console.error('Error during initialization:', error)
      message.error('Failed to initialize page')
      isLoading.value = false
    }
  } else {
    isLoading.value = false
  }
})

watch(
  () => loadoutStore.selectedLoadoutId,
  async (newLoadoutId) => {
    if (newLoadoutId !== null && agents.value.length > 0) {
      // Update selected agents based on loadout
      if (loadoutStore.selectedLoadout) {
        tAgentType.value = loadoutStore.selectedLoadout.selected_agent_t ?? -1
        ctAgentType.value = loadoutStore.selectedLoadout.selected_agent_ct ?? -1
      }
    }
  }
)
</script>

<template>
  <div class="p-4">
    <div class="max-w-7xl mx-auto content-fade-in">
      <SkinPageLayout
        :title="t('extras.agents') as string"
        :user="user"
        :error="error || ''"
        :is-loading="isLoading && (!user || !loadoutStore.selectedLoadoutId)"
      />
      <!-- Agent Type Groups -->
      <div v-if="!error && user && loadoutStore.selectedLoadoutId" class="relative">
        <Transition name="skeleton-fade">
          <!-- Loading State: skeleton row matching the agent card stage height -->
          <div
            v-if="isLoading"
            key="skeleton"
            class="flex gap-4 overflow-hidden pb-6"
            aria-hidden="true"
          >
            <ItemCardSkeleton
              v-for="i in 5"
              :key="i"
              stage-class="h-48"
              class="mx-2 mt-2 w-56 shrink-0 sm:w-64"
            />
          </div>

          <!-- No Agents State -->
          <Empty v-else-if="!agents || agents.length === 0" key="empty" class="py-10">
            <EmptyHeader>
              <EmptyMedia>
                <WeaponSilhouette
                  :src="agentSilhouette"
                  class="h-16 w-24 text-text-tertiary opacity-60"
                />
              </EmptyMedia>
              <EmptyTitle class="font-display tracking-[-0.02em]">
                {{ t('agents.noAgentsAvailable') }}
              </EmptyTitle>
            </EmptyHeader>
          </Empty>

          <!-- Agents Grid with Horizontal Scrolling -->
          <div v-else key="content">
            <div class="mb-4 flex flex-col gap-1.5">
              <span
                id="agent-select-label"
                class="font-mono text-[10px] uppercase tracking-[0.12em] text-text-tertiary"
              >
                {{ t('extras.agents') }}
              </span>
              <Select :model-value="currentAgentType" @update:model-value="onAgentTypeChange">
                <SelectTrigger class="w-full sm:w-72" aria-labelledby="agent-select-label">
                  <span v-if="currentAgentLabel">{{ currentAgentLabel }}</span>
                  <span v-else class="text-muted-foreground">{{ t('agents.selectAgent') }}</span>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem
                    v-for="opt in currentAgentOptions"
                    :key="opt.value"
                    :value="opt.value"
                  >
                    {{ opt.label }}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div class="overflow-x-auto">
              <!-- Directional wipe on team switch (grid keyed by teamSide) -->
              <Transition
                :css="false"
                mode="out-in"
                @enter="teamSwap.onEnter"
                @leave="teamSwap.onLeave"
                @enter-cancelled="teamSwap.onEnterCancelled"
                @leave-cancelled="teamSwap.onLeaveCancelled"
              >
                <div
                  v-if="currentAgents && currentAgents.length > 0"
                  :key="teamSide"
                  ref="scrollContainer"
                  class="flex gap-4 pb-6 overflow-x-auto horizontal-scroll"
                  style="min-width: max-content"
                >
                  <AgentTabs
                    v-for="agent in currentAgents"
                    :key="agent.id"
                    :agent="agent"
                    :is-selected="currentAgentType === parseInt(agent.id.replace('agent-', ''))"
                    @select="handleAgentSelect"
                  />
                </div>
                <Empty v-else :key="`empty-${teamSide}`" class="py-10">
                  <EmptyHeader>
                    <EmptyMedia>
                      <WeaponSilhouette
                        :src="agentSilhouette"
                        class="h-16 w-24 text-text-tertiary opacity-60"
                      />
                    </EmptyMedia>
                    <EmptyTitle class="font-display tracking-[-0.02em]">
                      {{ t('agents.noAgentsForTeam') }}
                    </EmptyTitle>
                  </EmptyHeader>
                </Empty>
              </Transition>
            </div>
          </div>
        </Transition>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Scrollbar styling comes from the global thin-dark recipe in tailwind.css */
.horizontal-scroll {
  scroll-behavior: smooth;
  -webkit-overflow-scrolling: touch;
}
</style>
