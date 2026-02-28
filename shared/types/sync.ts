/**
 * Shared sync types used by both app and server
 *
 * Extracted from server/utils/sync/notifySync.ts
 * so app composables can import without crossing the server boundary.
 */

export type SyncItemType =
    | 'knife'
    | 'glove'
    | 'weapon'
    | 'agent'
    | 'music'
    | 'pin'
    | 'loadout'
    | 'config'
export type SyncItemCategory = 'rifles' | 'pistols' | 'smgs' | 'heavys' | null
