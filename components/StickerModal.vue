<script setup lang="ts">
import {ref, computed, watch, watchEffect} from 'vue'
import { NModal, NInput, NPagination, NCard, NSpin, NSpace, NInputNumber, NButton } from 'naive-ui'
import { hexToRgba } from '~/utilities/helpers'



const props = defineProps<{
  visible: boolean
  position: number
  currentSticker?: any | null
}>()

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
  (e: 'select', sticker: any): void
}>()

const state = ref({
  searchQuery: '',
  currentPage: 1,
  items: [],
  isLoading: false,
  selectedItem: null as any,
  customization: {
    x: 0,
    y: 0,
    wear: 0,
    scale: 1,
    rotation: 0
  }
})

const PAGE_SIZE = 10

const filteredItems = computed(() => {
  return state.value.items.filter(item =>
      item.name.toLowerCase().includes(state.value.searchQuery.toLowerCase())
  )
})

const paginatedItems = computed(() => {
  const start = (state.value.currentPage - 1) * PAGE_SIZE
  const end = start + PAGE_SIZE
  return filteredItems.value.slice(start, end)
})

const totalPages = computed(() => Math.ceil(filteredItems.value.length / PAGE_SIZE))

const fetchItems = async () => {
  try {
    state.value.isLoading = true
    const response = await fetch('/api/data/stickers')
    const data = await response.json()
    state.value.items = data.stickers
  } catch (error) {
    console.error('Error fetching stickers:', error)
  } finally {
    state.value.isLoading = false
  }
}

const handleSelect = (item: any) => {
  state.value.selectedItem = item
  // Keep current customization if editing existing sticker
  if (!props.currentSticker) {
    state.value.customization = {
      x: 0,
      y: 0,
      wear: 0,
      scale: 1,
      rotation: 0
    }
  }
}

const handleSave = () => {
  if (!state.value.selectedItem) return

  const emitData = {
    id: state.value.selectedItem.id.replace('sticker-', ''),
    x: state.value.customization.x,
    y: state.value.customization.y,
    wear: state.value.customization.wear,
    scale: state.value.customization.scale,
    rotation: state.value.customization.rotation,
    api: {
      name: state.value.selectedItem.name,
      image: state.value.selectedItem.image,
      type: state.value.selectedItem.type,
      effect: state.value.selectedItem.effect,
      tournament_event: state.value.selectedItem.tournament_event,
      tournament_team: state.value.selectedItem.tournament_team,
      rarity: state.value.selectedItem.rarity,
    }
  };
  console.log("StickerModal - handleSave - emitData: ");
  console.log(emitData);
  emit('select', emitData)
  handleClose()
}

const handleClose = () => {
  emit('update:visible', false)
  state.value.selectedItem = null
  state.value.customization = {
    x: 0,
    y: 0,
    wear: 0,
    scale: 1,
    rotation: 0
  }
  state.value.searchQuery = ''
  state.value.currentPage = 1
}

onMounted(() => {
  fetchItems()
})

// Initialize with current sticker if editing
watchEffect(() => {
  if (props.currentSticker) {
    state.value.selectedItem = state.value.items.find(item => item.id === ("sticker-"+ props.currentSticker?.id))
    state.value.customization = {
      x: props.currentSticker.x,
      y: props.currentSticker.y,
      wear: props.currentSticker.wear,
      scale: props.currentSticker.scale,
      rotation: props.currentSticker.rotation
    }
  }
})
watch(() => props.currentSticker, (newSticker) => {
  if (newSticker) {
    state.value.customization = {
      x: newSticker.x,
      y: newSticker.y,
      wear: newSticker.wear,
      scale: newSticker.scale,
      rotation: newSticker.rotation
    }
  }
}, { immediate: true })

// Fetch stickers when modal becomes visible
watch(() => props.visible, (newValue) => {
  if (newValue) {
    fetchItems()
  }
})
</script>

