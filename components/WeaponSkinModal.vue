<script setup lang="ts">
// New type system imports
import type {
  WeaponModalProps,
  WeaponModalState,
  WeaponConfiguration,
  APIWeaponSkin,
  UserProfile
} from '~/types'

// Legacy imports for backward compatibility
import type { IEnhancedWeapon, IMappedDBWeapon } from '~/server/utils/interfaces'

import { useMessage } from 'naive-ui'
import { steamAuth } from "~/services/steamAuth"
import { skinModalThemeOverrides } from "~/server/utils/themeCustomization"

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
  (e: 'select' | 'duplicate', skin: IEnhancedWeapon, customization: WeaponConfiguration): void
  (e: 'error', error: string): void
}>()

const { t } = useI18n()
const message = useMessage()

const modalTitle = computed(() => {
  return props.weapon
    ? t('modals.weaponSkin.title', { weaponName: props.weapon?.defaultName }) as string
    : t('modals.weaponSkin.defaultTitle') as string
})

const teamLabel = computed((): string | null => {
  const team = props.weapon?.databaseInfo?.team
  if (team === 1) return t('modals.weaponSkin.team.terrorist') as string
  if (team === 2) return t('modals.weaponSkin.team.counterTerrorist') as string
  return null
})

const teamBadgeClasses = computed(() => {
  const team = props.weapon?.databaseInfo?.team
  if (team === 1) return 'border-orange-500/30 bg-orange-500/15 text-orange-300'
  if (team === 2) return 'border-blue-500/30 bg-blue-500/15 text-blue-300'
  return ''
})

/**
 * Modal state using new WeaponModalState interface
 */
const state = ref<WeaponModalState>({
  // Base modal state
  isLoadingSkins: false,
  searchQuery: '',
  currentPage: 1,
  error: null,

  // Base item modal state
  showImportModal: false,
  showDuplicateConfirm: false,
  showResetConfirm: false,
  isImporting: false,
  isLoadingInspect: false,
  isResetting: false,
  isDuplicating: false,

  // Weapon-specific modal state
  showStickerModal: false,
  showKeychainModal: false,
  showVisualCustomizer: false,
  currentStickerPosition: 0
})

/**
 * Additional state for API data (not part of the modal state interface)
 */
const apiState = ref({
  skins: [] as APIWeaponSkin[],
  showDetails: false
})

const selectedSkin = ref<IEnhancedWeapon | null>()

/**
 * Default weapon configuration using new WeaponConfiguration interface
 */
const defaultCustomization: WeaponConfiguration = {
  active: false,
  team: 1, // Default to Terrorist team
  defindex: 0,
  paintIndex: 0,
  paintIndexOverride: false,
  pattern: 0,
  wear: 0,
  statTrak: false,
  statTrakCount: 0,
  nameTag: '',
  stickers: [null, null, null, null, null],
  keychain: null
}

const customization = ref<WeaponConfiguration>({ ...defaultCustomization })

/**
 * User profile using new UserProfile interface
 */
const user = computed((): UserProfile | null => {
  const steamUser = steamAuth.getSavedUser()
  if (!steamUser) return null

  return {
    steamId: steamUser.steamId,
    displayName: steamUser.displayName,
    avatar: steamUser.avatar,
    profileUrl: steamUser.profileUrl
  }
})
/**
 * Pagination and filtering computed properties
 */
const PAGE_SIZE = ref(props.pageSize || 10)

type SkinSortBy = 'name' | 'rarity'
type SortDir = 'asc' | 'desc'

const ui = ref({
  sortBy: 'name' as SkinSortBy,
  sortDir: 'asc' as SortDir,
  rarityFilterIds: [] as string[],
})

const rarityRank = (rarityId: string | undefined) => {
  const id = (rarityId || '').toLowerCase()
  const rankMap: Record<string, number> = {
    consumer: 1,
    industrial: 2,
    milspec: 3,
    restricted: 4,
    classified: 5,
    covert: 6,
    extraordinary: 7,
  }
  return rankMap[id] ?? 0
}

const availableRarities = computed(() => {
  const map = new Map<string, { id: string; name: string; color: string }>()
  for (const skin of apiState.value.skins) {
    const id = skin.rarity?.id
    if (!id) continue
    if (!map.has(id)) {
      map.set(id, { id, name: skin.rarity.name, color: skin.rarity.color })
    }
  }
  return Array.from(map.values()).sort((a, b) => rarityRank(a.id) - rarityRank(b.id))
})

const skinSortOptions = computed(() => [
  { label: t('modals.weaponSkin.sort.name') as string, value: 'name' },
  { label: t('modals.weaponSkin.sort.rarity') as string, value: 'rarity' },
])

const toggleSortDir = () => {
  ui.value.sortDir = ui.value.sortDir === 'asc' ? 'desc' : 'asc'
  state.value.currentPage = 1
}

