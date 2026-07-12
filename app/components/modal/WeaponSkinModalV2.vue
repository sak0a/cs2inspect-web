<script setup lang="ts">
import { buttonColor } from '~/lib/buttonColors'
import type {
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
import type { CanvasState, CanvasElement } from '~/types/canvas'
import { useItemModal } from '~/composables/useItemModal'
import { steamAuth } from '~/services/steamAuth'
import { useLoadoutStore } from '~/stores/loadoutStore'
import { useAutoSave } from '~/composables/useAutoSave'
import {
  stickerToCanvasElement,
  keychainToCanvasElement,
  canvasElementToSticker,
  canvasElementToKeychain,
  generateStickerImageUrl,
  generateFlatKeychainUrl,
} from '~/utils/canvasCoordinates'
import type { ItemHistoryRecord } from '~/server/database/schema/itemHistory'

interface Props {
  visible: boolean
  weapon: IEnhancedWeapon | null
  isLoading?: boolean
  pageSize?: number
  triggerRect?: DOMRect | null
}

const props = defineProps<Props>()

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

// ─── User ────────────────────────────────────────────────────────────────────

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

// ─── Item modal composable ────────────────────────────────────────────────────

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
  fetchSkins,
  clearState,
  toggleSortDir,
  toggleRarityFilter,
} = useItemModal({
  itemType: 'weapon',
  pageSize: props.pageSize || 10,
  enableSortFilter: true,
})

// ─── Quick actions ────────────────────────────────────────────────────────────

const quickActions = useWeaponQuickActions({
  user: computed(() => user.value),
  loadoutId: computed(() => loadoutStore.selectedLoadoutId),
  weaponType: props.weapon?.category || '',
  onSuccess: async () => {},
})

// ─── Team badge ───────────────────────────────────────────────────────────────

const { teamLabel, teamBadgeClasses } = useTeamBadge(() => props.weapon?.databaseInfo?.team)

// ─── View state ───────────────────────────────────────────────────────────────

const showStickerModal = ref(false)
const showKeychainModal = ref(false)
const showHistoryPanel = ref(false)
const currentStickerPosition = ref(0)

// ─── Selected skin ───────────────────────────────────────────────────────────

const selectedSkin = ref<IEnhancedWeapon | null>(null)

// ─── Customization ────────────────────────────────────────────────────────────

