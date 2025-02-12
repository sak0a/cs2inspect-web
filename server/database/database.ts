// server/utils/mariadb.ts
import mariadb from 'mariadb'

export const pool = mariadb.createPool({
    host: process.env.DATABASE_HOST || 'localhost',
    user: process.env.DATABASE_USER || 'root',
    password: process.env.DATABASE_PASSWORD || '',
    database: process.env.DATABASE_NAME || 'csgo_skins',
    connectionLimit: 10
})