import type { IDefaultItem } from '~/server/types'

// ============================================================================
// API CONFIGURATION CONSTANTS
// ============================================================================

/**
 * API version for response metadata
 */
export const API_VERSION = '1.0.0'

/**
 * Protected API paths that require authentication
 */
export const PROTECTED_API_PATHS = [
  '/api/items/weapons',
  '/api/loadouts',
  '/api/items/knives',
  '/api/items/knives/save',
  '/api/items/weapons/save',
  '/api/inspect',
  '/api/items/weapons/[type]',
  '/api/auth/',
  '/api/admin/',
  '/api/sync/',
]

/**
 * Admin API paths that require admin role
 */
export const ADMIN_API_PATHS = ['/api/admin/']

/**
 * Admin-specific error codes
 */
export const ADMIN_ERROR_CODES = {
  ADMIN_AUTH_ERROR: 'ADMIN_AUTH_ERROR',
  ADMIN_NOT_FOUND: 'ADMIN_NOT_FOUND',
  ADMIN_FORBIDDEN: 'ADMIN_FORBIDDEN',
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  BAN_ERROR: 'BAN_ERROR',
  SETTING_ERROR: 'SETTING_ERROR',
  STATS_ERROR: 'STATS_ERROR',
} as const

/**
 * Default application settings
 */
export const DEFAULT_APP_SETTINGS = {
  // General
  MAINTENANCE_MODE: {
    value: 'false',
    type: 'boolean',
    description: 'Enable maintenance mode to block user access',
  },
  REGISTRATION_ENABLED: {
    value: 'true',
    type: 'boolean',
    description: 'Allow new user registrations',
  },
  SITE_ANNOUNCEMENT: {
    value: '',
    type: 'string',
    description: 'Announcement banner text shown to all users (leave empty to hide)',
  },

  // Features
  FEATURE_INSPECT_URLS: {
    value: 'true',
    type: 'boolean',
    description: 'Enable inspect URL generation',
  },
  FEATURE_STICKERS: {
    value: 'true',
    type: 'boolean',
    description: 'Enable sticker customization',
  },
  FEATURE_KEYCHAINS: {
    value: 'true',
    type: 'boolean',
    description: 'Enable keychain customization',
  },
  FEATURE_TUTORIALS: {
    value: 'true',
    type: 'boolean',
    description: 'Enable the tutorial system for users',
  },
  FEATURE_SHARE_CODES: {
    value: 'true',
    type: 'boolean',
    description: 'Enable loadout share codes for sharing between users',
  },

  // Tutorials
  TUTORIAL_NAVIGATE_APP: {
    value: 'true',
    type: 'boolean',
    description: "Enable 'Navigate the App' tutorial",
  },
  TUTORIAL_CUSTOMIZE_WEAPON: {
    value: 'true',
    type: 'boolean',
    description: "Enable 'Customize a Weapon' tutorial",
  },
  TUTORIAL_INSPECT_LINK: {
    value: 'true',
    type: 'boolean',
    description: "Enable 'Inspect Link' tutorial",
  },
  TUTORIAL_CREATE_LOADOUT: {
    value: 'true',
    type: 'boolean',
    description: "Enable 'Create a Loadout' tutorial",
  },

  // Limits
  MAX_LOADOUTS_PER_USER: {
    value: '10',
    type: 'number',
    description: 'Maximum loadouts per user',
  },
  MAX_LOADOUT_NAME_LENGTH: {
    value: '25',
    type: 'number',
    description: 'Maximum character length for loadout names',
  },
  MAX_VERSION_HISTORY_PER_ITEM: {
    value: '50',
    type: 'number',
    description:
      'Maximum version history entries per item (oldest removed when exceeded, 0 = unlimited)',
  },
} as const

/**
 * External API URLs for CS2 data
 */
