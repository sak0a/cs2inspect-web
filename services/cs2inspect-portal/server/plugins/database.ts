import { pool } from '~/server/database/client'

export default defineNitroPlugin(async () => {
  try {
    const connection = await pool.getConnection()
    console.log('[database] Connected to MariaDB')
    connection.release()
  }
  catch (error) {
    console.error('[database] Failed to connect:', error)
  }
})
