<script setup lang="ts">
import { onMounted, ref, computed, nextTick } from 'vue'
import { useMessage, NSpin } from 'naive-ui'
import { useLoadoutStore } from '~/stores/loadoutStore'
import type { SteamUser } from "~/services/steamAuth"
import { steamAuth } from "~/services/steamAuth"
import AgentTabs from "~/components/AgentTabs.vue";
import { APIAgent } from "~/server/utils/interfaces";

const user = ref<SteamUser | null>(null)
const isLoading = ref<boolean>(true)
const error = ref<string | null>(null)
const tAgentType = ref<number | null>(null)
const ctAgentType = ref<number | null>(null)
const agents = ref<APIAgent[]>([])

const loadoutStore = useLoadoutStore()
const message = useMessage()
const { t } = useI18n()

// Initialize agents with an empty array to prevent undefined errors
agents.value = []

// Filter agents by team
const tAgents = computed(() => {
  if (!agents.value) return []
  return agents.value.filter(agent => agent.team.id === 'terrorists')
})

const ctAgents = computed(() => {
  if (!agents.value) return []
  return agents.value.filter(agent => agent.team.id === 'counter-terrorists')
})

// Create options for the dropdowns
const tAgentOptions = computed(() => {
  return [
    { label: 'Default Agent', value: -1 },
    ...(tAgents.value || []).map(agent => ({
      label: agent.name,
      value: parseInt(agent.id.replace('agent-', ''))
    }))
  ]
})

const ctAgentOptions = computed(() => {
  return [
    { label: 'Default Agent', value: -1 },
    ...(ctAgents.value || []).map(agent => ({
      label: agent.name,
      value: parseInt(agent.id.replace('agent-', ''))
    }))
  ]
})

const handleAgentTypeChange = async (team: 't' | 'ct', agentDefindex: number) => {
  if (!loadoutStore.selectedLoadoutId || !loadoutStore.selectedLoadout || !user.value?.steamId) {
    message.error('Please select a loadout first')
    return
  }

  await fetch(`/api/loadouts/select?steamId=${user.value.steamId}&loadoutId=${loadoutStore.selectedLoadoutId}&type=agent`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'credentials': 'include'
        },
        body: JSON.stringify({
          team: team === 't' ? 1 : 2,
          defindex: agentDefindex === -1 ? null : agentDefindex
        })
      }
  ).then(async (response) => {
    const data = await response.json()
    if (!loadoutStore.selectedLoadout) {
      return
    }
    if (team === 't') {
      loadoutStore.selectedLoadout.selected_agent_t = agentDefindex === -1 ? null : agentDefindex
    } else {
      loadoutStore.selectedLoadout.selected_agent_ct = agentDefindex === -1 ? null : agentDefindex
    }
    message.success(`${team === 't' ? 'Terrorist' : 'Counter-Terrorist'} agent updated`)
  }).catch((error) => {
    console.error(error)
    message.error("Failed to update Agent Type")
  })
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

    const response = await fetch('/api/data/agents')
    if (!response.ok) {
      throw new Error('Failed to fetch agents')
    }

    const data = await response.json()
    console.log('Received agents data:', data)

    // Check for different possible response structures
    if (data && data.data && Array.isArray(data.data)) {
      agents.value = data.data
    } else if (data && data.agents && Array.isArray(data.agents)) {
      agents.value = data.agents
    } else {
      console.warn('Unexpected agents data structure:', data)
      // Try to extract agents from the response if possible
      if (data && typeof data === 'object') {
        // Look for any array property that might contain agents
        const possibleAgentsArray = Object.values(data).find(val => Array.isArray(val) && val.length > 0)
        if (possibleAgentsArray) {
          console.log('Found possible agents array:', possibleAgentsArray)
          agents.value = possibleAgentsArray
        } else {
          agents.value = []
        }
      } else {
        agents.value = []
      }
    }

    // Set initial selected agents if available in loadout
    if (loadoutStore.selectedLoadout) {
      tAgentType.value = loadoutStore.selectedLoadout.selected_agent_t || -1
      ctAgentType.value = loadoutStore.selectedLoadout.selected_agent_ct || -1
    }
  } catch (error) {
    console.error('Error fetching agents:', error)
    message.error('Failed to load agents')
    agents.value = [] // Ensure agents is at least an empty array on error
  } finally {
    isLoading.value = false
  }
}

// References to scroll containers
const ctScrollContainer = ref(null)
const tScrollContainer = ref(null)

// Function to handle horizontal scrolling with mouse wheel
const setupHorizontalScroll = () => {
  nextTick(() => {
    const containers = [ctScrollContainer.value, tScrollContainer.value]

    containers.forEach(container => {
      if (!container) return

      // Handle mouse wheel scrolling
      container.addEventListener('wheel', (event) => {
        if (event.deltaY) {
          event.preventDefault()
          // Adjust scroll speed for smoother scrolling
          container.scrollLeft += event.deltaY * 0.5
        }
      }, { passive: false })
    })
  })
}

