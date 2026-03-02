<script setup lang="ts">
import type {
  ItemConfiguration,
  WeaponConfiguration,
  KnifeConfiguration,
  UserProfile,
  ItemType,
  IEnhancedItem,
} from '~/types'

/**
 * Props interface using new type system with backward compatibility
 */
interface Props {
  /** Item data - supports both new and legacy interfaces */
  item: IEnhancedItem | null
  /** Item type for proper handling */
  itemType: ItemType | null
  /** Item customization configuration */
  customization: ItemConfiguration | null
  /** Loading state */
  isLoading?: boolean
  /** User profile information */
  user: UserProfile | null
}

const props = defineProps<Props>()

/**
 * Events interface with enhanced type safety
 */
const emit = defineEmits<{
  (e: 'customize' | 'clear' | 'generate-link'): void
  (e: 'error', error: string): void
}>()

const { t } = useI18n()

/**
 * Type guards for safe type checking
 */
const isWeaponConfiguration = (config: ItemConfiguration | null): config is WeaponConfiguration => {
  return config !== null && 'stattrak_enabled' in config && 'stickers' in config
}

const isKnifeConfiguration = (config: ItemConfiguration | null): config is KnifeConfiguration => {
  return config !== null && 'stattrak_enabled' in config && !('stickers' in config)
}

// Removed unused isGloveConfiguration function

/**
 * Filtered stickers for display (non-null only)
 */
const filteredStickers = computed(() => {
  if (props.itemType !== 'weapon' || !isWeaponConfiguration(props.customization)) {
    return []
  }
  return props.customization.stickers.filter(
    (sticker): sticker is NonNullable<typeof sticker> => sticker !== null
  )
})

/**
 * Determine background color based on rarity
 */
const itemBackground = computed(() => {
  if (!props.item?.rarity?.color) return '#242424'
  return `linear-gradient(135deg, #101010, ${hexToRgba(props.item.rarity.color, '0.15')})`
})

/**
 * Format item name for display with StatTrak and name tag support
 */
const displayName = computed(() => {
  if (!props.item) return ''

  try {
    let name = props.item.name

    // Add StatTrak™ prefix if applicable (weapons and knives only)
    if (props.itemType === 'weapon' || props.itemType === 'knife') {
      if (isWeaponConfiguration(props.customization) || isKnifeConfiguration(props.customization)) {
        if (props.customization.stattrak_enabled) {
          name = `StatTrak™ ${name}`
        }
      }
    }

    // Add name tag if present (weapons and knives only)
    if (props.itemType === 'weapon' || props.itemType === 'knife') {
      if (isWeaponConfiguration(props.customization) || isKnifeConfiguration(props.customization)) {
        if (props.customization.nametag) {
          name = `${name} (${props.customization.nametag})`
        }
      }
    }

    return name
  } catch (error) {
    console.error('Error formatting display name:', error)
    return props.item.name || 'Unknown Item'
  }
})

/**
 * Get item type display name with proper localization
 */
const itemTypeDisplay = computed(() => {
  try {
    switch (props.itemType) {
      case 'weapon':
        return t('common.weapon')
      case 'knife':
        return t('common.knife')
      case 'glove':
        return t('common.glove')
      case 'agent':
        return t('common.agent')
      case 'musickit':
        return t('common.musickit')
      case 'pin':
        return t('common.pin')
      default:
        return ''
    }
  } catch (error) {
    console.error('Error getting item type display name:', error)
    return props.itemType || ''
  }
})

/**
 * Utility functions
 */

/** Format float value for display */
const formatFloat = (value: number): string => {
  try {
    return value.toFixed(8).replace(/0+$/, '').replace(/\.$/, '')
  } catch (error) {
    console.error('Error formatting float:', error)
    return '0'
  }
}

/**
 * Event handlers with error handling
 */

/** Handle customize button click */
const handleCustomize = () => {
  try {
    emit('customize')
  } catch (error) {
    console.error('Error handling customize:', error)
    emit('error', 'Failed to open customization')
  }
}

/** Handle clear button click */
const handleClear = () => {
  try {
    emit('clear')
  } catch (error) {
    console.error('Error handling clear:', error)
    emit('error', 'Failed to clear item')
  }
}

/** Handle generate link button click */
const handleGenerateLink = () => {
  try {
    emit('generate-link')
  } catch (error) {
    console.error('Error handling generate link:', error)
    emit('error', 'Failed to generate inspect link')
  }
}
</script>

