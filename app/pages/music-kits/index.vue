<script setup lang="ts">
import type { SteamUser } from '~/services/steamAuth'
import { steamAuth } from '~/services/steamAuth'
import type { APIMusicKit } from '~/server/types'
import { toSteamId } from '~/types/core/branded'

const user = ref<SteamUser | null>(null)
const isLoading = ref<boolean>(true)
const error = ref<string | null>(null)
const selectedMusicKit = ref<number | null>(null)
const musicKits = ref<APIMusicKit[]>([])
const searchQuery = ref<string>('')
const musicKitRefs = ref<Array<{ select: () => void }>>([])

const loadoutStore = useLoadoutStore()
const message = useMessage()
const { t: _t } = useI18n()

// Initialize music kits with an empty array to prevent undefined errors
musicKits.value = []

// Filter music kits based on search query and remove StatTrak variants
const filteredMusicKits = computed(() => {
  // First, remove all StatTrak variants
  const nonStatTrakKits = musicKits.value.filter((kit) => !kit.id.includes('_st'))

  // Then apply search filter if needed
  if (!searchQuery.value) return nonStatTrakKits

  const query = searchQuery.value.toLowerCase()
  return nonStatTrakKits.filter((kit) => {
    return (
      kit.name.toLowerCase().includes(query) ||
      (kit.description && kit.description.toLowerCase().includes(query))
    )
  })
})

// Extract the base music kit ID (without _st suffix for StatTrak)
const getMusicKitBaseId = (musicKit: APIMusicKit) => {
  return parseInt(musicKit.id.replace('music_kit-', '').replace('_st', ''))
}

// Return all music kits for vertical grid display
const musicKitGrid = computed(() => {
  return filteredMusicKits.value
})

// Create options for the dropdown
const musicKitOptions = computed(() => {
  // Get unique music kits by base ID to avoid duplicates (StatTrak variants)
  const uniqueKits = new Map()

  musicKits.value.forEach((kit) => {
    const baseId = getMusicKitBaseId(kit)
    // Prefer non-StatTrak variants in the dropdown
    if (!uniqueKits.has(baseId) || !kit.id.includes('_st')) {
      uniqueKits.set(baseId, kit)
    }
  })

  return [
    { label: 'Player Inventory', value: -1 },
    { label: 'Default', value: 0 },
    ...Array.from(uniqueKits.values()).map((kit) => ({
      label: kit.name,
      value: getMusicKitBaseId(kit),
    })),
  ]
})

const handleMusicKitTypeChange = async (musicKitId: number) => {
  if (!loadoutStore.selectedLoadoutId || !loadoutStore.selectedLoadout || !user.value?.steamId) {
    message.error('Please select a loadout first')
    return
  }

  // Handle deselection (setting to default)
  const isDefault = musicKitId === -1
  const actualMusicKitId = isDefault ? null : musicKitId

  // Update the local state immediately for better UX
  selectedMusicKit.value = actualMusicKitId

  try {
    await $fetch(
      `/api/loadouts/select?steamId=${user.value.steamId}&loadoutId=${loadoutStore.selectedLoadoutId}&type=music`,
      {
        method: 'POST',
        body: {
          musicid: actualMusicKitId,
        },
      }
    )

    message.success(isDefault ? 'Reset to default music kit' : 'Music kit updated')

    // Update the loadout store to reflect the change
    if (loadoutStore.selectedLoadout) {
      loadoutStore.selectedLoadout.selected_music = actualMusicKitId
    }

    // Force refresh the UI to ensure proper rendering
    nextTick(() => {
      setupFadeInAnimation()
    })
  } catch (error) {
    console.error(error)
    message.error('Failed to update Music Kit')
  }
}

const handleMusicKitSelect = (musicKit: APIMusicKit) => {
  const musicKitId = getMusicKitBaseId(musicKit)

  // If clicking the already selected music kit, deselect it (set to default)
  if (selectedMusicKit.value === musicKitId) {
    handleMusicKitTypeChange(-1) // -1 represents default
  } else {
    // Otherwise, select the new music kit
    handleMusicKitTypeChange(musicKitId)
  }
}

const fetchMusicKits = async () => {
  isLoading.value = true
  // Reset search query when fetching new data
  searchQuery.value = ''

  try {
    // Fetch music kits data from API
    const response = await $fetch<{ data: APIMusicKit[] }>('/api/data/musickits')
    musicKits.value = response.data ?? []

    // Get the selected music kit from the loadout
    if (loadoutStore.selectedLoadout) {
      selectedMusicKit.value = loadoutStore.selectedLoadout.selected_music ?? -1
    } else {
      selectedMusicKit.value = -1
    }
  } catch (error) {
    console.error('Error fetching music kits:', error)
    message.error('Failed to load music kits')
    musicKits.value = [] // Ensure music kits is at least an empty array on error
  } finally {
    isLoading.value = false
  }
}

// No longer need horizontal scrolling setup as we're using vertical scrolling

