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
import { steamAuth } from '~/services/steamAuth'
import { useLoadoutStore } from '~/stores/loadoutStore'
import { useAutoSave } from '~/composables/useAutoSave'
import { generateFlatKeychainUrl, generateDefaultFlatImageUrl } from '~/utils/canvasCoordinates'
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
  paginatedSkins,
  totalPages,
  fetchSkins,
  clearState,
  toggleSortDir,
  toggleRarityFilter,
} = useItemModal({
  itemType: 'weapon',
  pageSize: props.pageSize || 10,
  enableSortFilter: true,
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
  user: computed(() => steamAuth.getSavedUser()),
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
  weaponState.value.inlineVisualCustomizerActive = false
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

  // 1-5 → Open sticker slot
  if (/^[1-5]$/.test(e.key)) {
    e.preventDefault()
    handleAddSticker(Number(e.key) - 1)
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
      <div v-if="!weaponState.inlineVisualCustomizerActive" class="flex items-center shrink-0">
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
          :color="buttonColor.warning"
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

    <div @keydown="handleModalKeydown">
      <NSpace vertical size="large" class="-mt-2">
        <Transition name="fade" mode="out-in">
          <div v-if="weaponState.inlineVisualCustomizerActive" key="inline">
            <!-- Visual Customizer Inline Mode -->
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
          <div v-else key="normal">
            <!-- Selected Skin Preview -->
            <div v-if="selectedSkin" class="bg-[var(--bg-secondary)] p-6 rounded-lg bg-opacity-50">
              <div class="grid grid-cols-2 gap-6">
                <!-- Left side - Video/Image Preview -->
                <div>
                  <div class="relative">
                    <!-- Hidden video element for frame extraction -->
                    <video
                      ref="previewVideo"
                      crossorigin="anonymous"
                      playsinline
                      style="display: none"
                    />

                    <!-- Canvas for video rendering (shown when video available) -->
                    <canvas
                      v-show="isPreviewVideoMode && !isPreviewVideoLoading"
                      ref="previewCanvas"
                      class="w-full h-64"
                    />

                    <!-- Static image fallback (shown when no video or loading) -->
                    <img
                      v-show="!isPreviewVideoMode || isPreviewVideoLoading"
                      :src="previewImageUrl"
                      :alt="selectedSkin?.name"
                      class="w-full h-64 object-contain"
                    />
                    <!-- Visual Customizer Overlay Button -->
                    <button
                      class="visual-customizer-overlay"
                      :class="{ disabled: !selectedSkin }"
                      :disabled="!selectedSkin"
                      :title="
                        (t('modals.weaponSkin.visualCustomizer.button') as string) ||
                        'Visual Customizer'
                      "
                      :aria-label="
                        (t('modals.weaponSkin.visualCustomizer.button') as string) ||
                        'Visual Customizer'
                      "
                      @click.stop="weaponState.inlineVisualCustomizerActive = true"
                    >
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
                        class="magic-wand-icon"
                      >
                        <!-- Magic Wand Icon (Tabler: wand) -->
                        <path d="M6 21l15 -15l-3 -3l-15 15l3 3" />
                        <path d="M15 6l3 3" />
                        <path
                          d="M9 3a2 2 0 0 0 2 2a2 2 0 0 0 -2 2a2 2 0 0 0 -2 -2a2 2 0 0 0 2 -2"
                        />
                        <path
                          d="M19 13a2 2 0 0 0 2 2a2 2 0 0 0 -2 2a2 2 0 0 0 -2 -2a2 2 0 0 0 2 -2"
                        />
                      </svg>
                    </button>
                    <!-- Skin Name Overlay -->
                    <h3 class="absolute bottom-0 left-0 right-0 text-lg font-bold px-2 py-1">
                      {{ selectedSkin?.name }}
                    </h3>
                  </div>
                </div>

                <!-- Right side - Customization -->
                <div class="space-y-4 flex flex-col items-center">
                  <!-- StatTrak and Name Tag -->
                  <div class="grid grid-cols-2 gap-4 w-full">
                    <div class="flex items-center space-x-4">
                      <NSwitch v-model:value="customization.stattrak_enabled" />
                      <span>{{ t('modals.weaponSkin.labels.stattrak') }}</span>
                      <NInputNumber
                        v-model:value="customization.stattrak_count"
                        :disabled="!customization.stattrak_enabled"
                        :min="0"
                        :max="99999"
                        class="w-28"
                        :input-props="digitOnlyInputProps"
                      />
                    </div>
                    <NInput
                      v-model:value="customization.nametag"
                      :placeholder="t('modals.weaponSkin.inputs.nameTagPlaceholder') as string"
                      class="pl-1"
                      maxlength="20"
                      show-count
                    />
                  </div>

                  <!-- Wear Slider -->
                  <div class="w-full" data-tutorial="wear-slider">
                    <div class="flex items-start justify-between">
                      <h4 class="font-bold">
                        {{ t('modals.weaponSkin.labels.wear') }}
                      </h4>
                    </div>
                    <WearSlider
                      v-model="customization.paintwear"
                      :max="selectedSkin?.maxFloat ?? 1"
                      :min="selectedSkin?.minFloat ?? 0"
                    />
                  </div>

                  <!-- Paint Settings & Active Toggle -->
                  <div class="flex flex-wrap items-end gap-4 w-full">
                    <div class="flex flex-col gap-1" data-tutorial="paint-index-override">
                      <div class="flex items-center gap-2">
                        <span class="text-sm font-medium">{{
                          t('modals.weaponSkin.labels.paintIndex')
                        }}</span>
                        <NSwitch v-model:value="customization.paintIndexOverride" size="small" />
                      </div>
                      <NInputNumber
                        v-model:value="customization.paintindex"
                        :min="0"
                        :max="9999"
                        :disabled="!customization.paintIndexOverride"
                        :input-props="digitOnlyInputProps"
                        class="w-28"
                      />
                    </div>

                    <div class="flex flex-col gap-1">
                      <span class="text-sm font-medium">{{
                        t('modals.weaponSkin.labels.pattern')
                      }}</span>
                      <NInputNumber
                        v-model:value="customization.paintseed"
                        :min="0"
                        :max="1000"
                        :input-props="digitOnlyInputProps"
                        class="w-28"
                      />
                    </div>

                    <!-- Active/Inactive Toggle & Duplicate -->
                    <div class="flex items-center gap-4 flex-1" data-tutorial="active-switch">
                      <NSwitch v-model:value="customization.active" size="medium">
                        <template #checked>
                          {{ t('modals.weaponSkin.labels.itemActive') }}
                        </template>
                        <template #unchecked>
                          {{ t('modals.weaponSkin.labels.itemInactive') }}
                        </template>
                      </NSwitch>

                      <!-- Duplicate Weapon -->
                      <SButton
                        v-if="selectedSkin?.availableTeams === 'both'"
                        :disabled="!selectedSkin"
                        variant="light"
                        size="sm"
                        @click="state.showDuplicateConfirm = true"
                      >
                        {{ t('modals.weaponSkin.buttons.duplicate') }}
                      </SButton>
                    </div>
                  </div>

                  <!-- Stickers & Keychain Toggle and Duplicate Weapon Buttons -->
                  <!--<div class="flex flex-row w-max items-center justify-center gap-4">
              <SButton
                  text
                  class="text-gray-400 hover:text-gray-200"
                  @click="state.showDetails = !state.showDetails"
                  icon-placement="right"
              >
                <template #icon-left>
                  <ChevronUpIcon v-if="state.showDetails" :size="16" />
                  <ChevronDownIcon v-else :size="16" />
                </template>
                {{ state.showDetails ? 'Hide' : 'Show' }} Stickers & Keychain
              </SButton>
            </div>-->
                </div>
              </div>

              <!-- Sticker and Keychain customization-->
              <div
                class="grid grid-cols-6 gap-4 auto-rows-fr"
                data-tutorial="sticker-section"
                :class="{ 'h-[0px]': apiState.showDetails }"
              >
                <!-- Stickers -->
                <div
                  class="col-span-5 lg:col-span-5 md:col-span-3 mt-4"
                  data-tutorial="sticker-slots"
                >
                  <h4 class="font-bold mb-1">
                    {{ t('modals.weaponSkin.stickers.title') }}
                  </h4>
                  <div
                    class="grid grid-cols-5 lg:grid-cols-5 md:grid-cols-3 sm:grid-cols-2 gap-x-1.5 min-h-32 max-h-32"
                  >
                    <div
                      v-for="(sticker, index) in customization.stickers"
                      :key="index"
                      class="sticker-slot group flex items-center justify-center bg-[var(--card-bg)] p-2 rounded cursor-move transition-all relative hover:bg-[var(--bg-hover)] hover:shadow-md active:scale-[0.98]"
                      :class="{
                        'inactive-item': !sticker,
                        'active-item': sticker,
                      }"
                      draggable="true"
                      @dragstart="handleStickerDragStart($event, index)"
                      @dragend="handleStickerDragEnd"
                      @dragover="handleStickerDragOver"
                      @dragleave="handleStickerDragLeave"
                      @drop="handleStickerDrop($event, index)"
                      @click.stop="handleAddSticker(index)"
                    >
                      <button
                        v-if="sticker"
                        type="button"
                        class="absolute top-1 right-1 z-20 rounded-md border border-white/10 bg-black/40 p-1 text-gray-200 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-red-500/20 hover:text-red-200 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-red-400"
                        :title="t('modals.weaponSkin.stickers.remove') as string"
                        :aria-label="`${t('modals.weaponSkin.stickers.remove')} #${index + 1}`"
                        draggable="false"
                        @mousedown.stop.prevent
                        @click.stop.prevent="removeSticker(index)"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          stroke-width="2"
                          stroke-linecap="round"
                          stroke-linejoin="round"
                        >
                          <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                          <path d="M18 6l-12 12" />
                          <path d="M6 6l12 12" />
                        </svg>
                      </button>
                      <div v-if="sticker" class="h-24 relative group">
                        <img
                          :src="generateStickerImageUrl(sticker.id, sticker.wear || 0)"
                          :alt="sticker.api?.name ?? ''"
                          class="w-full h-full object-contain"
                          @error="
                            (e) => ((e.target as HTMLImageElement).src = sticker?.api?.image || '')
                          "
                        />
                        <div
                          class="absolute inset-0 bg-white rounded-lg bg-opacity-10 backdrop-blur-sm opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                        >
                          <span class="text-white text-xs">{{
                            t('modals.weaponSkin.stickers.reposition')
                          }}</span>
                        </div>
                      </div>
                      <div v-else class="h-24 flex items-center justify-center">
                        <span class="text-gray-400 text-sm">{{
                          t('modals.weaponSkin.stickers.add')
                        }}</span>
                      </div>
                      <div class="mt-1 absolute top-0 left-1 text-xs text-gray-400">
                        #{{ index + 1 }}
                      </div>
                    </div>
                  </div>
                </div>
                <!-- Keychain -->
                <div
                  class="col-span-1 lg:col-span-1 md:col-span-3 sm:col-span-2 mt-4"
                  data-tutorial="keychain-section"
                >
                  <h4 class="font-bold mb-1">
                    {{ t('modals.weaponSkin.keychain.title') }}
                  </h4>
                  <div
                    class="relative group items-center flex justify-center bg-[var(--card-bg)] p-2 rounded cursor-pointer hover:bg-[var(--bg-hover)] transition-all min-h-32 max-h-32"
                    :class="{
                      'inactive-item': !customization.keychain,
                      'active-item': customization.keychain,
                    }"
                    @click="handleAddKeychain"
                  >
                    <button
                      v-if="customization.keychain"
                      type="button"
                      class="absolute top-1 right-1 z-20 rounded-md border border-white/10 bg-black/40 p-1 text-gray-200 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-red-500/20 hover:text-red-200 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-red-400"
                      :title="String(t('modals.weaponSkin.keychain.remove'))"
                      :aria-label="String(t('modals.weaponSkin.keychain.remove'))"
                      draggable="false"
                      @mousedown.stop.prevent
                      @click.stop.prevent="removeKeychain"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      >
                        <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                        <path d="M18 6l-12 12" />
                        <path d="M6 6l12 12" />
                      </svg>
                    </button>
                    <div
                      v-if="customization.keychain"
                      class="relative group h-24 flex flex-col items-center justify-center w-full"
                    >
                      <img
                        :src="
                          generateFlatKeychainUrl(
                            customization.keychain.api?.name ?? '',
                            customization.keychain.seed,
                            undefined,
                            customization.keychain.wrapped_sticker_id || undefined
                          )
                        "
                        :alt="customization.keychain.api?.name ?? ''"
                        class="h-full w-full object-contain max-h-[85%]"
                      />
                      <p class="text-xs text-center text-gray-400 mt-1 truncate w-full px-1">
                        {{ (customization.keychain.api?.name ?? '').replace('Charm | ', '') }}
                      </p>
                    </div>
                    <div v-else class="h-24 flex items-center justify-center">
                      <span class="text-gray-400 text-sm">{{
                        t('modals.weaponSkin.keychain.add')
                      }}</span>
                    </div>
                  </div>
                </div>
              </div>
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

            <!-- Skins Grid -->
            <div v-if="state.isLoadingSkins" class="grid grid-cols-5 gap-4">
              <div
                v-for="i in PAGE_SIZE"
                :key="i"
                class="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-dark)] p-4"
              >
                <NSkeleton height="128px" />
                <div class="mt-3">
                  <NSkeleton text :repeat="1" />
                  <div class="mt-2">
                    <NSkeleton height="4px" />
                  </div>
                </div>
              </div>
            </div>

            <div
              v-else
              class="grid grid-cols-5 lg:grid-cols-5 md:grid-cols-3 sm:grid-cols-2 gap-4"
              data-tutorial="skin-grid"
            >
              <NCard
                v-for="skin in paginatedSkins"
                :key="skin.id"
                :style="{
                  borderColor: skin.rarity?.color || '#313030',
                  background:
                    'linear-gradient(135deg, ' +
                    '#101010' +
                    ', ' +
                    (hexToRgba(skin.rarity?.color, '0.15') || '#313030') +
                    ')',
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
                  <img
                    :src="skin.image"
                    :alt="skin.name"
                    class="w-full h-32 object-contain mb-2"
                    loading="lazy"
                  />
                  <div class="w-full">
                    <p class="text-sm text-white truncate">{{ skin.name }}</p>
                    <div
                      class="h-1 mt-2"
                      :style="{ background: skin.rarity?.color || '#313030' }"
                    />
                  </div>
                </div>
              </NCard>
            </div>

            <!-- No Results -->
            <div
              v-if="!state.isLoadingSkins && sortedSkins.length === 0"
              class="flex justify-center items-center h-64"
            >
              <NEmpty :description="String(t('modals.weaponSkin.noSearchResults'))" />
            </div>

            <!-- Pagination -->
            <div
              v-if="totalPages > 1"
              class="flex justify-center mt-4"
              data-tutorial="skin-pagination"
            >
              <NPagination
                v-model:page="state.currentPage"
                :page-count="totalPages"
                :page-slot="5"
              />
            </div>
          </div>
        </Transition>
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
</style>
