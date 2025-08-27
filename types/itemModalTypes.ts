import type { 
  APISkin, 
  WeaponCustomization, 
  KnifeCustomization, 
  GloveCustomization,
  IEnhancedWeapon,
  IEnhancedKnife,
  IEnhancedGlove,
  SteamUser
} from '~/server/utils/interfaces'

// ============================================================================
// CORE TYPE DEFINITIONS
// ============================================================================

/**
 * Union type for all item types
 */
export type ItemType = 'weapon' | 'knife' | 'glove'

/**
 * Union type for all enhanced item interfaces
 */
export type EnhancedItem = IEnhancedWeapon | IEnhancedKnife | IEnhancedGlove

/**
 * Union type for all customization interfaces
 */
export type ItemCustomization = WeaponCustomization | KnifeCustomization | GloveCustomization

/**
 * Type-safe customization mapping
 */
export type ItemCustomizationMap = {
  weapon: WeaponCustomization
  knife: KnifeCustomization
  glove: GloveCustomization
}

/**
 * Type-safe enhanced item mapping
 */
export type EnhancedItemMap = {
  weapon: IEnhancedWeapon
  knife: IEnhancedKnife
  glove: IEnhancedGlove
}

// ============================================================================
// MODAL COMPONENT PROPS
// ============================================================================

/**
 * Base props for all item modal components
 */
export interface BaseItemModalProps {
  visible: boolean
  user: SteamUser | null
}

/**
 * Props for weapon modal component
 */
export interface WeaponModalProps extends BaseItemModalProps {
  weapon: IEnhancedWeapon | null
}

/**
 * Props for knife modal component
 */
export interface KnifeModalProps extends BaseItemModalProps {
  weapon: IEnhancedKnife | null
}

/**
 * Props for glove modal component
 */
export interface GloveModalProps extends BaseItemModalProps {
  weapon: IEnhancedGlove | null
}

/**
 * Union type for all modal props
 */
export type ItemModalProps = WeaponModalProps | KnifeModalProps | GloveModalProps

// ============================================================================
// MODAL COMPONENT EMITS
// ============================================================================

/**
 * Base emits for all item modal components
 */
export interface BaseItemModalEmits {
  'update:visible': [visible: boolean]
}

/**
 * Emits for weapon modal component
 */
export interface WeaponModalEmits extends BaseItemModalEmits {
  select: [weapon: IEnhancedWeapon, customization: WeaponCustomization]
  duplicate: [weapon: IEnhancedWeapon, customization: WeaponCustomization]
}

/**
 * Emits for knife modal component
 */
export interface KnifeModalEmits extends BaseItemModalEmits {
  save: [weapon: IEnhancedKnife, customization: KnifeCustomization]
  duplicate: [weapon: IEnhancedKnife, customization: KnifeCustomization]
}

/**
 * Emits for glove modal component
 */
export interface GloveModalEmits extends BaseItemModalEmits {
  select: [weapon: IEnhancedGlove, customization: GloveCustomization]
  duplicate: [weapon: IEnhancedGlove, customization: GloveCustomization]
}

// ============================================================================
// ACTION HANDLER TYPES
// ============================================================================

/**
 * Type for duplicate action handler
 */
export type DuplicateHandler<T extends EnhancedItem, C extends ItemCustomization> = (
  item: T,
  customization: C
) => void

/**
 * Type for reset action handler
 */
export type ResetHandler<T extends EnhancedItem, C extends ItemCustomization> = (
  item: T,
  customization: C
) => void

/**
 * Type for save action handler
 */
export type SaveHandler<T extends EnhancedItem, C extends ItemCustomization> = (
  item: T,
  customization: C
) => void

/**
 * Type-safe duplicate handler mapping
 */
export type DuplicateHandlerMap = {
  weapon: DuplicateHandler<IEnhancedWeapon, WeaponCustomization>
  knife: DuplicateHandler<IEnhancedKnife, KnifeCustomization>
  glove: DuplicateHandler<IEnhancedGlove, GloveCustomization>
}

/**
 * Type-safe reset handler mapping
 */
