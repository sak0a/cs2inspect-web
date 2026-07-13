import { mysqlTable, int, varchar, timestamp, mysqlEnum } from 'drizzle-orm/mysql-core'
import { customers } from './customers'
import { licenses } from './licenses'

export const purchases = mysqlTable('purchases', {
  id: int('id').primaryKey().autoincrement(),
  customerid: int('customerid').notNull().references(() => customers.id),
  licenseid: int('licenseid').notNull().references(() => licenses.id),
  provider: mysqlEnum('provider', ['stripe', 'paypal']).notNull(),
  providertxid: varchar('providertxid', { length: 256 }).notNull().unique(),
  plan: mysqlEnum('plan', ['30d', '90d', '365d']).notNull(),
  amountcents: int('amountcents').notNull(),
  currency: varchar('currency', { length: 3 }).notNull().default('eur'),
  daysadded: int('daysadded').notNull(),
  discountpct: int('discountpct'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  status: mysqlEnum('status', ['completed', 'refunded']).notNull().default('completed'),
})

export type Purchase = typeof purchases.$inferSelect
export type NewPurchase = typeof purchases.$inferInsert
