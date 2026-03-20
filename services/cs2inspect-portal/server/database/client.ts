import { drizzle } from 'drizzle-orm/mysql2'
import mysql from 'mysql2/promise'
import * as schema from './schema'

const connectionLimit = Number(process.env.DATABASE_CONNECTION_LIMIT) || 5

const pool = mysql.createPool({
  host: process.env.DATABASE_HOST || 'localhost',
  port: Number(process.env.DATABASE_PORT) || 3306,
  user: process.env.DATABASE_USER || 'portal',
  password: process.env.DATABASE_PASSWORD || '',
  database: process.env.DATABASE_NAME || 'cs2inspect_portal',
  connectionLimit,
  maxIdle: Math.min(connectionLimit, 5),
  idleTimeout: 60_000,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
})

export const db = drizzle(pool, { schema, mode: 'default' })
export { pool }
export * from './schema'
