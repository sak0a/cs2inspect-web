<script setup lang="ts">
import { buttonColor } from '~/lib/buttonColors'
import type {
  WeaponModalProps,
  WeaponConfiguration,
  APIWeaponSkin,
  APIKeychain,
  UserProfile,
  StickerConfiguration,
  KeychainConfiguration,
  KeychainJSON,
  IEnhancedWeapon,
  IMappedDBWeapon,
} from '~/types'
import { toSteamId } from '~/types'
import type { APISticker } from '~/server/types'
import { digitOnlyInputProps } from '~/utils/inputProps'
import { useItemModal } from '~/composables/useItemModal'
import { useInfiniteScroll } from '~/composables/useInfiniteScroll'
import { steamAuth } from '~/services/steamAuth'
import { useLoadoutStore } from '~/stores/loadoutStore'
import { useAutoSave } from '~/composables/useAutoSave'
import { generateFlatKeychainUrl, generateDefaultFlatImageUrl, generateStickerImageUrl } from '~/utils/canvasCoordinates'
import type { ItemHistoryRecord } from '~/server/database/schema/itemHistory'
import { VideoCanvasManager, generateVideoUrl, checkVideoExists } from '~/utils/videoCanvas'

/**
 * Props interface using new type system with backward compatibility
 */
interface Props extends Omit<WeaponModalProps, 'weapon' | 'user'> {
  // Maintain backward compatibility with existing prop names
  weapon: IEnhancedWeapon | null
  isLoading?: boolean
  pageSize?: number
}

const props = defineProps<Props>()

/**
 * Events interface using new type system with backward compatibility
 */
const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
  (
    e: 'select' | 'duplicate' | 'auto-save',
    skin: IEnhancedWeapon,
    customization: WeaponConfiguration
  ): void
  (e: 'error', error: string): void
}>()

const { t } = useI18n()
const message = useMessage()

const modalTitle = computed(() => {
  // Show visual customizer title when in inline mode
  if (weaponState.value.inlineVisualCustomizerActive && selectedSkin.value) {
    return t('modals.weaponSkin.visualCustomizer.modalTitle', {
      weaponName: selectedSkin.value.name,
    }) as string
  }

  return props.weapon
    ? (t('modals.weaponSkin.title', { weaponName: props.weapon?.defaultName }) as string)
    : (t('modals.weaponSkin.defaultTitle') as string)
})

const { teamLabel, teamBadgeClasses } = useTeamBadge(() => props.weapon?.databaseInfo?.team)

/**
 * Use shared item modal composable for state, pagination, sorting, and skin fetching
 */
const {
  state,
  apiState,
  PAGE_SIZE,
  sortBy,
  sortDir,
  rarityFilterIds,
  availableRarities,
  sortedSkins,
  displayedSkins,
  hasMore,
  loadMore,
  resetDisplayedCount,
  fetchSkins,
  clearState,
  toggleSortDir,
  toggleRarityFilter,
} = useItemModal({
  itemType: 'weapon',
  pageSize: props.pageSize || 10,
  enableSortFilter: true,
})

// Ref for the modal's scrollable content area
const modalContentRef = ref<HTMLElement | null>(null)

const { sentinelRef } = useInfiniteScroll({
  onLoadMore: loadMore,
  rootMargin: '200px',
  enabled: computed(() => hasMore.value && !state.value.isLoadingSkins && !isCanvasMode.value),
  root: modalContentRef,
})

/**
 * Weapon-specific modal state (not shared with other item modals)
 */
const weaponState = ref({
  showStickerModal: false,
  showKeychainModal: false,
  showVisualCustomizer: false,
  inlineVisualCustomizerActive: false,
  currentStickerPosition: 0,
  showHistoryPanel: false,
})

type ModalViewState = 'browse' | 'stickerEdit' | 'canvas'
const modalViewState = ref<ModalViewState>('browse')
const editingStickerIndex = ref<number | null>(null)
const isCanvasMode = computed(() => modalViewState.value === 'canvas')
const isStickerEditMode = computed(() => modalViewState.value === 'stickerEdit')

const selectedSkin = ref<IEnhancedWeapon | null>()

/**
 * Default weapon configuration using new WeaponConfiguration interface
 * Field names match database columns for consistency
 */
const defaultCustomization: WeaponConfiguration = {
  active: false,
  team: 1, // Default to Terrorist team
  defindex: 0,
  paintindex: 0,
  paintIndexOverride: false,
  paintseed: 0,
  paintwear: 0,
  stattrak_enabled: false,
  stattrak_count: 0,
  nametag: '',
  stickers: [null, null, null, null, null],
  keychain: null,
}

const customization = ref<WeaponConfiguration>({ ...defaultCustomization })

/**
 * Auto-save functionality
 * Automatically saves changes to the server after a debounce period
 */
const autoSave = useAutoSave<WeaponConfiguration>(
  async (data) => {
    if (!selectedSkin.value) return
    emit('auto-save', selectedSkin.value, data)
  },
  {
    debounceMs: 1500,
    retryAttempts: 3,
    onSaveError: (error) => {
      console.error('Auto-save failed:', error)
    },
  }
)

// Track if we should trigger auto-save (only when user makes intentional changes)
const isInitializing = ref(false)

// Video preview refs
const previewVideo = ref<HTMLVideoElement | null>(null)
const previewCanvas = ref<HTMLCanvasElement | null>(null)
const previewCtx = ref<CanvasRenderingContext2D | null>(null)
const previewVideoManager = ref<VideoCanvasManager | null>(null)
const isPreviewVideoMode = ref(false)
const isPreviewVideoLoading = ref(false)

// Preview image: use flat default PNG when paintindex=0, otherwise selected skin image
const previewImageUrl = computed(() => {
  if (customization.value.paintindex === 0 && selectedSkin.value) {
    const weaponName = selectedSkin.value.name.split(' | ')[0] || ''
    return generateDefaultFlatImageUrl(weaponName)
  }
  return selectedSkin.value?.image || ''
})

// Watch customization changes for auto-save
watch(
  () => customization.value,
  (newVal) => {
    // Only auto-save if:
    // 1. Not initializing (loading data from DB)
    // 2. A skin is selected
    // 3. A paint index is set (user has chosen a skin)
    // 4. Modal is visible
    if (
      !isInitializing.value &&
      selectedSkin.value &&
      newVal.paintindex !== null &&
      props.visible
    ) {
      autoSave.triggerSave({ ...newVal })
    }
  },
  { deep: true }
)

// Watch wear changes to update video preview
watch(
  () => customization.value.paintwear,
  (newWear) => {
    if (isPreviewVideoMode.value && previewVideoManager.value) {
      previewVideoManager.value.updateWear(newWear)
    }
  }
)

// Watch selectedSkin to initialize video preview
watch(selectedSkin, async (newSkin) => {
  if (newSkin) {
    await nextTick()
    await initializePreviewVideo()
  } else {
    isPreviewVideoMode.value = false
  }
})

/**
 * User profile using new UserProfile interface
 */
const user = computed((): UserProfile | null => {
  const steamUser = steamAuth.getSavedUser()
  if (!steamUser) return null

  return {
    steamId: toSteamId(steamUser.steamId),
    personaName: steamUser.personaName,
    avatar: steamUser.avatar,
    profileUrl: steamUser.profileUrl,
  }
})

const loadoutStore = useLoadoutStore()

const quickActions = useWeaponQuickActions({
  user: computed(() => user.value),
  loadoutId: computed(() => loadoutStore.selectedLoadoutId),
  weaponType: props.weapon?.category || '',
  onSuccess: async () => {
    // Modal doesn't need to refresh external data — it manages its own state
  },
})

