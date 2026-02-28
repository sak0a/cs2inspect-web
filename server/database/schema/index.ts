/**
 * Drizzle ORM Schema Index
 * Exports all table schemas for the CS2 Inspect database
 */

// Core tables
export { loadouts } from './loadouts'

// Item tables
export { agents } from './agents'
export { gloves } from './gloves'
export { knives } from './knives'
export { music } from './music'
export { pins } from './pins'
export { pistols, rifles, smgs, heavys } from './weapons'

// System tables
export { healthCheckHistory, healthCheckConfig } from './health'
export { migrations } from './migrations'

// Sync tables
export { syncNotifications } from './syncNotifications'

// History tables
export { itemHistory } from './itemHistory'
export type {
    ItemHistorySnapshot,
    ChangeType,
    HistoryItemType,
    HistoryItemCategory,
    ItemHistoryRecord,
    NewItemHistoryRecord,
} from './itemHistory'

// Admin tables
export { adminUsers, bannedUsers, appSettings, adminActivityLog } from './admin'
export type {
    AdminUser,
    NewAdminUser,
    BannedUser,
    NewBannedUser,
    AppSetting,
    NewAppSetting,
    AdminActivityLogEntry,
    NewAdminActivityLogEntry,
    AdminRole,
    SettingType,
    AdminAction,
} from './admin'

// User profile tables
export { userProfiles } from './userProfiles'
export type { UserProfile, NewUserProfile } from './userProfiles'

// Plugin settings tables
export { pluginSettings } from './pluginSettings'
export type {
    PluginSetting,
    NewPluginSetting,
    PluginSettingCategory,
    PluginSettingReloadBehavior,
    PluginSettingType,
} from './pluginSettings'

// Zod validation schemas (drizzle-zod)
export {
    insertLoadoutSchema,
    selectLoadoutSchema,
    loadoutCreateBodySchema,
    insertWeaponSchema,
    selectWeaponSchema,
    weaponSaveBodySchema,
    insertKnifeSchema,
    selectKnifeSchema,
    knifeSaveBodySchema,
    insertGloveSchema,
    selectGloveSchema,
    gloveSaveBodySchema,
    insertAgentSchema,
    selectAgentSchema,
    insertMusicSchema,
    selectMusicSchema,
    insertPinSchema,
    selectPinSchema,
    resetRequestSchema,
} from './zod'
