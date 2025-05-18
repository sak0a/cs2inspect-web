<script setup lang="ts">
import { onMounted, ref, computed, nextTick } from 'vue'
import { useMessage, NSpin, NSelect, NInput } from 'naive-ui'
import { useLoadoutStore } from '~/stores/loadoutStore'
import type { SteamUser } from "~/services/steamAuth"
import { steamAuth } from "~/services/steamAuth"
import MusicKitTabs from "~/components/MusicKitTabs.vue";
import { APIMusicKit } from "~/server/utils/interfaces";

const user = ref<SteamUser | null>(null)
const isLoading = ref<boolean>(true)
const error = ref<string | null>(null)
const selectedMusicKit = ref<number | null>(null)
const musicKits = ref<APIMusicKit[]>([])
const searchQuery = ref<string>('')
const musicKitRefs = ref<any[]>([])

const loadoutStore = useLoadoutStore()
const message = useMessage()
const { t } = useI18n()

// Initialize music kits with an empty array to prevent undefined errors
musicKits.value = []

// Filter music kits based on search query and remove StatTrak variants
const filteredMusicKits = computed(() => {
  // First, remove all StatTrak variants
  const nonStatTrakKits = musicKits.value.filter(kit => !kit.id.includes('_st'))

  // Then apply search filter if needed
  if (!searchQuery.value) return nonStatTrakKits

  const query = searchQuery.value.toLowerCase()
  return nonStatTrakKits.filter(kit => {
    return kit.name.toLowerCase().includes(query) ||
           (kit.description && kit.description.toLowerCase().includes(query))
  })
})

// Extract the base music kit ID (without _st suffix for StatTrak)
const getMusicKitBaseId = (musicKit: APIMusicKit) => {
  return parseInt(musicKit.id.replace('music_kit-', '').replace('_st', ''))
}

// Group music kits into rows (2 rows)
const musicKitRows = computed(() => {
  const kits = filteredMusicKits.value
  const rows = []
  const itemsPerRow = Math.ceil(kits.length / 2) // Divide into 2 rows

  for (let i = 0; i < 2; i++) {
    const startIndex = i * itemsPerRow
    const endIndex = Math.min(startIndex + itemsPerRow, kits.length)
    if (startIndex < kits.length) {
      rows.push(kits.slice(startIndex, endIndex))
    }
  }

  return rows
})

// Create options for the dropdown
const musicKitOptions = computed(() => {
  // Get unique music kits by base ID to avoid duplicates (StatTrak variants)
  const uniqueKits = new Map()

  musicKits.value.forEach(kit => {
    const baseId = getMusicKitBaseId(kit)
    // Prefer non-StatTrak variants in the dropdown
    if (!uniqueKits.has(baseId) || !kit.id.includes('_st')) {
      uniqueKits.set(baseId, kit)
    }
  })

  return [
    { label: 'Default Music Kit', value: -1 },
    ...Array.from(uniqueKits.values()).map(kit => ({
      label: kit.name,
      value: getMusicKitBaseId(kit)
    }))
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
    const response = await fetch(`/api/loadouts/select?steamId=${user.value.steamId}&loadoutId=${loadoutStore.selectedLoadoutId}&type=music`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'credentials': 'include'
        },
        body: JSON.stringify({
          musicid: actualMusicKitId
        })
      }
    )

    const data = await response.json()
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
    message.error("Failed to update Music Kit")
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
    const response = await fetch('/api/data/musickits')
    if (!response.ok) {
      throw new Error('Failed to fetch music kits')
    }
    const data = await response.json()
    musicKits.value = data.musickits || []

    // Get the selected music kit from the loadout
    if (loadoutStore.selectedLoadout) {
      selectedMusicKit.value = loadoutStore.selectedLoadout.selected_music || -1
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

// Setup horizontal scrolling for music kits
const setupHorizontalScroll = () => {
  // Get all horizontal scroll containers
  const containers = document.querySelectorAll('.horizontal-scroll')

  // Add wheel event listener to each container
  containers.forEach(container => {
    // First remove any existing listeners to prevent duplicates
    container.removeEventListener('wheel', wheelHandler)

    // Then add the new listener
    container.addEventListener('wheel', wheelHandler, { passive: false })
  })
}

// Wheel event handler for horizontal scrolling
function wheelHandler(e: WheelEvent) {
  // Prevent the default vertical scroll
  e.preventDefault()

  // Get the container
  const container = e.currentTarget as HTMLElement

  // Scroll horizontally by the vertical scroll amount
  container.scrollLeft += e.deltaY
}

// Setup fade-in animation for scrolling
const setupFadeInAnimation = () => {
  nextTick(() => {
    // Use Intersection Observer to detect when music kit cards are visible
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible')
          // Once the animation is applied, we don't need to observe this element anymore
          observer.unobserve(entry.target)
        }
      })
    }, { threshold: 0.1 }) // Trigger when at least 10% of the element is visible

    // Observe all music kit cards
    document.querySelectorAll('.fade-in-item').forEach(card => {
      observer.observe(card)
    })
  })
}

