/**
 * Drizzle ORM Client
 * Provides type-safe database access using Drizzle ORM with mysql2
 */
import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import * as schema from './schema';

// Create mysql2 connection pool
const pool = mysql.createPool({
    host: process.env.DATABASE_HOST || 'localhost',
    port: Number(process.env.DATABASE_PORT) || 3306,
    user: process.env.DATABASE_USER || 'root',
    password: process.env.DATABASE_PASSWORD || 'root',
    database: process.env.DATABASE_NAME || 'cs2inspect',
    connectionLimit: Number(process.env.DATABASE_CONNECTION_LIMIT) || 5,
    waitForConnections: true,
    queueLimit: 0,
});

// Create Drizzle ORM instance with schema for relational queries
export const db = drizzle(pool, { schema, mode: 'default' });

// Export pool for direct access (e.g., health checks)
export { pool };

// Re-export schema for convenience
export * from './schema';
