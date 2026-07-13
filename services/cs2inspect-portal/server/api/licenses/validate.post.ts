import { eq } from 'drizzle-orm'
import { licenses } from '~/server/database/schema'
import { checkRateLimit } from '~/server/utils/rate-limit'

export default defineEventHandler(async (event) => {
  const clientIp = getRequestIP(event, { xForwardedFor: true }) || 'unknown'
  if (!checkRateLimit(clientIp)) {
    throw createError({ statusCode: 429, statusMessage: 'Rate limit exceeded' })
  }

  const body = await readBody(event)
  const { key, server_address } = body || {}
  if (!key || !server_address) {
    throw createError({ statusCode: 400, statusMessage: 'Missing key or server_address' })
  }

  const db = useDatabase()
  const license = await db.query.licenses.findFirst({
    where: eq(licenses.licensekey, key),
  })

  if (!license) {
    return { valid: false, reason: 'not_found' }
  }

  if (license.status === 'revoked') {
    return { valid: false, reason: 'revoked' }
  }

  if (new Date() > license.expiresat) {
    if (license.status !== 'expired') {
      await db.update(licenses).set({ status: 'expired' }).where(eq(licenses.id, license.id))
    }
    return { valid: false, reason: 'expired' }
  }

  // Bind server address on first activation
  if (!license.serveraddress) {
    await db.update(licenses)
      .set({ serveraddress: server_address, activatedat: new Date(), lastheartbeat: new Date() })
      .where(eq(licenses.id, license.id))
  }
  else if (license.serveraddress !== server_address) {
    return { valid: false, reason: 'address_mismatch' }
  }
  else {
    await db.update(licenses)
      .set({ lastheartbeat: new Date() })
      .where(eq(licenses.id, license.id))
  }

  const daysRemaining = Math.ceil((license.expiresat.getTime() - Date.now()) / (1000 * 60 * 60 * 24))

  return {
    valid: true,
    expires_at: license.expiresat.toISOString(),
    days_remaining: daysRemaining,
    server_address: server_address,
  }
})