export const EXTERNAL_API_URLS = {
  SKINS: 'https://raw.githubusercontent.com/ByMykel/CSGO-API/main/public/api/en/skins.json',
  STICKERS: 'https://raw.githubusercontent.com/ByMykel/CSGO-API/main/public/api/en/stickers.json',
  KEYCHAINS: 'https://raw.githubusercontent.com/ByMykel/CSGO-API/main/public/api/en/keychains.json',
  AGENTS: 'https://raw.githubusercontent.com/ByMykel/CSGO-API/main/public/api/en/agents.json',
  MUSIC_KITS:
    'https://raw.githubusercontent.com/ByMykel/CSGO-API/main/public/api/en/music_kits.json',
  COLLECTIBLES:
    'https://raw.githubusercontent.com/ByMykel/CSGO-API/main/public/api/en/collectibles.json',
  HIGHLIGHTS:
    'https://raw.githubusercontent.com/ByMykel/CSGO-API/main/public/api/en/highlights.json',
}

// ============================================================================
// PAGINATION AND LIMITS
// ============================================================================

/**
 * Default pagination settings
 */
export const PAGINATION_DEFAULTS = {
  /** Default number of items per page */
  DEFAULT_LIMIT: 50,
  /** Maximum number of items per page */
  MAX_LIMIT: 100,
  /** Minimum number of items per page */
  MIN_LIMIT: 1,
  /** Default page number */
  DEFAULT_PAGE: 1,
}

// ============================================================================
// CACHE AND TIMING CONSTANTS
// ============================================================================

/**
 * Cache validity periods in milliseconds
 */
export const CACHE_PERIODS = {
  /** 24 hours for API data cache */
  API_DATA: 24 * 60 * 60 * 1000,
  /** 1 hour for response cache */
  RESPONSE_CACHE: 60 * 60 * 1000,
  /** 5 minutes for temporary cache */
  TEMP_CACHE: 5 * 60 * 1000,
}

/**
 * Data staleness threshold (24 hours)
 */
export const DATA_STALENESS_THRESHOLD = CACHE_PERIODS.API_DATA

// ============================================================================
// ITEM TYPE DETECTION CONSTANTS
// ============================================================================

/**
 * Definition index ranges for different item types
 */
export const DEFINDEX_RANGES = {
  /** Knife definition index ranges */
  KNIVES: {
    MIN: 500,
    MAX: 525,
    ADDITIONAL: [42, 59], // weapon_knife, weapon_knifegg
  },
  /** Glove definition index ranges */
  GLOVES: {
    MIN: 5000,
    MAX: 5035,
  },
  /** Weapon definition index ranges (everything else) */
  WEAPONS: {
    MIN: 1,
    MAX: 64,
  },
}

/**
 * Sticker slot configuration
 */
export const STICKER_CONFIG = {
  /** Maximum number of sticker slots per weapon */
  MAX_SLOTS: 5,
  /** Default sticker slot index */
  DEFAULT_SLOT: 0,
  /** Empty sticker database format */
  EMPTY_STICKER: '0;0;0;0;0;0',
}

/**
 * Keychain configuration
 */
export const KEYCHAIN_CONFIG = {
  /** Default keychain slot index */
  DEFAULT_SLOT: 0,
  /** Empty keychain database format */
  EMPTY_KEYCHAIN: '0;0;0;0;0',
}

/**
 * Base URL for images hosted on GitHub or other platforms
 */
export const IMAGE_BASE_URL = '/img/defaults/'
//https://github.com/sak0a/cs2inspect-web/raw/refs/heads/master/public/img/weapons/flat/ak-47-asiimov.webm

// ============================================================================
// DEFAULT ITEM DEFINITIONS
// ============================================================================

/**
 * Default weapon configurations
 * Contains all available weapons with their base properties
 */