export type ResetHandlerMap = {
  weapon: ResetHandler<IEnhancedWeapon, WeaponCustomization>
  knife: ResetHandler<IEnhancedKnife, KnifeCustomization>
  glove: ResetHandler<IEnhancedGlove, GloveCustomization>
}

/**
 * Type-safe save handler mapping
 */
export type SaveHandlerMap = {
  weapon: SaveHandler<IEnhancedWeapon, WeaponCustomization>
  knife: SaveHandler<IEnhancedKnife, KnifeCustomization>
  glove: SaveHandler<IEnhancedGlove, GloveCustomization>
}

// ============================================================================
// MODAL STATE TYPES
// ============================================================================

/**
 * Common modal state interface
 */
export interface BaseModalState {
  isLoadingSkins: boolean
  searchQuery: string
  currentPage: number
  showImportModal: boolean
  showDuplicateConfirm: boolean
  showResetConfirm: boolean
}

/**
 * Weapon-specific modal state
 */
export interface WeaponModalState extends BaseModalState {
  showStickerModal: boolean
  showKeychainModal: boolean
  currentStickerPosition: number
}

/**
 * Knife-specific modal state
 */
export interface KnifeModalState extends BaseModalState {
  // Knives don't have additional state beyond base
}

/**
 * Glove-specific modal state
 */
export interface GloveModalState extends BaseModalState {
  // Gloves don't have additional state beyond base
}

/**
 * Action state for all modals
 */
export interface ModalActionState {
  isImporting: boolean
  isLoadingInspect: boolean
  isResetting: boolean
  isDuplicating: boolean
}

// ============================================================================
// API PAYLOAD TYPES
// ============================================================================

/**
 * Base inspect payload
 */
export interface BaseInspectPayload {
  defindex: number
  paintindex: number
  paintseed: number
  paintwear: number
  rarity: number
}

/**
 * Weapon inspect payload
 */
export interface WeaponInspectPayload extends BaseInspectPayload {
  statTrak?: boolean
  statTrakCount?: number
  nameTag?: string
  stickers?: any[]
  keychain?: any
}

/**
 * Knife inspect payload
 */
export interface KnifeInspectPayload extends BaseInspectPayload {
  statTrak?: boolean
  statTrakCount?: number
  nameTag?: string
}

/**
 * Glove inspect payload (same as base)
 */
export interface GloveInspectPayload extends BaseInspectPayload {
  // Gloves only use base payload
}

/**
 * Union type for all inspect payloads
 */
export type InspectPayload = WeaponInspectPayload | KnifeInspectPayload | GloveInspectPayload

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Extract item type from enhanced item
 */
export type ExtractItemType<T> = 
  T extends IEnhancedWeapon ? 'weapon' :
  T extends IEnhancedKnife ? 'knife' :
  T extends IEnhancedGlove ? 'glove' :
  never

/**
 * Extract customization type from enhanced item
 */
export type ExtractCustomizationType<T> = 
  T extends IEnhancedWeapon ? WeaponCustomization :
  T extends IEnhancedKnife ? KnifeCustomization :
  T extends IEnhancedGlove ? GloveCustomization :
  never

/**
 * Type guard for weapon items
 */
export function isWeaponItem(item: EnhancedItem): item is IEnhancedWeapon {
  return 'stickers' in item || 'keychain' in item
}

/**
 * Type guard for knife items
 */
export function isKnifeItem(item: EnhancedItem): item is IEnhancedKnife {
  return 'category' in item && item.category === 'knife'
}

/**
 * Type guard for glove items
 */
export function isGloveItem(item: EnhancedItem): item is IEnhancedGlove {
  return 'category' in item && item.category === 'glove'
}

/**
 * Type guard for weapon customization
 */
export function isWeaponCustomization(customization: ItemCustomization): customization is WeaponCustomization {
  return 'stickers' in customization || 'keychain' in customization
}

/**
 * Type guard for knife customization
 */
export function isKnifeCustomization(customization: ItemCustomization): customization is KnifeCustomization {
  return 'statTrak' in customization && !('stickers' in customization)
}

/**
 * Type guard for glove customization
 */
export function isGloveCustomization(customization: ItemCustomization): customization is GloveCustomization {
  return !('statTrak' in customization) && !('stickers' in customization)
}
