import { eq } from 'drizzle-orm'
import { customers, licenses } from '~/server/database/schema'
import { generateLicenseKey } from '~/server/utils/license-keys'

export default defineEventHandler(async (event) => {
  const { steamId } = event.context.auth
  const db = useDatabase()

  const customer = await db.query.customers.findFirst({
    where: eq(customers.steamid, steamId),
  })
  if (!customer) throw createError({ statusCode: 404, statusMessage: 'Customer not found' })
  if (customer.trialused) {
    throw createError({ statusCode: 409, statusMessage: 'Trial already used' })
  }

  const licenseKey = generateLicenseKey()
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + 3)

  const [result] = await db.insert(licenses).values({
    customerid: customer.id,
    licensekey: licenseKey,
    expiresat: expiresAt,
    istrial: true,
    status: 'active',
  })

  await db.update(customers)
    .set({ trialused: true })
    .where(eq(customers.id, customer.id))

  return {
    id: result.insertId,
    licenseKey,
    expiresAt: expiresAt.toISOString(),
  }
})
