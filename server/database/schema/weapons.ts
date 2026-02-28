import {
    mysqlTable,
    int,
    varchar,
    tinyint,
    float,
    timestamp,
    index,
    uniqueIndex,
    json,
} from 'drizzle-orm/mysql-core'
import { loadouts } from './loadouts'
import type { StickerJSON, KeychainJSON } from '~/server/types/jsonSchemas'

// Common weapon columns for all weapon tables
const weaponColumns = {
    id: int('id').primaryKey().autoincrement(),
    steamid: varchar('steamid', { length: 64 }).notNull(),
    loadoutid: int('loadoutid')
        .notNull()
        .references(() => loadouts.id, { onDelete: 'cascade' }),
    active: tinyint('active').default(1),
    team: tinyint('team').notNull(),
    defindex: int('defindex').notNull(),
    paintindex: int('paintindex').notNull(),
    paintseed: int('paintseed').notNull(),
    paintwear: float('paintwear').notNull(),
    stattrak_enabled: tinyint('stattrak_enabled').default(0),
    stattrak_count: int('stattrak_count').default(0),
    nametag: varchar('nametag', { length: 255 }),
    // JSON columns for stickers (null = empty slot)
    sticker_0: json('sticker_0').$type<StickerJSON | null>().default(null),
    sticker_1: json('sticker_1').$type<StickerJSON | null>().default(null),
    sticker_2: json('sticker_2').$type<StickerJSON | null>().default(null),
    sticker_3: json('sticker_3').$type<StickerJSON | null>().default(null),
    sticker_4: json('sticker_4').$type<StickerJSON | null>().default(null),
    // JSON column for keychain (includes wrapped_sticker_id and highlight_reel_id)
    keychain: json('keychain').$type<KeychainJSON | null>().default(null),
    created_at: timestamp('created_at').defaultNow().notNull(),
    updated_at: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
}

export const pistols = mysqlTable('wp_player_pistols', weaponColumns, (table) => [
    index('idx_steamid_loadout').on(table.steamid, table.loadoutid),
    index('loadoutid').on(table.loadoutid),
    uniqueIndex('uq_wp_player_pistols_unique').on(
        table.steamid,
        table.loadoutid,
        table.team,
        table.defindex
    ),
])

export const rifles = mysqlTable('wp_player_rifles', weaponColumns, (table) => [
    index('idx_steamid_loadout').on(table.steamid, table.loadoutid),
    index('loadoutid').on(table.loadoutid),
    uniqueIndex('uq_wp_player_rifles_unique').on(
        table.steamid,
        table.loadoutid,
        table.team,
        table.defindex
    ),
])

export const smgs = mysqlTable('wp_player_smgs', weaponColumns, (table) => [
    index('idx_steamid_loadout').on(table.steamid, table.loadoutid),
    index('loadoutid').on(table.loadoutid),
    uniqueIndex('uq_wp_player_smgs_unique').on(
        table.steamid,
        table.loadoutid,
        table.team,
        table.defindex
    ),
])

export const heavys = mysqlTable('wp_player_heavys', weaponColumns, (table) => [
    index('idx_steamid_loadout').on(table.steamid, table.loadoutid),
    index('loadoutid').on(table.loadoutid),
    uniqueIndex('uq_wp_player_heavys_unique').on(
        table.steamid,
        table.loadoutid,
        table.team,
        table.defindex
    ),
])
