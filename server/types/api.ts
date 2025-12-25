/**
 * API response and request type definitions
 * Moved from server/utils/interfaces.ts for better organization
 */

// ============================================================================
// API RESPONSE INTERFACES
// ============================================================================

/**
 * Standard pagination metadata for API responses
 * Provides consistent pagination information across all endpoints
 */
export interface PaginationMeta {
    /** Current page number (1-based) */
    currentPage: number;
    /** Total number of pages available */
    totalPages: number;
    /** Total number of items across all pages */
    totalItems: number;
    /** Number of items per page */
    limit: number;
    /** Number of items in current response */
    count: number;
    /** Whether there is a next page */
    hasNext: boolean;
    /** Whether there is a previous page */
    hasPrevious: boolean;
}

/**
 * Standard metadata for API responses
 * Provides additional context and information about the response
 */
export interface ResponseMeta {
    /** Timestamp when the response was generated */
    timestamp: string;
    /** Time taken to process the request (in milliseconds) */
    processingTime?: number;
    /** Version of the API */
    apiVersion?: string;
    /** Additional metadata specific to the endpoint */
    [key: string]: unknown;
}

/**
 * Standard error information for API responses
 * Provides consistent error reporting across all endpoints
 */
export interface ErrorInfo {
    /** Error code for programmatic handling */
    code: string;
    /** Human-readable error message */
    message: string;
    /** Additional error details */
    details?: unknown;
    /** Field-specific validation errors */
    fieldErrors?: Record<string, string[]>;
}

/**
 * Base API response interface
 * All API responses should extend this interface
 */
export interface BaseAPIResponse<T = unknown> {
    /** Whether the request was successful */
    success: boolean;
    /** The main data payload */
    data?: T;
    /** Response metadata */
    meta: ResponseMeta;
    /** Pagination information (if applicable) */
    pagination?: PaginationMeta;
    /** Error information (if success is false) */
    error?: ErrorInfo;
    /** Human-readable message */
    message?: string;
}

/**
 * Paginated API response interface
 * For endpoints that return paginated data
 */
export interface PaginatedAPIResponse<T = unknown> extends BaseAPIResponse<T[]> {
    /** Pagination information (required for paginated responses) */
    pagination: PaginationMeta;
    /** Applied filters information */
    appliedFilters?: Record<string, unknown>;
    /** Available filter options */
    availableFilters?: Record<string, unknown[]>;
}

/**
 * Collection API response interface
 * For endpoints that return collections of items with metadata
 */
export interface CollectionAPIResponse<T = unknown> extends BaseAPIResponse<T[]> {
    /** Collection-specific metadata */
    collection: {
        /** Total count of items in the collection */
        totalCount: number;
        /** Available categories/types */
        categories?: string[];
        /** Available filters and their options */
        filters?: Record<string, unknown[]>;
    };
}

// ============================================================================
// SHARED TYPES AND INTERFACES
// ============================================================================

/**
 * Represents rarity information for CS2 items
 * Used across all item types (skins, stickers, agents, etc.)
 */
export interface ItemRarity {
    /** Unique identifier for the rarity level */
    id: string;
    /** Display name of the rarity (e.g., "Covert", "Classified") */
    name: string;
    /** Hex color code associated with this rarity level */
    color: string;
}

/**
 * Represents team information for CS2 items
 * Used for agents and some skins that are team-specific
 */
export interface ItemTeam {
    /** Unique identifier for the team */
    id: string;
    /** Display name of the team */
    name: string;
}

/**
 * Base interface for all CS2 API items
 * Contains common fields shared across all item types
 */
export interface BaseAPIItem {
    /** Unique identifier for the item */
    id: string;
    /** Display name of the item */
    name: string;
    /** Optional description text */
    description?: string;
    /** Rarity information for this item */
    rarity: ItemRarity;
    /** URL to the item's image */
    image: string;
    /** Steam market hash name for trading */
    market_hash_name?: string;
}

