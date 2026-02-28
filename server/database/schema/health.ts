import { mysqlTable, int, varchar, timestamp, text, tinyint, index } from 'drizzle-orm/mysql-core'

export const healthCheckHistory = mysqlTable(
    'health_check_history',
    {
        id: int('id').primaryKey().autoincrement(),
        check_name: varchar('check_name', { length: 64 }).notNull(),
        status: varchar('status', { length: 20 }).notNull(),
        latency_ms: int('latency_ms'),
        message: text('message'),
        metadata: text('metadata'),
        checked_at: timestamp('checked_at').defaultNow().notNull(),
    },
    (table) => [
        index('idx_check_name_time').on(table.check_name, table.checked_at),
        index('idx_checked_at').on(table.checked_at),
    ]
)

export const healthCheckConfig = mysqlTable('health_check_config', {
    id: int('id').primaryKey().autoincrement(),
    check_name: varchar('check_name', { length: 64 }).notNull().unique(),
    enabled: tinyint('enabled').default(1).notNull(),
    warning_threshold_ms: int('warning_threshold_ms'),
    error_threshold_ms: int('error_threshold_ms'),
    created_at: timestamp('created_at').defaultNow().notNull(),
    updated_at: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
})