const toggleRarityFilter = (rarityId: string) => {
  const set = new Set(ui.value.rarityFilterIds)
  if (set.has(rarityId)) set.delete(rarityId)
  else set.add(rarityId)
  ui.value.rarityFilterIds = Array.from(set)
  state.value.currentPage = 1
}

const filteredSkins = computed(() => {
  const q = state.value.searchQuery.toLowerCase()
  const raritySet = new Set(ui.value.rarityFilterIds)
  const useRarityFilter = raritySet.size > 0

  return apiState.value.skins.filter((skin) => {
    if (q && !skin.name.toLowerCase().includes(q)) return false
    if (useRarityFilter && !raritySet.has(skin.rarity?.id)) return false
    return true
  })
})

const sortedSkins = computed(() => {
  const dir = ui.value.sortDir === 'asc' ? 1 : -1
  const sortBy = ui.value.sortBy

  return [...filteredSkins.value].sort((a, b) => {
    if (sortBy === 'rarity') {
      const diff = rarityRank(a.rarity?.id) - rarityRank(b.rarity?.id)
      if (diff !== 0) return diff * dir
    }
    return a.name.localeCompare(b.name) * dir
  })
})

const paginatedSkins = computed(() => {
  const start = (state.value.currentPage - 1) * PAGE_SIZE.value
  const end = start + PAGE_SIZE.value
  return sortedSkins.value.slice(start, end)
})

const totalPages = computed(() => Math.ceil(sortedSkins.value.length / PAGE_SIZE.value))

/**
 * Fetch available skins for the current weapon
 * Updated to use new state structure and error handling
 */
