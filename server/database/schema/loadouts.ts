import {
  mysqlTable,
  int,
  varchar,
  tinyint,
  smallint,
  timestamp,
  index,
} from 'drizzle-orm/mysql-core'

export const loadouts = mysqlTable(
  'wp_player_loadouts',
  {
    id: int('id').primaryKey().autoincrement(),
    steamid: varchar('steamid', { length: 64 }).notNull(),
    name: varchar('name', { length: 25 }).notNull(),
    active: tinyint('active').default(0).notNull(),
    selected_knife_t: smallint('selected_knife_t'),
    selected_knife_ct: smallint('selected_knife_ct'),
    selected_glove_t: smallint('selected_glove_t'),
    selected_glove_ct: smallint('selected_glove_ct'),
    selected_agent_t: smallint('selected_agent_t'),
    selected_agent_ct: smallint('selected_agent_ct'),
    selected_music: smallint('selected_music'),
    selected_pin: smallint('selected_pin'),
    share_code: varchar('share_code', { length: 32 }).unique(),
    is_default: tinyint('is_default').default(0),
    created_at: timestamp('created_at').defaultNow().notNull(),
    updated_at: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
  },
  (table) => [index('idx_steamid').on(table.steamid)]
)