const skinSortOptions = computed(() => [
  { label: t('modals.weaponSkin.sort.name') as string, value: 'name' },
  { label: t('modals.weaponSkin.sort.rarity') as string, value: 'rarity' },
])

/**
 * Initialize video preview for the selected skin
 * Falls back to static image if video not available
 */
const initializePreviewVideo = async () => {
  if (!selectedSkin.value || !previewVideo.value || !previewCanvas.value) return

  // Default skin (paintindex=0): skip video, use flat image directly
  if (customization.value.paintindex === 0) {
    isPreviewVideoMode.value = false
    isPreviewVideoLoading.value = false
    return
  }

  // Scale canvas backing buffer for HiDPI sharpness
  const dpr = window.devicePixelRatio || 1
  const rect = previewCanvas.value.getBoundingClientRect()
  const cssW = rect.width || 640
  const cssH = rect.height || 256
  previewCanvas.value.width = cssW * dpr
  previewCanvas.value.height = cssH * dpr
  previewCanvas.value.style.width = `${cssW}px`
  previewCanvas.value.style.height = `${cssH}px`

  // Get canvas context
  previewCtx.value = previewCanvas.value.getContext('2d')
  if (!previewCtx.value) return

  // Scale context so all draw calls use CSS-pixel coordinates
  previewCtx.value.setTransform(dpr, 0, 0, dpr, 0, 0)

  // Generate video URL from skin name
  const weaponName = selectedSkin.value.name.split(' | ')[0] || 'weapon'
  const skinName = selectedSkin.value.name.split(' | ')[1] || 'skin'
  const videoUrl = generateVideoUrl(weaponName, skinName)

  isPreviewVideoLoading.value = true

  try {
    const videoExists = await checkVideoExists(videoUrl)
    if (videoExists) {
      // Clean up previous video manager
      if (previewVideoManager.value) {
        previewVideoManager.value.destroy()
      }

      previewVideoManager.value = new VideoCanvasManager({
        video: previewVideo.value,
        ctx: previewCtx.value,
        canvasSize: {
          width: cssW,
          height: cssH,
        },
        wearValue: customization.value.paintwear,
        minWear: selectedSkin.value.minFloat ?? 0,
        maxWear: selectedSkin.value.maxFloat ?? 1,
        videoDuration: 140,
        transparentBackground: true,
      })
      await previewVideoManager.value.loadVideo(videoUrl)
      // Seek to current wear and render after seek completes
      await previewVideoManager.value.seekToWear(customization.value.paintwear)
      isPreviewVideoMode.value = true
      previewVideoManager.value.renderFrame()
    } else {
      isPreviewVideoMode.value = false
    }
  } catch (e) {
    console.warn('[WeaponSkinModal] Video preview init failed', e)
    isPreviewVideoMode.value = false
  }

  isPreviewVideoLoading.value = false
}

// mapCustomizationToRepresentation has been moved to the backend

/**
 * Handle inspect link import with improved error handling and type safety
 */
const handleImportInspectLink = async (inspectUrl: string) => {
  if (!props.weapon || !user.value) {
    state.value.error = 'Missing weapon or user data'
    emit('error', state.value.error)
    return
  }

  try {
    state.value.isImporting = true
    state.value.error = null

    const config = await quickActions.importFromLink(
      props.weapon.weapon_defindex,
      customization.value.team,
      inspectUrl,
    )

    // Update local customization state (modal doesn't save directly)
    customization.value = config

    // Update selected skin based on paint index
    const matchingSkin = apiState.value.skins.find(
      (skin) => Number(skin.paint_index) === config.paintindex,
    )

    if (matchingSkin) {
      selectedSkin.value = {
        ...props.weapon!,
        name: matchingSkin.name,
        defaultName: matchingSkin.name,
        image: matchingSkin.image,
        defaultImage: matchingSkin.image,
        minFloat: matchingSkin.min_float ?? 0,
        maxFloat: matchingSkin.max_float ?? 1,
        paintindex: Number(matchingSkin.paint_index),
        rarity: matchingSkin.rarity,
        availableTeams: matchingSkin.team?.id ?? 'both',
      }
    }

    message.success(t('modals.weaponSkin.importSuccess') as string, { duration: 3000 })
    state.value.showImportModal = false
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : (t('modals.weaponSkin.importFailedDefault') as string)
    state.value.error = errorMessage
    message.error(errorMessage, { duration: 3000 })
    emit('error', errorMessage)
  } finally {
    state.value.isImporting = false
  }
}
/**
 * Handle inspect link creation with improved error handling
 */
const handleCreateInspectLink = async () => {
  if (!props.weapon || !selectedSkin.value || !user.value) {
    state.value.error = 'Missing required data for inspect link creation'
    emit('error', state.value.error)
    return
  }

  // Require a configured skin (paint index) before generating an inspect link
  if (!customization.value.paintindex || customization.value.paintindex === 0) {
    state.value.error = 'No skin configured for inspect link creation'
    emit('error', state.value.error)
    return
  }

  try {
    state.value.isLoadingInspect = true
    state.value.error = null

    const data = await $fetch<{ inspectUrl: string; message?: string }>(
      `/api/inspect?action=create-url&steamId=${user.value.steamId}`,
      {
        method: 'POST',
        body: {
          itemType: 'weapon',
          defindex: props.weapon.weapon_defindex,
          paintindex: customization.value.paintindex,
          paintseed: customization.value.paintseed,
          paintwear: customization.value.paintwear,
          rarity: 0,
          stattrak_enabled: customization.value.stattrak_enabled,
          stattrak_count: customization.value.stattrak_count,
          nametag: customization.value.nametag,
          customization: customization.value,
        },
      }
    )

    const link: string = data.inspectUrl
    await navigator.clipboard.writeText(link)
    message.success(t('modals.weaponSkin.generateInspectUrlSuccess') as string, {
      duration: 3000,
    })
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : (t('modals.weaponSkin.generateInspectUrlFailed') as string)
    state.value.error = errorMessage
    message.error(errorMessage)
    emit('error', errorMessage)
    console.error('Error creating inspect link:', error)
  } finally {
    state.value.isLoadingInspect = false
  }
}

/**
 * Handle weapon reset with improved error handling
 */
const handleReset = async () => {
  if (!selectedSkin.value) {
    state.value.error = 'No weapon selected for reset'
    emit('error', state.value.error)
    return
  }

  state.value.isResetting = true
  try {
    state.value.error = null
    customization.value.reset = true
    state.value.showResetConfirm = false
    handleSave()
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : (t('modals.weaponSkin.resetFailed') as string)
    state.value.error = errorMessage
    message.error(errorMessage)
    emit('error', errorMessage)
    console.error('Error resetting weapon:', error)
  } finally {
    state.value.isResetting = false
  }
}

/**
 * Handle history restore - reload the configuration from the restored version
 * Fetches API data for stickers and keychain to update the display
 */
