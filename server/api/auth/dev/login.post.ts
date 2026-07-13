import { createError, defineEventHandler, readBody } from 'h3'
import {
  type DevAuthRole,
  ensureDevUser,
  isDevAuthEnabled,
  issueAuthCookie,
  validateDevCredentials,
} from '~/server/utils/devAuth'

interface DevLoginBody {
  username?: string
  password?: string
  as?: DevAuthRole
}

export default defineEventHandler(async (event) => {
  if (!isDevAuthEnabled()) {
    throw createError({ statusCode: 404, message: 'Not found' })
  }

  const body = (await readBody(event)) as DevLoginBody
  const role: DevAuthRole = body.as === 'admin' ? 'admin' : 'user'

  if (!validateDevCredentials(role, body.username, body.password)) {
    throw createError({ statusCode: 401, message: 'Invalid dev credentials' })
  }

  const profile = await ensureDevUser(role)
  issueAuthCookie(event, profile.steamid, 'dev_auth')

  return {
    steamId: profile.steamid,
    personaName: profile.personaname,
    avatarFull: profile.avatarfull,
    role,
    authenticated: true,
  }
})
