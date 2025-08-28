/**
 * Modal component interfaces for the CS2Inspect application
 * 
 * @description This file contains interfaces for modal components,
 * their props, state, and event emissions. These interfaces ensure
 * consistent modal behavior and type safety across the application.
 * 
 * @version 2.0.0
 * @since 2.0.0
 */

import type { 
  EntityId, 
  UserProfile, 
  AsyncResult, 
  LoadingState 
} from '../core/common'

import type { 
  ItemData, 
  ItemConfiguration, 
  WeaponItemData, 
  KnifeItemData, 
  GloveItemData,
  WeaponConfiguration, 
  KnifeConfiguration, 
  GloveConfiguration,
  StickerConfiguration,
  KeychainConfiguration
} from '../business/items'

// ============================================================================
// BASE MODAL INTERFACES
// ============================================================================

/**
 * Base props for all modal components
 * 
 * @description Common properties shared across all modal components
 */
export interface BaseModalProps {
  /** Whether the modal is visible */
  visible: boolean
  /** Whether the modal is in a loading state */
  loading?: boolean
  /** User profile information */
  user: UserProfile | null
}

/**
 * Base modal state interface
 * 
 * @description Common state properties for modal components
 */
export interface BaseModalState {
  /** Whether skins are being loaded */
  isLoadingSkins: boolean
  /** Current search query */
  searchQuery: string
  /** Current page number for pagination */
  currentPage: number
  /** Error message if any */
  error: string | null
}

/**
 * Base modal events interface
 * 
 * @description Common events emitted by modal components
 */
export interface BaseModalEvents {
  /** Emitted when modal visibility should change */
  'update:visible': [visible: boolean]
  /** Emitted when modal is closed */
  'close': []
  /** Emitted when an error occurs */
  'error': [error: string]
}

// ============================================================================
// ITEM MODAL INTERFACES
// ============================================================================

/**
 * Base props for item modal components
 * 
 * @description Common properties for modals that handle items
 */
export interface BaseItemModalProps extends BaseModalProps {
  /** Whether the other team has this skin equipped */
  otherTeamHasSkin: boolean
  /** Page size for pagination */
  pageSize?: number
}

/**
 * Base state for item modal components
 * 
 * @description Common state for modals that handle items
 */
export interface BaseItemModalState extends BaseModalState {
  /** Whether import modal is visible */
  showImportModal: boolean
  /** Whether duplicate confirmation modal is visible */
  showDuplicateConfirm: boolean
  /** Whether reset confirmation modal is visible */
  showResetConfirm: boolean
  /** Whether currently importing */
  isImporting: boolean
  /** Whether currently loading inspect data */
  isLoadingInspect: boolean
  /** Whether currently resetting */
  isResetting: boolean
  /** Whether currently duplicating */
  isDuplicating: boolean
}

/**
 * Base events for item modal components
 * 
 * @template TItem - Type of item data
 * @template TConfig - Type of item configuration
 */
export interface BaseItemModalEvents<
  TItem extends ItemData = ItemData,
  TConfig extends ItemConfiguration = ItemConfiguration
> extends BaseModalEvents {
  /** Emitted when item should be saved */
  'save': [item: TItem, configuration: TConfig]
  /** Emitted when item should be duplicated */
  'duplicate': [item: TItem, configuration: TConfig]
  /** Emitted when item should be reset */
  'reset': []
}

// ============================================================================
// WEAPON MODAL INTERFACES
// ============================================================================

/**
 * Props for weapon modal component
 * 
 * @description Properties specific to the weapon skin modal
 * 
 * @example
 * ```typescript
 * const props: WeaponModalProps = {
 *   visible: true,
 *   weapon: weaponData,
 *   user: userProfile,
 *   otherTeamHasSkin: false,
 *   pageSize: 20
 * }
 * ```
 */
export interface WeaponModalProps extends BaseItemModalProps {
  /** Weapon data to customize */
  weapon: WeaponItemData | null
}

/**
 * State for weapon modal component
 * 
 * @description State specific to the weapon skin modal
 */
