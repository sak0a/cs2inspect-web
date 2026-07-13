import { eq, and } from 'drizzle-orm'
import { customers, licenses } from '~/server/database/schema'
import { useStripe, PLANS, MULTI_SERVER_DISCOUNT_PCT, type PlanId } from '~/server/utils/stripe'

export default defineEventHandler(async (event) => {
  const { steamId } = event.context.auth
  const body = await readBody(event)
  const { licenseId, plan, provider } = body as { licenseId: number; plan: PlanId; provider: 'stripe' | 'paypal' }

  if (!PLANS[plan]) throw createError({ statusCode: 400, statusMessage: 'Invalid plan' })
  if (!['stripe', 'paypal'].includes(provider)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid provider' })
  }

  const db = useDatabase()
  const customer = await db.query.customers.findFirst({
    where: eq(customers.steamid, steamId),
  })
  if (!customer) throw createError({ statusCode: 404 })

  const license = await db.query.licenses.findFirst({
    where: and(eq(licenses.id, licenseId), eq(licenses.customerid, customer.id)),
  })
  if (!license) throw createError({ statusCode: 404 })

  // Check if multi-server discount applies (2nd+ license)
  const allLicenses = await db.query.licenses.findMany({
    where: eq(licenses.customerid, customer.id),
  })
  const isAdditionalLicense = allLicenses.length > 1

  let priceCents = PLANS[plan].price
  let discountPct = 0
  if (isAdditionalLicense) {
    discountPct = MULTI_SERVER_DISCOUNT_PCT
    priceCents = Math.round(priceCents * (1 - discountPct / 100))
  }

  const config = useRuntimeConfig()

  if (provider === 'stripe') {
    const stripe = useStripe()
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'eur',
          product_data: {
            name: `CS2Inspect Plugin — ${PLANS[plan].label}`,
            description: discountPct > 0
              ? `${discountPct}% multi-server discount applied`
              : undefined,
          },
          unit_amount: priceCents,
        },
        quantity: 1,
      }],
      metadata: {
        customerId: String(customer.id),
        licenseId: String(licenseId),
        plan,
        daysAdded: String(PLANS[plan].days),
        discountPct: String(discountPct),
      },
      success_url: `${config.portalBaseUrl}/dashboard?payment=success`,
      cancel_url: `${config.portalBaseUrl}/buy?payment=cancelled`,
    })

    return { url: session.url, provider: 'stripe' }
  }

  if (provider === 'paypal') {
    const { createPayPalOrder } = await import('~/server/utils/paypal')
    const amountEur = (priceCents / 100).toFixed(2)
    const description = `CS2Inspect Plugin — ${PLANS[plan].label}${discountPct > 0 ? ` (${discountPct}% discount)` : ''}`
    const metadata = {
      customerId: String(customer.id),
      licenseId: String(licenseId),
      plan,
      daysAdded: String(PLANS[plan].days),
      discountPct: String(discountPct),
      amountCents: String(priceCents),
    }

    const { approveUrl } = await createPayPalOrder(amountEur, description, metadata)
    return { url: approveUrl, provider: 'paypal' }
  }

  throw createError({ statusCode: 400, statusMessage: 'Invalid provider' })
})
