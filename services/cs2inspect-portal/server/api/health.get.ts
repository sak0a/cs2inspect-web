import { pool } from '~/server/database/client'

export default defineEventHandler(async () => {
  try {
    const conn = await pool.getConnection()
    conn.release()
    return { status: 'ok', db: 'connected' }
  }
  catch {
    throw createError({ statusCode: 503, statusMessage: 'Database unavailable' })
  }
})