const handleHistoryRestore = async (record: ItemHistoryRecord) => {
  if (record.configuration) {
    // Parse configuration if it's a JSON string (MariaDB/Drizzle may return JSON as string)
    let config = record.configuration
    if (typeof config === 'string') {
      try {
        config = JSON.parse(config)
      } catch {
        console.error('Failed to parse history configuration')
        return
      }
    }

    // Helper to safely parse a number from various types
    const toNumber = (val: unknown, defaultVal: number): number => {
      if (typeof val === 'number' && !isNaN(val)) return val
      if (typeof val === 'string') {
        const parsed = parseFloat(val)
        return isNaN(parsed) ? defaultVal : parsed
      }
      return defaultVal
    }

    // Helper to safely parse an integer from various types
    const toInt = (val: unknown, defaultVal: number): number => {
      if (typeof val === 'number' && !isNaN(val)) return Math.floor(val)
      if (typeof val === 'string') {
        const parsed = parseInt(val, 10)
        return isNaN(parsed) ? defaultVal : parsed
      }
      return defaultVal
    }

    // Properly restore stickers array - ensure it's always a 5-element array
    // Important: Include slot and position based on array index for IEnhancedWeaponSticker compatibility
    const restoredStickers: (StickerConfiguration | null)[] = [null, null, null, null, null]
    const stickerPromises: Promise<void>[] = []

    if (config.stickers && Array.isArray(config.stickers)) {
      for (let index = 0; index < Math.min(config.stickers.length, 5); index++) {
        let s = config.stickers[index]
        if (!s) continue

        // Parse if sticker is stored as a JSON string (MariaDB/Drizzle may return JSON as string)
        if (typeof s === 'string') {
          try {
            s = JSON.parse(s)
          } catch {
            continue
          }
        }
        if (typeof s !== 'object' || s === null) continue

        // Handle both number and string IDs
        const id = toInt(s.id, 0)
        if (id <= 0) continue

        restoredStickers[index] = {
          id: id,
          slot: index, // Required for IEnhancedWeaponSticker
          position: index, // Required for StickerConfiguration
          x: toNumber(s.x, 0),
          y: toNumber(s.y, 0),
          wear: toNumber(s.wear, 0),
          scale: toNumber(s.scale, 1),
          rotation: toNumber(s.rotation, 0),
        } as StickerConfiguration

        // Fetch sticker API data
        const stickerIndex = index
        stickerPromises.push(
          $fetch<{ success: boolean; data: APISticker[] }>(`/api/data/stickers?id=sticker-${id}`)
            .then((response) => {
              const stickerData = response.data?.[0]
              if (stickerData && restoredStickers[stickerIndex]) {
                restoredStickers[stickerIndex] = {
                  ...restoredStickers[stickerIndex]!,
                  api: {
                    name: stickerData.name,
                    image: stickerData.image,
                    type: stickerData.type,
                    effect: stickerData.effect,
                    tournament_event: stickerData.tournament_event,
                    tournament_team: stickerData.tournament_team,
                    rarity: stickerData.rarity,
                  },
                }
              }
            })
            .catch(() => {
              /* Ignore sticker fetch errors */
            })
        )
      }
    }

    // Properly restore keychain with all fields including wrapped_sticker_id and highlight_reel_id
    let restoredKeychain: KeychainConfiguration | null = null
    let keychainPromise: Promise<void> | null = null

    if (config.keychain) {
      // Parse if keychain is stored as a JSON string (MariaDB/Drizzle may return JSON as string)
      let keychainData: KeychainJSON | string | null = config.keychain as
        | KeychainJSON
        | string
        | null
      if (typeof keychainData === 'string') {
        try {
          keychainData = JSON.parse(keychainData)
        } catch {
          keychainData = null
        }
      }

      if (keychainData && typeof keychainData === 'object') {
        const keychainId = toInt(keychainData.id, 0)
        if (keychainId > 0) {
          restoredKeychain = {
            id: keychainId,
            x: toNumber(keychainData.x, 0),
            y: toNumber(keychainData.y, 0),
            z: toNumber(keychainData.z, 0),
            seed: toInt(keychainData.seed, 0),
            // Preserve wrapped_sticker_id for Sticker Slabs
            wrapped_sticker_id:
              toInt(keychainData.wrapped_sticker_id, 0) > 0
                ? toInt(keychainData.wrapped_sticker_id, 0)
                : undefined,
            // Preserve highlight_reel_id for Highlight Reel charms
            highlight_reel_id:
              toInt(keychainData.highlight_reel_id, 0) > 0
                ? toInt(keychainData.highlight_reel_id, 0)
                : undefined,
          } as KeychainConfiguration

          // Fetch keychain API data
          keychainPromise = $fetch<{ success: boolean; data: APIKeychain[] }>(
            `/api/data/keychains?id=keychain-${keychainId}`
          )
            .then((response) => {
              const keychainData = response.data?.[0]
              if (keychainData && restoredKeychain) {
                restoredKeychain = {
                  ...restoredKeychain!,
                  api: {
                    name: keychainData.name,
                    image: keychainData.image,
                    rarity: keychainData.rarity,
                  },
                }
              }
            })
            .catch(() => {
              /* Ignore keychain fetch errors */
            })
        }
      }
    }

    // Wait for all API data to be fetched
    await Promise.all([...stickerPromises, keychainPromise].filter(Boolean))

    customization.value = {
      ...customization.value,
      paintindex: toInt(config.paintindex, 0),
      paintseed: toInt(config.paintseed, 0),
      paintwear: toNumber(config.paintwear, 0),
      active: config.active ?? false,
      stattrak_enabled: config.stattrak_enabled ?? false,
      stattrak_count: toInt(config.stattrak_count, 0),
      nametag: config.nametag || '',
      stickers: restoredStickers,
      keychain: restoredKeychain,
    }

    // Also update the selected skin if paint index changed
    if (config.paintindex) {
      const matchingSkin = apiState.value.skins.find(
        (skin) => Number(skin.paint_index) === toInt(config.paintindex, 0)
      )
      if (matchingSkin && props.weapon) {
        selectedSkin.value = {
          ...props.weapon,
          name: matchingSkin.name,
          defaultName: matchingSkin.name,
          image: matchingSkin.image,
          defaultImage: matchingSkin.image,
          minFloat: matchingSkin.min_float ?? 0,
          maxFloat: matchingSkin.max_float ?? 1,
          paintindex: Number(matchingSkin.paint_index),
          rarity: matchingSkin.rarity,
          availableTeams: matchingSkin.team?.id ?? 'both',
        }
      }
    }

    weaponState.value.showHistoryPanel = false
    // Note: Success message is shown by ItemHistoryPanel, no need to duplicate here
  }
}

/**
 * Handle weapon duplication with improved error handling
 */
const handleDuplicate = async () => {
  if (!selectedSkin.value) {
    state.value.error = 'No weapon selected for duplication'
    emit('error', state.value.error)
    return
  }

  state.value.isDuplicating = true
  try {
    state.value.error = null

    // Calculate the other team number (if current is 1, other is 2 and vice versa)
    const otherTeam = props.weapon?.databaseInfo?.team === 1 ? 2 : 1

    // Create copy of current customization for other team
    const duplicateData: WeaponConfiguration = {
      ...customization.value,
      team: otherTeam,
    }

    // Emit duplicate event to parent
    emit('duplicate', selectedSkin.value, duplicateData)

    state.value.showDuplicateConfirm = false
    console.log('handleDuplicate', selectedSkin.value, duplicateData)
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : (t('modals.weaponSkin.duplicateFailed') as string)
    state.value.error = errorMessage
    message.error(errorMessage)
    emit('error', errorMessage)
    console.error('Error duplicating weapon:', error)
  } finally {
    state.value.isDuplicating = false
  }
}
/**
 * Handle skin selection with type safety
 */
