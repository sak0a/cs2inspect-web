/**
 * @fileoverview Legacy type definitions for item modals
 * @deprecated This file is deprecated. Use the new type system from ~/types instead.
 *
 * This file provides backward compatibility during the migration to the new type system.
 * All types here are now available in the main ~/types module with improved structure.
 *
 * Migration guide:
 * - ItemType -> ItemType (from ~/types)
 * - EnhancedItem -> ItemData (from ~/types)
 * - ItemCustomization -> ItemConfiguration (from ~/types)
 * - WeaponCustomization -> WeaponConfiguration (from ~/types)
 * - KnifeCustomization -> KnifeConfiguration (from ~/types)
 * - GloveCustomization -> GloveConfiguration (from ~/types)
 * - APISkin -> APIWeaponSkin (from ~/types)
 * - SteamUser -> UserProfile (from ~/types)
 */

// New type system imports
import type {
  ItemType as NewItemType,
  ItemData,
  ItemConfiguration,
  WeaponConfiguration,
  KnifeConfiguration,
  GloveConfiguration,
  APIWeaponSkin,
  UserProfile
} from '~/types'

// Legacy imports for backward compatibility
import type {
  APISkin,
  WeaponCustomization,
  KnifeCustomization,
  GloveCustomization,
  IEnhancedWeapon,
  IEnhancedKnife,
  IEnhancedGlove
} from '~/server/utils/interfaces'

// ============================================================================
// DEPRECATED TYPE DEFINITIONS (Use ~/types instead)
// ============================================================================

/**
 * @deprecated Use ItemType from ~/types instead
 * Union type for all item types
 */
export type ItemType = NewItemType

/**
 * @deprecated Use ItemData from ~/types instead
 * Union type for all enhanced item interfaces
 */
export type EnhancedItem = IEnhancedWeapon | IEnhancedKnife | IEnhancedGlove

/**
 * @deprecated Use ItemConfiguration from ~/types instead
 * Union type for all customization interfaces
 */
export type ItemCustomization = ItemConfiguration

/**
 * @deprecated Use ItemConfigurationMap from ~/types instead
 * Type-safe customization mapping
 */
export type ItemCustomizationMap = {
  weapon: WeaponConfiguration
  knife: KnifeConfiguration
  glove: GloveConfiguration
}

/**
 * @deprecated Use ItemDataMap from ~/types instead
 * Type-safe enhanced item mapping
 */
export type EnhancedItemMap = {
  weapon: IEnhancedWeapon
  knife: IEnhancedKnife
  glove: IEnhancedGlove
}

// ============================================================================
// DEPRECATED MODAL COMPONENT PROPS (Use ~/types/components/modals instead)
// ============================================================================

/**
 * @deprecated Use BaseModalProps from ~/types/components/modals instead
 * Base props for all item modal components
 */
export interface BaseItemModalProps {
  visible: boolean
  user: UserProfile | null
}

/**
 * @deprecated Use WeaponModalProps from ~/types/components/modals instead
 * Props for weapon modal component
 */
export interface WeaponModalProps extends BaseItemModalProps {
  weapon: IEnhancedWeapon | null
}

/**
 * @deprecated Use KnifeModalProps from ~/types/components/modals instead
 * Props for knife modal component
 */
export interface KnifeModalProps extends BaseItemModalProps {
  weapon: IEnhancedKnife | null
}

/**
 * @deprecated Use GloveModalProps from ~/types/components/modals instead
 * Props for glove modal component
 */
export interface GloveModalProps extends BaseItemModalProps {
  weapon: IEnhancedGlove | null
}

/**
 * @deprecated Use modal-specific props from ~/types/components/modals instead
 * Union type for all modal props
 */
export type ItemModalProps = WeaponModalProps | KnifeModalProps | GloveModalProps

// ============================================================================
// DEPRECATED MODAL COMPONENT EMITS (Use ~/types/components/modals instead)
// ============================================================================

/**
 * @deprecated Use BaseModalEvents from ~/types/components/modals instead
 * Base emits for all item modal components
 */
export interface BaseItemModalEmits {
  'update:visible': [visible: boolean]
}

/**
 * @deprecated Use WeaponModalEvents from ~/types/components/modals instead
 * Emits for weapon modal component
 */
export interface WeaponModalEmits extends BaseItemModalEmits {
  select: [weapon: IEnhancedWeapon, customization: WeaponConfiguration]
  duplicate: [weapon: IEnhancedWeapon, customization: WeaponConfiguration]
}

/**
 * @deprecated Use KnifeModalEvents from ~/types/components/modals instead
 * Emits for knife modal component
 */
export interface KnifeModalEmits extends BaseItemModalEmits {
  save: [weapon: IEnhancedKnife, customization: KnifeConfiguration]
  duplicate: [weapon: IEnhancedKnife, customization: KnifeConfiguration]
}

