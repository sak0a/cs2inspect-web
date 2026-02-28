/**
 * Drizzle ORM Migration Runner
 * Handles database migrations using Drizzle Kit
 */
import { migrate } from 'drizzle-orm/mysql2/migrator'
import { db, pool } from './client'
import { Logger } from '~/server/utils/logger'

/**
 * Ensure the Drizzle migration journal table exists and is seeded.
 * If the database was originally set up with `db:push` (no journal),
 * this seeds all existing migrations as "already applied" so that
 * `migrate()` doesn't try to re-create tables that already exist.
 */
async function ensureMigrationJournal(): Promise<void> {
    const connection = await pool.getConnection()
    try {
        const fs = await import('fs')
        const path = await import('path')
        const crypto = await import('crypto')

        const journalPath = path.resolve('./server/database/drizzle/meta/_journal.json')
        const journal = JSON.parse(fs.readFileSync(journalPath, 'utf-8'))

        // Check if Drizzle's migration journal table exists
        const [rows] = (await connection.query(
            `SELECT COUNT(*) as cnt FROM information_schema.tables
             WHERE table_schema = DATABASE() AND table_name = '__drizzle_migrations'`
        )) as [Array<{ cnt: number }>, unknown]

        const journalCount = rows[0]?.cnt ?? 0
        const journalExists = journalCount > 0

        if (journalExists) {
            // Journal exists — check for gap migrations (tables created via db:push
            // after the journal was initially seeded)
            await seedGapMigrations(connection, journal, fs, path, crypto)
            return
        }

        // Journal doesn't exist. Check if DB has application tables (set up via db:push)
        const [tableRows] = (await connection.query(
            `SELECT COUNT(*) as cnt FROM information_schema.tables
             WHERE table_schema = DATABASE() AND table_name = 'wp_player_loadouts'`
        )) as [Array<{ cnt: number }>, unknown]

        const existingTableCount = tableRows[0]?.cnt ?? 0
        const hasExistingTables = existingTableCount > 0

        if (!hasExistingTables) {
            // Fresh database — migrate() will create everything from scratch
            return
        }

        // DB has tables but no journal — seed the journal with all migrations
        Logger.info('Journal missing, seeding from applied schema', 'migrations')

        // Create the journal table (same schema Drizzle uses)
        await connection.query(`
            CREATE TABLE \`__drizzle_migrations\` (
                \`id\` serial PRIMARY KEY,
                \`hash\` text NOT NULL,
                \`created_at\` bigint
            )
        `)

        // Mark all existing migrations as applied
        for (const entry of journal.entries) {
            const migrationPath = path.resolve(`./server/database/drizzle/${entry.tag}.sql`)
            const sqlContent = fs.readFileSync(migrationPath, 'utf-8')
            const hash = crypto.createHash('sha256').update(sqlContent).digest('hex')

            await connection.query(
                `INSERT INTO \`__drizzle_migrations\` (\`hash\`, \`created_at\`) VALUES (?, ?)`,
                [hash, entry.when]
            )
        }

        Logger.info(`Journal seeded count=${journal.entries.length}`, 'migrations')
    } finally {
        connection.release()
    }
}

/**
 * Seed migrations that were applied via db:push after the journal was initially created.
 * For each migration not in __drizzle_migrations, check if its first CREATE TABLE
 * target already exists. If so, mark it as applied to prevent re-execution.
 */
async function seedGapMigrations(
    connection: import('mysql2/promise').PoolConnection,
    journal: { entries: Array<{ idx: number; tag: string; when: number }> },
    fs: typeof import('fs'),
    path: typeof import('path'),
    crypto: typeof import('crypto')
): Promise<void> {
    // Get all hashes currently in the journal table
    const [appliedRows] = (await connection.query(`SELECT hash FROM \`__drizzle_migrations\``)) as [
        Array<{ hash: string }>,
        unknown,
    ]
    const appliedHashes = new Set(appliedRows.map((r) => r.hash))

    let seededCount = 0

    for (const entry of journal.entries) {
        const migrationPath = path.resolve(`./server/database/drizzle/${entry.tag}.sql`)
        const sqlContent = fs.readFileSync(migrationPath, 'utf-8')
        const hash = crypto.createHash('sha256').update(sqlContent).digest('hex')

        if (appliedHashes.has(hash)) {
            continue // Already applied
        }

        // Extract the first CREATE TABLE name from the migration SQL
        const tableMatch = sqlContent.match(/CREATE TABLE [`"]?(\w+)[`"]?/i)
        if (!tableMatch) {
            continue // No CREATE TABLE — let migrate() handle it
        }

        const tableName = tableMatch[1]

        // Check if this table already exists in the database
        const [tableCheck] = (await connection.query(
            `SELECT COUNT(*) as cnt FROM information_schema.tables
             WHERE table_schema = DATABASE() AND table_name = ?`,
            [tableName]
        )) as [Array<{ cnt: number }>, unknown]

        if ((tableCheck[0]?.cnt ?? 0) > 0) {
            // Table exists but migration isn't recorded — seed it
            await connection.query(
                `INSERT INTO \`__drizzle_migrations\` (\`hash\`, \`created_at\`) VALUES (?, ?)`,
                [hash, entry.when]
            )
            seededCount++
            Logger.info(
                `Gap migration seeded: ${entry.tag} (table ${tableName} already exists)`,
                'migrations'
            )
        }
    }

    if (seededCount > 0) {
        Logger.info(`Gap migrations seeded count=${seededCount}`, 'migrations')
    }
}

/**
 * Run all pending Drizzle migrations
 */
export async function runMigrations(): Promise<void> {
    try {
        Logger.info('Migration check start', 'migrations')

        // Ensure the journal is set up before running migrations
        await ensureMigrationJournal()

        // Run migrations from the drizzle folder
        await migrate(db, {
            migrationsFolder: './server/database/drizzle',
        })

        Logger.info('Migration check done', 'migrations')
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        Logger.error(`Migration check failed error=${errorMessage}`, 'migrations')
        throw error
    }
}

/**
 * Close the database connection pool
 * Useful for graceful shutdown
 */
export async function closeConnection(): Promise<void> {
    try {
        await pool.end()
        Logger.info('Connection pool closed', 'migrations')
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        Logger.error(`Connection pool close failed error=${errorMessage}`, 'migrations')
    }
}