const fetchAvailableSkinsForWeapon = async () => {
  if (!props.weapon) {
    console.warn('WeaponSkinModal: No weapon provided for skin fetching')
    return
  }

  try {
    state.value.isLoadingSkins = true
    state.value.error = null

    console.log('WeaponSkinModal: Fetching skins for weapon:', props.weapon.weapon_name)
    const response = await fetch(`/api/data/skins?weapon=${props.weapon.weapon_name}`)

    if (!response.ok) {
      throw new Error(`Failed to fetch skins: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    console.log('WeaponSkinModal: API response:', {
      success: data.success,
      dataLength: data.data?.length || 0,
      weapon: props.weapon.weapon_name
    })

    // Handle both old and new API response formats
    const skins = data.data || data.skins || []
    apiState.value.skins = skins

    if (skins.length === 0) {
      console.warn('WeaponSkinModal: No skins found for weapon:', props.weapon.weapon_name)
      state.value.error = `No skins available for ${props.weapon.defaultName || props.weapon.weapon_name}`
    } else {
      console.log('WeaponSkinModal: Successfully loaded', skins.length, 'skins')
    }

    // Check if current page is above available pages and adjust if needed
    const newTotalPages = Math.ceil(sortedSkins.value.length / PAGE_SIZE.value)

    if (state.value.currentPage > newTotalPages && newTotalPages > 0) {
      state.value.currentPage = newTotalPages
    }
  } catch (error) {
    console.error('WeaponSkinModal: Error fetching weapon skins:', {
      error,
      weapon: props.weapon?.weapon_name,
      weaponData: props.weapon
    })
    state.value.error = error instanceof Error ? error.message : 'Failed to fetch skins'
    emit('error', state.value.error)
  } finally {
    state.value.isLoadingSkins = false
  }
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

    const response = await fetch(`/api/inspect?action=inspect-item&steamId=${user.value.steamId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'credentials': 'include'
      },
      body: JSON.stringify({ inspectUrl, itemType: 'weapon' })
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.message || 'Failed to import inspect link')
    }

    if (data.item.defindex !== props.weapon.weapon_defindex) {
      throw new Error(t('modals.weaponSkin.importFailedNoMatchingWeapon') as string)
    }

    // Fetch sticker data in parallel
    const stickerPromises = data.item.stickers?.map(async (sticker: { sticker_id: number; offset_x?: number; offset_y?: number; wear?: number; scale?: number; rotation?: number }, index: number) => {
      if (!sticker) return null
      const response = await fetch(`/api/data/stickers?id=sticker-${sticker.sticker_id}`)
      const stickerResponse = await response.json()
      const stickerData = stickerResponse.stickers[0]

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
        }
      }
    }) || []

    // Fetch keychain data if exists
    let keychainPromise
    if (data.item.keychains?.[0]) {
      keychainPromise = await fetch(`/api/data/keychains?id=keychain-${data.item.keychains[0].sticker_id}`)
          .then(res => res.json())
          .then(keychainData => {
            // Handle both old and new API response formats
            const keychains = keychainData.data || keychainData.keychains || []
            const keychain = keychains[0]
            if (!keychain) return null

            return {
              id: data.item.keychains[0].sticker_id,
              x: data.item.keychains[0].offset_x || 0,
              y: data.item.keychains[0].offset_y || 0,
              z: data.item.keychains[0].offset_z || 0,
              seed: data.item.keychains[0].pattern || 0,
              api: {
                name: keychain.name,
                image: keychain.image,
                rarity: keychain.rarity
              }
            }
          })
    }

    // Wait for all data to be fetched
    const [stickerResults, keychainData] = await Promise.all([
      Promise.all(stickerPromises),
      keychainPromise
    ])

    // Initialize array with nulls
    const stickers = Array(5).fill(null)

    // Sort sticker results by their original index and place them in order
    stickerResults
        .filter(Boolean) // Remove any null results
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
      paintIndex: data.item.paintindex,
      paintIndexOverride: false,
      pattern: data.item.paintseed,
      wear: data.item.paintwear,
      statTrak: data.item.killeaterscoretype !== null,
      statTrakCount: data.item.killeatervalue || 0,
      nameTag: data.item.customname || '',
      stickers,
      keychain: keychainData
    }

    // Update selected skin based on paint index
    const matchingSkin = apiState.value.skins.find(skin =>
      Number(skin.paint_index) === data.item.paintindex
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
        paintIndex: Number(matchingSkin.paint_index),
        rarity: matchingSkin.rarity,
        availableTeams: matchingSkin.team?.id ?? 'both',
      }
    }

    message.success(t('modals.weaponSkin.importSuccess') as string, { duration: 3000 })
    state.value.showImportModal = false
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : (t('modals.weaponSkin.importFailedDefault') as string)
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
  if (!customization.value.paintIndex || customization.value.paintIndex === 0) {
    state.value.error = 'No skin configured for inspect link creation'
    emit('error', state.value.error)
    return
  }

  try {
    state.value.isLoadingInspect = true
    state.value.error = null

    const response = await fetch(`/api/inspect?action=create-url&steamId=${user.value.steamId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'credentials': 'include'
      },
      body: JSON.stringify({
        itemType: 'weapon',
        defindex: props.weapon.weapon_defindex,
        paintindex: customization.value.paintIndex,
        paintseed: customization.value.pattern,
        paintwear: customization.value.wear,
        rarity: 0,
        statTrak: customization.value.statTrak,
        statTrakCount: customization.value.statTrakCount,
        nameTag: customization.value.nameTag,
        customization: customization.value
      })
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.message || 'Failed to create inspect link')
    }

    const link: string = data.inspectUrl
    await navigator.clipboard.writeText(link)
    message.success(t('modals.weaponSkin.generateInspectUrlSuccess') as string, { duration: 3000 })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : (t('modals.weaponSkin.generateInspectUrlFailed') as string)
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
    const errorMessage = error instanceof Error ? error.message : (t('modals.weaponSkin.resetFailed') as string)
    state.value.error = errorMessage
    message.error(errorMessage)
    emit('error', errorMessage)
    console.error('Error resetting weapon:', error)
  } finally {
    state.value.isResetting = false
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
      team: otherTeam
    }

    // Emit duplicate event to parent
    emit('duplicate', selectedSkin.value, duplicateData)

    state.value.showDuplicateConfirm = false
    console.log('handleDuplicate', selectedSkin.value, duplicateData)
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : (t('modals.weaponSkin.duplicateFailed') as string)
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
      paintIndex: Number(skin.paint_index),
      rarity: skin.rarity,
      availableTeams: skin.team?.id ?? 'both',
    }

    customization.value = {
      ...customization.value,
      paintIndex: Number(skin.paint_index),
      wear: Number(skin.min_float ?? 0),
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
  const temp = stickers[fromIndex]
  stickers[fromIndex] = stickers[toIndex]
  stickers[toIndex] = temp
  customization.value.stickers = stickers
}
const handleAddSticker = (position: number) => {
  state.value.currentStickerPosition = position
  state.value.showStickerModal = true
}
const handleStickerSelect = (stickerData: { id: number; x?: number; y?: number; wear?: number; scale?: number; rotation?: number; api?: Record<string, unknown> }) => {
  customization.value.stickers[state.value.currentStickerPosition] = stickerData
}

const removeSticker = (index: number) => {
  const stickers = [...customization.value.stickers]
  if (!stickers[index]) return
  stickers[index] = null
  customization.value.stickers = stickers
}

const handleAddKeychain = () => {
  state.value.showKeychainModal = true
}
const handleKeychainSelect = (keychainData: { id: number; x?: number; y?: number; z?: number; seed?: number; api?: Record<string, unknown> }) => {
  customization.value.keychain = keychainData
}

const removeKeychain = () => {
  if (!customization.value.keychain) return
  customization.value.keychain = null
}

const handleOpenVisualCustomizer = () => {
  if (!selectedSkin.value) {
    message.warning('Please select a weapon skin first')
    return
  }
  state.value.showVisualCustomizer = true
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
    state.value.showStickerModal
    || state.value.showKeychainModal
    || state.value.showImportModal
    || state.value.showDuplicateConfirm
    || state.value.showResetConfirm
    || state.value.showVisualCustomizer
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
    if (!selectedSkin.value || customization.value.paintIndex === 0) return
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

const handleVisualCustomizerSave = (data: { stickers: Array<{ id: number; slot: number; x: number; y: number; wear: number; scale: number; rotation: number; ext_norm_x?: number; ext_norm_y?: number; ext_ref_x?: number; ext_ref_y?: number; api?: Record<string, unknown> } | null>, keychain: { id: number; x: number; y: number; z?: number; seed?: number } | null, weaponWear?: number }) => {
  customization.value.stickers = data.stickers
  customization.value.keychain = data.keychain

  // Update weapon wear if provided
  if (typeof data.weaponWear === 'number') {
    customization.value.wear = data.weaponWear
  }

  state.value.showVisualCustomizer = false
  message.success('Visual customization applied successfully')
}

const handleVisualCustomizerWearUpdate = (wearValue: number) => {
  customization.value.wear = wearValue
}

const digitOnlyInputProps = {
  inputmode: 'numeric' as const, 
  pattern: '\\d*',
  onKeydown: (e: KeyboardEvent) => { const allow=['Backspace','Delete','Tab','ArrowLeft','ArrowRight','Home','End','Enter']; const meta=e.ctrlKey||e.metaKey; if (allow.includes(e.key)||(meta&&/[acvxy]/i.test(e.key))) return; if (!/^[0-9]$/.test(e.key)) e.preventDefault() },
  onPaste: (e: ClipboardEvent) => { const t=e.clipboardData?.getData('text')||''; if (/[^0-9]/.test(t)) e.preventDefault() }
}

const handleSave = () => {
  if (!selectedSkin.value) return
  emit('select', selectedSkin.value, customization.value)
  handleClose();
}
const handleClose = () => {
  // Emit the update event to close the modal
  emit('update:visible', false)

  // We'll also reset the state immediately to ensure it's clean
  setTimeout(() => {
    resetAllState()
  }, 300) // Small delay to ensure modal is closed first
}

watch(() => customization.value.wear, (newWear) => {
      if (typeof newWear === 'number' && !isNaN(newWear)) {
        customization.value.wear = Number(newWear.toFixed(3));
      }
    }, { immediate: true }
);

// Function to completely reset all state
const resetAllState = () => {
  // Reset customization to default values
  customization.value = {
    active: false,
    statTrak: false,
    statTrakCount: 0,
    paintIndex: 0,
    paintIndexOverride: false,
    pattern: 0,
    wear: 0,
    nameTag: '',
    stickers: [null, null, null, null, null],
    keychain: null,
    team: 1
  }

  // Reset all other state
  state.value = {
    ...state.value,
    searchQuery: '',
    currentPage: 1,
    skins: [],
    isLoadingSkins: false,
    showStickerModal: false,
    showKeychainModal: false,
    showImportModal: false,
    showDetails: false,
    currentStickerPosition: 0,
    showResetConfirm: false,
    showDuplicateConfirm: false,
    isResetting: false,
    isImporting: false,
    isLoadingInspect: false,
    isDuplicating: false
  }

  ui.value = {
    sortBy: 'name',
    sortDir: 'asc',
    rarityFilterIds: [],
  }

  // Reset selected skin
  selectedSkin.value = null
}

// Watch for changes to props.visible to properly reset state when modal is opened/closed
watch(() => props.visible, (isVisible) => {
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
}, { immediate: true })

// Watch for changes to searchQuery to adjust current page if needed
watch(() => state.value.searchQuery, () => {
  // When search query changes, check if we need to adjust the current page
  const newTotalPages = Math.ceil(sortedSkins.value.length / PAGE_SIZE.value)
  if (state.value.currentPage > newTotalPages && newTotalPages > 0) {
    state.value.currentPage = newTotalPages
  } else if (newTotalPages > 0) {
    // Reset to page 1 when search query changes
    state.value.currentPage = 1
  }
})

watch(() => ui.value.sortBy, () => {
  state.value.currentPage = 1
})

watch(() => ui.value.sortDir, () => {
  state.value.currentPage = 1
})

/**
 * Watch for changes to props.weapon to initialize state when a weapon is selected
 * Updated to use new WeaponConfiguration interface
 */
watch(() => props.weapon, () => {
  if (props.visible && props.weapon) {
    try {
      state.value.error = null

      // First reset all state to ensure no previous data persists
      resetAllState()

      // Then fetch new data and initialize state
      fetchAvailableSkinsForWeapon()
      selectedSkin.value = props.weapon

      const dbInfo = props.weapon.databaseInfo as IMappedDBWeapon
      if (dbInfo) {
        customization.value = {
          active: dbInfo.active || false,
          team: dbInfo.team || 1,
          defindex: props.weapon.weapon_defindex,
          paintIndex: dbInfo.paintIndex || 0,
          paintIndexOverride: false,
          pattern: dbInfo.pattern || 0,
          wear: dbInfo.paintWear || 0,
          statTrak: dbInfo.statTrak || false,
          statTrakCount: dbInfo.statTrakCount || 0,
          nameTag: dbInfo.nameTag || '',
          stickers: Array.isArray(dbInfo.stickers) ? [...dbInfo.stickers] : [null, null, null, null, null],
          keychain: dbInfo.keychain ? {...dbInfo.keychain} : null
        }
      } else {
        customization.value = {
          ...defaultCustomization,
          team: props.weapon.availableTeams === 'terrorists' ? 1 : 2,
          defindex: props.weapon.weapon_defindex
        }
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to initialize weapon data'
      state.value.error = errorMessage
      emit('error', errorMessage)
      console.error('Error initializing weapon:', error)
    }
  }
})
</script>

<template>
  <NModal
      :show="visible"
      style="max-width: 1200px; width: 95vw"
      preset="card"
      :bordered="false"
      size="huge"
      class="duration-500 ease-in-out transition-all"
      :theme-overrides="skinModalThemeOverrides"
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
      </div>
    </template>
    <template #header-extra>
      <!-- Reset Weapon Configuration -->
      <NButton 
        :loading="state.isResetting" 
        secondary 
        type="error" 
        :disabled="!selectedSkin || customization.paintIndex == 0" 
        :aria-label="t('modals.weaponSkin.buttons.reset') as string"
        @click="state.showResetConfirm = true"
      >
        <template #icon>
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-refresh">
            <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
            <path d="M20 11a8.1 8.1 0 0 0 -15.5 -2m-.5 -4v4h4" />
            <path d="M4 13a8.1 8.1 0 0 0 15.5 2m.5 4v-4h-4" />
          </svg>
        </template>
        {{ t('modals.weaponSkin.buttons.reset') }}
      </NButton>
      <NDivider vertical />

      <!-- Import Weapon by Inspect Link -->
      <NButton 
        :loading="state.isImporting" 
        secondary 
        type="default" 
        :disabled="!selectedSkin"
        :aria-label="t('modals.weaponSkin.buttons.importFromLink') as string"
        @click="state.showImportModal = true"
      >
        <template #icon>
          <svg  xmlns="http://www.w3.org/2000/svg"  width="24"  height="24"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-zoom-scan"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M4 8v-2a2 2 0 0 1 2 -2h2" /><path d="M4 16v2a2 2 0 0 0 2 2h2" /><path d="M16 4h2a2 2 0 0 1 2 2v2" /><path d="M16 20h2a2 2 0 0 0 2 -2v-2" /><path d="M8 11a3 3 0 1 0 6 0a3 3 0 0 0 -6 0" /><path d="M16 16l-2.5 -2.5" /></svg>
        </template>
        {{ t('modals.weaponSkin.buttons.importFromLink') }}
      </NButton>
      <NDivider vertical />

      <!-- Generate Weapon Inspect Link by Data -->
      <NButton
        :loading="state.isLoadingInspect"
        secondary
        type="default"
        :disabled="!selectedSkin || customization.paintIndex === 0"
        :aria-label="t('modals.weaponSkin.buttons.generateLink') as string"
        @click="handleCreateInspectLink"
      >
        <template #icon>
          <svg  xmlns="http://www.w3.org/2000/svg"  width="24"  height="24"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-zoom-scan"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M4 8v-2a2 2 0 0 1 2 -2h2" /><path d="M4 16v2a2 2 0 0 0 2 2h2" /><path d="M16 4h2a2 2 0 0 1 2 2v2" /><path d="M16 20h2a2 2 0 0 0 2 -2v-2" /><path d="M8 11a3 3 0 1 0 6 0a3 3 0 0 0 -6 0" /><path d="M16 16l-2.5 -2.5" /></svg>
        </template>
        {{ t('modals.weaponSkin.buttons.generateLink') }}
      </NButton>
      <NDivider vertical />

      <!-- Weapon Search -->
      <NInput
          v-model:value="state.searchQuery"
          :placeholder="t('modals.weaponSkin.inputs.searchPlaceholder') as string"
          class="pl-1 w-96"
      />
    </template>

    <div @keydown="handleModalKeydown">
      <NSpace vertical size="large" class="-mt-2">
        <!-- Selected Skin Preview -->
        <div v-if="selectedSkin" class="bg-[#1a1a1a] p-6  rounded-lg">
          <div class="grid grid-cols-2 gap-6">
            <!-- Left side - Image -->
            <div>
              <div class="relative">
                <img
                    :src="selectedSkin?.image"
                    :alt="selectedSkin?.name"
                    class="w-full h-64 object-contain"
                >
                <!-- Visual Customizer Overlay Button -->
                <button
                  class="visual-customizer-overlay"
                  :class="{ 'disabled': !selectedSkin }"
                  :disabled="!selectedSkin"
                  :title="(t('modals.weaponSkin.visualCustomizer.button') as string) || 'Visual Customizer'"
                  :aria-label="(t('modals.weaponSkin.visualCustomizer.button') as string) || 'Visual Customizer'"
                  @click.stop="handleOpenVisualCustomizer"
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
                    <path d="M9 3a2 2 0 0 0 2 2a2 2 0 0 0 -2 2a2 2 0 0 0 -2 -2a2 2 0 0 0 2 -2" />
                    <path d="M19 13a2 2 0 0 0 2 2a2 2 0 0 0 -2 2a2 2 0 0 0 -2 -2a2 2 0 0 0 2 -2" />
                  </svg>
                </button>
              </div>
              <h3 class="text-lg font-bold mt-2">{{ selectedSkin?.name }}</h3>
            </div>

            <!-- Right side - Customization -->
            <div class="space-y-6 flex flex-col items-center">
              <!-- StatTrak and Name Tag -->
              <div class="grid grid-cols-2 gap-4 w-full">
                <div class="flex items-center space-x-4">
                  <NSwitch v-model:value="customization.statTrak" />
                  <span>{{ t('modals.weaponSkin.labels.stattrak') }}</span>
                  <NInputNumber
                      v-model:value="customization.statTrakCount"
                      :disabled="!customization.statTrak"
                      :min="0"
                      :max="99999"
                      class="w-28"
                      :input-props="digitOnlyInputProps"
                  />
                </div>
                <NInput
                    v-model:value="customization.nameTag"
                    :placeholder="t('modals.weaponSkin.inputs.nameTagPlaceholder') as string"
                    class="pl-1"
                    maxlength="20"
                    show-count
                />
              </div>

            <!-- Paint Settings -->
            <div class="grid grid-cols-2 gap-4 w-full">
              <div class="space-y-2">
                <div class="flex items-center justify-between">
                  <h4 class="font-bold">{{ t('modals.weaponSkin.labels.paintIndex') }}</h4>
                  <div class="flex items-center space-x-2">
                    <NSwitch v-model:value="customization.paintIndexOverride" />
                    <span class="text-sm">{{ t('modals.weaponSkin.labels.paintIndexOverride') }}</span>
                  </div>
                </div>
                <NInputNumber
                    v-model:value="customization.paintIndex"
                    :min="0"
                    :max="9999"
                    :disabled="!customization.paintIndexOverride"
                    :input-props="digitOnlyInputProps"
                />
              </div>

              <div class="space-y-2">
                <h4 class="font-bold">{{ t('modals.weaponSkin.labels.pattern') }}</h4>
                <NInputNumber
                    v-model:value="customization.pattern"
                    :min="0"
                    :max="1000"
                    :input-props="digitOnlyInputProps"
                />
              </div>
            </div>

            <!-- Wear Slider -->
            <div class="w-full">
              <div class="flex items-start justify-between">
                <h4 class="font-bold">{{ t('modals.weaponSkin.labels.wear') }}</h4>
              </div>
              <WearSlider
                  v-model="customization.wear"
                  :max="selectedSkin?.maxFloat ?? 1"
                  :min="selectedSkin?.minFloat ?? 0"
              />
            </div>

            <!-- Save Button & Active Switch-->
            <div class="flex items-center justify-center w-full mt-0 gap-2">
              <!-- Save Weapon -->
              <NButton
type="success" secondary :class="[
                selectedSkin?.availableTeams !== 'both' ? 'w-96' : 'w-40']" @click="handleSave">
                {{ t('modals.weaponSkin.buttons.save') }}
              </NButton>
              <!-- Duplicate Weapon -->
              <div v-if="selectedSkin?.availableTeams === 'both'" class="">
                <NButton
                    :disabled="!selectedSkin"
                    type="default"
                    secondary
                    class="w-full"
                    @click="state.showDuplicateConfirm = true"
                >
                  {{ t('modals.weaponSkin.buttons.duplicate') }}
                </NButton>
              </div>

              <NSpace justify="center" align="center" class="w-full h-full">
                <NSwitch v-model:value="customization.active" size="large" class="col-span-1">
                  <template #checked>
                    {{ t('modals.weaponSkin.labels.itemActive') }}
                  </template>
                  <template #unchecked>
                    {{ t('modals.weaponSkin.labels.itemInactive') }}
                  </template>
                </NSwitch>
              </NSpace>
            </div>

            <!-- Stickers & Keychain Toggle and Duplicate Weapon Buttons -->
            <!--<div class="flex flex-row w-max items-center justify-center gap-4">
              <NButton
                  text
                  class="text-gray-400 hover:text-gray-200"
                  @click="state.showDetails = !state.showDetails"
                  icon-placement="right"
              >
                <template #icon>
                  <NIcon v-if="state.showDetails"><ChevronUpIcon/></NIcon>

                  <NIcon v-else><ChevronDownIcon/></NIcon>
                </template>
                {{ state.showDetails ? 'Hide' : 'Show' }} Stickers & Keychain
              </NButton>
            </div>-->
          </div>
        </div>

        <!-- Sticker and Keychain customization-->
        <div class="grid grid-cols-6 gap-4 auto-rows-fr" :class="{ 'h-[0px]': state.showDetails }">
          <!-- Stickers -->
          <div class="col-span-5 lg:col-span-5 md:col-span-3 mt-4">
            <h4 class="font-bold mb-1">{{ t('modals.weaponSkin.stickers.title') }}</h4>
            <div class="grid grid-cols-5 lg:grid-cols-5 md:grid-cols-3 sm:grid-cols-2 gap-x-2 min-h-36 max-h-36">
              <div
                  v-for="(sticker, index) in customization.stickers"
                  :key="index"
                  class="
                  sticker-slot group flex items-center justify-center bg-[#242424] p-2 rounded cursor-move
 transition-all relative hover:bg-[#2a2a2a] hover:shadow-md active:scale-[0.98]"
                  :class="{ 'inactive-item': !sticker, 'active-item': sticker }"
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
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                    <path d="M18 6l-12 12" />
                    <path d="M6 6l12 12" />
                  </svg>
                </button>
                <div v-if="sticker" class="h-28 relative group">
                  <img
                      :src="sticker.api.image"
                      :alt="sticker.api.name"
                      class="w-full h-full object-contain"
                  >
                  <div class="absolute inset-0 bg-white rounded-lg bg-opacity-10 backdrop-blur-sm opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <span class="text-white text-xs">{{ t('modals.weaponSkin.stickers.reposition') }}</span>
                  </div>
                </div>
                <div v-else class="h-28 flex items-center justify-center">
                  <span class="text-gray-400 text-sm">{{ t('modals.weaponSkin.stickers.add') }}</span>
                </div>
                <div class="mt-1 absolute top-0 left-1 text-xs text-gray-400">
                  #{{ index + 1 }}
                </div>
              </div>
            </div>
          </div>
          <!-- Keychain -->
          <div class="col-span-1 lg:col-span-1 md:col-span-3 sm:col-span-2 mt-4">
            <h4 class="font-bold mb-1">{{ t('modals.weaponSkin.keychain.title') }}</h4>
            <div
                class="relative group items-center flex justify-center bg-[#242424] p-2 rounded cursor-pointer hover:bg-[#2a2a2a] transition-all min-h-36 max-h-36"
                :class="{ 'inactive-item': !customization.keychain, 'active-item': customization.keychain }"
                @click="handleAddKeychain"
            >
              <button
                v-if="customization.keychain"
                type="button"
                class="absolute top-1 right-1 z-20 rounded-md border border-white/10 bg-black/40 p-1 text-gray-200 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-red-500/20 hover:text-red-200 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-red-400"
                :title="t('modals.weaponSkin.keychain.remove') as string"
                :aria-label="t('modals.weaponSkin.keychain.remove') as string"
                draggable="false"
                @mousedown.stop.prevent
                @click.stop.prevent="removeKeychain"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                  <path d="M18 6l-12 12" />
                  <path d="M6 6l12 12" />
                </svg>
              </button>
              <div v-if="customization.keychain" class=" relative group h-30">
                <img
                    :src="customization.keychain.api.image"
                    :alt="customization.keychain.api.name"
                    class="w-full h-full object-contain"
                >
                <p class="text-sm text-center text-gray-400 mt-1">{{ customization.keychain.api.name.replace('Charm | ', '') }}</p>
              </div>
              <div v-else class="h-30 flex items-center justify-center">
                <span class="text-gray-400 text-sm">{{ t('modals.weaponSkin.keychain.add') }}</span>
              </div>

            </div>
          </div>
        </div>
      </div>

      <!-- Skin list controls (Phase 2) -->
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div class="flex items-center gap-2">
          <span class="text-sm text-gray-300">{{ t('modals.weaponSkin.sort.label') }}</span>
          <NSelect
            v-model:value="ui.sortBy"
            size="small"
            class="w-44"
            :options="skinSortOptions"
          />
          <NButton 
            size="small" 
            secondary 
            type="default"
            :aria-label="`Sort ${ui.sortDir === 'asc' ? 'ascending' : 'descending'}`"
            @click="toggleSortDir"
          >
            {{ ui.sortDir === 'asc' ? '↑' : '↓' }}
          </NButton>
        </div>

        <div v-if="availableRarities.length > 0" class="flex flex-wrap items-center gap-2">
          <span class="text-sm text-gray-300">{{ t('modals.weaponSkin.filters.rarity') }}</span>
          <NButton
            v-for="rarity in availableRarities"
            :key="rarity.id"
            size="small"
            secondary
            :type="ui.rarityFilterIds.includes(rarity.id) ? 'primary' : 'default'"
            :style="ui.rarityFilterIds.includes(rarity.id) ? { borderColor: rarity.color } : undefined"
            :aria-label="`Filter by ${rarity.name} rarity`"
            :aria-pressed="ui.rarityFilterIds.includes(rarity.id)"
            @click="toggleRarityFilter(rarity.id)"
          >
            <span class="flex items-center gap-2">
              <span class="h-2 w-2 rounded-full" :style="{ background: rarity.color }" />
              {{ rarity.name }}
            </span>
          </NButton>
        </div>
      </div>

      <!-- Skins Grid -->
      <div v-if="state.isLoadingSkins" class="grid grid-cols-5 gap-4">
        <div
          v-for="i in PAGE_SIZE"
          :key="i"
          class="rounded-xl border border-[#313030] bg-[#101010] p-4"
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

      <div v-else class="grid grid-cols-5 lg:grid-cols-5 md:grid-cols-3 sm:grid-cols-2 gap-4">
        <NCard
            v-for="skin in paginatedSkins"
            :key="skin.id"
            :style="{
              borderColor: skin.rarity?.color || '#313030',
              background: 'linear-gradient(135deg, ' + ('#101010') +
              ', ' + (hexToRgba(skin.rarity?.color, '0.15') || '#313030') + ')'}"
            :class="[
            'hover:shadow-lg cursor-pointer transition-all rounded-xl',
            selectedSkin?.name === skin.name ? 'ring-2 ring-[var(--selection-ring)] border-0 opacity-85' : ''
          ]"
            @click="handleSkinSelect(skin)"
        >
          <div class="flex flex-col items-center">
            <img
                :src="skin.image"
                :alt="skin.name"
                class="w-full h-32 object-contain mb-2"
                loading="lazy"
            >
            <div class="w-full">
              <p class="text-sm text-white truncate">{{ skin.name }}</p>
              <div class="h-1 mt-2" :style="{ background: skin.rarity?.color || '#313030' }" />
            </div>
          </div>
        </NCard>
      </div>

      <!-- No Results -->
      <div v-if="!state.isLoadingSkins && sortedSkins.length === 0" class="flex justify-center items-center h-64">
        <NEmpty :description="t('modals.weaponSkin.noSearchResults') as string" />
      </div>

      <!-- Pagination -->
      <div v-if="totalPages > 1" class="flex justify-center mt-4">
        <NPagination
            v-model:page="state.currentPage"
            :page-count="totalPages"
            :page-slot="5"
        />
      </div>
      </NSpace>

      <!-- Sticker Modal -->
      <StickerModal
          v-model:visible="state.showStickerModal"
          :position="state.currentStickerPosition"
          :current-sticker="customization.stickers[state.currentStickerPosition]"
          :weapon-name="selectedSkin?.name || weapon?.defaultName"
          :team="customization.team"
          @select="handleStickerSelect"
      />

      <!-- Keychain Modal -->
      <KeychainModal
          v-model:visible="state.showKeychainModal"
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
          :item-type="t('modals.duplicateItem.type.weapon') as string"
          @confirm="handleDuplicate"
      />

      <ResetModal
          v-model:visible="state.showResetConfirm"
          :loading="state.isResetting"
          @confirm="handleReset"
      />

      <!-- Visual Customizer Modal -->
      <VisualCustomizerModal
          :visible="state.showVisualCustomizer"
          :weapon-skin="{
            name: selectedSkin?.name || '',
            image: selectedSkin?.image || '',
            defindex: selectedSkin?.weapon_defindex || 0
          }"
          :stickers="customization.stickers"
          :keychain="customization.keychain"
          :weapon-wear="customization.wear"
          :min-wear="selectedSkin?.minFloat || 0"
          :max-wear="selectedSkin?.maxFloat || 1"
          @update:visible="state.showVisualCustomizer = $event"
          @save="handleVisualCustomizerSave"
          @update-wear="handleVisualCustomizerWearUpdate"
      />
    </div>
  </NModal>
</template>
<style scoped lang="postcss">
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
  transition: border-color 0.5s ease-in-out, transform 0.5s ease-in-out, box-shadow 0.5s ease-in-out;
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
  background: linear-gradient(135deg, var(--selection-ring), #F59E0B);
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
</style>