export const DEFAULT_WEAPONS: IDefaultItem[] = [
  {
    weapon_defindex: 1,
    weapon_name: 'weapon_deagle',
    paintindex: 0,
    defaultImage: IMAGE_BASE_URL + 'weapon_deagle.webp',
    defaultName: 'Desert Eagle',
    category: 'pistols',
    availableTeams: 'both',
  },
  {
    weapon_defindex: 2,
    weapon_name: 'weapon_elite',
    paintindex: 0,
    defaultImage: IMAGE_BASE_URL + 'weapon_elite.webp',
    defaultName: 'Dual Berettas',
    category: 'pistols',
    availableTeams: 'both',
  },
  {
    weapon_defindex: 3,
    weapon_name: 'weapon_fiveseven',
    paintindex: 0,
    defaultImage: IMAGE_BASE_URL + 'weapon_fiveseven.webp',
    defaultName: 'Five-SeveN',
    category: 'pistols',
    availableTeams: 'counter-terrorists',
  },
  {
    weapon_defindex: 4,
    weapon_name: 'weapon_glock',
    paintindex: 0,
    defaultImage: IMAGE_BASE_URL + 'weapon_glock.webp',
    defaultName: 'Glock-18',
    category: 'pistols',
    availableTeams: 'terrorists',
  },
  {
    weapon_defindex: 7,
    weapon_name: 'weapon_ak47',
    paintindex: 0,
    defaultImage: IMAGE_BASE_URL + 'weapon_ak47.webp',
    defaultName: 'AK-47',
    category: 'rifles',
    availableTeams: 'terrorists',
  },
  {
    weapon_defindex: 8,
    weapon_name: 'weapon_aug',
    paintindex: 0,
    defaultImage: IMAGE_BASE_URL + 'weapon_aug.webp',
    defaultName: 'AUG',
    category: 'rifles',
    availableTeams: 'counter-terrorists',
  },
  {
    weapon_defindex: 9,
    weapon_name: 'weapon_awp',
    paintindex: 0,
    defaultImage: IMAGE_BASE_URL + 'weapon_awp.webp',
    defaultName: 'AWP',
    category: 'rifles',
    availableTeams: 'both',
  },
  {
    weapon_defindex: 10,
    weapon_name: 'weapon_famas',
    paintindex: 0,
    defaultImage: IMAGE_BASE_URL + 'weapon_famas.webp',
    defaultName: 'FAMAS',
    category: 'rifles',
    availableTeams: 'counter-terrorists',
  },
  {
    weapon_defindex: 11,
    weapon_name: 'weapon_g3sg1',
    paintindex: 0,
    defaultImage: IMAGE_BASE_URL + 'weapon_g3sg1.webp',
    defaultName: 'G3SG1',
    category: 'rifles',
    availableTeams: 'terrorists',
  },
  {
    weapon_defindex: 13,
    weapon_name: 'weapon_galilar',
    paintindex: 0,
    defaultImage: IMAGE_BASE_URL + 'weapon_galilar.webp',
    defaultName: 'Galil AR',
    category: 'rifles',
    availableTeams: 'terrorists',
  },
  {
    weapon_defindex: 14,
    weapon_name: 'weapon_m249',
    paintindex: 0,
    defaultImage: IMAGE_BASE_URL + 'weapon_m249.webp',
    defaultName: 'M249',
    category: 'heavys',
    availableTeams: 'both',
  },
  {
    weapon_defindex: 16,
    weapon_name: 'weapon_m4a1',
    paintindex: 0,
    defaultImage: IMAGE_BASE_URL + 'weapon_m4a1.webp',
    defaultName: 'M4A4',
    category: 'rifles',
    availableTeams: 'counter-terrorists',
  },
  {
    weapon_defindex: 17,
    weapon_name: 'weapon_mac10',
    paintindex: 0,
    defaultImage: IMAGE_BASE_URL + 'weapon_mac10.webp',
    defaultName: 'MAC-10',
    category: 'smgs',
    availableTeams: 'terrorists',
  },
  {
    weapon_defindex: 19,
    weapon_name: 'weapon_p90',
    paintindex: 0,
    defaultImage: IMAGE_BASE_URL + 'weapon_p90.webp',
    defaultName: 'P90',
    category: 'smgs',
    availableTeams: 'both',
  },
  {
    weapon_defindex: 23,
    weapon_name: 'weapon_mp5sd',
    paintindex: 0,
    defaultImage: IMAGE_BASE_URL + 'weapon_mp5sd.webp',
    defaultName: 'MP5-SD',
    category: 'smgs',
    availableTeams: 'both',
  },
  {
    weapon_defindex: 24,
    weapon_name: 'weapon_ump45',
    paintindex: 0,
    defaultImage: IMAGE_BASE_URL + 'weapon_ump45.webp',
    defaultName: 'UMP-45',
    category: 'smgs',
    availableTeams: 'both',
  },
  {
    weapon_defindex: 25,
    weapon_name: 'weapon_xm1014',
    paintindex: 0,
    defaultImage: IMAGE_BASE_URL + 'weapon_xm1014.webp',
    defaultName: 'XM1014',
    category: 'heavys',
    availableTeams: 'both',
  },
  {
    weapon_defindex: 26,
    weapon_name: 'weapon_bizon',
    paintindex: 0,
    defaultImage: IMAGE_BASE_URL + 'weapon_bizon.webp',
    defaultName: 'PP-Bizon',
    category: 'smgs',
    availableTeams: 'both',
  },
  {
    weapon_defindex: 27,
    weapon_name: 'weapon_mag7',
    paintindex: 0,
    defaultImage: IMAGE_BASE_URL + 'weapon_mag7.webp',
    defaultName: 'MAG-7',
    category: 'heavys',
    availableTeams: 'counter-terrorists',
  },
  {
    weapon_defindex: 28,
    weapon_name: 'weapon_negev',
    paintindex: 0,
    defaultImage: IMAGE_BASE_URL + 'weapon_negev.webp',
    defaultName: 'Negev',
    category: 'heavys',
    availableTeams: 'both',
  },
  {
    weapon_defindex: 29,
    weapon_name: 'weapon_sawedoff',
    paintindex: 0,
    defaultImage: IMAGE_BASE_URL + 'weapon_sawedoff.webp',
    defaultName: 'Sawed-Off',
    category: 'heavys',
    availableTeams: 'terrorists',
  },
  {
    weapon_defindex: 30,
    weapon_name: 'weapon_tec9',
    paintindex: 0,
    defaultImage: IMAGE_BASE_URL + 'weapon_tec9.webp',
    defaultName: 'Tec-9',
    category: 'pistols',
    availableTeams: 'terrorists',
  },
  {
    weapon_defindex: 31,
    weapon_name: 'weapon_taser',
    paintindex: 0,
    defaultImage: IMAGE_BASE_URL + 'weapon_taser.webp',
    defaultName: 'Zeus x27',
    category: 'pistols',
    availableTeams: 'both',
  },
  {
    weapon_defindex: 32,
    weapon_name: 'weapon_hkp2000',
    paintindex: 0,
    defaultImage: IMAGE_BASE_URL + 'weapon_hkp2000.webp',
    defaultName: 'P2000',
    category: 'pistols',
    availableTeams: 'counter-terrorists',
  },
  {
    weapon_defindex: 33,
    weapon_name: 'weapon_mp7',
    paintindex: 0,
    defaultImage: IMAGE_BASE_URL + 'weapon_mp7.webp',
    defaultName: 'MP7',
    category: 'smgs',
    availableTeams: 'both',
  },
  {
    weapon_defindex: 34,
    weapon_name: 'weapon_mp9',
    paintindex: 0,
    defaultImage: IMAGE_BASE_URL + 'weapon_mp9.webp',
    defaultName: 'MP9',
    category: 'smgs',
    availableTeams: 'counter-terrorists',
  },
  {
    weapon_defindex: 35,
    weapon_name: 'weapon_nova',
    paintindex: 0,
    defaultImage: IMAGE_BASE_URL + 'weapon_nova.webp',
    defaultName: 'Nova',
    category: 'heavys',
    availableTeams: 'both',
  },
  {
    weapon_defindex: 36,
    weapon_name: 'weapon_p250',
    paintindex: 0,
    defaultImage: IMAGE_BASE_URL + 'weapon_p250.webp',
    defaultName: 'P250',
    category: 'pistols',
    availableTeams: 'both',
  },
  {
    weapon_defindex: 38,
    weapon_name: 'weapon_scar20',
    paintindex: 0,
    defaultImage: IMAGE_BASE_URL + 'weapon_scar20.webp',
    defaultName: 'SCAR-20',
    category: 'rifles',
    availableTeams: 'counter-terrorists',
  },
  {
    weapon_defindex: 39,
    weapon_name: 'weapon_sg553',
    paintindex: 0,
    defaultImage: IMAGE_BASE_URL + 'weapon_sg553.webp',
    defaultName: 'SG 553',
    category: 'rifles',
    availableTeams: 'terrorists',
  },
  {
    weapon_defindex: 40,
    weapon_name: 'weapon_ssg08',
    paintindex: 0,
    defaultImage: IMAGE_BASE_URL + 'weapon_ssg08.webp',
    defaultName: 'SSG 08',
    category: 'rifles',
    availableTeams: 'both',
  },
  {
    weapon_defindex: 60,
    weapon_name: 'weapon_m4a1_silencer',
    paintindex: 0,
    defaultImage: IMAGE_BASE_URL + 'weapon_m4a1_silencer.webp',
    defaultName: 'M4A1-S',
    category: 'rifles',
    availableTeams: 'counter-terrorists',
  },
  {
    weapon_defindex: 61,
    weapon_name: 'weapon_usp_silencer',
    paintindex: 0,
    defaultImage: IMAGE_BASE_URL + 'weapon_usp_silencer.webp',
    defaultName: 'USP-S',
    category: 'pistols',
    availableTeams: 'counter-terrorists',
  },
  {
    weapon_defindex: 63,
    weapon_name: 'weapon_cz75a',
    paintindex: 0,
    defaultImage: IMAGE_BASE_URL + 'weapon_cz75a.webp',
    defaultName: 'CZ75-Auto',
    category: 'pistols',
    availableTeams: 'both',
  },
  {
    weapon_defindex: 64,
    weapon_name: 'weapon_revolver',
    paintindex: 0,
    defaultImage: IMAGE_BASE_URL + 'weapon_revolver.webp',
    defaultName: 'R8 Revolver',
    category: 'pistols',
    availableTeams: 'both',
  },
]

