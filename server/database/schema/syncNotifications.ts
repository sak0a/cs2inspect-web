import { mysqlTable, bigint, int, varchar, timestamp, index } from 'drizzle-orm/mysql-core'

export const syncNotifications = mysqlTable(
  'wp_sync_notifications',
  {
    id: bigint('id', { mode: 'number' }).primaryKey().autoincrement(),
    steamid: varchar('steamid', { length: 64 }).notNull(),
    loadoutid: int('loadoutid').notNull(),
    source: varchar('source', { length: 10 }).notNull(),
    item_type: varchar('item_type', { length: 20 }).notNull(),
    item_category: varchar('item_category', { length: 20 }),
    created_at: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    index('idx_source_steamid_id').on(table.source, table.steamid, table.id),
    index('idx_created_at').on(table.created_at),
  ]
)