const handleSkinSelect = (skin: APIWeaponSkin) => {
  if (!props.weapon) {
    state.value.error = 'No weapon available for skin selection'
    emit('error', state.value.error)
    return
  }

  try {
    state.value.error = null

    selectedSkin.value = {
      ...props.weapon,
      name: skin.name,
      defaultName: skin.name,
      image: skin.image,
      defaultImage: skin.image,
      minFloat: skin.min_float ?? 0,
      maxFloat: skin.max_float ?? 1,
      paintindex: Number(skin.paint_index),
      rarity: skin.rarity,
      availableTeams: skin.team?.id ?? 'both',
    }

    // Preserve current float value, only clamp if outside new skin's valid range
    const newMinFloat = skin.min_float ?? 0
    const newMaxFloat = skin.max_float ?? 1
    const currentFloat = customization.value.paintwear
    const clampedFloat = Math.max(newMinFloat, Math.min(newMaxFloat, currentFloat))

    customization.value = {
      ...customization.value,
      paintindex: Number(skin.paint_index),
      paintwear: clampedFloat,
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to select skin'
    state.value.error = errorMessage
    emit('error', errorMessage)
    console.error('Error selecting skin:', error)
  }
}
// Deactivating this skin will remain it's configuration but will no longer be used on the server

const handleStickerDragStart = (e: DragEvent, fromIndex: number) => {
  if (!e.dataTransfer) return
  e.dataTransfer.effectAllowed = 'move'
  e.dataTransfer.setData('text/plain', fromIndex.toString())

  // Add dragging class to source element
  const el = e.target as HTMLElement
  el.classList.add('dragging')
}
const handleStickerDragEnd = (e: DragEvent) => {
  const el = e.target as HTMLElement
  el.classList.remove('dragging')
}
const handleStickerDragOver = (e: DragEvent) => {
  e.preventDefault()
  e.stopPropagation()

  const el = e.target as HTMLElement
  el.classList.add('drag-over')
}
const handleStickerDragLeave = (e: DragEvent) => {
  const el = e.target as HTMLElement
  el.classList.remove('drag-over')
}
const handleStickerDrop = (e: DragEvent, toIndex: number) => {
  e.preventDefault()
  const el = e.target as HTMLElement
  el.classList.remove('drag-over')

  const fromIndex = parseInt(e.dataTransfer?.getData('text/plain') || '-1')
  if (fromIndex === -1 || fromIndex === toIndex) return

  // Swap stickers in the customization object
  const stickers = [...customization.value.stickers]
  const temp = stickers[fromIndex] ?? null
  stickers[fromIndex] = stickers[toIndex] ?? null
  stickers[toIndex] = temp
  customization.value.stickers = stickers
}
const handleAddSticker = (position: number) => {
  weaponState.value.currentStickerPosition = position
  weaponState.value.showStickerModal = true
}
const handleStickerSelect = (stickerData: StickerConfiguration | null) => {
  customization.value.stickers[weaponState.value.currentStickerPosition] = stickerData
}

const removeSticker = (index: number) => {
  const stickers = [...customization.value.stickers]
  if (!stickers[index]) return
  stickers[index] = null
  customization.value.stickers = stickers
}

const handleAddKeychain = () => {
  weaponState.value.showKeychainModal = true
}
const handleKeychainSelect = (keychainData: KeychainConfiguration | null) => {
  customization.value.keychain = keychainData
}

const removeKeychain = () => {
  if (!customization.value.keychain) return
  customization.value.keychain = null
}

const handleExitInlineVisualCustomizer = () => {
  exitCanvas()
}

function enterStickerEdit(index: number) {
  const sticker = customization.value.stickers[index]
  if (!sticker) {
    handleAddSticker(index)
    return
  }
  editingStickerIndex.value = index
  modalViewState.value = 'stickerEdit'
}

function exitStickerEdit() {
  editingStickerIndex.value = null
  modalViewState.value = 'browse'
}

function enterCanvas(preselectStickerIndex?: number) {
  modalViewState.value = 'canvas'
  weaponState.value.inlineVisualCustomizerActive = true
  if (preselectStickerIndex !== undefined) {
    editingStickerIndex.value = preselectStickerIndex
  }
}

function exitCanvas() {
  modalViewState.value = 'browse'
  editingStickerIndex.value = null
  weaponState.value.inlineVisualCustomizerActive = false
}

function handlePreviewAreaClick() {
  if (isStickerEditMode.value) {
    exitStickerEdit()
  }
}

const handleInlineOpenStickerModal = (slotIndex: number) => {
  weaponState.value.currentStickerPosition = slotIndex
  weaponState.value.showStickerModal = true
}

const handleInlineSave = () => {
  handleExitInlineVisualCustomizer()
  message.success(
    String(t('modals.visualCustomizer.messages.saved') || 'Visual customization saved')
  )
}

const isEditableTarget = (target: EventTarget | null): boolean => {
  const el = target as HTMLElement | null
  if (!el) return false
  if (el.isContentEditable) return true
  const tag = el.tagName?.toLowerCase()
  if (tag === 'input' || tag === 'textarea' || tag === 'select') return true
  return Boolean(el.closest('input, textarea, select, [contenteditable="true"]'))
}

const handleModalKeydown = (e: KeyboardEvent) => {
  if (e.isComposing) return
  if (e.defaultPrevented) return
  if (e.ctrlKey || e.metaKey || e.altKey) return

  // Escape → exit sticker edit or canvas mode
  if (e.key === 'Escape') {
    if (isStickerEditMode.value) { exitStickerEdit(); e.stopPropagation(); return }
    if (isCanvasMode.value) { exitCanvas(); e.stopPropagation(); return }
  }

  // If any sub-modals are open, don't intercept Enter here.
  if (
    weaponState.value.showStickerModal ||
    weaponState.value.showKeychainModal ||
    state.value.showImportModal ||
    state.value.showDuplicateConfirm ||
    state.value.showResetConfirm ||
    weaponState.value.showVisualCustomizer
  ) {
    return
  }

  // Don't trigger shortcuts while typing in an input.
  if (isEditableTarget(e.target)) return

  const target = e.target as HTMLElement | null
  // Avoid triggering shortcuts while focus is on interactive controls.
  if (target?.closest('button, a, [role="button"]')) return

  // Enter → Save
  if (e.key === 'Enter') {
    e.preventDefault()
    handleSave()
    return
  }

  // 1-5 → Open sticker slot (only when not in canvas mode)
  if (!isCanvasMode.value && /^[1-5]$/.test(e.key)) {
    e.preventDefault()
    enterStickerEdit(Number(e.key) - 1)
    return
  }

  // R → Reset (with confirmation)
  if (e.key === 'r' || e.key === 'R') {
    if (!selectedSkin.value || customization.value.paintindex === 0) return
    e.preventDefault()
    state.value.showResetConfirm = true
    return
  }

  // D → Duplicate (with confirmation)
  if (e.key === 'd' || e.key === 'D') {
    if (!selectedSkin.value || selectedSkin.value.availableTeams !== 'both') return
    e.preventDefault()
    state.value.showDuplicateConfirm = true
  }
}

const handleSave = () => {
  if (!selectedSkin.value) return
  // Emit select to ensure any pending changes are saved
  emit('select', selectedSkin.value, customization.value)
  // Mark as saved since we're explicitly saving
  autoSave.markAsSaved()
  handleClose()
}
const handleClose = async () => {
  // Flush any pending auto-save before closing
  // This ensures changes are saved even if the user closes before debounce completes
  if (selectedSkin.value && customization.value.paintindex !== null) {
    await autoSave.flushPending()
  }

  // Emit the update event to close the modal
  emit('update:visible', false)

  // We'll also reset the state immediately to ensure it's clean
  setTimeout(() => {
    resetAllState()
  }, 300) // Small delay to ensure modal is closed first
}

watch(
  () => customization.value.paintwear,
  (newWear) => {
    if (typeof newWear === 'number' && !isNaN(newWear)) {
      customization.value.paintwear = Number(newWear.toFixed(3))
    }
  },
  { immediate: true }
)

// Function to completely reset all state
const resetAllState = () => {
  // Reset customization to default values
  customization.value = {
    active: false,
    defindex: props.weapon?.weapon_defindex || 0,
    stattrak_enabled: false,
    stattrak_count: 0,
    paintindex: 0,
    paintIndexOverride: false,
    paintseed: 0,
    paintwear: 0,
    nametag: '',
    stickers: [null, null, null, null, null],
    keychain: null,
    team: 1,
  }

  // Reset base modal state via composable
  clearState()

  // Reset weapon-specific state
  weaponState.value = {
    showStickerModal: false,
    showKeychainModal: false,
    showVisualCustomizer: false,
    inlineVisualCustomizerActive: false,
    currentStickerPosition: 0,
    showHistoryPanel: false,
  }

  // Reset selected skin
  selectedSkin.value = null

  // Reset state machine
  modalViewState.value = 'browse'
  editingStickerIndex.value = null
}

// Watch for changes to props.visible to properly reset state when modal is opened/closed
watch(
  () => props.visible,
  (isVisible) => {
    if (!isVisible) {
      // Reset all state when modal is closed
      setTimeout(() => {
        resetAllState()
      }, 300) // Small delay to ensure modal is closed first
    } else if (sortedSkins.value.length > 0) {
      // Check if current page is above available pages and adjust if needed
      const newTotalPages = Math.ceil(sortedSkins.value.length / PAGE_SIZE.value)
      if (state.value.currentPage > newTotalPages && newTotalPages > 0) {
        state.value.currentPage = newTotalPages
      }
    }
  },
  { immediate: true }
)

/**
 * Watch for changes to props.weapon to initialize state when a weapon is selected
 * Updated to use new WeaponConfiguration interface
 */
watch(
  () => props.weapon,
  () => {
    if (props.visible && props.weapon) {
      try {
        // Prevent auto-save during initialization
        isInitializing.value = true
        state.value.error = null

        // First reset all state to ensure no previous data persists
        resetAllState()
        autoSave.resetStatus()

        // Then fetch new data and initialize state
        const displayName = props.weapon.name.split(' | ')[0] || props.weapon.weapon_name
        fetchSkins(
          props.weapon.weapon_name,
          (err) => emit('error', err),
          props.weapon.defaultImage,
          displayName
        )
        selectedSkin.value = props.weapon

        const dbInfo = props.weapon.databaseInfo as IMappedDBWeapon
        if (dbInfo) {
          customization.value = {
            active: dbInfo.active || false,
            team: dbInfo.team || 1,
            defindex: props.weapon.weapon_defindex,
            paintindex: dbInfo.paintindex || 0,
            paintIndexOverride: false,
            paintseed: dbInfo.paintseed || 0,
            paintwear: dbInfo.paintwear || 0,
            stattrak_enabled: dbInfo.stattrak_enabled || false,
            stattrak_count: dbInfo.stattrak_count || 0,
            nametag: dbInfo.nametag || '',
            stickers: Array.isArray(dbInfo.stickers)
              ? [...dbInfo.stickers]
              : [null, null, null, null, null],
            keychain: dbInfo.keychain ? { ...dbInfo.keychain } : null,
          }
        } else {
          customization.value = {
            ...defaultCustomization,
            team: props.weapon.availableTeams === 'terrorists' ? 1 : 2,
            defindex: props.weapon.weapon_defindex,
          }
        }

        // Allow auto-save after initialization completes
        nextTick(() => {
          isInitializing.value = false
        })
      } catch (error: unknown) {
        isInitializing.value = false
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to initialize weapon data'
        state.value.error = errorMessage
        emit('error', errorMessage)
        console.error('Error initializing weapon:', error)
      }
    }
  }
)

// Cleanup video manager on unmount
onUnmounted(() => {
  if (previewVideoManager.value) {
    previewVideoManager.value.destroy()
  }
})
</script>

<template>
  <NModal
    :show="visible"
    style="max-width: 1800px; width: 95vw"
    preset="card"
    :bordered="false"
    size="huge"
    :auto-focus="false"
    header-extra-style="flex-shrink: 0"
    class="duration-500 ease-in-out transition-all"
    @update:show="handleClose"
  >
    <template #header>
      <div class="flex items-center gap-3">
        <span class="leading-none">{{ modalTitle }}</span>
        <span
          v-if="teamLabel"
          class="inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold"
          :class="teamBadgeClasses"
        >
          {{ teamLabel }}
        </span>
        <!-- Auto-save status indicator (fixed position like NaiveUI messages) -->
        <SaveStatusIndicator
          data-tutorial="auto-save"
          :status="autoSave.status.value"
          :show-retry="autoSave.status.value === 'error'"
          fixed
          @retry="autoSave.retry"
        />
      </div>
    </template>
    <template #header-extra>
      <div v-if="!isCanvasMode" class="flex items-center shrink-0">
        <!-- Reset Weapon Configuration -->
        <SButton
          :loading="state.isResetting"
          variant="elevated"
          rounded="full"
          :color="buttonColor.error"
          :disabled="!selectedSkin || customization.paintindex == 0"
          :aria-label="String(t('modals.weaponSkin.buttons.reset'))"
          class="whitespace-nowrap px-5 py-1.5 !overflow-visible"
          tinted
          data-tutorial="reset-button"
          @click="state.showResetConfirm = true"
        >
          <template #icon-left>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              class="icon icon-tabler icons-tabler-outline icon-tabler-refresh"
            >
              <path stroke="none" d="M0 0h24v24H0z" fill="none" />
              <path d="M20 11a8.1 8.1 0 0 0 -15.5 -2m-.5 -4v4h4" />
              <path d="M4 13a8.1 8.1 0 0 0 15.5 2m.5 4v-4h-4" />
            </svg>
          </template>
          {{ t('modals.weaponSkin.buttons.reset') }}
        </SButton>
        <NDivider vertical />

        <!-- History Button -->
        <SButton
          variant="elevated"
          rounded="full"
          :disabled="!selectedSkin"
          :aria-label="String(t('history.title'))"
          class="whitespace-nowrap px-5 py-1.5 !overflow-visible"
          data-tutorial="history-button"
          @click="weaponState.showHistoryPanel = true"
        >
          <template #icon-left>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path stroke="none" d="M0 0h24v24H0z" fill="none" />
              <path d="M12 8l0 4l2 2" />
              <path d="M3.05 11a9 9 0 1 1 .5 4m-.5 5v-5h5" />
            </svg>
          </template>
          {{ t('history.title') }}
        </SButton>
        <NDivider vertical />

        <!-- Import Weapon by Inspect Link -->
        <SButton
          :loading="state.isImporting"
          variant="elevated"
          rounded="full"
          :disabled="!selectedSkin"
          :aria-label="String(t('modals.weaponSkin.buttons.importFromLink'))"
          class="whitespace-nowrap px-5 py-1.5 !overflow-visible"
          data-tutorial="import-button"
          @click="state.showImportModal = true"
        >
          <template #icon-left>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              class="icon icon-tabler icons-tabler-outline icon-tabler-zoom-scan"
            >
              <path stroke="none" d="M0 0h24v24H0z" fill="none" />
              <path d="M4 8v-2a2 2 0 0 1 2 -2h2" />
              <path d="M4 16v2a2 2 0 0 0 2 2h2" />
              <path d="M16 4h2a2 2 0 0 1 2 2v2" />
              <path d="M16 20h2a2 2 0 0 0 2 -2v-2" />
              <path d="M8 11a3 3 0 1 0 6 0a3 3 0 0 0 -6 0" />
              <path d="M16 16l-2.5 -2.5" />
            </svg>
          </template>
          {{ t('modals.weaponSkin.buttons.importFromLink') }}
        </SButton>
        <NDivider vertical />

        <!-- Generate Weapon Inspect Link by Data -->
        <SButton
          :loading="state.isLoadingInspect"
          variant="elevated"
          rounded="full"
          :disabled="!selectedSkin || customization.paintindex === 0"
          :aria-label="String(t('modals.weaponSkin.buttons.generateLink'))"
          class="whitespace-nowrap px-5 py-1.5 !overflow-visible"
          data-tutorial="save-button"
          @click="handleCreateInspectLink"
        >
          <template #icon-left>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              class="icon icon-tabler icons-tabler-outline icon-tabler-zoom-scan"
            >
              <path stroke="none" d="M0 0h24v24H0z" fill="none" />
              <path d="M4 8v-2a2 2 0 0 1 2 -2h2" />
              <path d="M4 16v2a2 2 0 0 0 2 2h2" />
              <path d="M16 4h2a2 2 0 0 1 2 2v2" />
              <path d="M16 20h2a2 2 0 0 0 2 -2v-2" />
              <path d="M8 11a3 3 0 1 0 6 0a3 3 0 0 0 -6 0" />
              <path d="M16 16l-2.5 -2.5" />
            </svg>
          </template>
          {{ t('modals.weaponSkin.buttons.generateLink') }}
        </SButton>
        <NDivider vertical />

        <!-- Weapon Search -->
        <NInput
          v-model:value="state.searchQuery"
          :placeholder="String(t('modals.weaponSkin.inputs.searchPlaceholder'))"
          class="pl-1 max-w-72"
          data-tutorial="skin-search"
        />
      </div>
      <div v-else class="flex items-center shrink-0">
        <!-- Exit Visual Mode Button -->
        <SButton
          variant="light"
          :color="buttonColor.error"
          @click="handleExitInlineVisualCustomizer"
        >
          <template #icon-left>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              class="icon icon-tabler icons-tabler-outline icon-tabler-x"
            >
              <path stroke="none" d="M0 0h24v24H0z" fill="none" />
              <path d="M18 6l-12 12" />
              <path d="M6 6l12 12" />
            </svg>
          </template>
          {{ t('modals.weaponSkin.visualCustomizer.exit') }}
        </SButton>
      </div>
    </template>

    <div ref="modalContentRef" @keydown="handleModalKeydown">
      <NSpace vertical size="large" class="-mt-2">
        <div>
            <!-- Selected Skin Preview -->
            <div v-if="selectedSkin" class="rounded-lg overflow-hidden">
              <Transition name="canvas-morph" mode="out-in">
                <!-- Canvas Mode: InlineVisualCustomizer -->
                <div v-if="isCanvasMode" key="canvas">
                  <LazyInlineVisualCustomizer
                    :visible="true"
                    :weapon-skin="{
                      name: selectedSkin?.name || '',
                      image: selectedSkin?.image || '',
                      defindex: selectedSkin?.weapon_defindex || 0,
                      paintindex: customization.paintindex ?? undefined,
                    }"
                    :stickers="customization.stickers"
                    :keychain="customization.keychain"
                    :weapon-wear="customization.paintwear"
                    :min-wear="selectedSkin?.minFloat || 0"
                    :max-wear="selectedSkin?.maxFloat || 1"
                    @save="handleInlineSave"
                    @update-wear="(val) => (customization.paintwear = val)"
                    @update-stickers="(stickers) => (customization.stickers = stickers)"
                    @update-keychain="(keychain) => (customization.keychain = keychain)"
                    @open-sticker-modal="handleInlineOpenStickerModal"
                  />
                </div>

                <!-- Browse Mode: Weapon preview + floating panels -->
                <div v-else key="browse" class="relative" style="min-height: 440px;" @click="handlePreviewAreaClick">
                <!-- Weapon Preview (right padding reserves space for settings panel) -->
                <div class="pr-[240px]">
                  <video ref="previewVideo" crossorigin="anonymous" playsinline style="display: none" />
                  <canvas v-show="isPreviewVideoMode && !isPreviewVideoLoading" ref="previewCanvas" class="w-full h-96" />
                  <img v-show="!isPreviewVideoMode || isPreviewVideoLoading" :src="previewImageUrl" :alt="selectedSkin?.name" class="w-full h-96 object-contain" />
                </div>

                <!-- Magic Wand Button -->
                <button class="visual-customizer-overlay" :class="{ disabled: !selectedSkin }" :disabled="!selectedSkin"
                  :title="(t('modals.weaponSkin.visualCustomizer.button') as string) || 'Visual Customizer'"
                  :aria-label="(t('modals.weaponSkin.visualCustomizer.button') as string) || 'Visual Customizer'"
                  @click.stop="enterCanvas()">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="magic-wand-icon">
                    <path d="M6 21l15 -15l-3 -3l-15 15l3 3" /><path d="M15 6l3 3" />
                    <path d="M9 3a2 2 0 0 0 2 2a2 2 0 0 0 -2 2a2 2 0 0 0 -2 -2a2 2 0 0 0 2 -2" />
                    <path d="M19 13a2 2 0 0 0 2 2a2 2 0 0 0 -2 2a2 2 0 0 0 -2 -2a2 2 0 0 0 2 -2" />
                  </svg>
                </button>

                <!-- Skin Name Overlay -->
                <div class="absolute bottom-14 left-3 text-lg font-bold text-white drop-shadow-lg">{{ selectedSkin?.name }}</div>

                <!-- FLOATING SETTINGS PANEL (top-right) -->
                <div class="floating-panel floating-panel--settings" style="top: 12px; right: 12px; width: 220px; padding: 12px;">
                  <div class="flex items-center justify-between mb-1.5">
                    <span class="text-xs text-gray-400">{{ t('modals.weaponSkin.labels.stattrak') }}</span>
                    <NSwitch v-model:value="customization.stattrak_enabled" size="small" />
                  </div>
                  <NInputNumber v-if="customization.stattrak_enabled" v-model:value="customization.stattrak_count" :min="0" :max="99999" size="tiny" class="w-full mb-1.5" :input-props="digitOnlyInputProps" />
                  <WearSlider v-model="customization.paintwear" :max="selectedSkin?.maxFloat ?? 1" :min="selectedSkin?.minFloat ?? 0" />
                  <div class="flex items-center justify-between mt-1.5 mb-1">
                    <span class="text-xs text-gray-400">{{ t('modals.weaponSkin.labels.paintIndex') }}</span>
                    <NSwitch v-model:value="customization.paintIndexOverride" size="small" />
                  </div>
                  <NInputNumber v-model:value="customization.paintindex" :min="0" :max="9999" size="tiny" :disabled="!customization.paintIndexOverride" :input-props="digitOnlyInputProps" class="w-full mb-1.5" />
                  <div class="flex items-center justify-between mb-1">
                    <span class="text-xs text-gray-400">{{ t('modals.weaponSkin.labels.pattern') }}</span>
                  </div>
                  <NInputNumber v-model:value="customization.paintseed" :min="0" :max="1000" size="tiny" :input-props="digitOnlyInputProps" class="w-full mb-1.5" />
                  <NInput v-model:value="customization.nametag" :placeholder="t('modals.weaponSkin.inputs.nameTagPlaceholder') as string" size="tiny" maxlength="20" show-count class="mb-1.5" />
                  <div class="flex items-center gap-2 mb-2">
                    <NSwitch v-model:value="customization.active" size="small">
                      <template #checked>{{ t('modals.weaponSkin.labels.itemActive') }}</template>
                      <template #unchecked>{{ t('modals.weaponSkin.labels.itemInactive') }}</template>
                    </NSwitch>
                  </div>
                  <button v-if="selectedSkin?.availableTeams === 'both'" class="w-full text-center text-xs py-1.5 px-2 rounded bg-[#1a1a1a] border border-[#2a2a2a] text-gray-400 hover:text-gray-200 hover:border-[#444] transition-colors" :disabled="!selectedSkin" @click="state.showDuplicateConfirm = true">
                    {{ t('modals.weaponSkin.buttons.duplicate') }} →
                  </button>
                </div>

                <!-- FLOATING STICKER + KEYCHAIN BAR (bottom-left) -->
                <div class="floating-panel floating-panel--sticker-bar" style="bottom: 12px; left: 12px; padding: 6px 8px;">
                  <div class="flex items-center gap-1">
                    <div v-for="(sticker, index) in customization.stickers" :key="'slot-' + index"
                      class="compact-sticker-slot" :class="{ 'compact-sticker-slot--empty': !sticker, 'compact-sticker-slot--filled': sticker, 'compact-sticker-slot--active': editingStickerIndex === index && isStickerEditMode }"
                      :title="sticker?.api?.name || `Sticker #${index + 1}`"
                      draggable="true" @dragstart="handleStickerDragStart($event, index)" @dragend="handleStickerDragEnd" @dragover="handleStickerDragOver" @dragleave="handleStickerDragLeave" @drop="handleStickerDrop($event, index)" @click.stop="enterStickerEdit(index)">
                      <img v-if="sticker" :src="generateStickerImageUrl(sticker.id, sticker.wear || 0)" :alt="sticker.api?.name ?? ''" class="w-full h-full object-contain" @error="(e) => ((e.target as HTMLImageElement).src = sticker?.api?.image || '')" />
                      <span v-else class="text-[8px] text-gray-500">+</span>
                    </div>
                    <div class="w-px h-5 bg-[#333] mx-1" />
                    <div class="compact-sticker-slot" :class="{ 'compact-sticker-slot--empty': !customization.keychain, 'compact-sticker-slot--filled': customization.keychain }" :title="customization.keychain?.api?.name || 'Keychain'" @click="handleAddKeychain">
                      <img v-if="customization.keychain" :src="generateFlatKeychainUrl(customization.keychain.api?.name ?? '', customization.keychain.seed, undefined, customization.keychain.wrapped_sticker_id || undefined)" :alt="customization.keychain.api?.name ?? ''" class="w-full h-full object-contain" />
                      <span v-else class="text-[8px] text-gray-500">+</span>
                    </div>

                    <!-- EXPANDED STICKER EDIT (State 2) -->
                    <Transition name="sticker-bar-expand">
                      <div v-if="isStickerEditMode && editingStickerIndex !== null" class="flex items-center gap-2 ml-2 pl-2 border-l border-[#333]">
                        <div class="w-8 h-8 rounded bg-[#1a1a1a] border border-[#2a2a2a] flex items-center justify-center overflow-hidden flex-shrink-0">
                          <img v-if="customization.stickers[editingStickerIndex]" :src="generateStickerImageUrl(customization.stickers[editingStickerIndex]!.id, customization.stickers[editingStickerIndex]!.wear || 0)" class="w-full h-full object-contain" />
                        </div>
                        <div class="flex-1 min-w-0">
                          <div class="text-xs text-gray-200 font-semibold truncate max-w-[160px]">{{ customization.stickers[editingStickerIndex]?.api?.name ?? '' }}</div>
                          <div class="flex gap-3 text-[10px] text-gray-500 mt-0.5">
                            <span>Wear: <span class="text-gray-300">{{ (customization.stickers[editingStickerIndex]?.wear ?? 0).toFixed(2) }}</span></span>
                            <span>Scale: <span class="text-gray-300">{{ (customization.stickers[editingStickerIndex]?.scale ?? 1).toFixed(1) }}</span></span>
                            <span>Rot: <span class="text-gray-300">{{ (customization.stickers[editingStickerIndex]?.rotation ?? 0) }}°</span></span>
                          </div>
                        </div>
                        <div class="flex gap-1 flex-shrink-0">
                          <button class="text-[10px] px-2 py-0.5 rounded bg-[#222] border border-[#333] text-gray-400 hover:text-gray-200 transition-colors" @click.stop="enterCanvas(editingStickerIndex!)" title="Open Visual Customizer">✨</button>
                          <button class="text-[10px] px-2 py-0.5 rounded bg-[#222] border border-[#333] text-gray-400 hover:text-gray-200 transition-colors" @click.stop="handleAddSticker(editingStickerIndex!)">Change</button>
                          <button class="text-[10px] px-2 py-0.5 rounded bg-[#222] border border-[#3a1a1a] text-red-400 hover:text-red-300 transition-colors" @click.stop="removeSticker(editingStickerIndex!); exitStickerEdit()">Remove</button>
                          <button class="text-[10px] px-1 py-0.5 text-gray-500 hover:text-gray-300 transition-colors" @click.stop="exitStickerEdit()">✕</button>
                        </div>
                      </div>
                    </Transition>
                  </div>
                </div>
              </div>
              </Transition>
            </div>

            <!-- Skin list controls (Phase 2) -->
            <div
              class="flex flex-wrap items-center justify-between gap-3 my-3"
              data-tutorial="sort-filter"
            >
              <div class="flex items-center gap-2">
                <span class="text-sm text-gray-300">{{ t('modals.weaponSkin.sort.label') }}</span>
                <NSelect
                  v-model:value="sortBy"
                  size="small"
                  class="w-44"
                  :options="skinSortOptions"
                />
                <SButton
                  size="xs"
                  icon-only
                  variant="light"
                  :aria-label="`Sort ${sortDir === 'asc' ? 'ascending' : 'descending'}`"
                  @click="toggleSortDir"
                >
                  {{ sortDir === 'asc' ? '↑' : '↓' }}
                </SButton>
              </div>

              <div v-if="availableRarities.length > 0" class="flex flex-wrap items-center gap-2">
                <span class="text-sm text-gray-300">{{
                  t('modals.weaponSkin.filters.rarity')
                }}</span>
                <SButton
                  v-for="rarity in availableRarities"
                  :key="rarity.id"
                  size="xs"
                  variant="light"
                  :color="
                    rarityFilterIds.includes(rarity.id) ? buttonColor.primary : buttonColor.default
                  "
                  :style="
                    rarityFilterIds.includes(rarity.id) ? { borderColor: rarity.color } : undefined
                  "
                  :aria-label="`Filter by ${rarity.name} rarity`"
                  :aria-pressed="rarityFilterIds.includes(rarity.id)"
                  @click="toggleRarityFilter(rarity.id)"
                >
                  <span class="flex items-center gap-2">
                    <span class="h-2 w-2 rounded-full" :style="{ background: rarity.color }" />
                    {{ rarity.name }}
                  </span>
                </SButton>
              </div>
            </div>

            <!-- Skins Grid (infinite scroll) -->
            <div v-if="!isCanvasMode">
              <!-- Loading skeleton (initial load only) -->
              <div v-if="state.isLoadingSkins" class="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                <div
                  v-for="i in PAGE_SIZE"
                  :key="i"
                  class="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-dark)] p-3"
                >
                  <NSkeleton height="96px" />
                  <div class="mt-2">
                    <NSkeleton text :repeat="1" />
                    <div class="mt-1"><NSkeleton height="3px" /></div>
                  </div>
                </div>
              </div>

              <!-- Skin cards grid -->
              <div
                v-else
                class="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3"
                data-tutorial="skin-grid"
              >
                <NCard
                  v-for="skin in displayedSkins"
                  :key="skin.id"
                  :style="{
                    borderColor: skin.rarity?.color || '#313030',
                    background: 'linear-gradient(135deg, #101010, ' + (hexToRgba(skin.rarity?.color, '0.15') || '#313030') + ')',
                  }"
                  :class="[
                    'hover:shadow-lg cursor-pointer transition-all rounded-xl',
                    customization.paintindex === Number(skin.paint_index)
                      ? 'ring-2 ring-[var(--selection-ring)] border-0 opacity-85'
                      : '',
                  ]"
                  @click="handleSkinSelect(skin)"
                >
                  <div class="flex flex-col items-center">
                    <img :src="skin.image" :alt="skin.name" class="w-full h-24 object-contain mb-1.5" loading="lazy" />
                    <div class="w-full">
                      <p class="text-xs text-white truncate">{{ skin.name }}</p>
                      <div class="h-0.5 mt-1.5 rounded-full" :style="{ background: skin.rarity?.color || '#313030' }" />
                    </div>
                  </div>
                </NCard>
              </div>

              <!-- Loading more indicator -->
              <div v-if="state.isLoadingMore" class="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 mt-3">
                <div
                  v-for="i in 6"
                  :key="'skel-' + i"
                  class="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-dark)] p-3 animate-pulse"
                >
                  <div class="h-24 bg-[var(--bg-secondary)] rounded" />
                  <div class="mt-2 h-3 bg-[var(--bg-secondary)] rounded w-3/4" />
                </div>
              </div>

              <!-- Infinite scroll sentinel -->
              <div ref="sentinelRef" class="h-1" />

              <!-- No Results -->
              <div
                v-if="!state.isLoadingSkins && sortedSkins.length === 0"
                class="flex justify-center items-center h-48"
              >
                <NEmpty :description="String(t('modals.weaponSkin.noSearchResults'))" />
              </div>
            </div>
          </div>
        </NSpace>

      <!-- Sticker Modal -->
      <LazyStickerModal
        v-model:visible="weaponState.showStickerModal"
        :position="weaponState.currentStickerPosition"
        :current-sticker="customization.stickers[weaponState.currentStickerPosition]"
        :weapon-name="selectedSkin?.name || weapon?.defaultName"
        :team="customization.team"
        @select="handleStickerSelect"
      />

      <!-- Keychain Modal -->
      <KeychainModal
        v-model:visible="weaponState.showKeychainModal"
        :current-keychain="customization.keychain"
        :weapon-name="selectedSkin?.name || weapon?.defaultName"
        :team="customization.team"
        @select="handleKeychainSelect"
      />

      <!-- Import via InspectURL Modal -->
      <InspectURLModal
        v-model:visible="state.showImportModal"
        :loading="state.isImporting"
        @submit="handleImportInspectLink"
      />

      <!-- Duplicate Modal -->
      <DuplicateItemModal
        v-model:visible="state.showDuplicateConfirm"
        :loading="state.isDuplicating"
        :other-team-has-skin="otherTeamHasSkin"
        :item-type="String(t('modals.duplicateItem.type.weapon'))"
        @confirm="handleDuplicate"
      />

      <ResetModal
        v-model:visible="state.showResetConfirm"
        :loading="state.isResetting"
        @confirm="handleReset"
      />

      <!-- Item History Panel -->
      <LazyItemHistoryPanel
        v-model:visible="weaponState.showHistoryPanel"
        item-type="weapon"
        :category="props.weapon?.category as any"
        :defindex="props.weapon?.weapon_defindex || 0"
        :team="customization.team"
        :steam-id="user?.steamId || ''"
        :loadout-id="loadoutStore.selectedLoadoutId || 0"
        @restore="handleHistoryRestore"
      />
    </div>
  </NModal>