const defaultCustomization: WeaponConfiguration = {
  active: false,
  team: 1,
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

// ─── Canvas state ─────────────────────────────────────────────────────────────

const canvasState = ref<CanvasState>({
  elements: [],
  selectedElementId: null,
  canvasSize: { width: 1120, height: 500 },
  weaponImage: '',
  isDragging: false,
  isEditing: true,
})

const selectedElement = ref<CanvasElement | null>(null)

const canvasPreviewRef = ref<{
  render: () => void
  init: () => void
  setupVideo: (fullSkinName?: string, fallbackImageUrl?: string) => Promise<void>
  loadAllElementImages: () => Promise<void>
  handleKeydown: (e: KeyboardEvent) => void
  selectElement: (id: string | null) => void
  updateScale: (delta: number) => void
  updateRotation: (delta: number) => void
  updateWear: (val: number) => void
  removeSelected: () => void
} | null>(null)

// ─── Canvas ↔ Customization sync ─────────────────────────────────────────────

const weaponNameForCanvas = computed(() =>
  selectedSkin.value?.name.split(' | ')[0] || props.weapon?.defaultName?.split(' | ')[0] || ''
)

function syncStickersToCanvas() {
  const elements: CanvasElement[] = []
  const weaponName = weaponNameForCanvas.value
  const previousSelectedId = canvasState.value.selectedElementId

  customization.value.stickers.forEach((sticker, index) => {
    if (sticker) {
      const el = stickerToCanvasElement(sticker, index, 10, weaponName)
      if (el) {
        // Preserve selection state
        if (el.id === previousSelectedId) el.selected = true
        elements.push(el)
      }
    }
  })

  if (customization.value.keychain) {
    const el = keychainToCanvasElement(customization.value.keychain, 5, weaponName)
    if (el) {
      if (el.id === previousSelectedId) el.selected = true
      elements.push(el)
    }
  }

  canvasState.value = {
    ...canvasState.value,
    elements,
    selectedElementId: previousSelectedId,
  }

  // Preload sticker/keychain images into canvas cache
  nextTick(() => {
    canvasPreviewRef.value?.loadAllElementImages()
  })
}

function syncCanvasToCustomization() {
  const stickers: (StickerConfiguration | null)[] = [null, null, null, null, null]
  const weaponName = weaponNameForCanvas.value

  canvasState.value.elements.forEach((el) => {
    if (el.type === 'sticker' && el.slotIndex != null) {
      const s = canvasElementToSticker(el, weaponName)
      if (s) {
        stickers[el.slotIndex] = {
          ...s,
          id: Number(el.assetId),
          slot: el.slotIndex,
          position: el.slotIndex,
          api: el.apiData as StickerConfiguration['api'],
        } as StickerConfiguration
      }
    }
  })

  const keychainEl = canvasState.value.elements.find((el) => el.type === 'keychain')
  const keychain = keychainEl ? canvasElementToKeychain(keychainEl, weaponName) : null

  // Apply back preserving existing api data
  stickers.forEach((s, i) => {
    if (s && customization.value.stickers[i]) {
      stickers[i] = { ...customization.value.stickers[i]!, ...s }
    }
  })

  customization.value = {
    ...customization.value,
    stickers,
    keychain: keychain
      ? ({ ...customization.value.keychain, ...keychain } as KeychainConfiguration)
      : null,
  }
}

// Watch stickers/keychain → re-sync to canvas when changed externally (not from canvas)
let skipCanvasSync = false

watch(
  () => [customization.value.stickers, customization.value.keychain] as const,
  () => {
    if (!skipCanvasSync) {
      syncStickersToCanvas()
    }
  },
  { deep: true }
)

function onCanvasStateUpdate(newState: CanvasState) {
  canvasState.value = newState
  skipCanvasSync = true
  syncCanvasToCustomization()
  nextTick(() => {
    skipCanvasSync = false
  })
}

function onElementSelected(el: CanvasElement | null) {
  selectedElement.value = el
}

// Sync canvas element changes (drag, scale, rotate) back to customization for auto-save
watch(
  () => canvasState.value.elements.map(el => ({
    x: el.position.x,
    y: el.position.y,
    scale: el.scale,
    rotation: el.rotation,
    wear: el.wear,
  })),
  () => {
    if (isInitializing.value || canvasState.value.isDragging) return
    skipCanvasSync = true
    syncCanvasToCustomization()
    nextTick(() => { skipCanvasSync = false })
  },
  { deep: true }
)

// Also sync when drag ends
watch(
  () => canvasState.value.isDragging,
  (dragging) => {
    if (!dragging && !isInitializing.value) {
      skipCanvasSync = true
      syncCanvasToCustomization()
      nextTick(() => { skipCanvasSync = false })
    }
  }
)

// Update canvas weapon image and trigger video setup when skin changes
async function initCanvasForSkin() {
  if (!canvasPreviewRef.value || !selectedSkin.value) return
  canvasState.value.weaponImage = selectedSkin.value.image || ''

  // Wait for DOM to stabilize (modal transition + v-if rendering)
  await nextTick()
  await new Promise(r => setTimeout(r, 50))

  if (!canvasPreviewRef.value) return
  canvasPreviewRef.value.init()

  const fullName = selectedSkin.value?.name || ''
  const fallbackImage = selectedSkin.value?.image || ''
  await canvasPreviewRef.value.setupVideo(fullName, fallbackImage)
  await canvasPreviewRef.value.loadAllElementImages()
  canvasPreviewRef.value.render()
}

watch(
  () => selectedSkin.value?.image,
  () => initCanvasForSkin()
)

// Also re-init when the canvas preview component mounts
watch(canvasPreviewRef, (ref) => {
  if (ref && selectedSkin.value) {
    initCanvasForSkin()
  }
})

function onEmptySlotClick(index: number, type: 'sticker' | 'keychain') {
  if (type === 'sticker') {
    currentStickerPosition.value = index
    showStickerModal.value = true
  } else {
    showKeychainModal.value = true
  }
}

// ─── Auto-save ────────────────────────────────────────────────────────────────

const autoSave = useAutoSave<WeaponConfiguration>(
  async (data) => {
    if (!selectedSkin.value) return
    emit('auto-save', selectedSkin.value, data)
  },
  {
    debounceMs: 1500,
    retryAttempts: 3,
    onSaveError: (error) => {
      console.error('[WeaponSkinModalV2] Auto-save failed:', error)
    },
  }
)

const isInitializing = ref(false)

watch(
  () => customization.value,
  (newVal) => {
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

// Round wear to 3 decimal places
watch(
  () => customization.value.paintwear,
  (newWear) => {
    if (typeof newWear === 'number' && !isNaN(newWear)) {
      customization.value.paintwear = Number(newWear.toFixed(3))
    }
  },
  { immediate: true }
)

// ─── Skin selection ───────────────────────────────────────────────────────────

function handleSkinSelect(skin: APIWeaponSkin) {
  if (!props.weapon) {
    emit('error', 'No weapon available for skin selection')
    return
  }

  try {
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

    const newMinFloat = skin.min_float ?? 0
    const newMaxFloat = skin.max_float ?? 1
    const currentFloat = customization.value.paintwear
    const clampedFloat = Math.max(newMinFloat, Math.min(newMaxFloat, currentFloat))

    customization.value = {
      ...customization.value,
      paintindex: Number(skin.paint_index),
      paintwear: clampedFloat,
    }

    // Update canvas weapon image
    canvasState.value.weaponImage = skin.image
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Failed to select skin'
    emit('error', msg)
  }
}

// ─── Sticker bar drag-and-drop ────────────────────────────────────────────────

function handleStickerDragStart(e: DragEvent, fromIndex: number) {
  if (!e.dataTransfer) return
  e.dataTransfer.effectAllowed = 'move'
  e.dataTransfer.setData('text/plain', fromIndex.toString())
}

function handleStickerDragEnd() {
  // nothing
}

function handleStickerDragOver(e: DragEvent) {
  e.preventDefault()
  e.stopPropagation()
}

function handleStickerDragLeave(_e: DragEvent) {
  // nothing
}

function handleStickerDrop(e: DragEvent, toIndex: number) {
  e.preventDefault()
  const fromIndex = parseInt(e.dataTransfer?.getData('text/plain') || '-1')
  if (fromIndex === -1 || fromIndex === toIndex) return

  const stickers = [...customization.value.stickers]
  const temp = stickers[fromIndex] ?? null
  stickers[fromIndex] = stickers[toIndex] ?? null
  stickers[toIndex] = temp
  customization.value = { ...customization.value, stickers }
}

// ─── Sticker / keychain handlers ─────────────────────────────────────────────

function handleStickerSlotClick(index: number) {
  currentStickerPosition.value = index
  showStickerModal.value = true
}

function handleStickerSelect(stickerData: StickerConfiguration | null) {
  const stickers = [...customization.value.stickers]
  stickers[currentStickerPosition.value] = stickerData
  customization.value = { ...customization.value, stickers }
}

function handleKeychainSelect(keychainData: KeychainConfiguration | null) {
  customization.value = { ...customization.value, keychain: keychainData }
}

// ─── Edit toolbar handlers ────────────────────────────────────────────────────

function handleEditToolbarChange() {
  if (!selectedElement.value) return
  // Open the sticker modal to replace
  if (selectedElement.value.type === 'sticker' && selectedElement.value.slotIndex != null) {
    currentStickerPosition.value = selectedElement.value.slotIndex
    showStickerModal.value = true
  } else if (selectedElement.value.type === 'keychain') {
    showKeychainModal.value = true
  }
}

function handleEditToolbarRemove() {
  canvasPreviewRef.value?.removeSelected()
  selectedElement.value = null
}

function handleEditToolbarScale(delta: number) {
  canvasPreviewRef.value?.updateScale(delta)
}

function handleEditToolbarRotation(delta: number) {
  canvasPreviewRef.value?.updateRotation(delta)
}

async function handleEditToolbarWear(wear: number) {
  if (!selectedElement.value || selectedElement.value.type !== 'sticker') return
  selectedElement.value.wear = wear
  const newImageUrl = generateStickerImageUrl(Number(selectedElement.value.assetId), wear)
  if (selectedElement.value.apiData) {
    selectedElement.value.apiData.image = newImageUrl
  }
  await canvasPreviewRef.value?.loadAllElementImages()
  canvasPreviewRef.value?.render()
  // Sync to customization so auto-save picks it up
  skipCanvasSync = true
  syncCanvasToCustomization()
  nextTick(() => { skipCanvasSync = false })
}

async function handleEditToolbarSeed(seed: number) {
  if (!selectedElement.value || selectedElement.value.type !== 'keychain') return
  selectedElement.value.seed = seed
  const name = selectedElement.value.apiData?.name ?? ''
  const wrappedStickerId = selectedElement.value.wrapped_sticker_id ?? undefined
  const newImageUrl = generateFlatKeychainUrl(name, seed, undefined, wrappedStickerId || undefined)
  if (selectedElement.value.apiData) {
    selectedElement.value.apiData.image = newImageUrl
  }
  await canvasPreviewRef.value?.loadAllElementImages()
  canvasPreviewRef.value?.render()
  // Sync to customization so auto-save picks it up
  skipCanvasSync = true
  syncCanvasToCustomization()
  nextTick(() => { skipCanvasSync = false })
}

// ─── Inspect link import ──────────────────────────────────────────────────────

async function handleImportInspectLink(inspectUrl: string) {
  if (!props.weapon || !user.value) {
    const msg = 'Missing weapon or user data'
    state.value.error = msg
    emit('error', msg)
    return
  }

  try {
    state.value.isImporting = true
    state.value.error = null

    const config = await quickActions.importFromLink(
      props.weapon.weapon_defindex,
      customization.value.team,
      inspectUrl
    )

    customization.value = config

    const matchingSkin = apiState.value.skins.find(
      (skin) => Number(skin.paint_index) === config.paintindex
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

    message.success(t('modals.weaponSkin.importSuccess') as string, { duration: 3000 })
    state.value.showImportModal = false
  } catch (error) {
    const msg =
      error instanceof Error
        ? error.message
        : (t('modals.weaponSkin.importFailedDefault') as string)
    state.value.error = msg
    message.error(msg, { duration: 3000 })
    emit('error', msg)
  } finally {
    state.value.isImporting = false
  }
}

// ─── Inspect link creation ────────────────────────────────────────────────────

async function handleCreateInspectLink() {
  if (!props.weapon || !selectedSkin.value || !user.value) {
    const msg = 'Missing required data for inspect link creation'
    state.value.error = msg
    emit('error', msg)
    return
  }

  if (!customization.value.paintindex || customization.value.paintindex === 0) {
    const msg = 'No skin configured for inspect link creation'
    state.value.error = msg
    emit('error', msg)
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

    await navigator.clipboard.writeText(data.inspectUrl)
    message.success(t('modals.weaponSkin.generateInspectUrlSuccess') as string, { duration: 3000 })
  } catch (error) {
    const msg =
      error instanceof Error
        ? error.message
        : (t('modals.weaponSkin.generateInspectUrlFailed') as string)
    state.value.error = msg
    message.error(msg)
    emit('error', msg)
  } finally {
    state.value.isLoadingInspect = false
  }
}

// ─── Reset ────────────────────────────────────────────────────────────────────

async function handleReset() {
  if (!selectedSkin.value) {
    emit('error', 'No weapon selected for reset')
    return
  }

  state.value.isResetting = true
  try {
    state.value.error = null
    customization.value = { ...customization.value, reset: true } as WeaponConfiguration & {
      reset: boolean
    }
    state.value.showResetConfirm = false
    handleSave()
  } catch (error) {
    const msg =
      error instanceof Error ? error.message : (t('modals.weaponSkin.resetFailed') as string)
    state.value.error = msg
    message.error(msg)
    emit('error', msg)
  } finally {
    state.value.isResetting = false
  }
}

// ─── History restore ──────────────────────────────────────────────────────────

async function handleHistoryRestore(record: ItemHistoryRecord) {
  if (!record.configuration) return

  let config = record.configuration
  if (typeof config === 'string') {
    try {
      config = JSON.parse(config)
    } catch {
      console.error('[WeaponSkinModalV2] Failed to parse history configuration')
      return
    }
  }

  const toNumber = (val: unknown, def: number): number => {
    if (typeof val === 'number' && !isNaN(val)) return val
    if (typeof val === 'string') {
      const p = parseFloat(val)
      return isNaN(p) ? def : p
    }
    return def
  }

  const toInt = (val: unknown, def: number): number => {
    if (typeof val === 'number' && !isNaN(val)) return Math.floor(val)
    if (typeof val === 'string') {
      const p = parseInt(val, 10)
      return isNaN(p) ? def : p
    }
    return def
  }

  const restoredStickers: (StickerConfiguration | null)[] = [null, null, null, null, null]
  const stickerPromises: Promise<void>[] = []

  if (config.stickers && Array.isArray(config.stickers)) {
    for (let index = 0; index < Math.min(config.stickers.length, 5); index++) {
      let s = config.stickers[index]
      if (!s) continue
      if (typeof s === 'string') {
        try {
          s = JSON.parse(s)
        } catch {
          continue
        }
      }
      if (typeof s !== 'object' || s === null) continue

      const id = toInt(s.id, 0)
      if (id <= 0) continue

      restoredStickers[index] = {
        id,
        slot: index,
        position: index,
        x: toNumber(s.x, 0),
        y: toNumber(s.y, 0),
        wear: toNumber(s.wear, 0),
        scale: toNumber(s.scale, 1),
        rotation: toNumber(s.rotation, 0),
      } as StickerConfiguration

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
          .catch(() => {})
      )
    }
  }

  let restoredKeychain: KeychainConfiguration | null = null
  let keychainPromise: Promise<void> | null = null

  if (config.keychain) {
    let keychainData: KeychainJSON | string | null = config.keychain as KeychainJSON | string | null
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
          wrapped_sticker_id:
            toInt(keychainData.wrapped_sticker_id, 0) > 0
              ? toInt(keychainData.wrapped_sticker_id, 0)
              : undefined,
          highlight_reel_id:
            toInt(keychainData.highlight_reel_id, 0) > 0
              ? toInt(keychainData.highlight_reel_id, 0)
              : undefined,
        } as KeychainConfiguration

        keychainPromise = $fetch<{ success: boolean; data: APIKeychain[] }>(
          `/api/data/keychains?id=keychain-${keychainId}`
        )
          .then((response) => {
            const kd = response.data?.[0]
            if (kd && restoredKeychain) {
              restoredKeychain = {
                ...restoredKeychain!,
                api: { name: kd.name, image: kd.image, rarity: kd.rarity },
              }
            }
          })
          .catch(() => {})
      }
    }
  }

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

  showHistoryPanel.value = false
}