// ============================================================================
// SPECIFIC API ITEM INTERFACES
// ============================================================================

/**
 * Represents a weapon skin from the CS2 API
 * Extends BaseAPIItem with weapon-specific properties
 */
export interface APISkin extends BaseAPIItem {
    /** Weapon information this skin belongs to */
    weapon: {
        id: string;
        name: string;
        weapon_id: string;
    };
    /** Category information (e.g., "Pistol", "Rifle") */
    category: {
        id: string;
        name: string;
    };
    /** Pattern information for the skin */
    pattern: {
        id: string;
        name: string;
    };
    /** Minimum float value for wear */
    min_float: number;
    /** Maximum float value for wear */
    max_float: number;
    /** Whether StatTrak version is available */
    stattrak?: boolean;
    /** Whether souvenir version is available */
    souvenir?: boolean;
    /** Paint index identifier */
    paint_index: string;
    /** Available wear conditions */
    wears?: Array<{ name: string; min: number; max: number }>;
    /** Collections this skin belongs to */
    collections?: Array<{ id: string; name: string }>;
    /** Crates this skin can be found in */
    crates?: Array<{ id: string; name: string }>;
    /** Team association if applicable */
    team?: ItemTeam;
}

/**
 * Represents a sticker from the CS2 API
 * Extends BaseAPIItem with sticker-specific properties
 */
export interface APISticker extends BaseAPIItem {
    /** Crates this sticker can be found in */
    crates?: Array<{ id: string; name: string }>;
    /** Tournament event this sticker is associated with */
    tournament_event: string;
    /** Tournament team this sticker represents */
    tournament_team: string;
    /** Type of sticker (e.g., "Team", "Player") */
    type: string;
    /** Visual effect applied to the sticker */
    effect?: string;
}

/**
 * Represents an agent from the CS2 API
 * Extends BaseAPIItem with agent-specific properties
 */
export interface APIAgent extends BaseAPIItem {
    /** Collections this agent belongs to */
    collections?: Array<{ id: string; name: string }>;
    /** Team this agent belongs to */
    team: ItemTeam;
}

/**
 * Represents a music kit from the CS2 API
 * Extends BaseAPIItem with music kit-specific properties
 */
export interface APIMusicKit extends BaseAPIItem {
    /** Whether this music kit is exclusive/limited */
    exclusive?: boolean;
}

/**
 * Represents a keychain from the CS2 API
 * Extends BaseAPIItem with keychain-specific properties
 */
export type APIKeychain = BaseAPIItem

/**
 * Represents a collectible item from the CS2 API
 * Extends BaseAPIItem with collectible-specific properties
 */
export interface APICollectible extends BaseAPIItem {
    /** Type of collectible item */
    type?: string;
    /** Whether this is a genuine item */
    genuine?: boolean;
}

/**
 * Represents a highlight from the CS2 API
 * Extends BaseAPIItem with highlight-specific properties
 */
export interface APIHighlight extends BaseAPIItem {
    /** Definition index */
    def_index: string;
    /** Item description */
    description: string;
    /** Tournament event name */
    tournament_event: string;
    /** First team name */
    team0: string;
    /** Second team name */
    team1: string;
    /** Tournament stage */
    stage: string;
    /** Tournament player name */
    tournament_player: string;
    /** Map name */
    map: string;
    /** Market hash name */
    market_hash_name: string;
    /** Video URL */
    video: string;
    /** Thumbnail image URL */
    thumbnail: string;
    /** Original item data */
    original: Record<string, unknown>;
}

// ============================================================================
// ENUMS AND CONSTANTS
// ============================================================================

/**
 * Represents CS2 team identifiers
 * Used throughout the application for team-specific items and configurations
 */
export enum CsTeam {
    /** No team specified */
    None = 0,
    /** Terrorist team */
    Terrorist = 1,
    /** Counter-Terrorist team */
    CounterTerrorist = 2
}