</template>
<style scoped lang="scss">
@reference "tailwindcss";

.active-item {
  @apply border-2 border-solid border-[var(--selection-ring)];
}

.inactive-item {
  @apply border-2 border-dashed border-gray-600;
}

.sticker-slot {
  touch-action: none;
  transition: all 0.15s ease-in-out;

  &.dragging {
    opacity: 0.5;
    transform: scale(0.95);
  }

  &.drag-over {
    background-color: #2a2a2a;
    transform: scale(1.05);
  }

  &:empty {
    cursor: default;
  }

  &:not(:empty) {
    cursor: grab;

    &:active {
      cursor: grabbing;
    }
  }
}

/* Visual Customizer Overlay Button */
.visual-customizer-overlay {
  position: absolute;
  top: 8px;
  left: 8px;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.15);
  backdrop-filter: blur(4px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  cursor: pointer;
  transition:
    border-color 0.5s ease-in-out,
    transform 0.5s ease-in-out,
    box-shadow 0.5s ease-in-out;
  z-index: 10;
  overflow: hidden;
}

.visual-customizer-overlay:focus-visible {
  outline: none;
  box-shadow: 0 0 0 2px var(--selection-ring);
}

.visual-customizer-overlay::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, var(--selection-ring), #f59e0b);
  opacity: 0;
  transition: opacity 0.5s ease-in-out;
  z-index: -1;
}

