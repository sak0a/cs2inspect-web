import {
  mysqlTable,
  int,
  varchar,
  tinyint,
  timestamp,
  index,
  uniqueIndex,
} from 'drizzle-orm/mysql-core'
import { loadouts } from './loadouts'

export const agents = mysqlTable(
  'wp_player_agents',
  {
    id: int('id').primaryKey().autoincrement(),
    steamid: varchar('steamid', { length: 64 }).notNull(),
    loadoutid: int('loadoutid')
      .notNull()
      .references(() => loadouts.id, { onDelete: 'cascade' }),
    active: tinyint('active').default(1),
    team: tinyint('team').notNull(),
    defindex: int('defindex').notNull(),
    agent_name: varchar('agent_name', { length: 255 }).notNull(),
    created_at: timestamp('created_at').defaultNow().notNull(),
    updated_at: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
  },
  (table) => [
    index('idx_steamid_loadout').on(table.steamid, table.loadoutid),
    index('loadoutid').on(table.loadoutid),
    uniqueIndex('uq_wp_player_agents_unique').on(
      table.steamid,
      table.loadoutid,
      table.team,
      table.defindex
    ),
  ]
)
