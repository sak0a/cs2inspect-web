import { mysqlTable, int, varchar, boolean, timestamp, mysqlEnum } from 'drizzle-orm/mysql-core'
import { customers } from './customers'

export const licenses = mysqlTable('licenses', {
  id: int('id').primaryKey().autoincrement(),
  customerid: int('customerid').notNull().references(() => customers.id),
  licensekey: varchar('licensekey', { length: 19 }).notNull().unique(),
  serveraddress: varchar('serveraddress', { length: 64 }),
  activatedat: timestamp('activatedat'),
  expiresat: timestamp('expiresat').notNull(),
  istrial: boolean('istrial').notNull().default(false),
  status: mysqlEnum('status', ['active', 'expired', 'revoked']).notNull().default('active'),
  lastheartbeat: timestamp('lastheartbeat'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
})

export type License = typeof licenses.$inferSelect
export type NewLicense = typeof licenses.$inferInsert