<template>
  <NModal
      :show="visible"
      style="width: 1200px"
      preset="card"
      :title="currentSticker ? 'Edit Sticker' : 'Add Sticker'"
      :bordered="false"
      size="huge"
      @update:show="handleClose"
  >
    <template #header-extra>
      <NInput
          v-model:value="state.searchQuery"
          placeholder="Search stickers..."
          class="w-64"
      />
    </template>

    <NSpace vertical size="large">
      <!-- Selected Sticker Preview -->
      <div v-if="state.selectedItem" class="bg-[#1a1a1a] p-6 rounded-lg">
        <div class="grid grid-cols-2 gap-6">
          <!-- Left side - Image -->
          <div class="flex flex-col items-center">
            <img
                :src="state.selectedItem.image"
                :alt="state.selectedItem.name"
                class="w-48 h-48 object-contain"
            />
            <h3 class="text-lg font-semibold mt-4 break-words">{{ state.selectedItem.name }}</h3>
          </div>

          <!-- Right side - Customization -->
          <div class="space-y-4">
            <!-- Position Controls -->
            <div class="grid grid-cols-2 gap-4">
              <div>
                <h4 class="font-medium mb-2">X Position</h4>
                <NInputNumber
                    v-model:value="state.customization.x"
                    :min="-100"
                    :max="100"
                    :step="1"
                    class="w-full"
                />
              </div>
              <div>
                <h4 class="font-medium mb-2">Y Position</h4>
                <NInputNumber
                    v-model:value="state.customization.y"
                    :min="-100"
                    :max="100"
                    :step="1"
                    class="w-full"
                />
              </div>
            </div>

            <!-- Scale and Rotation -->
            <div class="grid grid-cols-2 gap-4">
              <div>
                <h4 class="font-medium mb-2">Scale</h4>
                <NInputNumber
                    v-model:value="state.customization.scale"
                    :min="0.1"
                    :max="2"
                    :step="0.1"
                    class="w-full"
                />
              </div>
              <div>
                <h4 class="font-medium mb-2">Rotation</h4>
                <NInputNumber
                    v-model:value="state.customization.rotation"
                    :min="0"
                    :max="359"
                    :step="1"
                    class="w-full"
                />
              </div>
            </div>

            <!-- Wear -->
            <div>
              <h4 class="font-medium mb-2">Wear</h4>
              <NInputNumber
                  v-model:value="state.customization.wear"
                  :min="0"
                  :max="1"
                  :step="0.01"
                  class="w-full"
              />
            </div>

            <NButton
                type="primary"
                class="w-full mt-4"
                @click="handleSave"
            >
              {{ currentSticker ? 'Update' : 'Apply' }} Sticker
            </NButton>
          </div>
        </div>
      </div>

      <!-- Stickers Grid -->
      <div v-if="!state.isLoading" class="grid grid-cols-5 gap-4">
        <NCard
            v-for="item in paginatedItems"
            :key="item.id"
            :class="[
            'cursor-pointer transition-all hover:shadow-lg',
            state.selectedItem?.id === item.id ? 'ring-2 ring-[#80E6C4] !border-0 opacity-65' : ''
          ]"
            :style="{
            borderColor: item.rarity?.color || '#313030',
            background: `linear-gradient(135deg, #101010, ${
              hexToRgba(item.rarity?.color || '#313030', '0.15')
            })`
          }"
            @click="handleSelect(item)"
        >
          <div class="flex flex-col items-center">
            <img
                :src="item.image"
                :alt="item.name"
                class="w-full h-24 object-contain mb-2"
                loading="lazy"
            />
            <p class="text-sm text-center break-words">{{ item.name.replace('Sticker |', '') }}</p>
            <div
                class="h-1 w-full mt-2"
                :style="{ background: item.rarity?.color || '#313030' }"
            />
          </div>
        </NCard>
      </div>

      <!-- Loading State -->
      <div v-if="state.isLoading" class="flex justify-center items-center h-64">
        <NSpin size="large" />
      </div>

      <!-- Empty State -->
      <div
          v-if="!state.isLoading && filteredItems.length === 0"
          class="flex justify-center items-center h-64 text-gray-400"
      >
        No stickers found
      </div>

      <!-- Pagination -->
      <div v-if="totalPages > 1" class="flex justify-center">
        <NPagination
            v-model:page="state.currentPage"
            :page-count="totalPages"
            :page-slot="7"
        />
      </div>
    </NSpace>
  </NModal>
</template>

<style scoped>
.n-card {
  background: #242424;
  border: 1px solid #313030;
}
</style>