import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  schema: './server/database/schema/index.ts',
  out: './server/database/drizzle',
  dialect: 'mysql',
  dbCredentials: {
    host: process.env.DATABASE_HOST!,
    port: Number(process.env.DATABASE_PORT) || 3306,
    user: process.env.DATABASE_USER!,
    password: process.env.DATABASE_PASSWORD!,
    database: process.env.DATABASE_NAME!,
  },
})