// Setup fade-in animation for vertical scrolling
const setupFadeInAnimation = () => {
  nextTick(() => {
    // Use Intersection Observer to detect when music kit cards are visible
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry, index) => {
          if (entry.isIntersecting) {
            // Add a small delay based on the index for a staggered effect
            setTimeout(() => {
              entry.target.classList.add('visible')
            }, index * 50) // 50ms delay between each item

            // Once the animation is applied, we don't need to observe this element anymore
            observer.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.1, rootMargin: '0px 0px 50px 0px' }
    ) // Trigger when at least 10% of the element is visible and add bottom margin

    // Observe all music kit cards
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
      await fetchMusicKits()

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

// Update animations when music kits are loaded or changed
watch([() => musicKits.value, () => filteredMusicKits.value], () => {
  nextTick(() => {
    setupFadeInAnimation()
  })
})

watch(
  () => loadoutStore.selectedLoadoutId,
  async (newLoadoutId) => {
    if (newLoadoutId !== null && user.value?.steamId) {
      await fetchMusicKits()
    }
  }
)

// Update when search query changes
watch(
  () => searchQuery.value,
  () => {
    nextTick(() => {
      setupFadeInAnimation()
    })
  }
)
</script>

<template>
  <div class="p-4">
    <div class="max-w-7xl mx-auto content-fade-in">
      <SkinPageLayout
        title="Music Kits"
        :user="user"
        :error="error || ''"
        :is-loading="isLoading && (!user || !loadoutStore.selectedLoadoutId)"
      />
      <!-- Music Kit Selection -->
      <div v-if="!error && user && loadoutStore.selectedLoadoutId">
        <!-- Skeleton Loading State -->
        <div v-if="isLoading" class="music-kit-grid">
          <div
            v-for="i in 8"
            :key="i"
            class="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-dark)] p-4 flex flex-col"
            style="height: 300px"
          >
            <NSkeleton height="128px" />
            <div class="mt-2 flex flex-col flex-grow">
              <NSkeleton text class="mt-1" style="height: 40px" />
              <NSkeleton text :repeat="2" class="mt-1" style="height: 64px" />
              <div class="mt-auto">
                <NSkeleton height="4px" />
              </div>
            </div>
          </div>
        </div>

        <!-- Content when loaded -->
        <template v-else>
          <div class="flex gap-x-10 justify-start mb-6">
            <div class="flex items-center justify-end space-x-2">
              <span class="font-bold whitespace-nowrap"> Music Kit </span>
              <NSelect
                v-model:value="selectedMusicKit"
                :options="musicKitOptions"
                placeholder="Select music kit"
                class="w-72"
                @update:value="handleMusicKitTypeChange($event)"
              />
            </div>
          </div>

          <!-- No Music Kits State -->
          <div v-if="!musicKits || musicKits.length === 0" class="text-center py-12">
            <p class="text-gray-400">No music kits available</p>
          </div>

          <!-- Music Kits Content -->
          <div v-else>
            <!-- Search Bar -->
            <div class="mb-6">
              <NInput v-model:value="searchQuery" placeholder="Search music kits..." clearable>
                <template #prefix>
                  <div class="i-carbon-search text-lg" />
                </template>
              </NInput>
            </div>

            <!-- Music Kits Vertical Grid -->
            <div class="overflow-visible">
              <!-- Display music kits in a grid -->
              <div class="music-kit-grid">
                <MusicKitTabs
                  v-for="musicKit in musicKitGrid"
                  :key="musicKit.id"
                  ref="musicKitRefs"
                  :music-kit="musicKit"
                  :is-selected="getMusicKitBaseId(musicKit) === selectedMusicKit"
                  :class="[
                    'fade-in-item',
                    getMusicKitBaseId(musicKit) === selectedMusicKit ? 'selected-music-kit' : '',
                  ]"
                  @select="handleMusicKitSelect"
                />
              </div>

              <!-- No results message -->
              <p
                v-if="searchQuery && filteredMusicKits.length === 0"
                class="text-gray-400 py-4 text-center"
              >
                No music kits found matching your search
              </p>
            </div>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<style scoped>
.n-card {
  background: #242424;
  border: 1px solid #313030;
}

/* Vertical grid layout for music kits */
.music-kit-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 1rem;
  width: 100%;
  margin-bottom: 2rem;
}

/* Fade-in animation */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(15px) scale(0.98);
    filter: blur(2px);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
    filter: blur(0);
  }
}

.fade-in-item {
  opacity: 0;
  will-change: opacity, transform, filter;
  margin: 5px;
  transition: all 0.5s ease;
}

.fade-in-item.visible {
  animation: fadeIn 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
}

.fade-in-item:hover:not(.selected-music-kit) {
  transform: scale(1.05);
  z-index: 10;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
  transition: all 0.3s ease;
}

.content-fade-in {
  animation: fadeIn 0.5s ease-in-out;
}

/* Selected items are handled by the ring class in the component */
.fade-in-item.visible {
  opacity: 1 !important;
  visibility: visible !important;
}

/* Ensure selected music kits maintain their styling */
.selected-music-kit {
  opacity: 1 !important;
  visibility: visible !important;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
