import { eq } from 'drizzle-orm'
import { licenses, purchases } from '~/server/database/schema'
import { verifyPayPalWebhook } from '~/server/utils/paypal'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const rawBody = await readRawBody(event)
  if (!rawBody) throw createError({ statusCode: 400 })

  const headers: Record<string, string> = {}
  for (const key of ['paypal-auth-algo', 'paypal-cert-url', 'paypal-transmission-id', 'paypal-transmission-sig', 'paypal-transmission-time']) {
    headers[key] = getHeader(event, key) || ''
  }

  const verified = await verifyPayPalWebhook(headers, rawBody, config.paypalWebhookId)
  if (!verified) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid webhook signature' })
  }

  const webhookEvent = JSON.parse(rawBody)
  if (webhookEvent.event_type !== 'PAYMENT.CAPTURE.COMPLETED') {
    return { received: true }
  }

  const capture = webhookEvent.resource
  const customId = capture.custom_id
  if (!customId) return { received: true }

  const metadata = JSON.parse(customId)
  const { customerId, licenseId, plan, daysAdded, discountPct, amountCents } = metadata

  const db = useDatabase()

  // Idempotency check
  const existing = await db.query.purchases.findFirst({
    where: eq(purchases.providertxid, capture.id),
  })
  if (existing) return { received: true, duplicate: true }

  const license = await db.query.licenses.findFirst({
    where: eq(licenses.id, Number(licenseId)),
  })
  if (!license) {
    console.error(`[paypal-webhook] License ${licenseId} not found`)
    return { received: true, error: 'license_not_found' }
  }

  // Calculate new expiry
  const now = new Date()
  const baseDate = license.expiresat > now ? license.expiresat : now
  const newExpiry = new Date(baseDate)
  newExpiry.setDate(newExpiry.getDate() + Number(daysAdded))

  await db.insert(purchases).values({
    customerid: Number(customerId),
    licenseid: Number(licenseId),
    provider: 'paypal',
    providertxid: capture.id,
    plan: plan as '30d' | '90d' | '365d',
    amountcents: Number(amountCents),
    currency: 'eur',
    daysadded: Number(daysAdded),
    discountpct: Number(discountPct) || null,
    status: 'completed',
  })

  await db.update(licenses)
    .set({ expiresat: newExpiry, status: 'active', istrial: false })
    .where(eq(licenses.id, Number(licenseId)))

  return { received: true }
})
