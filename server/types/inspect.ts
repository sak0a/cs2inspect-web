/**
 * Type definitions for the unified inspect API endpoint
 * Handles all item types: weapons, knives, gloves, agents, music kits
 */

// ============================================================================
// ITEM TYPE DEFINITIONS
// ============================================================================

/**
 * Supported item types for inspect functionality
 */
export type ItemType = 'weapon' | 'knife' | 'glove' | 'agent' | 'music-kit'

/**
 * Supported inspect actions
 */
export type InspectAction = 
  | 'create-url'
  | 'inspect-item'
  | 'decode-masked-only'
  | 'decode-hex-data'
  | 'validate-url'
  | 'analyze-url'
  | 'client-status'

/**
 * URL types returned by the inspect system
 */
export type UrlType = 'masked' | 'unmasked'

// ============================================================================
// REQUEST INTERFACES
// ============================================================================

/**
 * Base interface for all inspect API requests
 */
export interface BaseInspectRequest {
  /** The type of item being inspected */
  itemType?: ItemType
}

/**
 * Request interface for creating inspect URLs
 */
export interface CreateUrlRequest extends BaseInspectRequest {
  /** Item definition index */
  defindex?: number
  /** Paint index for the skin */
  paintindex?: number
  /** Pattern seed for the skin */
  paintseed?: number
  /** Wear value (float) */
  paintwear?: number
  /** Item rarity */
  rarity?: number
  /** Whether the item has StatTrak */
  statTrak?: boolean
  /** StatTrak kill count */
  statTrakCount?: number
  /** Custom name tag */
  nameTag?: string
  /** Stickers array (weapons only) */
  stickers?: any[]
  /** Keychain object (weapons only) */
  keychain?: any
  /** Complete customization object (weapons only) */
  customization?: any
}

/**
 * Request interface for inspecting URLs
 */
export interface InspectUrlRequest extends BaseInspectRequest {
  /** The inspect URL to process */
  inspectUrl: string
}

/**
 * Request interface for decoding hex data
 */
export interface DecodeHexRequest extends BaseInspectRequest {
  /** Raw hex data to decode */
  hexData: string
}

/**
 * Union type for all possible inspect request bodies
 */
export type InspectRequest = CreateUrlRequest | InspectUrlRequest | DecodeHexRequest

// ============================================================================
// RESPONSE INTERFACES
// ============================================================================

/**
 * Base interface for all inspect API responses
 */
export interface BaseInspectResponse {
  /** Whether the operation was successful */
  success: boolean
}

/**
 * Response interface for create-url action
 */
export interface CreateUrlResponse extends BaseInspectResponse {
  /** Generated inspect URL */
  inspectUrl: string
  /** Item data used to create the URL */
  itemData: any
  /** Type of item that was processed */
  itemType?: ItemType
}

/**
 * Response interface for inspect-item action
 */
export interface InspectItemResponse extends BaseInspectResponse {
  /** Type of URL that was processed */
  urlType: UrlType
  /** Inspected item data */
  item: any
  /** Original URL that was inspected */
  originalUrl: string
  /** Queue status for unmasked URLs */
  queueStatus?: {
    length: number
  }
}

/**
 * Response interface for decode actions
 */
export interface DecodeResponse extends BaseInspectResponse {
  /** Type of URL (for URL-based decoding) */
  urlType?: UrlType
  /** Decoded item data */
  item: any
  /** Original URL (for URL-based decoding) */
  originalUrl?: string
  /** Hex data (for hex-based decoding) */
  hexData?: string
  /** Method used for decoding */
  method: string
}

/**
 * Response interface for URL validation
 */
export interface ValidateUrlResponse extends BaseInspectResponse {
  /** Whether the URL is valid */
  isValid: boolean
  /** Type of URL if valid */
  urlType: UrlType | null
  /** Whether Steam client is required */
  requiresSteamClient: boolean
  /** Detailed validation information */
  validation: {
    valid: boolean
    errors: string[]
  }
  /** Additional URL information */
  urlInfo?: {
    isQuoted: boolean
    hasHexData: boolean
    hexDataLength: number
  }
  /** Error message if invalid */
  error?: string
}

/**
 * Response interface for URL analysis
 */
export interface AnalyzeUrlResponse extends BaseInspectResponse {
  /** Detailed analysis of the URL */
  analysis: {
    original_url: string
    cleaned_url: string
    url_type: UrlType
    is_quoted: boolean
    hex_data?: string
  }
  /** Whether Steam client is required */
  requiresSteamClient: boolean
}

/**
 * Response interface for Steam client status
 */
export interface ClientStatusResponse extends BaseInspectResponse {
  /** Steam client information */
  steamClient: {
    isReady: boolean
    status: string
    queueLength: number
    unmaskedSupport: boolean
  }
}

/**
 * Union type for all possible inspect response types
 */
export type InspectResponse = 
  | CreateUrlResponse
  | InspectItemResponse
  | DecodeResponse
  | ValidateUrlResponse
  | AnalyzeUrlResponse
  | ClientStatusResponse

// ============================================================================
// ERROR INTERFACES
// ============================================================================

/**
 * Error response interface for inspect API
 */
export interface InspectErrorResponse {
  /** Whether the operation was successful (always false for errors) */
  success: false
  /** Error message */
  message: string
  /** HTTP status code */
  statusCode: number
  /** Additional error details */
  details?: any
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Item type configuration for different inspect behaviors
 */
export interface ItemTypeConfig {
  /** Default defindex for this item type */
  defaultDefindex: number
  /** Default paintindex for this item type */
  defaultPaintindex: number
  /** Default pattern seed */
  defaultPaintseed: number
  /** Default wear value */
  defaultPaintwear: number
  /** Default rarity */
  defaultRarity: number
  /** Whether this item type supports StatTrak */
  supportsStatTrak: boolean
  /** Whether this item type supports name tags */
  supportsNameTag: boolean
  /** Whether this item type supports stickers */
  supportsStickers: boolean
  /** Whether this item type supports keychains */
  supportsKeychains: boolean
}

/**
 * Configuration map for all item types
 */
export type ItemTypeConfigMap = Record<ItemType, ItemTypeConfig>
