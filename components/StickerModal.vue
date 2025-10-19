<script setup lang="ts">
import { ref, computed, watch, watchEffect } from 'vue'
import { useMessage, NModal, NInput, NPagination, NCard, NSpin, NSpace, NInputNumber, NButton } from 'naive-ui'
import { APISticker } from "~/server/utils/interfaces";
import { weaponAttachmentModalThemeOverrides } from "~/server/utils/themeCustomization";

const props = defineProps<{
  visible: boolean
  position: number
  currentSticker?: any | null
}>()

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
  (e: 'select', sticker: any): void
}>()

const { t } = useI18n()
const message = useMessage()

const state = ref({
  searchQuery: '',
  currentPage: 1,
  items: [] as APISticker[],
  isLoading: false,
  selectedItem: null as APISticker | null | undefined,
  customization: {
    x: 0,
    y: 0,
    wear: 0,
    scale: 1,
    rotation: 0
  }
})

const digitOnlyInputProps = {
  inputmode: 'numeric', pattern: '\\d*',
  onKeydown: (e: KeyboardEvent) => { const allow=['Backspace','Delete','Tab','ArrowLeft','ArrowRight','Home','End','Enter']; const meta=e.ctrlKey||e.metaKey; if (allow.includes(e.key)||(meta&&/[acvxy]/i.test(e.key))) return; if (!/^[0-9]$/.test(e.key)) e.preventDefault() },
  onPaste: (e: ClipboardEvent) => { const t=e.clipboardData?.getData('text')||''; if (/[^0-9]/.test(t)) e.preventDefault() }
}

// External normalized offsets from VisualCustomizer (if present)
const extNormX = computed(() => {
  const val = (props.currentSticker as any)?.ext_norm_x
  return typeof val === 'number' && !isNaN(val) ? val : null
})
const extNormY = computed(() => {
  const val = (props.currentSticker as any)?.ext_norm_y
  return typeof val === 'number' && !isNaN(val) ? val : null
})
const extNormXStr = computed(() => (extNormX.value !== null ? extNormX.value.toFixed(12) : ''))
const extNormYStr = computed(() => (extNormY.value !== null ? extNormY.value.toFixed(12) : ''))


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
    // Handle both old and new API response formats
    const stickers = data.data || data.stickers || []
    state.value.items = stickers
  } catch (error) {
    message.error(t('modals.sticker.errorFetching') as string)
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
  emit('select', emitData)
  handleClose()
}

const handleRemove = () => {
  if (!props.currentSticker) return
  emit('select', null)
  handleClose()
}

// Function to completely reset all state
const resetAllState = () => {
  state.value = {
    ...state.value,
    searchQuery: '',
    currentPage: 1,
    selectedItem: null,
    customization: {
      x: 0,
      y: 0,
      wear: 0,
      scale: 1,
      rotation: 0
    }
  }
}

const handleClose = () => {
  emit('update:visible', false)
  resetAllState()
}

onMounted(() => {
  fetchItems()
})

