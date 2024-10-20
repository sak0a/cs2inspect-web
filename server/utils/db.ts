import mariadb from 'mariadb';

const pool = mariadb.createPool({
    host: '45.81.234.145', // Replace with your host
    user: 'korra_share',      // Replace with your user
    password: 'YYRmH*E6uqijhelB',  // Replace with your password
    database: 'korra_share',  // Replace with your database name
    connectionLimit: 5
});

// Helper function to query the database
export async function query(sql: string, params: any[]) {
    let conn;
    try {
        conn = await pool.getConnection();
        return await conn.query(sql, params);
    } finally {
        if (conn) conn.release();
    }
}