.visual-customizer-overlay:hover:not(.disabled) {
  border-color: transparent;
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(250, 204, 21, 0.3);
}

.visual-customizer-overlay:hover:not(.disabled)::before {
  opacity: 1;
}

.visual-customizer-overlay:active:not(.disabled) {
  transform: scale(0.95);
}

.visual-customizer-overlay.disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.visual-customizer-overlay .magic-wand-icon {
  color: rgba(255, 255, 255, 0.8);
  transition: color 0.5s ease-in-out;
}

.visual-customizer-overlay:hover:not(.disabled) .magic-wand-icon {
  color: #ffffff;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Frosted-glass floating panel base */
.floating-panel {
  position: absolute;
  background: rgba(18, 18, 18, 0.92);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.07);
  border-radius: 8px;
  box-shadow: 0 6px 24px rgba(0, 0, 0, 0.5);
  z-index: 10;
}

.floating-panel--settings { z-index: 30; }
.floating-panel--sticker-bar { z-index: 20; }
.floating-panel--detail { z-index: 40; }
.floating-panel--toolbar { z-index: 15; }
.floating-panel--wear { z-index: 10; }

/* Compact sticker slot (28×28px) */
.compact-sticker-slot {
  width: 28px;
  height: 28px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.15s ease-in-out;
  flex-shrink: 0;
  overflow: hidden;
}