export interface WeaponModalState extends BaseItemModalState {
  /** Whether sticker modal is visible */
  showStickerModal: boolean
  /** Whether keychain modal is visible */
  showKeychainModal: boolean
  /** Current sticker position being edited */
  currentStickerPosition: number
}

/**
 * Events emitted by weapon modal component
 * 
 * @description Events specific to the weapon skin modal
 */
export interface WeaponModalEvents extends BaseItemModalEvents<WeaponItemData, WeaponConfiguration> {
  /** Emitted when sticker should be added */
  'add-sticker': [position: number]
  /** Emitted when sticker should be removed */
  'remove-sticker': [position: number]
  /** Emitted when keychain should be added */
  'add-keychain': []
  /** Emitted when keychain should be removed */
  'remove-keychain': []
}

// ============================================================================
// KNIFE MODAL INTERFACES
// ============================================================================

/**
 * Props for knife modal component
 * 
 * @description Properties specific to the knife skin modal
 * 
 * @example
 * ```typescript
 * const props: KnifeModalProps = {
 *   visible: true,
 *   weapon: knifeData,
 *   user: userProfile,
 *   otherTeamHasSkin: false,
 *   pageSize: 20
 * }
 * ```
 */
export interface KnifeModalProps extends BaseItemModalProps {
  /** Knife data to customize (using 'weapon' for backward compatibility) */
  weapon: KnifeItemData | null
}

/**
 * State for knife modal component
 * 
 * @description State specific to the knife skin modal
 */
export interface KnifeModalState extends BaseItemModalState {
  // Knives don't have additional state beyond base item modal state
}

/**
 * Events emitted by knife modal component
 * 
 * @description Events specific to the knife skin modal
 */
export interface KnifeModalEvents extends BaseItemModalEvents<KnifeItemData, KnifeConfiguration> {
  // Knives don't have additional events beyond base item modal events
}

// ============================================================================
// GLOVE MODAL INTERFACES
// ============================================================================

/**
 * Props for glove modal component
 * 
 * @description Properties specific to the glove skin modal
 * 
 * @example
 * ```typescript
 * const props: GloveModalProps = {
 *   visible: true,
 *   weapon: gloveData,
 *   user: userProfile,
 *   otherTeamHasSkin: false,
 *   pageSize: 20
 * }
 * ```
 */
export interface GloveModalProps extends BaseItemModalProps {
  /** Glove data to customize (using 'weapon' for backward compatibility) */
  weapon: GloveItemData | null
}

/**
 * State for glove modal component
 * 
 * @description State specific to the glove skin modal
 */
export interface GloveModalState extends BaseItemModalState {
  // Gloves don't have additional state beyond base item modal state
}

/**
 * Events emitted by glove modal component
 * 
 * @description Events specific to the glove skin modal
 */
export interface GloveModalEvents extends BaseItemModalEvents<GloveItemData, GloveConfiguration> {
  // Gloves don't have additional events beyond base item modal events
}

// ============================================================================
// SPECIALIZED MODAL INTERFACES
// ============================================================================

/**
 * Props for sticker modal component
 * 
 * @description Properties for the sticker selection modal
 */
export interface StickerModalProps extends BaseModalProps {
  /** Current sticker position (0-4) */
  position: number
  /** Current sticker configuration */
  currentSticker: StickerConfiguration | null
}

/**
 * Events emitted by sticker modal component
 */
export interface StickerModalEvents extends BaseModalEvents {
  /** Emitted when sticker is selected */
  'select': [sticker: StickerConfiguration]
  /** Emitted when sticker is removed */
  'remove': []
}

/**
 * Props for keychain modal component
 * 
 * @description Properties for the keychain selection modal
 */
export interface KeychainModalProps extends BaseModalProps {
  /** Current keychain configuration */
  currentKeychain: KeychainConfiguration | null
}

/**
 * Events emitted by keychain modal component
 */
export interface KeychainModalEvents extends BaseModalEvents {
  /** Emitted when keychain is selected */
  'select': [keychain: KeychainConfiguration]
  /** Emitted when keychain is removed */
  'remove': []
}

/**
 * Props for inspect URL modal component
 * 
 * @description Properties for the inspect URL input modal
 */
export interface InspectURLModalProps extends BaseModalProps {
  // Uses only base modal props
}

