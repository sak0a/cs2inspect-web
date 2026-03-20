import { eq } from 'drizzle-orm'
import { licenses, purchases } from '~/server/database/schema'
import { useStripe } from '~/server/utils/stripe'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const stripe = useStripe()
  const body = await readRawBody(event)
  const sig = getHeader(event, 'stripe-signature')

  if (!body || !sig) {
    throw createError({ statusCode: 400, statusMessage: 'Missing body or signature' })
  }

  let stripeEvent
  try {
    stripeEvent = stripe.webhooks.constructEvent(body, sig, config.stripeWebhookSecret)
  }
  catch {
    throw createError({ statusCode: 400, statusMessage: 'Invalid webhook signature' })
  }

  if (stripeEvent.type !== 'checkout.session.completed') {
    return { received: true }
  }

  const session = stripeEvent.data.object
  const { customerId, licenseId, plan, daysAdded, discountPct } = session.metadata!

  const db = useDatabase()

  // Idempotency: check if we already processed this transaction
  const existing = await db.query.purchases.findFirst({
    where: eq(purchases.providertxid, session.id),
  })
  if (existing) return { received: true, duplicate: true }

  // Get current license
  const license = await db.query.licenses.findFirst({
    where: eq(licenses.id, Number(licenseId)),
  })
  if (!license) {
    console.error(`[stripe-webhook] License ${licenseId} not found`)
    return { received: true, error: 'license_not_found' }
  }

  // Calculate new expiry: max(now, current_expires_at) + days_added
  const now = new Date()
  const baseDate = license.expiresat > now ? license.expiresat : now
  const newExpiry = new Date(baseDate)
  newExpiry.setDate(newExpiry.getDate() + Number(daysAdded))

  // Create purchase record
  await db.insert(purchases).values({
    customerid: Number(customerId),
    licenseid: Number(licenseId),
    provider: 'stripe',
    providertxid: session.id,
    plan: plan as '30d' | '90d' | '365d',
    amountcents: session.amount_total!,
    currency: 'eur',
    daysadded: Number(daysAdded),
    discountpct: Number(discountPct) || null,
    status: 'completed',
  })

  // Update license expiry + clear trial flag if applicable
  await db.update(licenses)
    .set({
      expiresat: newExpiry,
      status: 'active',
      istrial: false,
    })
    .where(eq(licenses.id, Number(licenseId)))

  return { received: true }
})
