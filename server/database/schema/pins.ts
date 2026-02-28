import { mysqlTable, int, varchar, timestamp, index } from 'drizzle-orm/mysql-core'
import { loadouts } from './loadouts'

export const pins = mysqlTable(
    'wp_player_pins',
    {
        id: int('id').primaryKey().autoincrement(),
        steamid: varchar('steamid', { length: 64 }).notNull(),
        loadoutid: int('loadoutid')
            .notNull()
            .references(() => loadouts.id, { onDelete: 'cascade' }),
        defindex: int('defindex').notNull(),
        created_at: timestamp('created_at').defaultNow().notNull(),
        updated_at: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
    },
    (table) => [
        index('idx_steamid_loadout').on(table.steamid, table.loadoutid),
        index('loadoutid').on(table.loadoutid),
    ]
)
