import { mysqlTable, int, varchar, tinyint, float, timestamp, index, uniqueIndex } from 'drizzle-orm/mysql-core';
import { loadouts } from './loadouts';

// Common weapon columns for all weapon tables
const weaponColumns = {
    id: int('id').primaryKey().autoincrement(),
    steamid: varchar('steamid', { length: 64 }).notNull(),
    loadoutid: int('loadoutid').notNull().references(() => loadouts.id, { onDelete: 'cascade' }),
    active: tinyint('active').default(1),
    team: tinyint('team').notNull(),
    defindex: int('defindex').notNull(),
    paintindex: int('paintindex').notNull(),
    paintseed: int('paintseed').notNull(),
    paintwear: float('paintwear').notNull(),
    stattrak_enabled: tinyint('stattrak_enabled').default(0),
    stattrak_count: int('stattrak_count').default(0),
    nametag: varchar('nametag', { length: 255 }),
    sticker_0: varchar('sticker_0', { length: 200 }).default('0;0;0;0;0;0').notNull(),
    sticker_1: varchar('sticker_1', { length: 200 }).default('0;0;0;0;0;0').notNull(),
    sticker_2: varchar('sticker_2', { length: 200 }).default('0;0;0;0;0;0').notNull(),
    sticker_3: varchar('sticker_3', { length: 200 }).default('0;0;0;0;0;0').notNull(),
    sticker_4: varchar('sticker_4', { length: 200 }).default('0;0;0;0;0;0').notNull(),
    keychain: varchar('keychain', { length: 200 }).default('0;0;0;0;0').notNull(),
    wrapped_sticker_id: int('wrapped_sticker_id'),
    highlight_reel_id: int('highlight_reel_id'),
    created_at: timestamp('created_at').defaultNow().notNull(),
    updated_at: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
};

export const pistols = mysqlTable('wp_player_pistols', weaponColumns, (table) => ([
    index('idx_steamid_loadout').on(table.steamid, table.loadoutid),
    index('loadoutid').on(table.loadoutid),
    uniqueIndex('uq_wp_player_pistols_unique').on(table.steamid, table.loadoutid, table.team, table.defindex),
]));

export const rifles = mysqlTable('wp_player_rifles', weaponColumns, (table) => ([
    index('idx_steamid_loadout').on(table.steamid, table.loadoutid),
    index('loadoutid').on(table.loadoutid),
    uniqueIndex('uq_wp_player_rifles_unique').on(table.steamid, table.loadoutid, table.team, table.defindex),
]));

export const smgs = mysqlTable('wp_player_smgs', weaponColumns, (table) => ([
    index('idx_steamid_loadout').on(table.steamid, table.loadoutid),
    index('loadoutid').on(table.loadoutid),
    uniqueIndex('uq_wp_player_smgs_unique').on(table.steamid, table.loadoutid, table.team, table.defindex),
]));

export const heavys = mysqlTable('wp_player_heavys', weaponColumns, (table) => ([
    index('idx_steamid_loadout').on(table.steamid, table.loadoutid),
    index('loadoutid').on(table.loadoutid),
    uniqueIndex('uq_wp_player_heavys_unique').on(table.steamid, table.loadoutid, table.team, table.defindex),
]));
