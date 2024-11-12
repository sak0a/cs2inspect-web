import mariadb, { PoolConnection } from 'mariadb';

const pool = mariadb.createPool({
    host: process.env.DATABASE_HOST,
    port: process.env.DATABASE_PORT,// Replace with your host
    user: process.env.DATABASE_USER,      // Replace with your user
    password: process.env.DATABASE_PASSWORD,  // Replace with your password
    database: process.env.DATABASE_NAME,  // Replace with your database name
    connectionLimit: process.env.DATABASE_CONNECTION_LIMIT
});
let conn: PoolConnection;
// Helper function to query the database
export async function query(sql: string, params: any[]) {
    try {
        conn = await pool.getConnection();
        return await conn.query(sql, params);
    } catch (err) {
        throw err;
    } finally {
        if (conn) await conn.release();
    }
}