.compact-sticker-slot--empty {
  border: 1px dashed #444;
  background: rgba(24, 24, 24, 0.6);
}

.compact-sticker-slot--filled {
  border: 1px solid var(--selection-ring);
  background: rgba(26, 26, 10, 0.6);
}

.compact-sticker-slot--active {
  border-color: #22d3ee;
  background: rgba(10, 26, 26, 0.6);
  box-shadow: 0 0 8px rgba(34, 211, 238, 0.3);
}

/* Sticker bar expand animation */
.sticker-bar-expand-enter-active {
  transition: all 250ms ease-out;
}
.sticker-bar-expand-leave-active {
  transition: all 200ms ease-in;
}
.sticker-bar-expand-enter-from,
.sticker-bar-expand-leave-to {
  opacity: 0;
  max-width: 0;
}

/* Canvas morph transition */
.canvas-morph-enter-active {
  transition: all 400ms ease-out;
}
.canvas-morph-leave-active {
  transition: all 350ms ease-in;
}
.canvas-morph-enter-from { opacity: 0; }
.canvas-morph-leave-to { opacity: 0; transform: translateY(20px); }

/* Skin grid card entrance animation */
.skin-card-enter-active {
  transition: opacity 200ms ease-out, transform 200ms ease-out;
}
.skin-card-enter-from {
  opacity: 0;
  transform: translateY(12px);
}
</style>