export const VALID_WEAPON_DEFINDEXES = DEFAULT_WEAPONS.reduce(
  (acc, weapon) => {
    acc[weapon.weapon_defindex] = true
    return acc
  },
  {} as Record<number, boolean>
)

export const DEFAULT_KNIVES: IDefaultItem[] = [
  {
    weapon_defindex: 500,
    weapon_name: 'weapon_bayonet',
    defaultName: 'Bayonet',
    defaultImage: IMAGE_BASE_URL + 'weapon_knife_bayonet.webp',
    category: 'knife',
    paintindex: 0,
    availableTeams: 'both',
  },
  {
    weapon_defindex: 503,
    weapon_name: 'weapon_knife_css',
    defaultName: 'Classic Knife',
    defaultImage: IMAGE_BASE_URL + 'weapon_knife_css.webp',
    category: 'knife',
    paintindex: 0,
    availableTeams: 'both',
  },
  {
    weapon_defindex: 505,
    weapon_name: 'weapon_knife_flip',
    defaultName: 'Flip Knife',
    defaultImage: IMAGE_BASE_URL + 'weapon_knife_flip.webp',
    category: 'knife',
    paintindex: 0,
    availableTeams: 'both',
  },
  {
    weapon_defindex: 506,
    weapon_name: 'weapon_knife_gut',
    defaultName: 'Gut Knife',
    defaultImage: IMAGE_BASE_URL + 'weapon_knife_gut.webp',
    category: 'knife',
    paintindex: 0,
    availableTeams: 'both',
  },
  {
    weapon_defindex: 507,
    weapon_name: 'weapon_knife_karambit',
    defaultName: 'Karambit',
    defaultImage: IMAGE_BASE_URL + 'weapon_knife_karambit.webp',
    category: 'knife',
    paintindex: 0,
    availableTeams: 'both',
  },
  {
    weapon_defindex: 508,
    weapon_name: 'weapon_knife_m9_bayonet',
    defaultName: 'M9 Bayonet',
    defaultImage: IMAGE_BASE_URL + 'weapon_knife_m9_bayonet.webp',
    category: 'knife',
    paintindex: 0,
    availableTeams: 'both',
  },
  {
    weapon_defindex: 509,
    weapon_name: 'weapon_knife_tactical',
    defaultName: 'Huntsman Knife',
    defaultImage: IMAGE_BASE_URL + 'weapon_knife_tactical.webp',
    category: 'knife',
    paintindex: 0,
    availableTeams: 'both',
  },
  {
    weapon_defindex: 512,
    weapon_name: 'weapon_knife_falchion',
    defaultName: 'Falchion Knife',
    defaultImage: IMAGE_BASE_URL + 'weapon_knife_falchion.webp',
    category: 'knife',
    paintindex: 0,
    availableTeams: 'both',
  },
  {
    weapon_defindex: 514,
    weapon_name: 'weapon_knife_survival_bowie',
    defaultName: 'Bowie Knife',
    defaultImage: IMAGE_BASE_URL + 'weapon_knife_survival_bowie.webp',
    category: 'knife',
    paintindex: 0,
    availableTeams: 'both',
  },
  {
    weapon_defindex: 515,
    weapon_name: 'weapon_knife_butterfly',
    defaultName: 'Butterfly Knife',
    defaultImage: IMAGE_BASE_URL + 'weapon_knife_butterfly.webp',
    category: 'knife',
    paintindex: 0,
    availableTeams: 'both',
  },
  {
    weapon_defindex: 516,
    weapon_name: 'weapon_knife_push',
    defaultName: 'Shadow Daggers',
    defaultImage: IMAGE_BASE_URL + 'weapon_knife_push.webp',
    category: 'knife',
    paintindex: 0,
    availableTeams: 'both',
  },
  {
    weapon_defindex: 517,
    weapon_name: 'weapon_knife_cord',
    defaultName: 'Paracord Knife',
    defaultImage: IMAGE_BASE_URL + 'weapon_knife_cord.webp',
    category: 'knife',
    paintindex: 0,
    availableTeams: 'both',
  },
  {
    weapon_defindex: 518,
    weapon_name: 'weapon_knife_canis',
    defaultName: 'Survival Knife',
    defaultImage: IMAGE_BASE_URL + 'weapon_knife_canis.webp',
    category: 'knife',
    paintindex: 0,
    availableTeams: 'both',
  },
  {
    weapon_defindex: 519,
    weapon_name: 'weapon_knife_ursus',
    defaultName: 'Ursus Knife',
    defaultImage: IMAGE_BASE_URL + 'weapon_knife_ursus.webp',
    category: 'knife',
    paintindex: 0,
    availableTeams: 'both',
  },
  {
    weapon_defindex: 520,
    weapon_name: 'weapon_knife_gypsy_jackknife',
    defaultName: 'Navaja Knife',
    defaultImage: IMAGE_BASE_URL + 'weapon_knife_gypsy_jackknife.webp',
    category: 'knife',
    paintindex: 0,
    availableTeams: 'both',
  },
  {
    weapon_defindex: 521,
    weapon_name: 'weapon_knife_outdoor',
    defaultName: 'Nomad Knife',
    defaultImage: IMAGE_BASE_URL + 'weapon_knife_outdoor.webp',
    category: 'knife',
    paintindex: 0,
    availableTeams: 'both',
  },
  {
    weapon_defindex: 522,
    weapon_name: 'weapon_knife_stiletto',
    defaultName: 'Stiletto Knife',
    defaultImage: IMAGE_BASE_URL + 'weapon_knife_stiletto.webp',
    category: 'knife',
    paintindex: 0,
    availableTeams: 'both',
  },
  {
    weapon_defindex: 523,
    weapon_name: 'weapon_knife_widowmaker',
    defaultName: 'Talon Knife',
    defaultImage: IMAGE_BASE_URL + 'weapon_knife_widowmaker.webp',
    category: 'knife',
    paintindex: 0,
    availableTeams: 'both',
  },
  {
    weapon_defindex: 525,
    weapon_name: 'weapon_knife_skeleton',
    defaultName: 'Skeleton Knife',
    defaultImage: IMAGE_BASE_URL + 'weapon_knife_skeleton.webp',
    category: 'knife',
    paintindex: 0,
    availableTeams: 'both',
  },
  {
    weapon_defindex: 526,
    weapon_name: 'weapon_knife_kukri',
    defaultName: 'Kukri Knife',
    defaultImage: IMAGE_BASE_URL + 'weapon_knife_kukri.webp',
    category: 'knife',
    paintindex: 0,
    availableTeams: 'both',
  },
]