onMounted(async () => {
  user.value = steamAuth.getSavedUser()
  if (user.value?.steamId) {
    try {
      await loadoutStore.fetchLoadouts(user.value.steamId)
      await fetchAgents()

      // Setup horizontal scrolling and animations after DOM is updated
      nextTick(() => {
        setupHorizontalScroll()
        setupFadeInAnimation()
      })
    } catch (error) {
      console.error('Error during initialization:', error)
      message.error('Failed to initialize page')
    }
  }
})

// Update horizontal scrolling when agents are loaded or changed
watch([() => ctAgents.value, () => tAgents.value], () => {
  nextTick(() => {
    setupHorizontalScroll()
    setupFadeInAnimation()
  })
})

// Function to handle fade-in animation for agent cards
const setupFadeInAnimation = () => {
  nextTick(() => {
    // Use Intersection Observer to detect when agent cards are visible
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible')
          // Once the animation is applied, we don't need to observe this element anymore
          observer.unobserve(entry.target)
        }
      })
    }, { threshold: 0.1 }) // Trigger when at least 10% of the element is visible

    // Observe all agent cards
    document.querySelectorAll('.agent-card').forEach(card => {
      observer.observe(card)
    })
  })
}

watch(() => loadoutStore.selectedLoadoutId, async (newLoadoutId) => {
  if (newLoadoutId !== null && agents.value.length > 0) {
    // Update selected agents based on loadout
    if (loadoutStore.selectedLoadout) {
      tAgentType.value = loadoutStore.selectedLoadout.selected_agent_t || -1
      ctAgentType.value = loadoutStore.selectedLoadout.selected_agent_ct || -1
    }
  }
})
</script>

<template>
  <div class="p-4 bg-[#181818]">
    <div class="max-w-7xl mx-auto content-fade-in">
      <SkinPageLayout
          title="Agents"
          :user="user"
          :error="error || ''"
          :isLoading="isLoading"
      />
      <!-- Agent Type Groups -->
      <div v-if="!error && !isLoading && user && loadoutStore.selectedLoadoutId">
        <div class="flex gap-x-10 justify-start mb-6">
          <div class="flex items-center justify-end space-x-2 ">
            <span class="font-bold whitespace-nowrap">
              {{ t('teams.counterTerrorists') }}
            </span>
            <NSelect
                v-model:value="ctAgentType"
                :options="ctAgentOptions"
                placeholder=" Select agent"
                class="w-72"
                @update:value="handleAgentTypeChange('ct', $event)"
            />
          </div>
          <div class="flex items-center space-x-2">
            <span class="font-bold">
              {{ t('teams.terrorists') }}
            </span>
            <NSelect
                v-model:value="tAgentType"
                :options="tAgentOptions"
                placeholder="Select agent"
                class="w-72"
                @update:value="handleAgentTypeChange('t', $event)"
            />
          </div>
        </div>

        <!-- Loading State -->
        <div v-if="isLoading" class="text-center py-12">
          <NSpin size="large" />
          <p class="mt-4 text-gray-400">Loading agents...</p>
        </div>

        <!-- No Agents State -->
        <div v-else-if="!agents || agents.length === 0" class="text-center py-12">
          <p class="text-gray-400">No agents available</p>
        </div>

        <!-- Agents Grid with Horizontal Scrolling -->
        <div v-else class="overflow-x-auto">
          <h2 class="text-xl font-bold mb-4">{{ t('teams.counterTerrorists') }}</h2>
          <div ref="ctScrollContainer" class="flex gap-4 pb-6 overflow-x-auto horizontal-scroll" style="min-width: max-content;">
            <template v-if="ctAgents && ctAgents.length > 0">
              <AgentTabs
                  v-for="agent in ctAgents"
                  :key="agent.id"
                  :agent="agent"
                  @select="handleAgentSelect"
              />
            </template>
            <p v-else class="text-gray-400 py-4">No Counter-Terrorist agents available</p>
          </div>

          <h2 class="text-xl font-bold mb-4">{{ t('teams.terrorists') }}</h2>
          <div ref="tScrollContainer" class="flex gap-4 pb-2 overflow-x-auto horizontal-scroll" style="min-width: max-content;">
            <template v-if="tAgents && tAgents.length > 0">
              <AgentTabs
                  v-for="agent in tAgents"
                  :key="agent.id"
                  :agent="agent"
                  @select="handleAgentSelect"
              />
            </template>
            <p v-else class="text-gray-400 py-4">No Terrorist agents available</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.n-card {
  background: #242424;
  border: 1px solid #313030;
}

.horizontal-scroll {
  scroll-behavior: smooth;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: thin;
  scrollbar-color: #666 #333;
}

.horizontal-scroll::-webkit-scrollbar {
  height: 8px;
}

.horizontal-scroll::-webkit-scrollbar-track {
  background: #333;
  border-radius: 4px;
}

.horizontal-scroll::-webkit-scrollbar-thumb {
  background-color: #666;
  border-radius: 4px;
}

.horizontal-scroll::-webkit-scrollbar-thumb:hover {
  background-color: #888;
}

/* Fade-in animation */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(8px) scale(0.98);
    filter: blur(2px);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
    filter: blur(0);
  }
}

.agent-card {
  opacity: 0;
  will-change: opacity, transform, filter;
}

.agent-card.visible {
  animation: fadeIn 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
}
</style>