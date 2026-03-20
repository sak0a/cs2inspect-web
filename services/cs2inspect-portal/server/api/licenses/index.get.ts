import { eq } from 'drizzle-orm'
import { licenses, customers } from '~/server/database/schema'

export default defineEventHandler(async (event) => {
  const { steamId } = event.context.auth
  const db = useDatabase()

  const customer = await db.query.customers.findFirst({
    where: eq(customers.steamid, steamId),
  })
  if (!customer) throw createError({ statusCode: 404, statusMessage: 'Customer not found' })

  return db.query.licenses.findMany({
    where: eq(licenses.customerid, customer.id),
    orderBy: (licenses, { desc }) => [desc(licenses.created_at)],
  })
})