// ─── Duplicate ────────────────────────────────────────────────────────────────

async function handleDuplicate() {
  if (!selectedSkin.value) {
    emit('error', 'No weapon selected for duplication')
    return
  }

  state.value.isDuplicating = true
  try {
    state.value.error = null
    const otherTeam = props.weapon?.databaseInfo?.team === 1 ? 2 : 1
    const duplicateData: WeaponConfiguration = { ...customization.value, team: otherTeam }
    emit('duplicate', selectedSkin.value, duplicateData)
    state.value.showDuplicateConfirm = false
  } catch (error) {
    const msg =
      error instanceof Error ? error.message : (t('modals.weaponSkin.duplicateFailed') as string)
    state.value.error = msg
    message.error(msg)
    emit('error', msg)
  } finally {
    state.value.isDuplicating = false
  }
}

// ─── Save / Close ─────────────────────────────────────────────────────────────

function handleSave() {
  if (!selectedSkin.value) return
  emit('select', selectedSkin.value, customization.value)
  autoSave.markAsSaved()
  handleClose()
}

async function handleClose() {
  if (selectedSkin.value && customization.value.paintindex !== null) {
    await autoSave.flushPending()
  }
  emit('update:visible', false)
  setTimeout(() => resetAllState(), 300)
}

// ─── Keyboard shortcuts ───────────────────────────────────────────────────────

