import { eq } from 'drizzle-orm'
import { purchases, customers } from '~/server/database/schema'

export default defineEventHandler(async (event) => {
  const { steamId } = event.context.auth
  const db = useDatabase()

  const customer = await db.query.customers.findFirst({
    where: eq(customers.steamid, steamId),
  })
  if (!customer) throw createError({ statusCode: 404 })

  return db.query.purchases.findMany({
    where: eq(purchases.customerid, customer.id),
    orderBy: (purchases, { desc }) => [desc(purchases.created_at)],
  })
})
