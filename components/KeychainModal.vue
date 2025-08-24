<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useMessage, NModal, NInput, NPagination, NCard, NSpin, NSpace, NInputNumber, NButton } from 'naive-ui'
import { APIKeychain } from "~/server/utils/interfaces";
import {weaponAttachmentModalThemeOverrides} from "~/server/utils/themeCustomization";

const props = defineProps<{
  visible: boolean
  currentKeychain?: any | null
}>()

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
  (e: 'select', keychain: any): void
}>()

const { t } = useI18n()
const message = useMessage()

const state = ref({
  searchQuery: '',
  currentPage: 1,
  items: [] as APIKeychain[],
  isLoading: false,
  selectedItem: null as APIKeychain | null | undefined,
  customization: {
    x: 0,
    y: 0,
    z: 0,
    seed: 0
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

// Check if seed input should be disabled for Austin 2025 Highlight charms
const isSeedDisabled = computed(() => {
  return state.value.selectedItem?.name?.includes('Souvenir Charm | Austin 2025 Highlight') || false
})

const fetchItems = async () => {
  try {
    state.value.isLoading = true
    const response = await fetch('/api/data/keychains')
    const data = await response.json()
    state.value.items = data.keychains
  } catch (error) {
    message.error(t('modals.keychain.errorFetching') as string)
    console.error('Error fetching keychains:', error)
  } finally {
    state.value.isLoading = false
  }
}

const handleSelect = (item: APIKeychain) => {
  state.value.selectedItem = item
  if (!props.currentKeychain) {
    state.value.customization = {
      x: 0,
      y: 0,
      z: 0,
      seed: 0
    }
  }

  // Reset seed to 0 for Austin 2025 Highlight charms
  if (item.name?.includes('Souvenir Charm | Austin 2025 Highlight')) {
    state.value.customization.seed = 0
  }
}

const handleSave = () => {
  if (!state.value.selectedItem) return

  const emitData = {
    id: state.value.selectedItem.id.replace('keychain-', ''),
    x: state.value.customization.x,
    y: state.value.customization.y,
    z: state.value.customization.z,
    seed: state.value.customization.seed,
    api: {
      name: state.value.selectedItem.name,
      image: state.value.selectedItem.image,
      rarity: state.value.selectedItem.rarity
    }
  }
  emit('select', emitData)
  handleClose()
}

const handleRemove = () => {
  if (!props.currentKeychain) return
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
      z: 0,
      seed: 0
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

watchEffect(() => {
  if (props.currentKeychain) {
    state.value.selectedItem = state.value.items.find(item => item.id === ("keychain-"+ props.currentKeychain?.id))
    state.value.customization = {
      x: props.currentKeychain.x,
      y: props.currentKeychain.y,
      z: props.currentKeychain.z,
      seed: props.currentKeychain.seed
    }
  }
})

// Initialize with current keychain if editing
watch(() => props.currentKeychain, (newKeychain) => {
  if (newKeychain) {
    state.value.customization = {
      x: newKeychain.x,
      y: newKeychain.y,
      z: newKeychain.z,
      seed: newKeychain.seed
    }
  }
}, { immediate: true })

// Fetch keychains when modal becomes visible and reset state when closed
watch(() => props.visible, (newValue) => {
  if (newValue) {
    fetchItems()
  } else {
    // Reset state when modal is closed
    resetAllState()
  }
})

// Watch for seed changes and reset to 0 for Austin 2025 Highlight charms
watch(() => state.value.customization.seed, (newSeed) => {
  if (isSeedDisabled.value && newSeed !== 0) {
    state.value.customization.seed = 0
  }
})
</script>

<template>
  <NModal
      :show="visible"
      style="width: 1000px"
      preset="card"
      :title="currentKeychain ? t('modals.keychain.titleEdit') as string : t('modals.keychain.titleAdd') as string"
      :bordered="false"
      size="huge"
      @update:show="handleClose"
      :theme-overrides="weaponAttachmentModalThemeOverrides"
  >
    <template #header-extra>
      <NInput
          v-model:value="state.searchQuery"
          :placeholder="t('modals.keychain.searchPlaceholder') as string"
          class="w-64"
      />
    </template>

    <NSpace vertical size="large" class="-mt-2">
      <!-- Selected Keychain Preview -->
      <div v-if="state.selectedItem" class="bg-[#1a1a1a] px-6 py-4 rounded-lg">
        <div class="grid grid-cols-2 gap-4">
          <!-- Left side - Image -->
          <div class="flex flex-col items-center">
            <img
                :src="state.selectedItem.image"
                :alt="state.selectedItem.name"
                class="scale-125 h-40 object-top object-cover"
            />
            <h3 class="text-lg font-semibold mt-4">{{ state.selectedItem.name }}</h3>
          </div>

          <!-- Right side - Customization -->
          <div class="space-y-4">
            <!-- Position Controls -->
            <div class="grid grid-cols-2 gap-4">
              <div>
                <h4 class="font-medium mb-2">X {{ t('modals.keychain.labels.position') }}</h4>
                <NInputNumber
                    v-model:value="state.customization.x"
                    :min="-100"
                    :max="100"
                    :step="0.01"
                    class="w-full"
                />
              </div>
              <div>
                <h4 class="font-medium mb-2">Y {{ t('modals.keychain.labels.position') }}</h4>
                <NInputNumber
                    v-model:value="state.customization.y"
                    :min="-100"
                    :max="100"
                    :step="0.01"
                    class="w-full"
                />
              </div>
            </div>

            <!-- Z Position and Seed -->
            <div class="grid grid-cols-2 gap-4">
              <div>
                <h4 class="font-medium mb-2">Z {{ t('modals.keychain.labels.position') }}</h4>
                <NInputNumber
                    v-model:value="state.customization.z"
                    :min="-100"
                    :max="100"
                    :step="0.01"
                    class="w-full"
                />
              </div>
              <div>
                <h4 class="font-medium mb-2">{{ t('modals.keychain.labels.seed') }}</h4>
                <NInputNumber
                    v-model:value="state.customization.seed"
                    :min="0"
                    :max="100000"
                    :step="1"
                    :disabled="isSeedDisabled"
                    class="w-full"
                />
              </div>
            </div>
            <div class="grid grid-cols-2 gap-4">
              <NButton type="primary" class="w-full" secondary @click="handleSave">
                {{ currentKeychain ? t('modals.keychain.buttons.update') : t('modals.keychain.buttons.create') }}
              </NButton>
              <NButton v-if="currentKeychain" type="error" class="w-full" secondary @click="handleRemove">
                {{ t('modals.keychain.delete') }}
              </NButton>
            </div>
          </div>
        </div>
      </div>

      <!-- Keychains Grid -->
      <div v-if="!state.isLoading" class="grid grid-cols-5 gap-4">
        <NCard
            v-for="item in paginatedItems"
            :key="item.id"
            :class="[
            'cursor-pointer transition-all hover:shadow-lg',
            state.selectedItem?.id === item.id.replace('keychain-', '') ? 'ring-2 ring-[#80E6C4] !border-0 opacity-65' : ''
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
            <p class="text-sm text-center truncate">{{ item.name }}</p>
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
        {{ t('modals.keychain.noSearchResults') }}
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