export const VALID_KNIFE_DEFINDEXES = DEFAULT_KNIVES.reduce(
  (acc, knife) => {
    acc[knife.weapon_defindex] = true
    return acc
  },
  {} as Record<number, boolean>
)

export const DEFAULT_GLOVES = [
  {
    weapon_defindex: 5027, // Bloodhound Gloves
    weapon_name: 'studded_bloodhound_gloves',
    defaultName: 'Bloodhound Gloves',
    defaultImage: IMAGE_BASE_URL + 'default_gloves_t.webp',
    category: 'glove',
    paintindex: 0,
    availableTeams: 'both',
  },
  {
    weapon_defindex: 4725, // Broken Fang Gloves
    weapon_name: 'studded_brokenfang_gloves',
    defaultName: 'Broken Fang Gloves',
    defaultImage: IMAGE_BASE_URL + 'default_gloves_t.webp',
    category: 'glove',
    paintindex: 0,
    availableTeams: 'both',
  },
  {
    weapon_defindex: 5031, // Driver Gloves
    weapon_name: 'slick_gloves',
    defaultName: 'Driver Gloves',
    defaultImage: IMAGE_BASE_URL + 'default_gloves_t.webp',
    category: 'glove',
    paintindex: 0,
    availableTeams: 'both',
  },
  {
    weapon_defindex: 5032, // Hand Wraps
    weapon_name: 'leather_handwraps',
    defaultName: 'Hand Wraps',
    defaultImage: IMAGE_BASE_URL + 'default_gloves_t.webp',
    category: 'glove',
    paintindex: 0,
    availableTeams: 'both',
  },
  {
    weapon_defindex: 5035, // Hydra Gloves
    weapon_name: 'studded_hydra_gloves',
    defaultName: 'Hydra Gloves',
    defaultImage: IMAGE_BASE_URL + 'default_gloves_t.webp',
    category: 'glove',
    paintindex: 0,
    availableTeams: 'both',
  },
  {
    weapon_defindex: 5033, // Moto Gloves
    weapon_name: 'motorcycle_gloves',
    defaultName: 'Moto Gloves',
    defaultImage: IMAGE_BASE_URL + 'default_gloves_t.webp',
    category: 'glove',
    paintindex: 0,
    availableTeams: 'both',
  },
  {
    weapon_defindex: 5034, // Specialist Gloves
    weapon_name: 'specialist_gloves',
    defaultName: 'Specialist Gloves',
    defaultImage: IMAGE_BASE_URL + 'default_gloves_t.webp',
    category: 'glove',
    paintindex: 0,
    availableTeams: 'both',
  },
  {
    weapon_defindex: 5030, // Sport Gloves
    weapon_name: 'sporty_gloves',
    defaultName: 'Sport Gloves',
    defaultImage: IMAGE_BASE_URL + 'default_gloves_t.webp',
    category: 'glove',
    paintindex: 0,
    availableTeams: 'both',
  },
]