// Initialize with current sticker if editing
watchEffect(() => {
  if (props.currentSticker) {
    state.value.selectedItem = state.value.items.find(item => item.id === ("sticker-" + props.currentSticker?.id))
    console.log('StickerModal - watchEffect currentSticker:', props.currentSticker)
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

// Fetch stickers when modal becomes visible and reset state when closed
watch(() => props.visible, (newValue) => {
  if (newValue) {
    fetchItems()
  } else {
    // Reset state when modal is closed
    resetAllState()
  }
})
</script>

<template>
  <NModal
      :show="visible"
      style="width: 1200px"
      preset="card"
      :title="currentSticker ? t('modals.sticker.titleEdit') as string : t('modals.sticker.titleAdd') as string"
      :bordered="false"
      size="huge"
      @update:show="handleClose"
      :theme-overrides="weaponAttachmentModalThemeOverrides"
  >
    <template #header-extra>
      <NInput
          v-model:value="state.searchQuery"
          :placeholder="t('modals.sticker.searchPlaceholder') as string"
          class="w-64"
      />
    </template>

    <NSpace vertical size="large" class="-mt-2">
      <!-- Selected Sticker Preview -->
      <div v-if="state.selectedItem" class="bg-[#1a1a1a] p-6 rounded-lg">
        <div class="grid grid-cols-2 gap-6">
          <!-- Left side - Image -->
          <div class="flex flex-col items-center">
            <img
                :src="state.selectedItem.image"
                :alt="state.selectedItem.name"
                class="h-40 object-top object-cover"
            />
            <h3 class="text-lg font-semibold mt-4 break-words">{{ state.selectedItem.name }}</h3>
          </div>

          <!-- Right side - Customization -->
          <div class="space-y-4">
            <!-- Position Controls -->
            <div class="grid grid-cols-2 gap-4">
              <div>
                <h4 class="font-medium mb-2">X {{ t('modals.sticker.labels.position') }}</h4>
                <NInputNumber
                    v-model:value="state.customization.x"
                    :min="-100"
                    :max="100"
                    :step="0.01"
                    class="w-full"
                    :input-props="digitOnlyInputProps"
                />
              </div>
              <div>
                <h4 class="font-medium mb-2">Y {{ t('modals.sticker.labels.position') }}</h4>
                <NInputNumber
                    v-model:value="state.customization.y"
                    :min="-100"
                    :max="100"
                    :step="0.01"
                    class="w-full"
                    :input-props="digitOnlyInputProps"
                />
              </div>
            </div>

            <!-- External normalized offsets (read-only, if available) -->
            <div v-if="currentSticker && (extNormX !== null || extNormY !== null)" class="text-xs text-gray-400 -mt-2 mb-2">
              <div><span class="opacity-70">Ext normalized</span>: X {{ extNormXStr }} | Y {{ extNormYStr }}</div>
            </div>

            <!-- Scale and Rotation -->
            <div class="grid grid-cols-2 gap-4">
              <div>
                <h4 class="font-medium mb-2">{{ t('modals.sticker.labels.scale') }}</h4>
                <NInputNumber
                    v-model:value="state.customization.scale"
                    :min="0.01"
                    :max="1"
                    :step="0.01"
                    class="w-full"
                    :input-props="digitOnlyInputProps"
                />
              </div>
              <div>
                <h4 class="font-medium mb-2">{{ t('modals.sticker.labels.rotation') }}</h4>
                <NInputNumber
                    v-model:value="state.customization.rotation"
                    :min="-360"
                    :max="360"
                    :step="1"
                    class="w-full"
                    :input-props="digitOnlyInputProps"
                />
              </div>
            </div>

            <div class="grid grid-cols-2 gap-4 justify-start w-full mt-0">
            <!-- Wear -->
              <div>
                <h4 class="font-medium mb-2">{{ t('modals.sticker.labels.wear') }}</h4>
                <NInputNumber
                    v-model:value="state.customization.wear"
                    :min="0"
                    :max="1"
                    :step="0.01"
                    class=""
                />
              </div>
              <div class="grid grid-cols-2 gap-2">
                <NButton
                    type="primary"
                    class="mt-[30px] w-full "
                    :class="{
                      currentSticker: 'col-span-full'
                    }"
                    secondary
                    @click="handleSave"
                >
                  {{ currentSticker ? t('modals.sticker.buttons.update') : t('modals.sticker.buttons.create') }}
                </NButton>
                <NButton v-if="currentSticker"
                    type="error"
                    class="mt-[30px] w-full"
                    secondary
                    @click="handleRemove"
                >
                  {{ t('modals.sticker.buttons.delete') }}
                </NButton>
              </div>
            </div>
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
            state.selectedItem?.id === item.id ? 'ring-2 ring-[var(--selection-ring)] !border-0 opacity-65' : ''
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
        {{ t('modals.sticker.noSearchResults') }}
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