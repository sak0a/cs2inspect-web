<script setup lang="ts">
import { LucidePin, LucideSearch, LucideSearchX, LucideX } from '@lucide/vue'
import type { SteamUser } from '~/services/steamAuth'
import { steamAuth } from '~/services/steamAuth'
import type { APICollectible } from '~/server/types'
import { toSteamId } from '~/types/core/branded'

const user = ref<SteamUser | null>(null)
const isLoading = ref<boolean>(true)
const error = ref<string | null>(null)
const selectedPin = ref<number | null>(null)
const collectibles = ref<APICollectible[]>([])
const searchQuery = ref<string>('')
const pinRefs = ref<Array<{ select: () => void }>>([])

const loadoutStore = useLoadoutStore()
const message = useToast()
const { t } = useI18n()

// Initialize collectibles with an empty array to prevent undefined errors
collectibles.value = []

// Filter collectibles based on search query and only include pins
const filteredCollectibles = computed(() => {
  // First, filter only pins
  const onlyPins = collectibles.value.filter((item) => item.type === 'Pin')

  // Then apply search filter if needed
  if (!searchQuery.value) return onlyPins

  const query = searchQuery.value.toLowerCase()
  return onlyPins.filter((pin) => {
    return (
      pin.name.toLowerCase().includes(query) ||
      (pin.description && pin.description.toLowerCase().includes(query))
    )
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
    { label: 'Player Inventory', value: -1 },
    { label: 'Default', value: 0 },
    ...filteredCollectibles.value.map((pin) => ({
      label: pin.name,
      value: getCollectibleBaseId(pin),
    })),
  ]
})

// Display label for the current selection (reka Select won't show a preselected
// option's label until the menu is opened, so derive it from the options list).
const selectedPinLabel = computed(
  () => pinOptions.value.find((o) => o.value === selectedPin.value)?.label
)

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
    await $fetch(
      `/api/loadouts/select?steamId=${user.value.steamId}&loadoutId=${loadoutStore.selectedLoadoutId}&type=pin`,
      {
        method: 'POST',
        body: {
          pinid: actualPinId,
        },
      }
    )

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
    selectedPin.value = loadoutStore.selectedLoadout?.selected_pin ?? -1
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
    const response = await $fetch<{ data: APICollectible[] }>('/api/data/collectibles')
    collectibles.value = response.data ?? []

    // Get the selected pin from the loadout
    if (loadoutStore.selectedLoadout) {
      selectedPin.value = loadoutStore.selectedLoadout.selected_pin ?? -1
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
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible')
            observer.unobserve(entry.target)
          }
        })
      },
      {
        threshold: 0.1, // Trigger when at least 10% of the item is visible
      }
    )

    // Observe all pin cards
    document.querySelectorAll('.fade-in-item').forEach((card) => {
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
  <div class="p-4">
    <div class="max-w-7xl mx-auto content-fade-in">
      <SkinPageLayout
        :title="t('extras.pins') as string"
        :show-team="false"
        :user="user"
        :error="error || ''"
        :is-loading="isLoading && (!user || !loadoutStore.selectedLoadoutId)"
      />
      <!-- Pin Selection -->
      <div v-if="!error && user && loadoutStore.selectedLoadoutId">
        <!-- Skeleton Loading State (stage height matches PinTabs cards) -->
        <div v-if="isLoading" class="pin-grid" aria-hidden="true">
          <ItemCardSkeleton v-for="i in 12" :key="i" stage-class="h-32" />
        </div>

        <!-- Content when loaded -->
        <template v-else>
          <div class="mb-6 flex flex-col gap-1.5">
            <span
              id="pin-select-label"
              class="font-mono text-[10px] uppercase tracking-[0.12em] text-text-tertiary"
            >
              {{ t('extras.pins') }}
            </span>
            <Select
              :model-value="selectedPin"
              @update:model-value="(v) => handlePinTypeChange(Number(v))"
            >
              <SelectTrigger class="w-full sm:w-72" aria-labelledby="pin-select-label">
                <span v-if="selectedPinLabel">{{ selectedPinLabel }}</span>
                <span v-else class="text-muted-foreground">{{ t('pins.selectPin') }}</span>
              </SelectTrigger>
              <SelectContent>
                <SelectItem v-for="opt in pinOptions" :key="opt.value" :value="opt.value">
                  {{ opt.label }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <!-- Search and Filter -->
          <div class="mb-6">
            <div class="relative w-full max-w-md">
              <LucideSearch
                class="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text-tertiary"
              />
              <Input
                v-model="searchQuery"
                type="text"
                :placeholder="t('pins.searchPlaceholder')"
                class="w-full pl-9 pr-9 font-mono text-[13px] placeholder:text-xs placeholder:tracking-[0.02em] placeholder:text-text-tertiary"
              />
              <Button
                v-if="searchQuery"
                type="button"
                variant="ghost"
                size="icon-xs"
                class="absolute right-2.5 top-1/2 -translate-y-1/2"
                :aria-label="t('common.clearSearch')"
                @click="searchQuery = ''"
              >
                <LucideX :size="16" />
              </Button>
            </div>
          </div>

          <!-- Main Content Area -->
          <div>
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

              <!-- No results / no pins -->
              <Empty v-else class="py-10">
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <LucideSearchX v-if="searchQuery" />
                    <LucidePin v-else />
                  </EmptyMedia>
                  <EmptyTitle class="font-display tracking-[-0.02em]">
                    {{
                      searchQuery
                        ? t('pins.noResultsSearch', { query: searchQuery })
                        : t('pins.noPinsAvailable')
                    }}
                  </EmptyTitle>
                </EmptyHeader>
              </Empty>
            </div>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<style scoped>
.pin-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1rem;
  margin-top: 1rem;
}

/* Fade-in animation for pins (opacity-only: the card owns its transform/transition) */
.fade-in-item {
  opacity: 0;
  will-change: opacity;
}

.fade-in-item.visible {
  opacity: 1;
  animation: fadeIn 0.5s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .pin-grid {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  }
}
</style>
