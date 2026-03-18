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
import type { EconItem } from 'cs2-inspect-lib'
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

  // Get canvas context
  previewCtx.value = previewCanvas.value.getContext('2d')
  if (!previewCtx.value) return

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
          width: previewCanvas.value.width,
          height: previewCanvas.value.height,
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

    const data = await $fetch<{ item: EconItem; message?: string }>(
      `/api/inspect?action=inspect-item&steamId=${user.value.steamId}`,
      {
        method: 'POST',
        body: { inspectUrl, itemType: 'weapon' },
      }
    )

    if (data.item.defindex !== props.weapon.weapon_defindex) {
      throw new Error(t('modals.weaponSkin.importFailedNoMatchingWeapon') as string)
    }

    // Fetch sticker data in parallel
    const stickerPromises =
      data.item.stickers?.map(
        async (
          sticker: {
            sticker_id: number
            offset_x?: number
            offset_y?: number
            wear?: number
            scale?: number
            rotation?: number
          },
          index: number
        ) => {
          if (!sticker) return null
          const stickerResponse = await $fetch<{ success: boolean; data: APISticker[] }>(
            `/api/data/stickers?id=sticker-${sticker.sticker_id}`
          )
          const stickerData = stickerResponse.data?.[0]

          if (!stickerData) return null

          return {
            id: sticker.sticker_id,
            x: sticker.offset_x || 0,
            y: sticker.offset_y || 0,
            wear: sticker.wear || 0,
            scale: sticker.scale || 1,
            rotation: sticker.rotation || 0,
            index,
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
      ) || []

    // Fetch keychain data if exists
    let keychainPromise
    const itemKeychain = data.item.keychains?.[0]
    if (itemKeychain) {
      keychainPromise = $fetch<{ success: boolean; data: APIKeychain[] }>(
        `/api/data/keychains?id=keychain-${itemKeychain.sticker_id}`
      ).then((keychainData) => {
        const keychain = keychainData.data?.[0]
        if (!keychain) return null

        return {
          id: itemKeychain.sticker_id,
          name: keychain.name || 'Unknown Keychain',
          image: keychain.image || '',
          x: 0, // These are not used when offset_x/y are present
          y: 0,
          z: itemKeychain.offset_z || 0,
          offset_x: itemKeychain.offset_x || 0,
          offset_y: itemKeychain.offset_y || 0,
          offset_z: itemKeychain.offset_z || 0,
          seed: itemKeychain.pattern || 0,
          api: {
            name: keychain.name,
            image: keychain.image,
            rarity: keychain.rarity,
          },
        }
      })
    }

    // Wait for all data to be fetched
    const [stickerResults, keychainData] = await Promise.all([
      Promise.all(stickerPromises),
      keychainPromise,
    ])

    // Initialize array with nulls
    const stickers = Array(5).fill(null)

    // Sort sticker results by their original index and place them in order
    stickerResults
      .filter((s): s is NonNullable<typeof s> => s !== null) // Remove any null results
      .sort((a, b) => a.index - b.index) // Sort by original index
      .forEach((stickerData, index) => {
        if (stickerData && index < 5) {
          // Remove the temporary index property before assigning
          const { index: _, ...stickerWithoutIndex } = stickerData
          stickers[index] = stickerWithoutIndex
        }
      })

    // Update customization with complete data using new WeaponConfiguration interface
    customization.value = {
      active: true,
      team: props.weapon.databaseInfo?.team || 1, // Default to Terrorist team
      defindex: data.item.defindex,
      paintindex: data.item.paintindex,
      paintIndexOverride: false,
      paintseed: data.item.paintseed,
      paintwear: data.item.paintwear,
      stattrak_enabled: data.item.killeaterscoretype !== null,
      stattrak_count: data.item.killeatervalue || 0,
      nametag: data.item.customname || '',
      stickers,
      keychain: keychainData ?? null,
    }

    // Update selected skin based on paint index
    const matchingSkin = apiState.value.skins.find(
      (skin) => Number(skin.paint_index) === data.item.paintindex
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

  // Exit any edit modes
  editingSticker.value = null
  editingKeychain.value = false
  leftPanelCollapsed.value = false
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

// ─────────────────────────────────────────────────────────────
// 3-column layout: Edit mode state
// ─────────────────────────────────────────────────────────────

const editingSticker = ref<number | null>(null)
const editingKeychain = ref(false)
const leftPanelCollapsed = ref(false)
const isEditMode = computed(() => editingSticker.value !== null || editingKeychain.value)
watch(isEditMode, (val) => {
  leftPanelCollapsed.value = val
})

// Per-sticker edit values
const editStickerScale = ref(1.0)
const editStickerRotation = ref(0)
const editStickerX = ref(0)
const editStickerY = ref(0)

// Keychain edit values
const editKeychainX = ref(0)
const editKeychainY = ref(0)

const handleStickerStripClick = (index: number) => {
  if (customization.value.stickers[index]) {
    editingSticker.value = index
    const s = customization.value.stickers[index]!
    editStickerScale.value = (s as any).scale ?? 1.0
    editStickerRotation.value = (s as any).rotation ?? 0
    editStickerX.value = (s as any).x ?? 0
    editStickerY.value = (s as any).y ?? 0
  } else {
    weaponState.value.currentStickerPosition = index
    weaponState.value.showStickerModal = true
  }
}

const handleKeychainStripClick = () => {
  if (customization.value.keychain) {
    editingKeychain.value = true
    editKeychainX.value = (customization.value.keychain as any).x ?? 0
    editKeychainY.value = (customization.value.keychain as any).y ?? 0
  } else {
    weaponState.value.showKeychainModal = true
  }
}

const exitEditMode = () => {
  editingSticker.value = null
  editingKeychain.value = false
}

const applyEditStickerValues = () => {
  if (editingSticker.value === null) return
  const stickers = JSON.parse(
    JSON.stringify(customization.value.stickers || [null, null, null, null, null])
  )
  if (stickers[editingSticker.value]) {
    stickers[editingSticker.value].scale = editStickerScale.value
    stickers[editingSticker.value].rotation = editStickerRotation.value
    stickers[editingSticker.value].x = editStickerX.value
    stickers[editingSticker.value].y = editStickerY.value
  }
  customization.value.stickers = stickers
}

const removeEditingSticker = () => {
  if (editingSticker.value === null) return
  const stickers = JSON.parse(
    JSON.stringify(customization.value.stickers || [null, null, null, null, null])
  )
  stickers[editingSticker.value] = null
  customization.value.stickers = stickers
  exitEditMode()
}

const removeEditingKeychain = () => {
  customization.value.keychain = null
  exitEditMode()
}

// Watch sticker edit values to apply on change
watch([editStickerScale, editStickerRotation, editStickerX, editStickerY], () => {
  applyEditStickerValues()
})

// Watch keychain edit values to apply on change
watch([editKeychainX, editKeychainY], () => {
  if (!editingKeychain.value || !customization.value.keychain) return
  const kc = JSON.parse(JSON.stringify(customization.value.keychain))
  kc.x = editKeychainX.value
  kc.y = editKeychainY.value
  customization.value.keychain = kc
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
      <!-- Normal mode: action buttons -->
      <div v-if="!isEditMode" class="flex items-center shrink-0">
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
      </div>
      <!-- Edit mode: colored banner -->
      <div v-else class="flex items-center shrink-0">
        <span
          v-if="editingSticker !== null"
          class="text-sm font-semibold px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40"
        >
          ✦ Sticker Edit — click Done when finished
        </span>
        <span
          v-else-if="editingKeychain"
          class="text-sm font-semibold px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40"
        >
          ✦ Keychain Edit — click Done when finished
        </span>
      </div>
    </template>

    <!-- 3-column layout -->
    <div class="flex h-full gap-0" style="height: 580px" @keydown="handleModalKeydown">
      <!-- ── LEFT PANEL ── -->
      <div
        class="left-panel flex flex-col border-r border-white/5 transition-all duration-300 overflow-hidden"
        :style="leftPanelCollapsed ? 'width: 32px; min-width: 32px;' : 'width: 290px; min-width: 290px;'"
      >
        <!-- Collapsed state: vertical label + expand arrow -->
        <div v-if="leftPanelCollapsed" class="flex flex-col items-center justify-start h-full pt-4 gap-3">
          <button
            class="flex flex-col items-center gap-1 text-gray-400 hover:text-white transition-colors cursor-pointer"
            @click="leftPanelCollapsed = false"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path stroke="none" d="M0 0h24v24H0z" fill="none" />
              <path d="M9 6l6 6l-6 6" />
            </svg>
            <span class="text-xs font-bold tracking-widest" style="writing-mode: vertical-rl; text-orientation: mixed;">SKINS</span>
          </button>
        </div>

        <!-- Expanded state: full panel content -->
        <div v-else class="flex flex-col h-full overflow-hidden">
          <!-- Search input -->
          <div class="p-2 pb-1">
            <NInput
              v-model:value="state.searchQuery"
              :placeholder="String(t('modals.weaponSkin.inputs.searchPlaceholder'))"
              size="small"
              clearable
              data-tutorial="skin-search"
            >
              <template #prefix>
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-gray-400">
                  <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                  <circle cx="10" cy="10" r="7" />
                  <path d="M21 21l-6 -6" />
                </svg>
              </template>
            </NInput>
          </div>

          <!-- Sort row -->
          <div class="px-2 pb-1 flex items-center gap-1" data-tutorial="sort-filter">
            <NSelect
              v-model:value="sortBy"
              size="tiny"
              class="flex-1"
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

          <!-- Rarity filter pills -->
          <div v-if="availableRarities.length > 0" class="px-2 pb-1 flex flex-wrap gap-1">
            <SButton
              v-for="rarity in availableRarities"
              :key="rarity.id"
              size="xs"
              variant="light"
              :color="rarityFilterIds.includes(rarity.id) ? buttonColor.primary : buttonColor.default"
              :style="rarityFilterIds.includes(rarity.id) ? { borderColor: rarity.color } : undefined"
              :aria-label="`Filter by ${rarity.name} rarity`"
              :aria-pressed="rarityFilterIds.includes(rarity.id)"
              class="!px-1.5"
              @click="toggleRarityFilter(rarity.id)"
            >
              <span class="flex items-center gap-1">
                <span class="h-1.5 w-1.5 rounded-full flex-shrink-0" :style="{ background: rarity.color }" />
                <span class="text-[10px]">{{ rarity.name }}</span>
              </span>
            </SButton>
          </div>

          <!-- Skins grid (2 columns) -->
          <div class="flex-1 overflow-y-auto px-2 pb-1">
            <!-- Loading skeleton -->
            <div v-if="state.isLoadingSkins" class="grid grid-cols-2 gap-1.5">
              <div
                v-for="i in 8"
                :key="i"
                class="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-dark)] p-2"
              >
                <NSkeleton height="60px" />
                <div class="mt-1.5">
                  <NSkeleton text :repeat="1" />
                </div>
              </div>
            </div>

            <!-- Skin grid -->
            <div
              v-else
              class="grid grid-cols-2 gap-1.5"
              data-tutorial="skin-grid"
            >
              <NCard
                v-for="skin in paginatedSkins"
                :key="skin.id"
                :style="{
                  borderColor: skin.rarity?.color || '#313030',
                  background:
                    'linear-gradient(135deg, #101010, ' +
                    (hexToRgba(skin.rarity?.color, '0.15') || '#313030') +
                    ')',
                }"
                :class="[
                  'hover:shadow-lg cursor-pointer transition-all rounded-lg skin-card',
                  customization.paintindex === Number(skin.paint_index)
                    ? 'ring-2 ring-[var(--selection-ring)] border-0 opacity-85'
                    : '',
                ]"
                size="small"
                @click="handleSkinSelect(skin)"
              >
                <div class="flex flex-col items-center">
                  <img
                    :src="skin.image"
                    :alt="skin.name"
                    class="w-full h-14 object-contain mb-1"
                    loading="lazy"
                  />
                  <div class="w-full">
                    <p class="text-[10px] text-white truncate leading-tight">{{ skin.name }}</p>
                    <div
                      class="h-0.5 mt-1"
                      :style="{ background: skin.rarity?.color || '#313030' }"
                    />
                  </div>
                </div>
              </NCard>
            </div>

            <!-- No Results -->
            <div
              v-if="!state.isLoadingSkins && sortedSkins.length === 0"
              class="flex justify-center items-center h-32"
            >
              <NEmpty :description="String(t('modals.weaponSkin.noSearchResults'))" />
            </div>
          </div>

          <!-- Pagination -->
          <div
            v-if="totalPages > 1"
            class="px-2 py-1.5 border-t border-white/5"
            data-tutorial="skin-pagination"
          >
            <NPagination
              v-model:page="state.currentPage"
              :page-count="totalPages"
              :page-slot="3"
              size="small"
              class="justify-center"
            />
          </div>
        </div>
      </div>

      <!-- ── CENTER CANVAS ── -->
      <div class="flex flex-col flex-1 min-w-0 overflow-hidden">
        <!-- InlineVisualCustomizer always visible -->
        <div class="flex-1 min-h-0">
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

        <!-- Sticker/Keychain strip -->
        <div class="flex items-stretch border-t border-white/5 bg-[var(--bg-dark)]" style="height: 60px;">
          <!-- 5 sticker slots -->
          <div
            v-for="(sticker, index) in customization.stickers"
            :key="index"
            class="sticker-strip-slot flex-1 flex items-center justify-center cursor-pointer transition-all relative border-r border-white/5"
            :class="{
              'active-strip-item': sticker,
              'inactive-strip-item': !sticker,
              'ring-2 ring-amber-400': editingSticker === index,
              'opacity-50': isEditMode && editingSticker !== index,
            }"
            :title="sticker ? sticker.api?.name || `Sticker ${index + 1}` : `Add Sticker ${index + 1}`"
            draggable="true"
            @dragstart="handleStickerDragStart($event, index)"
            @dragend="handleStickerDragEnd"
            @dragover="handleStickerDragOver"
            @dragleave="handleStickerDragLeave"
            @drop="handleStickerDrop($event, index)"
            @click.stop="handleStickerStripClick(index)"
          >
            <img
              v-if="sticker"
              :src="generateStickerImageUrl(sticker.id, sticker.wear || 0)"
              :alt="sticker.api?.name ?? ''"
              class="h-8 w-auto object-contain"
              @error="(e) => ((e.target as HTMLImageElement).src = sticker?.api?.image || '')"
            />
            <span v-else class="text-gray-500 text-xs">+</span>
            <!-- Slot label -->
            <span class="absolute top-0 left-0.5 text-[9px] text-gray-600 leading-none">{{ index + 1 }}</span>
          </div>

          <!-- Divider -->
          <div class="w-px bg-white/10 self-stretch" />

          <!-- Keychain slot -->
          <div
            class="keychain-strip-slot flex items-center justify-center cursor-pointer transition-all relative"
            style="width: 46px;"
            :class="{
              'active-strip-keychain': customization.keychain,
              'inactive-strip-item': !customization.keychain,
              'ring-2 ring-purple-400': editingKeychain,
              'opacity-50': isEditMode && !editingKeychain,
            }"
            :title="customization.keychain ? customization.keychain.api?.name || 'Keychain' : 'Add Keychain'"
            @click.stop="handleKeychainStripClick"
          >
            <img
              v-if="customization.keychain"
              :src="generateFlatKeychainUrl(
                customization.keychain.api?.name ?? '',
                customization.keychain.seed,
                undefined,
                customization.keychain.wrapped_sticker_id || undefined
              )"
              :alt="customization.keychain.api?.name ?? ''"
              class="h-8 w-auto object-contain"
            />
            <span v-else class="text-gray-500 text-xs">K</span>
          </div>
        </div>

        <!-- ── Item controls bar ── -->
        <div
          class="flex items-center gap-2 border-t border-white/5 px-3 flex-shrink-0"
          style="height: 52px; background: var(--bg-elevated);"
        >
          <!-- Active -->
          <NSwitch v-model:value="customization.active" size="small" data-tutorial="active-switch">
            <template #checked>{{ t('modals.weaponSkin.labels.itemActive') }}</template>
            <template #unchecked>{{ t('modals.weaponSkin.labels.itemInactive') }}</template>
          </NSwitch>

          <div class="w-px h-7 bg-white/10 flex-shrink-0" />

          <!-- StatTrak -->
          <div class="flex items-center gap-1.5 flex-shrink-0">
            <NSwitch v-model:value="customization.stattrak_enabled" size="small" />
            <span class="text-xs text-gray-400 whitespace-nowrap">{{ t('modals.weaponSkin.labels.stattrak') }}</span>
            <NInputNumber
              v-model:value="customization.stattrak_count"
              :disabled="!customization.stattrak_enabled"
              :min="0"
              :max="99999"
              size="small"
              style="width: 80px;"
              :input-props="digitOnlyInputProps"
            />
          </div>

          <div class="w-px h-7 bg-white/10 flex-shrink-0" />

          <!-- Name Tag -->
          <div class="flex items-center gap-1.5 flex-shrink-0">
            <span class="text-xs text-gray-400 whitespace-nowrap">Tag</span>
            <NInput
              v-model:value="customization.nametag"
              :placeholder="t('modals.weaponSkin.inputs.nameTagPlaceholder') as string"
              size="small"
              maxlength="20"
              style="width: 130px;"
            />
          </div>

          <div class="w-px h-7 bg-white/10 flex-shrink-0" />

          <!-- Wear -->
          <div class="flex items-center gap-2 flex-1 min-w-0" data-tutorial="wear-slider">
            <span class="text-xs text-gray-400 whitespace-nowrap flex-shrink-0">{{ t('modals.weaponSkin.labels.wear') }}</span>
            <div class="flex-1 min-w-0">
              <WearSlider
                v-model="customization.paintwear"
                :max="selectedSkin?.maxFloat ?? 1"
                :min="selectedSkin?.minFloat ?? 0"
              />
            </div>
          </div>

          <div class="w-px h-7 bg-white/10 flex-shrink-0" />

          <!-- Pattern Seed -->
          <div class="flex items-center gap-1.5 flex-shrink-0">
            <span class="text-xs text-gray-400 whitespace-nowrap">{{ t('modals.weaponSkin.labels.pattern') }}</span>
            <NInputNumber
              v-model:value="customization.paintseed"
              :min="0"
              :max="1000"
              size="small"
              style="width: 72px;"
              :input-props="digitOnlyInputProps"
            />
          </div>

          <div class="w-px h-7 bg-white/10 flex-shrink-0" />

          <!-- Paint Index -->
          <div class="flex items-center gap-1.5 flex-shrink-0" data-tutorial="paint-index-override">
            <span class="text-xs text-gray-400 whitespace-nowrap">{{ t('modals.weaponSkin.labels.paintIndex') }}</span>
            <NSwitch v-model:value="customization.paintIndexOverride" size="small" />
            <NInputNumber
              v-model:value="customization.paintindex"
              :min="0"
              :max="9999"
              :disabled="!customization.paintIndexOverride"
              size="small"
              style="width: 72px;"
              :input-props="digitOnlyInputProps"
            />
          </div>

          <!-- Duplicate -->
          <SButton
            v-if="selectedSkin?.availableTeams === 'both'"
            :disabled="!selectedSkin"
            variant="light"
            size="sm"
            class="flex-shrink-0 ml-1"
            @click="state.showDuplicateConfirm = true"
          >
            {{ t('modals.weaponSkin.buttons.duplicate') }}
          </SButton>
        </div>

        <!-- ── Sticker edit bar ── -->
        <template v-if="editingSticker !== null">
          <div
            class="flex items-center gap-2 border-t border-amber-400/20 px-3 flex-shrink-0"
            style="height: 44px; background: rgba(251,191,36,0.05);"
          >
            <span class="text-xs text-amber-400 font-semibold whitespace-nowrap flex-shrink-0">Sticker #{{ editingSticker + 1 }}</span>
            <div class="w-px h-5 bg-amber-400/20 flex-shrink-0" />

            <!-- Scale -->
            <div class="flex items-center gap-1 flex-shrink-0">
              <span class="text-[10px] text-gray-500">Scale</span>
              <SButton size="xs" variant="light" icon-only @click="editStickerScale = Math.max(0.1, editStickerScale - 0.1)">-</SButton>
              <NInputNumber v-model:value="editStickerScale" :min="0.1" :max="3" :step="0.1" :precision="1" size="tiny" style="width: 52px;" :show-button="false" />
              <SButton size="xs" variant="light" icon-only @click="editStickerScale = Math.min(3, editStickerScale + 0.1)">+</SButton>
            </div>
            <div class="w-px h-5 bg-amber-400/20 flex-shrink-0" />

            <!-- Rotation -->
            <div class="flex items-center gap-1 flex-shrink-0">
              <span class="text-[10px] text-gray-500">Rot</span>
              <SButton size="xs" variant="light" icon-only @click="editStickerRotation = ((editStickerRotation - 15) + 360) % 360">↺</SButton>
              <NInputNumber v-model:value="editStickerRotation" :min="0" :max="360" :step="1" :precision="0" size="tiny" style="width: 52px;" :show-button="false" />
              <SButton size="xs" variant="light" icon-only @click="editStickerRotation = (editStickerRotation + 15) % 360">↻</SButton>
            </div>
            <div class="w-px h-5 bg-amber-400/20 flex-shrink-0" />

            <!-- Position X/Y -->
            <div class="flex items-center gap-1 flex-shrink-0">
              <span class="text-[10px] text-gray-500">X</span>
              <NInputNumber v-model:value="editStickerX" :step="0.001" :precision="4" size="tiny" style="width: 72px;" :show-button="false" />
              <span class="text-[10px] text-gray-500">Y</span>
              <NInputNumber v-model:value="editStickerY" :step="0.001" :precision="4" size="tiny" style="width: 72px;" :show-button="false" />
            </div>
            <div class="w-px h-5 bg-amber-400/20 flex-shrink-0" />

            <SButton size="sm" variant="light" :color="buttonColor.error" class="flex-shrink-0" @click="removeEditingSticker">Remove</SButton>
            <SButton size="sm" variant="light" :color="buttonColor.success" class="flex-shrink-0" @click="exitEditMode">Done ✓</SButton>
          </div>
        </template>

        <!-- ── Keychain edit bar ── -->
        <template v-if="editingKeychain">
          <div
            class="flex items-center gap-2 border-t border-purple-400/20 px-3 flex-shrink-0"
            style="height: 44px; background: rgba(192,132,252,0.05);"
          >
            <span class="text-xs text-purple-400 font-semibold whitespace-nowrap flex-shrink-0">Keychain</span>
            <div v-if="customization.keychain" class="text-xs text-gray-400 truncate max-w-[140px] flex-shrink-0">
              {{ (customization.keychain.api?.name ?? '').replace('Charm | ', '') }}
            </div>
            <div class="w-px h-5 bg-purple-400/20 flex-shrink-0" />

            <!-- Position X/Y -->
            <div class="flex items-center gap-1 flex-shrink-0">
              <span class="text-[10px] text-gray-500">X</span>
              <NInputNumber v-model:value="editKeychainX" :step="0.01" :min="-2" :max="2" :precision="4" size="tiny" style="width: 72px;" :show-button="false" />
              <span class="text-[10px] text-gray-500">Y</span>
              <NInputNumber v-model:value="editKeychainY" :step="0.01" :min="-2" :max="2" :precision="4" size="tiny" style="width: 72px;" :show-button="false" />
            </div>
            <div class="w-px h-5 bg-purple-400/20 flex-shrink-0" />

            <SButton size="sm" variant="light" :color="buttonColor.error" class="flex-shrink-0" @click="removeEditingKeychain">Remove</SButton>
            <SButton size="sm" variant="light" :color="buttonColor.success" class="flex-shrink-0" @click="exitEditMode">Done ✓</SButton>
          </div>
        </template>
      </div>
    </div>

    <!-- All modal dialogs preserved -->

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

.sticker-strip-slot {
  touch-action: none;
  transition: all 0.15s ease-in-out;

  &.dragging {
    opacity: 0.5;
    transform: scale(0.95);
  }

  &.drag-over {
    background-color: rgba(255, 255, 255, 0.08);
    transform: scale(1.05);
  }
}

.active-strip-item {
  @apply border border-solid border-amber-400/60;
}

.active-strip-keychain {
  @apply border border-solid border-purple-400/60;
}

.inactive-strip-item {
  @apply border border-dashed border-gray-700/60;
}

.skin-card {
  :deep(.n-card__content) {
    padding: 6px !important;
  }
}

.left-panel {
  flex-shrink: 0;
}

.right-panel {
  flex-shrink: 0;
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
