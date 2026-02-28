import { mysqlTable, int, varchar, timestamp, index } from 'drizzle-orm/mysql-core'

export const migrations = mysqlTable(
    '_migrations',
    {
        id: int('id').primaryKey().autoincrement(),
        filename: varchar('filename', { length: 255 }).notNull().unique(),
        executed_at: timestamp('executed_at').defaultNow().notNull(),
    },
    (table) => [index('idx_filename').on(table.filename)]
)