/**
 * @deprecated Use GloveModalEvents from ~/types/components/modals instead
 * Emits for glove modal component
 */
export interface GloveModalEmits extends BaseItemModalEmits {
  select: [weapon: IEnhancedGlove, customization: GloveConfiguration]
  duplicate: [weapon: IEnhancedGlove, customization: GloveConfiguration]
}

// ============================================================================
// DEPRECATED ACTION HANDLER TYPES (Use event handlers from components instead)
// ============================================================================

/**
 * @deprecated Use component event handlers instead
 * Type for duplicate action handler
 */
export type DuplicateHandler<T extends EnhancedItem, C extends ItemConfiguration> = (
  item: T,
  customization: C
) => void

/**
 * @deprecated Use component event handlers instead
 * Type for reset action handler
 */
export type ResetHandler<T extends EnhancedItem, C extends ItemConfiguration> = (
  item: T,
  customization: C
) => void

/**
 * @deprecated Use component event handlers instead
 * Type for save action handler
 */
export type SaveHandler<T extends EnhancedItem, C extends ItemConfiguration> = (
  item: T,
  customization: C
) => void

/**
 * @deprecated Use component event handlers instead
 * Type-safe duplicate handler mapping
 */
export type DuplicateHandlerMap = {
  weapon: DuplicateHandler<IEnhancedWeapon, WeaponConfiguration>
  knife: DuplicateHandler<IEnhancedKnife, KnifeConfiguration>
  glove: DuplicateHandler<IEnhancedGlove, GloveConfiguration>
}

/**
 * @deprecated Use component event handlers instead
 * Type-safe reset handler mapping
 */
export type ResetHandlerMap = {
  weapon: ResetHandler<IEnhancedWeapon, WeaponConfiguration>
  knife: ResetHandler<IEnhancedKnife, KnifeConfiguration>
  glove: ResetHandler<IEnhancedGlove, GloveConfiguration>
}

/**
 * @deprecated Use component event handlers instead
 * Type-safe save handler mapping
 */
export type SaveHandlerMap = {
  weapon: SaveHandler<IEnhancedWeapon, WeaponConfiguration>
  knife: SaveHandler<IEnhancedKnife, KnifeConfiguration>
  glove: SaveHandler<IEnhancedGlove, GloveConfiguration>
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
export function isWeaponCustomization(customization: ItemCustomization): customization is WeaponConfiguration {
  return 'stickers' in customization || 'keychain' in customization
}

/**
 * Type guard for knife customization
 */
export function isKnifeCustomization(customization: ItemCustomization): customization is KnifeConfiguration {
  return 'statTrak' in customization && !('stickers' in customization)
}

/**
 * @deprecated Use isGloveConfiguration from ~/types instead
 * Type guard for glove customization
 */
export function isGloveCustomization(customization: ItemConfiguration): customization is GloveConfiguration {
  return !('statTrak' in customization) && !('stickers' in customization)
}

// ============================================================================
// MIGRATION NOTICE
// ============================================================================

/**
 * @fileoverview MIGRATION NOTICE
 *
 * This file is deprecated and will be removed in a future version.
 * Please migrate to the new type system located in ~/types.
 *
 * Key migration paths:
 *
 * OLD (this file)                    NEW (~/types)
 * ==================                 =============
 * ItemType                    ->     ItemType
 * EnhancedItem               ->     ItemData
 * ItemCustomization          ->     ItemConfiguration
 * WeaponCustomization        ->     WeaponConfiguration
 * KnifeCustomization         ->     KnifeConfiguration
 * GloveCustomization         ->     GloveConfiguration
 * WeaponModalProps           ->     WeaponModalProps (from ~/types/components/modals)
 * KnifeModalProps            ->     KnifeModalProps (from ~/types/components/modals)
 * GloveModalProps            ->     GloveModalProps (from ~/types/components/modals)
 * WeaponModalEmits           ->     WeaponModalEvents (from ~/types/components/modals)
 * KnifeModalEmits            ->     KnifeModalEvents (from ~/types/components/modals)
 * GloveModalEmits            ->     GloveModalEvents (from ~/types/components/modals)
 * APISkin                    ->     APIWeaponSkin
 * SteamUser                  ->     UserProfile
 *
 * Benefits of the new type system:
 * - Better organization and structure
 * - Comprehensive JSDoc documentation
 * - Enhanced type safety with proper validation
 * - Consistent naming conventions
 * - Better error handling interfaces
 * - Future-proof extensible architecture
 *
 * To migrate your code:
 * 1. Replace imports from this file with imports from ~/types
 * 2. Update type names according to the mapping above
 * 3. Use the new interfaces for better type safety
 * 4. Remove references to this file once migration is complete
 *
 * For detailed migration examples, see ~/types/README.md
 */
