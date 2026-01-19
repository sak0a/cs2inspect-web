/**
 * Drizzle ORM Migration Runner
 * Handles database migrations using Drizzle Kit
 */
import { migrate } from 'drizzle-orm/mysql2/migrator';
import { db, pool } from './client';

/**
 * Run all pending Drizzle migrations
 */
export async function runMigrations(): Promise<void> {
    try {
        console.log('[Drizzle] Starting migration check...');

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