function isEditableTarget(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null
  if (!el) return false
  if (el.isContentEditable) return true
  const tag = el.tagName?.toLowerCase()
  if (tag === 'input' || tag === 'textarea' || tag === 'select') return true
  return Boolean(el.closest('input, textarea, select, [contenteditable="true"]'))
}

function handleModalKeydown(e: KeyboardEvent) {
  if (e.isComposing || e.defaultPrevented) return
  if (e.ctrlKey || e.metaKey || e.altKey) return

  // Forward to canvas for arrow keys
  if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
    canvasPreviewRef.value?.handleKeydown(e)
    return
  }

  // Escape → deselect element or close
  if (e.key === 'Escape') {
    if (selectedElement.value) {
      canvasPreviewRef.value?.selectElement(null)
      e.stopPropagation()
      return
    }
    handleClose()
    return
  }

  if (
    showStickerModal.value ||
    showKeychainModal.value ||
    state.value.showImportModal ||
    state.value.showDuplicateConfirm ||
    state.value.showResetConfirm ||
    showHistoryPanel.value
  ) {
    return
  }

  if (isEditableTarget(e.target)) return

  const target = e.target as HTMLElement | null
  if (target?.closest('button, a, [role="button"]')) return

  if (e.key === 'Enter') {
    e.preventDefault()
    handleSave()
    return
  }

  // 1-5 → open sticker slot modal
  if (/^[1-5]$/.test(e.key)) {
    e.preventDefault()
    const slotIndex = Number(e.key) - 1
    currentStickerPosition.value = slotIndex
    showStickerModal.value = true
    return
  }

  if (e.key === 'r' || e.key === 'R') {
    if (!selectedSkin.value || customization.value.paintindex === 0) return
    e.preventDefault()
    state.value.showResetConfirm = true
    return
  }

  if (e.key === 'd' || e.key === 'D') {
    if (!selectedSkin.value || selectedSkin.value.availableTeams !== 'both') return
    e.preventDefault()
    state.value.showDuplicateConfirm = true
  }
}