/**
 * Events emitted by inspect URL modal component
 */
export interface InspectURLModalEvents extends BaseModalEvents {
  /** Emitted when inspect URL is submitted */
  'submit': [url: string]
}

/**
 * Props for duplicate confirmation modal component
 * 
 * @description Properties for the duplicate item confirmation modal
 */
export interface DuplicateConfirmModalProps extends BaseModalProps {
  /** Type of item being duplicated */
  itemType: string
  /** Whether the other team has this skin */
  otherTeamHasSkin: boolean
}

/**
 * Events emitted by duplicate confirmation modal component
 */
export interface DuplicateConfirmModalEvents extends BaseModalEvents {
  /** Emitted when duplication is confirmed */
  'confirm': []
}

/**
 * Props for reset confirmation modal component
 * 
 * @description Properties for the reset item confirmation modal
 */
export interface ResetConfirmModalProps extends BaseModalProps {
  // Uses only base modal props
}

/**
 * Events emitted by reset confirmation modal component
 */
export interface ResetConfirmModalEvents extends BaseModalEvents {
  /** Emitted when reset is confirmed */
  'confirm': []
}

// ============================================================================
// MODAL COMPOSABLE INTERFACES
// ============================================================================

/**
 * Return type for item modal composables
 *
 * @template TItem - Type of item data
 * @template TConfig - Type of item configuration
 */
export interface ItemModalComposableReturn<
  TItem extends ItemData = ItemData,
  TConfig extends ItemConfiguration = ItemConfiguration
> {
  /** Modal state */
  state: any // Ref<BaseItemModalState> - Vue-specific type
  /** Handle skin selection */
  handleSkinSelect: (skin: any) => void
  /** Handle inspect link import */
  handleImportInspectLink: (url: string) => Promise<void>
  /** Handle item duplication */
  handleDuplicate: () => Promise<void>
  /** Handle item reset */
  handleReset: () => Promise<void>
  /** Handle inspect link creation */
  handleCreateInspectLink: () => Promise<string | null>
  /** Whether duplication is possible */
  canDuplicate: any // ComputedRef<boolean> - Vue-specific type
  /** Whether reset is possible */
  canReset: any // ComputedRef<boolean> - Vue-specific type
  /** Whether inspect link creation is possible */
  canCreateInspectLink: any // ComputedRef<boolean> - Vue-specific type
  /** Opposite team identifier */
  oppositeTeam: any // ComputedRef<number> - Vue-specific type
}

/**
 * Configuration for item modal composables
 *
 * @template TItem - Type of item data
 * @template TConfig - Type of item configuration
 */
export interface ItemModalComposableConfig<
  TItem extends ItemData = ItemData,
  TConfig extends ItemConfiguration = ItemConfiguration
> {
  /** Item type */
  itemType: TItem['type']
  /** User profile */
  user: any // Ref<UserProfile | null> - Vue-specific type
  /** Item data */
  item: any // Ref<TItem | null> - Vue-specific type
  /** Item configuration */
  configuration: any // Ref<TConfig> - Vue-specific type
  /** Selected skin */
  selectedSkin: any // Ref<TItem | null> - Vue-specific type
  /** Success callback */
  onSuccess?: (message: string) => void
  /** Error callback */
  onError?: (message: string) => void
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Extract modal props type for a specific item type
 */
export type ModalPropsForItemType<T extends ItemData['type']> = 
  T extends 'weapon' ? WeaponModalProps :
  T extends 'knife' ? KnifeModalProps :
  T extends 'glove' ? GloveModalProps :
  BaseItemModalProps

/**
 * Extract modal state type for a specific item type
 */
export type ModalStateForItemType<T extends ItemData['type']> = 
  T extends 'weapon' ? WeaponModalState :
  T extends 'knife' ? KnifeModalState :
  T extends 'glove' ? GloveModalState :
  BaseItemModalState

/**
 * Extract modal events type for a specific item type
 */
export type ModalEventsForItemType<T extends ItemData['type']> = 
  T extends 'weapon' ? WeaponModalEvents :
  T extends 'knife' ? KnifeModalEvents :
  T extends 'glove' ? GloveModalEvents :
  BaseItemModalEvents
