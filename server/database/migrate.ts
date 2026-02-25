/**
 * Drizzle ORM Migration Runner
 * Handles database migrations using Drizzle Kit
 */
import { migrate } from 'drizzle-orm/mysql2/migrator';
import { db, pool } from './client';

/**
 * Ensure the Drizzle migration journal table exists and is seeded.
 * If the database was originally set up with `db:push` (no journal),
 * this seeds all existing migrations as "already applied" so that
 * `migrate()` doesn't try to re-create tables that already exist.
 */
async function ensureMigrationJournal(): Promise<void> {
    const connection = await pool.getConnection();
    try {
        // Check if Drizzle's migration journal table exists
        const [rows] = await connection.query(
            `SELECT COUNT(*) as cnt FROM information_schema.tables
             WHERE table_schema = DATABASE() AND table_name = '__drizzle_migrations'`
        ) as [Array<{ cnt: number }>, unknown];

        const journalExists = rows[0]?.cnt > 0;

        if (journalExists) {
            // Journal exists — migrate() will handle the rest
            return;
        }

        // Journal doesn't exist. Check if DB has application tables (set up via db:push)
        const [tableRows] = await connection.query(
            `SELECT COUNT(*) as cnt FROM information_schema.tables
             WHERE table_schema = DATABASE() AND table_name = 'wp_player_loadouts'`
        ) as [Array<{ cnt: number }>, unknown];

        const hasExistingTables = tableRows[0]?.cnt > 0;

        if (!hasExistingTables) {
            // Fresh database — migrate() will create everything from scratch
            return;
        }

        // DB has tables but no journal — seed the journal with all migrations
        console.log('[Drizzle] Existing database detected without migration journal — seeding journal...');

        // Read the migration journal to get all migration entries
        const fs = await import('fs');
        const path = await import('path');
        const journalPath = path.resolve('./server/database/drizzle/meta/_journal.json');
        const journal = JSON.parse(fs.readFileSync(journalPath, 'utf-8'));

        // Create the journal table (same schema Drizzle uses)
        await connection.query(`
            CREATE TABLE \`__drizzle_migrations\` (
                \`id\` serial PRIMARY KEY,
                \`hash\` text NOT NULL,
                \`created_at\` bigint
            )
        `);

        // Mark all existing migrations as applied
        for (const entry of journal.entries) {
            const migrationPath = path.resolve(`./server/database/drizzle/${entry.tag}.sql`);
            const sql = fs.readFileSync(migrationPath, 'utf-8');

            // Drizzle uses a hash of the SQL content
            const crypto = await import('crypto');
            const hash = crypto.createHash('sha256').update(sql).digest('hex');

            await connection.query(
                `INSERT INTO \`__drizzle_migrations\` (\`hash\`, \`created_at\`) VALUES (?, ?)`,
                [hash, entry.when]
            );
        }

        console.log(`[Drizzle] Seeded ${journal.entries.length} migrations into journal`);
    } finally {
        connection.release();
    }
}

/**
 * Run all pending Drizzle migrations
 */
export async function runMigrations(): Promise<void> {
    try {
        console.log('[Drizzle] Starting migration check...');

        // Ensure the journal is set up before running migrations
        await ensureMigrationJournal();

        // Run migrations from the drizzle folder
        await migrate(db, {
            migrationsFolder: './server/database/drizzle'
        });

        console.log('[Drizzle] Migrations complete');
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('[Drizzle] Failed to run migrations:', errorMessage);
        throw error;
    }
}

/**
 * Close the database connection pool
 * Useful for graceful shutdown
 */
export async function closeConnection(): Promise<void> {
    try {
        await pool.end();
        console.log('[Drizzle] Database connection pool closed');
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('[Drizzle] Failed to close connection pool:', errorMessage);
    }
}
