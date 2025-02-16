// server/utils/mariadb.ts
import mariadb from 'mariadb'

export const pool = mariadb.createPool({
    host: process.env.DATABASE_HOST || 'localhost',
    user: process.env.DATABASE_USER || 'root',
    password: process.env.DATABASE_PASSWORD || 'root',
    database: process.env.DATABASE_NAME || 'cs2inspect',
    connectionLimit: process.env.DATABASE_CONNECTION_LIMIT ? parseInt(process.env.DATABASE_CONNECTION_LIMIT) : 5,
    port: process.env.DATABASE_PORT ? parseInt(process.env.DATABASE_PORT) : 3306
})

export async function executeQuery<T>(
    query: string,
    params: any[],
    errorMessage: string
): Promise<T> {
    let conn;
    try {
        conn = await pool.getConnection();
        return await conn.query(query, params) as T;
    } catch (e) {
        throw new Error(errorMessage);
    } finally {
        if (conn) conn.release();
    }
}