// ─── Reset all state ──────────────────────────────────────────────────────────

function resetAllState() {
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
  clearState()
  showStickerModal.value = false
  showKeychainModal.value = false
  showHistoryPanel.value = false
  currentStickerPosition.value = 0
  selectedSkin.value = null
  selectedElement.value = null
  canvasState.value = {
    elements: [],
    selectedElementId: null,
    canvasSize: { width: 1120, height: 500 },
    weaponImage: '',
    isDragging: false,
    isEditing: true,
  }
}

// ─── Watchers ─────────────────────────────────────────────────────────────────

watch(
  () => props.visible,
  (isVisible) => {
    if (!isVisible) {
      setTimeout(() => resetAllState(), 300)
    } else if (sortedSkins.value.length > 0) {
      const newTotalPages = Math.ceil(sortedSkins.value.length / PAGE_SIZE.value)
      if (state.value.currentPage > newTotalPages && newTotalPages > 0) {
        state.value.currentPage = newTotalPages
      }
    }
  },
  { immediate: true }
)

watch(
  () => props.weapon,
  () => {
    if (props.visible && props.weapon) {
      try {
        isInitializing.value = true
        state.value.error = null

        resetAllState()
        autoSave.resetStatus()

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

        nextTick(() => {
          syncStickersToCanvas()
          // Keep isInitializing true until canvas has fully settled
          // to prevent false auto-save triggers during init
          setTimeout(() => {
            isInitializing.value = false
          }, 500)
        })
      } catch (error) {
        isInitializing.value = false
        const msg = error instanceof Error ? error.message : 'Failed to initialize weapon data'
        state.value.error = msg
        emit('error', msg)
      }
    }
  }
)

