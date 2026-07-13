import { eq } from 'drizzle-orm'
import { customers } from '~/server/database/schema'
import { z } from 'zod'

const emailSchema = z.object({
  email: z.string().email().max(256),
})

export default defineEventHandler(async (event) => {
  const { steamId } = event.context.auth
  const body = await readBody(event)
  const { email } = emailSchema.parse(body)

  const db = useDatabase()
  await db.update(customers)
    .set({ email })
    .where(eq(customers.steamid, steamId))

  return { ok: true }
})
