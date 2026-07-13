import jwt from 'jsonwebtoken'

const PUBLIC_PATHS = [
  '/api/auth/steam-validate',
  '/api/licenses/validate',
  '/api/webhooks/',
  '/api/health',
]

export default defineEventHandler(async (event) => {
  const url = getRequestURL(event)
  if (!url.pathname.startsWith('/api/')) return
  if (PUBLIC_PATHS.some(p => url.pathname.startsWith(p))) return

  const token = getCookie(event, 'auth_token')
  if (!token) {
    throw createError({ statusCode: 401, statusMessage: 'Not authenticated' })
  }

  try {
    const config = useRuntimeConfig()
    const decoded = jwt.verify(token, config.jwtSecret) as { steamId: string; type: string }
    if (decoded.type !== 'steam_auth') {
      throw new Error('Invalid token type')
    }
    event.context.auth = decoded
  }
  catch {
    throw createError({ statusCode: 401, statusMessage: 'Invalid token' })
  }
})
