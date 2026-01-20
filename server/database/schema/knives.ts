import { mysqlTable, int, varchar, tinyint, float, timestamp, index, uniqueIndex } from 'drizzle-orm/mysql-core';
import { loadouts } from './loadouts';

export const knives = mysqlTable('wp_player_knifes', {
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
    created_at: timestamp('created_at').defaultNow().notNull(),
    updated_at: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
}, (table) => ([
    index('idx_steamid_loadout').on(table.steamid, table.loadoutid),
    index('loadoutid').on(table.loadoutid),
    uniqueIndex('uq_wp_player_knifes_unique').on(table.steamid, table.loadoutid, table.team, table.defindex),
]));