onUnmounted(() => {
  // canvasPreviewRef handles its own cleanup via composables
})

// ─── Computed helpers ─────────────────────────────────────────────────────────

const modalTitle = computed(() => {
  return props.weapon
    ? (t('modals.weaponSkin.title', { weaponName: props.weapon?.defaultName }) as string)
    : (t('modals.weaponSkin.defaultTitle') as string)
})

// otherTeamHasSkin: whether the other team already has a configured skin
// We don't have cross-team data here so pass false (safe default)
const otherTeamHasSkin = false

// Cast availableRarities to match SkinGrid's expected type (id: number vs string)
const skinGridRarities = computed(() =>
  availableRarities.value.map((r) => ({
    ...r,
    id: typeof r.id === 'number' ? r.id : (r as { id: string | number }).id,
  }))
)

const activeRarityIdSet = computed(() => new Set(rarityFilterIds.value as unknown as number[]))
</script>

<template>
  <ModalShell
    :visible="visible"
    :trigger-rect="triggerRect"
    @update:visible="handleClose"
  >
    <template #header>
      <div class="flex items-center gap-3">
        <span class="leading-none font-semibold">{{ modalTitle }}</span>
        <span
          v-if="teamLabel"
          class="inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold"
          :class="teamBadgeClasses"
        >
          {{ teamLabel }}
        </span>
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
      <div class="flex items-center shrink-0">
        <!-- Reset -->
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
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M20 11a8.1 8.1 0 0 0 -15.5 -2m-.5 -4v4h4" /><path d="M4 13a8.1 8.1 0 0 0 15.5 2m.5 4v-4h-4" /></svg>
          </template>
          {{ t('modals.weaponSkin.buttons.reset') }}
        </SButton>
        <NDivider vertical />

        <!-- History -->
        <SButton
          variant="elevated"
          rounded="full"
          :disabled="!selectedSkin"
          :aria-label="String(t('history.title'))"
          class="whitespace-nowrap px-5 py-1.5 !overflow-visible"
          data-tutorial="history-button"
          @click="showHistoryPanel = true"
        >
          <template #icon-left>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M12 8l0 4l2 2" /><path d="M3.05 11a9 9 0 1 1 .5 4m-.5 5v-5h5" /></svg>
          </template>
          {{ t('history.title') }}
        </SButton>
        <NDivider vertical />

        <!-- Import -->
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
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M4 8v-2a2 2 0 0 1 2 -2h2" /><path d="M4 16v2a2 2 0 0 0 2 2h2" /><path d="M16 4h2a2 2 0 0 1 2 2v2" /><path d="M16 20h2a2 2 0 0 0 2 -2v-2" /><path d="M8 11a3 3 0 1 0 6 0a3 3 0 0 0 -6 0" /><path d="M16 16l-2.5 -2.5" /></svg>
          </template>
          {{ t('modals.weaponSkin.buttons.importFromLink') }}
        </SButton>
        <NDivider vertical />

        <!-- Generate Link -->
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
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M4 8v-2a2 2 0 0 1 2 -2h2" /><path d="M4 16v2a2 2 0 0 0 2 2h2" /><path d="M16 4h2a2 2 0 0 1 2 2v2" /><path d="M16 20h2a2 2 0 0 0 2 -2v-2" /><path d="M8 11a3 3 0 1 0 6 0a3 3 0 0 0 -6 0" /><path d="M16 16l-2.5 -2.5" /></svg>
          </template>
          {{ t('modals.weaponSkin.buttons.generateLink') }}
        </SButton>
      </div>
    </template>

    <!-- Modal body -->
    <div class="flex flex-col flex-1 min-h-0 outline-none" tabindex="-1" @keydown="handleModalKeydown">
      <!-- Preview area -->
      <div v-if="selectedSkin" class="relative" style="min-height: 420px;">
        <!-- Canvas preview fills width, right-padded for settings panel -->
        <div class="pr-[240px]">
          <CanvasPreview
            ref="canvasPreviewRef"
            :canvas-state="canvasState"
            :weapon-defindex="selectedSkin.weapon_defindex"
            :weapon-name="weaponNameForCanvas"
            :paintindex="customization.paintindex ?? undefined"
            :wear="customization.paintwear"
            :min-wear="selectedSkin.minFloat || 0"
            :max-wear="selectedSkin.maxFloat || 1"
            @update:canvas-state="onCanvasStateUpdate"
            @element-selected="onElementSelected"
            @empty-slot-click="onEmptySlotClick"
          />
        </div>

        <!-- Floating settings panel -->
        <FloatingSettings
          :customization="customization"
          :selected-skin-name="selectedSkin.name"
          :available-teams="selectedSkin.availableTeams"
          :min-float="selectedSkin.minFloat || 0"
          :max-float="selectedSkin.maxFloat || 1"
          @update:customization="customization = $event"
          @duplicate="state.showDuplicateConfirm = true"
        />

        <!-- Sticker bar -->
        <StickerBar
          :stickers="customization.stickers"
          :keychain="customization.keychain"
          :selected-slot-index="selectedElement?.type === 'sticker' ? (selectedElement?.slotIndex ?? null) : null"
          @slot-click="handleStickerSlotClick"
          @keychain-click="showKeychainModal = true"
          @drag-start="handleStickerDragStart"
          @drag-end="handleStickerDragEnd"
          @drag-over="handleStickerDragOver"
          @drag-leave="handleStickerDragLeave"
          @drop="handleStickerDrop"
        />

        <!-- Skin name overlay -->
        <div class="absolute bottom-16 left-3 text-lg font-bold text-white drop-shadow-lg pointer-events-none">
          {{ selectedSkin.name }}
        </div>

        <!-- Edit toolbar (floating, bottom-right of canvas, left of settings panel) -->
        <Transition name="toolbar-fade">
          <div
            v-if="selectedElement"
            class="absolute -bottom-1 z-30"
            style="right: 252px; height: 54px; background: rgba(18,18,18,0.92); backdrop-filter: blur(12px); border: 1px solid rgba(255,255,255,0.07); border-radius: 8px; box-shadow: 0 6px 24px rgba(0,0,0,0.5); display: flex; align-items: center;"
          >
            <EditToolbar
              :element="selectedElement"
              @update-scale="handleEditToolbarScale"
              @update-rotation="handleEditToolbarRotation"
              @update-wear="handleEditToolbarWear"
              @update-seed="handleEditToolbarSeed"
              @change="handleEditToolbarChange"
              @remove="handleEditToolbarRemove"
            />
          </div>
        </Transition>
      </div>

      <!-- Skin grid (scrollable, fills remaining space) -->
      <SkinGrid
        class="mt-6 flex-1 min-h-0 overflow-y-auto"
        :skins="(displayedSkins as unknown as IEnhancedWeapon[])"
        :is-loading="state.isLoadingSkins"
        :is-loading-more="state.isLoadingMore"
        :has-more="hasMore"
        :selected-paint-index="customization.paintindex"
        :sort-by="sortBy"
        :sort-dir="sortDir"
        :search-query="state.searchQuery"
        :available-rarities="(skinGridRarities as unknown as Array<{ id: number; name: string; color: string }>)"
        :active-rarity-ids="activeRarityIdSet"
        @select-skin="handleSkinSelect($event as unknown as APIWeaponSkin)"
        @load-more="loadMore"
        @toggle-sort-dir="toggleSortDir"
        @update:sort-by="sortBy = $event"
        @update:search-query="state.searchQuery = $event"
        @toggle-rarity="toggleRarityFilter($event as unknown as string)"
      />
    </div>

    <!-- Child modals -->
    <LazyStickerModal
      v-model:visible="showStickerModal"
      :position="currentStickerPosition"
      :current-sticker="customization.stickers[currentStickerPosition]"
      :weapon-name="selectedSkin?.name || weapon?.defaultName"
      :team="customization.team"
      @select="handleStickerSelect"
    />

    <KeychainModal
      v-model:visible="showKeychainModal"
      :current-keychain="customization.keychain"
      :weapon-name="selectedSkin?.name || weapon?.defaultName"
      :team="customization.team"
      @select="handleKeychainSelect"
    />

    <InspectURLModal
      v-model:visible="state.showImportModal"
      :loading="state.isImporting"
      @submit="handleImportInspectLink"
    />

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

    <LazyItemHistoryPanel
      v-model:visible="showHistoryPanel"
      item-type="weapon"
      :category="props.weapon?.category as any"
      :defindex="props.weapon?.weapon_defindex || 0"
      :team="customization.team"
      :steam-id="user?.steamId || ''"
      :loadout-id="loadoutStore.selectedLoadoutId || 0"
      @restore="handleHistoryRestore"
    />
  </ModalShell>
</template>

<style scoped>
.toolbar-fade-enter-active { transition: opacity 200ms ease-out; }
.toolbar-fade-leave-active { transition: opacity 150ms ease-in; }
.toolbar-fade-enter-from,
.toolbar-fade-leave-to { opacity: 0; }

</style>