export const VALID_GLOVE_DEFINDEXES = DEFAULT_GLOVES.reduce(
  (acc, glove) => {
    acc[glove.weapon_defindex] = true
    return acc
  },
  {} as Record<number, boolean>
)

export const DEFINDEXES = {
  weapon_deagle: 1,
  weapon_elite: 2,
  weapon_fiveseven: 3,
  weapon_glock: 4,
  weapon_ak47: 7,
  weapon_aug: 8,
  weapon_awp: 9,
  weapon_famas: 10,
  weapon_g3sg1: 11,
  weapon_galil: 13,
  weapon_m249: 14,
  weapon_m4a1: 16,
  weapon_mac10: 17,
  weapon_p90: 19,
  weapon_mp5sd: 23,
  weapon_ump45: 24,
  weapon_xm1014: 25,
  weapon_bizon: 26,
  weapon_mag7: 27,
  weapon_negev: 28,
  weapon_sawedoff: 29,
  weapon_tec9: 30,
  weapon_taser: 31,
  weapon_hkp2000: 32,
  weapon_mp7: 33,
  weapon_mp9: 34,
  weapon_nova: 35,
  weapon_p250: 36,
  weapon_shield: 37,
  weapon_scar20: 38,
  weapon_sg553: 39,
  weapon_ssg08: 40,
  weapon_knifegg: 41,
  weapon_knife: 42,
  weapon_flashbang: 43,
  weapon_hegrenade: 44,
  weapon_smokegrenade: 45,
  weapon_molotov: 46,
  weapon_decoy: 47,
  weapon_incgrenade: 48,
  weapon_c4: 49,
  weapon_healthshot: 57,
  weapon_knife_t: 59,
  weapon_m4a1_silencer: 60,
  weapon_usp_silencer: 61,
  weapon_cz75a: 63,
  weapon_revolver: 64,
  weapon_tagrenade: 68,
  weapon_fists: 69,
  weapon_breachcharge: 70,
  weapon_tablet: 72,
  weapon_melee: 74,
  weapon_axe: 75,
  weapon_hammer: 76,
  weapon_spanner: 78,
  weapon_knife_ghost: 80,
  weapon_firebomb: 81,
  weapon_diversion: 82,
  weapon_frag_grenade: 83,
  weapon_snowball: 84,
  weapon_bumpmine: 85,
  weapon_bayonet: 500,
  weapon_knife_css: 503,
  weapon_knife_flip: 505,
  weapon_knife_gut: 506,
  weapon_knife_karambit: 507,
  weapon_knife_m9_bayonet: 508,
  weapon_knife_tactical: 509,
  weapon_knife_falchion: 512,
  weapon_knife_survival_bowie: 514,
  weapon_knife_butterfly: 515,
  weapon_knife_push: 516,
  weapon_knife_cord: 517,
  weapon_knife_canis: 518,
  weapon_knife_ursus: 519,
  weapon_knife_gypsy_jackknife: 520,
  weapon_knife_outdoor: 521,
  weapon_knife_stiletto: 522,
  weapon_knife_widowmaker: 523,
  weapon_knife_skeleton: 525,
  weapon_knife_kukri: 526,
  studded_brokenfang_gloves: 4725,
  studded_bloodhound_gloves: 5027,
  sporty_gloves: 5030,
  slick_gloves: 5031,
  leather_handwraps: 5032,
  motorcycle_gloves: 5033,
  specialist_gloves: 5034,
  studded_hydra_gloves: 5035,
}
