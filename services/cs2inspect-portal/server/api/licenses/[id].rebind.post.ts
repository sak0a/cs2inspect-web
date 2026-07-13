import { eq, and } from 'drizzle-orm'
import { licenses, customers } from '~/server/database/schema'

export default defineEventHandler(async (event) => {
  const licenseId = Number(getRouterParam(event, 'id'))
  const { steamId } = event.context.auth
  const db = useDatabase()

  const customer = await db.query.customers.findFirst({
    where: eq(customers.steamid, steamId),
  })
  if (!customer) throw createError({ statusCode: 404 })

  const license = await db.query.licenses.findFirst({
    where: and(eq(licenses.id, licenseId), eq(licenses.customerid, customer.id)),
  })
  if (!license) throw createError({ statusCode: 404 })

  // Check 7-day cooldown based on activation time
  if (license.activatedat && license.serveraddress) {
    const cooldownEnd = new Date(license.activatedat)
    cooldownEnd.setDate(cooldownEnd.getDate() + 7)
    if (new Date() < cooldownEnd) {
      throw createError({
        statusCode: 429,
        statusMessage: `Server rebind available after ${cooldownEnd.toISOString()}`,
      })
    }
  }

  await db.update(licenses)
    .set({ serveraddress: null, activatedat: null })
    .where(eq(licenses.id, licenseId))

  return { ok: true, message: 'Server address cleared. Will rebind on next plugin heartbeat.' }
})
