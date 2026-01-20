<script setup lang="ts">
import { NSpin, NSelect, NInput } from 'naive-ui'
import type { SteamUser } from "~/services/steamAuth"
import { steamAuth } from "~/services/steamAuth"
import type { APICollectible } from "~/server/types";
import { toSteamId } from "~/types/core/branded"

const user = ref<SteamUser | null>(null)
const isLoading = ref<boolean>(true)
const error = ref<string | null>(null)
const selectedPin = ref<number | null>(null)
const collectibles = ref<APICollectible[]>([])
const searchQuery = ref<string>('')
const pinRefs = ref<Array<{ select: () => void }>>([])

const loadoutStore = useLoadoutStore()
const message = useMessage()
const { t } = useI18n()

// Initialize collectibles with an empty array to prevent undefined errors
collectibles.value = []

// Filter collectibles based on search query and only include pins
const filteredCollectibles = computed(() => {
  // First, filter only pins
  const onlyPins = collectibles.value.filter(item => item.type === 'Pin')

  // Then apply search filter if needed
  if (!searchQuery.value) return onlyPins

  const query = searchQuery.value.toLowerCase()
  return onlyPins.filter(pin => {
    return pin.name.toLowerCase().includes(query) ||
           (pin.description && pin.description.toLowerCase().includes(query))
  })
})

// Extract the base collectible ID
const getCollectibleBaseId = (collectible: APICollectible) => {
  return parseInt(collectible.id.replace('collectible-', ''))
}

// Return all pins for vertical grid display
const pinGrid = computed(() => {
  return filteredCollectibles.value
})

// Create options for the dropdown
const pinOptions = computed(() => {
  return [
    { label: 'Default Pin', value: -1 },
    ...filteredCollectibles.value.map(pin => ({
      label: pin.name,
      value: getCollectibleBaseId(pin)
    }))
  ]
})

const handlePinTypeChange = async (pinId: number) => {
  if (!loadoutStore.selectedLoadoutId || !loadoutStore.selectedLoadout || !user.value?.steamId) {
    message.error('Please select a loadout first')
    return
  }

  // Handle deselection (setting to default)
  const isDefault = pinId === -1
  const actualPinId = isDefault ? null : pinId

  // Update the local state immediately for better UX
  selectedPin.value = actualPinId

  try {
    const response = await fetch(`/api/loadouts/select?steamId=${user.value.steamId}&loadoutId=${loadoutStore.selectedLoadoutId}&type=pin`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'credentials': 'include'
        },
        body: JSON.stringify({
          pinid: actualPinId
        })
      }
    )

    await response.json()
    message.success(isDefault ? 'Reset to default pin' : 'Pin updated')

    // Update the loadout store to reflect the change
    if (loadoutStore.selectedLoadout) {
      loadoutStore.selectedLoadout.selected_pin = actualPinId
    }

    // Force refresh the UI to ensure proper rendering
    nextTick(() => {
      setupFadeInAnimation()
    })
  } catch (error) {
    console.error('Error updating pin:', error)
    // Revert the local state on error
    selectedPin.value = loadoutStore.selectedLoadout?.selected_pin || -1
    message.error('Failed to update pin. Please try again.')
  }
}

const handlePinSelect = (collectible: APICollectible) => {
  const pinId = getCollectibleBaseId(collectible)

  // If clicking the already selected pin, deselect it (set to default)
  if (selectedPin.value === pinId) {
    handlePinTypeChange(-1) // -1 represents default
  } else {
    // Otherwise, select the new pin
    handlePinTypeChange(pinId)
  }
}

const fetchCollectibles = async () => {
  isLoading.value = true
  // Reset search query when fetching new data
  searchQuery.value = ''

  try {
    // Fetch collectibles data from API
    const response = await fetch('/api/data/collectibles')
    if (!response.ok) {
      throw new Error('Failed to fetch collectibles')
    }
    const data = await response.json()
    collectibles.value = data.collectibles || []

    // Get the selected pin from the loadout
    if (loadoutStore.selectedLoadout) {
      selectedPin.value = loadoutStore.selectedLoadout.selected_pin || -1
    } else {
      selectedPin.value = -1
    }
  } catch (error) {
    console.error('Error fetching collectibles:', error)
    message.error('Failed to load collectibles')
    collectibles.value = [] // Ensure collectibles is at least an empty array on error
  } finally {
    isLoading.value = false
  }
}