<template>
  <div class="inspect-item-display">
    <NCard
      v-if="item"
      :style="{
        borderColor: item.rarity?.color || '#313030',
        background: itemBackground,
      }"
      class="item-card"
    >
      <div class="flex flex-col items-center">
        <!-- Item Image -->
        <div class="w-full h-48 flex items-center justify-center mb-4">
          <img
            v-if="item.image"
            :src="item.image"
            :alt="item.name"
            class="w-full h-full object-contain"
            loading="lazy"
          />
          <div
            v-else
            class="flex flex-col items-center justify-center h-full w-full bg-gray-800/30 rounded"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1"
              stroke-linecap="round"
              stroke-linejoin="round"
              class="text-gray-400 mb-2"
            >
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
            <span class="text-gray-400 text-sm">{{ t('inspectItem.noImageAvailable') }}</span>
          </div>
        </div>

        <!-- Item Details -->
        <div class="w-full">
          <h3 class="text-lg font-bold text-white truncate">{{ displayName }}</h3>
          <p class="text-sm text-gray-300">{{ itemTypeDisplay }}</p>

          <!-- Item Properties -->
          <div class="mt-2 grid grid-cols-2 gap-2 text-sm">
            <div>
              <span class="text-gray-400">{{ t('common.paintIndex') }}:</span>
              <span class="ml-1">{{ customization?.paintindex || 0 }}</span>
            </div>
            <div>
              <span class="text-gray-400">{{ t('common.pattern') }}:</span>
              <span class="ml-1">{{ customization?.paintseed || 0 }}</span>
            </div>
            <div>
              <span class="text-gray-400">{{ t('common.wear') }}:</span>
              <span class="ml-1">{{ formatFloat(customization?.paintwear || 0) }}</span>
            </div>

            <!-- StatTrak (only for weapons and knives) -->
            <div v-if="itemType === 'weapon' || itemType === 'knife'">
              <span class="text-gray-400">{{ t('common.statTrak') }}:</span>
              <span class="ml-1">
                {{
                  (customization as WeaponConfiguration | KnifeConfiguration)?.stattrak_enabled
                    ? (customization as WeaponConfiguration | KnifeConfiguration)?.stattrak_count
                    : t('common.disabled')
                }}
              </span>
            </div>
          </div>

          <!-- Stickers and Keychain (only for weapons) -->
          <div v-if="itemType === 'weapon' && customization" class="mt-3">
            <!-- Stickers -->
            <div
              v-if="(customization as WeaponConfiguration)?.stickers?.some((s) => s !== null)"
              class="mb-2"
            >
              <p class="text-sm text-gray-400 mb-1">{{ t('common.stickers') }}:</p>
              <div class="flex flex-wrap gap-1">
                <div
                  v-for="(sticker, index) in filteredStickers"
                  :key="index"
                  class="w-10 h-10 rounded bg-gray-800/30 flex items-center justify-center overflow-hidden"
                  :title="sticker.api?.name || 'Sticker'"
                >
                  <img
                    v-if="sticker.api?.image"
                    :src="sticker.api.image"
                    :alt="sticker.api?.name || 'Sticker'"
                    class="w-8 h-8 object-contain"
                  />
                  <span v-else class="text-xs text-gray-400">{{ index + 1 }}</span>
                </div>
              </div>
            </div>

            <!-- Keychain -->
            <div v-if="(customization as WeaponConfiguration)?.keychain" class="mb-2">
              <p class="text-sm text-gray-400 mb-1">{{ t('common.keychain') }}:</p>
              <div class="flex items-center">
                <div
                  class="w-10 h-10 rounded bg-gray-800/30 flex items-center justify-center overflow-hidden mr-2"
                >
                  <img
                    v-if="(customization as WeaponConfiguration)?.keychain?.api?.image"
                    :src="(customization as WeaponConfiguration)?.keychain?.api?.image"
                    :alt="(customization as WeaponConfiguration)?.keychain?.api?.name || 'Keychain'"
                    class="w-8 h-8 object-contain"
                  />
                  <span v-else class="text-xs text-gray-400">K</span>
                </div>
                <span class="text-sm text-gray-300">
                  {{
                    (customization as WeaponConfiguration)?.keychain?.api?.name ||
                    t('common.keychain')
                  }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="mt-4 flex justify-between w-full">
          <NButton type="primary" :disabled="isLoading" @click="handleCustomize">
            {{ t('common.customize') }}
          </NButton>

          <NButton type="info" :disabled="isLoading" @click="handleGenerateLink">
            {{ t('common.generateLink') }}
          </NButton>

          <NButton type="error" :disabled="isLoading" @click="handleClear">
            {{ t('common.clear') }}
          </NButton>
        </div>
      </div>
    </NCard>

    <!-- Empty State -->
    <NCard v-else class="empty-card">
      <div class="flex flex-col items-center justify-center py-8">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="64"
          height="64"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1"
          stroke-linecap="round"
          stroke-linejoin="round"
          class="text-gray-400 mb-4"
        >
          <path
            d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"
          />
          <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
          <line x1="12" y1="22.08" x2="12" y2="12" />
        </svg>
        <p class="text-gray-300 text-lg">{{ t('inspectItem.noItemImported') }}</p>
        <p class="text-gray-400 text-sm mt-2">{{ t('inspectItem.useImportButton') }}</p>
      </div>
    </NCard>
  </div>
</template>

<style scoped>
.item-card {
  transition: all 0.3s ease;
  border-width: 2px;
}

.item-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.empty-card {
  background: #242424;
  border: 1px dashed #444;
  transition: all 0.3s ease;
}

.empty-card:hover {
  border-color: #666;
}
</style>
