import { mysqlTable, int, varchar, boolean, timestamp } from 'drizzle-orm/mysql-core'

export const customers = mysqlTable('customers', {
  id: int('id').primaryKey().autoincrement(),
  steamid: varchar('steamid', { length: 64 }).notNull().unique(),
  personaname: varchar('personaname', { length: 128 }).notNull(),
  avatarurl: varchar('avatarurl', { length: 512 }),
  email: varchar('email', { length: 256 }),
  trialused: boolean('trialused').notNull().default(false),
  created_at: timestamp('created_at').defaultNow().notNull(),
  lastseen: timestamp('lastseen').defaultNow().onUpdateNow().notNull(),
})

export type Customer = typeof customers.$inferSelect
export type NewCustomer = typeof customers.$inferInsert