onMounted(async () => {
  // Setup horizontal scrolling immediately
  setupHorizontalScroll()

  // Add window resize event listener
  window.addEventListener('resize', setupHorizontalScroll)

  user.value = steamAuth.getSavedUser()
  if (user.value?.steamId) {
    try {
      await loadoutStore.fetchLoadouts(user.value.steamId)
      await fetchMusicKits()

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

  // Clean up event listeners when component is unmounted
  onUnmounted(() => {
    window.removeEventListener('resize', setupHorizontalScroll)
  })
})

// Update horizontal scrolling when music kits are loaded or changed
watch([() => musicKits.value, () => filteredMusicKits.value], () => {
  nextTick(() => {
    setupHorizontalScroll()
    setupFadeInAnimation()
  })
})

watch(() => loadoutStore.selectedLoadoutId, async (newLoadoutId) => {
  if (newLoadoutId !== null && user.value?.steamId) {
    await fetchMusicKits()
  }
})

// Update when search query changes
watch(() => searchQuery.value, () => {
  nextTick(() => {
    setupHorizontalScroll()
    setupFadeInAnimation()
  })
})
</script>

<template>
  <div class="p-4 bg-[#181818]">
    <div class="max-w-7xl mx-auto content-fade-in">
      <SkinPageLayout
          title="Music Kits"
          :user="user"
          :error="error || ''"
          :isLoading="isLoading"
      />
      <!-- Music Kit Selection -->
      <div v-if="!error && !isLoading && user && loadoutStore.selectedLoadoutId">
        <div class="flex gap-x-10 justify-start mb-6">
          <div class="flex items-center justify-end space-x-2 ">
            <span class="font-bold whitespace-nowrap">
              Music Kit
            </span>
            <NSelect
                v-model:value="selectedMusicKit"
                :options="musicKitOptions"
                placeholder="Select music kit"
                class="w-72"
                @update:value="handleMusicKitTypeChange($event)"
            />
          </div>
        </div>

        <!-- Loading State -->
        <div v-if="isLoading" class="text-center py-12">
          <NSpin size="large" />
          <p class="mt-4 text-gray-400">Loading music kits...</p>
        </div>

        <!-- No Music Kits State -->
        <div v-else-if="!musicKits || musicKits.length === 0" class="text-center py-12">
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

          <!-- Music Kits Grid in Multiple Rows -->
          <div class="overflow-visible">
            <!-- Display each row of music kits -->
            <div v-for="(row, rowIndex) in musicKitRows" :key="rowIndex" class="mb-6">
              <div class="flex gap-4 pb-6 overflow-x-auto horizontal-scroll" style="min-width: max-content;">
                <template v-if="row.length > 0">
                  <MusicKitTabs
                      v-for="musicKit in row"
                      :key="musicKit.id"
                      :music-kit="musicKit"
                      @select="handleMusicKitSelect"
                      class="fade-in-item"
                      :class="{ 'selected-music-kit': getMusicKitBaseId(musicKit) === selectedMusicKit }"
                      ref="musicKitRefs"
                  />
                </template>
              </div>
            </div>

            <!-- No results message -->
            <p v-if="searchQuery.value && filteredMusicKits.length === 0" class="text-gray-400 py-4 text-center">No music kits found matching your search</p>
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
  overflow-x: auto;
  overflow-y: hidden;
}

.horizontal-scroll::-webkit-scrollbar {
  height: 8px;
}

.horizontal-scroll::-webkit-scrollbar-track {
  background: #333;
  border-radius: 4px;
}

.horizontal-scroll::-webkit-scrollbar-thumb {
  background: #666;
  border-radius: 4px;
}

.horizontal-scroll::-webkit-scrollbar-thumb:hover {
  background: #888;
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

.fade-in-item {
  opacity: 0;
  will-change: opacity, transform, filter;
  margin: 5px;
  transition: all 0.5s ease;
}

.fade-in-item.visible {
  animation: fadeIn 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
}

.fade-in-item:hover {
  transform: scale(1.05);
  z-index: 10;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
  transition: all 0.5s ease;
}

.content-fade-in {
  animation: fadeIn 0.5s ease-in-out;
}

.selected-music-kit {
  border: 2px solid #4b69ff !important;
  box-shadow: 0 0 15px rgba(75, 105, 255, 0.7);
  transform: scale(1.05);
  z-index: 20;
  opacity: 1 !important;
  visibility: visible !important;
  transition: all 0.5s ease;
  position: relative;
}

.fade-in-item:not(.selected-music-kit) {
  border: 1px solid #313030;
  box-shadow: none;
  transform: none;
  transition: all 0.5s ease;
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