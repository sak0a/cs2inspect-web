import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  schema: './server/database/schema',
  out: './server/database/drizzle',
  dialect: 'mysql',
  dbCredentials: {
    host: process.env.DATABASE_HOST || 'localhost',
    port: Number(process.env.DATABASE_PORT) || 3306,
    user: process.env.DATABASE_USER || 'portal',
    password: process.env.DATABASE_PASSWORD || '',
    database: process.env.DATABASE_NAME || 'cs2inspect_portal',
  },
})