// Setup fade-in animation for pins
const setupFadeInAnimation = () => {
  nextTick(() => {
    // Create an Intersection Observer to handle fade-in animations
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible')
          observer.unobserve(entry.target)
        }
      })
    }, {
      threshold: 0.1 // Trigger when at least 10% of the item is visible
    })

    // Observe all pin cards
    document.querySelectorAll('.fade-in-item').forEach(card => {
      observer.observe(card)
    })
  })
}

onMounted(async () => {
  user.value = steamAuth.getSavedUser()
  if (user.value?.steamId) {
    try {
      await loadoutStore.fetchLoadouts(toSteamId(user.value.steamId))
      await fetchCollectibles()

      // Setup animations after DOM is updated
      nextTick(() => {
        setupFadeInAnimation()
      })
    } catch (error) {
      console.error('Error during initialization:', error)
      message.error('Failed to initialize page')
      isLoading.value = false
    }
  } else {
    isLoading.value = false
  }
})

// Update animations when collectibles are loaded or changed
watch([() => collectibles.value, () => filteredCollectibles.value], () => {
  nextTick(() => {
    setupFadeInAnimation()
  })
})
</script>

<template>
  <div class="p-4 bg-[#181818]">
    <div class="max-w-7xl mx-auto content-fade-in">
      <SkinPageLayout
          title="Pins"
          :user="user"
          :error="error || ''"
          :is-loading="isLoading"
      />
      <!-- Pin Selection -->
      <div v-if="!error && !isLoading && user && loadoutStore.selectedLoadoutId">
        <div class="flex gap-x-10 justify-start mb-6">
          <div class="flex items-center justify-end space-x-2 ">
            <span class="font-bold whitespace-nowrap">
              Pin
            </span>
            <NSelect
                v-model:value="selectedPin"
                :options="pinOptions"
                placeholder="Select pin"
                class="w-72"
                @update:value="handlePinTypeChange($event)"
            />
          </div>
        </div>

        <!-- Search and Filter -->
        <div class="mb-6">
          <div class="flex items-center space-x-4">
            <NInput
                v-model:value="searchQuery"
                type="text"
                placeholder="Search pins..."
                class="w-full max-w-md"
            />
          </div>
        </div>

        <!-- Main Content Area -->
        <div class="bg-[#242424] p-6 rounded-lg">
          <!-- Loading State -->
          <div v-if="isLoading" class="flex justify-center items-center py-12">
            <NSpin size="large" />
          </div>

          <!-- Pins Vertical Grid -->
          <div class="overflow-visible">
            <!-- Display pins in a grid -->
            <div v-if="filteredCollectibles.length > 0" class="pin-grid">
              <PinTabs
                  v-for="collectible in pinGrid"
                  :key="collectible.id"
                  ref="pinRefs"
                  :collectible="collectible"
                  :is-selected="getCollectibleBaseId(collectible) === selectedPin"
                  class="fade-in-item"
                  @select="handlePinSelect"
              />
            </div>

            <!-- No results message -->
            <div v-else-if="!isLoading" class="text-center py-12">
              <p v-if="searchQuery" class="text-gray-400 text-lg mb-2">
                {{ t('pins.noResultsSearch', { query: searchQuery }) || `No pins found matching "${searchQuery}"` }}
              </p>
              <p v-else class="text-gray-400 text-lg">
                {{ t('pins.noPinsAvailable') || 'No pins available' }}
              </p>
            </div>
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

.pin-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1rem;
  margin-top: 1rem;
}

/* Fade-in animation for pins */
.fade-in-item {
  opacity: 0;
  transform: translateY(10px);
  transition: opacity 0.5s ease, transform 0.5s ease;
}

.fade-in-item.visible {
  opacity: 1;
  transform: translateY(0);
}

/* Ensure the search input has proper styling */
.n-input {
  background: #2a2a2a;
  border-color: #3a3a3a;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .pin-grid {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  }
}
</style>