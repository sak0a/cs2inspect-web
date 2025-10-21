/**
 * Database migration runner
 * Automatically runs all migration scripts in the migrations directory on server startup
 */
import { readdir, readFile } from 'fs/promises';
import { join } from 'path';
import { pool, executeQuery } from '~/server/database/database';

interface MigrationRecord {
    id: number;
    filename: string;
    executed_at: Date;
}

/**
 * Ensure the migrations tracking table exists
 */
async function ensureMigrationsTable(): Promise<void> {
    const createTableSQL = `
        CREATE TABLE IF NOT EXISTS _migrations (
            id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            filename VARCHAR(255) NOT NULL UNIQUE,
            executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP() NOT NULL,
            INDEX idx_filename (filename)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;
    
    await executeQuery(createTableSQL, [], 'Failed to create migrations table');
}

/**
 * Get list of already executed migrations
 */
async function getExecutedMigrations(): Promise<Set<string>> {
    try {
        const rows = await executeQuery<MigrationRecord[]>(
            'SELECT filename FROM _migrations ORDER BY id',
            [],
            'Failed to fetch executed migrations'
        );
        return new Set(rows.map(row => row.filename));
    } catch (error) {
        // If table doesn't exist yet, return empty set
        return new Set();
    }
}

/**
 * Mark a migration as executed
 */
async function markMigrationExecuted(filename: string): Promise<void> {
    await executeQuery(
        'INSERT INTO _migrations (filename) VALUES (?)',
        [filename],
        'Failed to mark migration as executed'
    );
}

/**
 * Split SQL into statements, respecting string literals and comments
 * This properly handles semicolons inside quoted strings like DEFAULT '0;0;0;0;0;0'
 */
function splitSQLStatements(sql: string): string[] {
    const statements: string[] = [];
    let currentStatement = '';
    let inSingleQuote = false;
    let inDoubleQuote = false;
    let inLineComment = false;
    let inBlockComment = false;
    
    for (let i = 0; i < sql.length; i++) {
        const char = sql[i];
        const nextChar = sql[i + 1];
        const prevChar = i > 0 ? sql[i - 1] : '';
        
        // Handle line comments (-- comment)
        if (!inSingleQuote && !inDoubleQuote && !inBlockComment && char === '-' && nextChar === '-') {
            inLineComment = true;
            currentStatement += char;
            continue;
        }
        
        // End line comment at newline
        if (inLineComment && char === '\n') {
            inLineComment = false;
            currentStatement += char;
            continue;
        }
        
        // Handle block comments (/* comment */)
        if (!inSingleQuote && !inDoubleQuote && !inLineComment && char === '/' && nextChar === '*') {
            inBlockComment = true;
            currentStatement += char;
            continue;
        }
        
        // End block comment
        if (inBlockComment && char === '*' && nextChar === '/') {
            inBlockComment = false;
            currentStatement += char + nextChar;
            i++; // Skip next character
            continue;
        }
        
        // Skip processing if in comment
        if (inLineComment || inBlockComment) {
            currentStatement += char;
            continue;
        }
        
        // Handle single quotes (with escape sequences)
        if (char === "'" && prevChar !== '\\' && !inDoubleQuote) {
            inSingleQuote = !inSingleQuote;
            currentStatement += char;
            continue;
        }
        
        // Handle double quotes (with escape sequences)
        if (char === '"' && prevChar !== '\\' && !inSingleQuote) {
            inDoubleQuote = !inDoubleQuote;
            currentStatement += char;
            continue;
        }
        
        // Handle semicolon as statement terminator (only if not in string or comment)
        if (char === ';' && !inSingleQuote && !inDoubleQuote) {
            currentStatement += char;
            const trimmed = currentStatement.trim();
            if (trimmed.length > 0) {
                statements.push(trimmed);
            }
            currentStatement = '';
            continue;
        }
        
        currentStatement += char;
    }
    
    // Add any remaining statement
    const trimmed = currentStatement.trim();
    if (trimmed.length > 0 && !trimmed.startsWith('--')) {
        statements.push(trimmed);
    }
    
    return statements;
}

/**
 * Execute a single migration file
 */
async function executeMigration(filepath: string, filename: string): Promise<void> {
    console.log(`[Migration] Executing: ${filename}`);
    
    const sql = await readFile(filepath, 'utf-8');
    
    // Split SQL into statements, properly handling strings and comments
    const statements = splitSQLStatements(sql);
    
    const conn = await pool.getConnection();
    
    try {
        await conn.beginTransaction();
        
        for (const statement of statements) {
            if (statement.trim()) {
                await conn.query(statement);
            }
        }
        
        await conn.commit();
        await markMigrationExecuted(filename);
        
        console.log(`[Migration] ✓ Completed: ${filename}`);
    } catch (error) {
        await conn.rollback();
        throw error;
    } finally {
        conn.release();
    }
}

/**
 * Run all pending migrations
 */
export async function runMigrations(): Promise<void> {
    try {
        console.log('[Migration] Starting migration check...');
        
        // Ensure migrations table exists
        await ensureMigrationsTable();
        
        // Get migrations directory path
        const migrationsDir = join(process.cwd(), 'server', 'database', 'migrations');
        
        // Get list of migration files
        const files = await readdir(migrationsDir);
        const migrationFiles = files
            .filter(f => f.endsWith('.sql'))
            .sort(); // Sort to ensure execution order (000_, 001_, etc.)
        
        if (migrationFiles.length === 0) {
            console.log('[Migration] No migration files found');
            return;
        }
        
        // Get already executed migrations
        const executedMigrations = await getExecutedMigrations();
        
        // Find pending migrations
        const pendingMigrations = migrationFiles.filter(f => !executedMigrations.has(f));
        
        if (pendingMigrations.length === 0) {
            console.log('[Migration] All migrations are up to date');
            return;
        }
        
        console.log(`[Migration] Found ${pendingMigrations.length} pending migration(s)`);
        
        // Execute each pending migration
        for (const filename of pendingMigrations) {
            const filepath = join(migrationsDir, filename);
            await executeMigration(filepath, filename);
        }
        
        console.log(`[Migration] ✓ Successfully executed ${pendingMigrations.length} migration(s)`);
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('[Migration] Failed to run migrations:', errorMessage);
        throw error;
    }
}
