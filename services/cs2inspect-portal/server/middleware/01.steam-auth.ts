import jwt from 'jsonwebtoken'
import { eq } from 'drizzle-orm'
import { customers } from '~/server/database/schema'

export default defineEventHandler(async (event) => {
  const url = getRequestURL(event)
  if (url.pathname !== '/api/auth/steam-validate') return

  const query = getQuery(event)
  const claimedId = query['openid.claimed_id'] as string
  if (!claimedId) throw createError({ statusCode: 400, statusMessage: 'Missing Steam ID' })

  // Verify with Steam OpenID
  const params = new URLSearchParams()
  params.set('openid.mode', 'check_authentication')
  for (const [key, value] of Object.entries(query)) {
    if (key.startsWith('openid.') && key !== 'openid.mode') {
      params.set(key, value as string)
    }
  }

  const verifyRes = await fetch('https://steamcommunity.com/openid/login', {
    method: 'POST',
    body: params,
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  })
  const verifyText = await verifyRes.text()
  if (!verifyText.includes('is_valid:true')) {
    throw createError({ statusCode: 401, statusMessage: 'Steam validation failed' })
  }

  const steamId = claimedId.split('/').pop()!
  const config = useRuntimeConfig()

  // Fetch Steam profile
  const profileRes = await fetch(
    `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/?key=${config.steamApiKey}&steamids=${steamId}`
  )
  const profileData = await profileRes.json()
  const player = profileData.response.players[0]

  // Upsert customer
  const db = useDatabase()
  await db.insert(customers).values({
    steamid: steamId,
    personaname: player?.personaname || 'Unknown',
    avatarurl: player?.avatarfull || null,
  }).onDuplicateKeyUpdate({
    set: {
      personaname: player?.personaname || 'Unknown',
      avatarurl: player?.avatarfull || null,
      lastseen: new Date(),
    },
  })

  // Create JWT
  const token = jwt.sign({ steamId, type: 'steam_auth' }, config.jwtSecret, {
    expiresIn: config.jwtExpiry,
  })

  setCookie(event, 'auth_token', token, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
  })

  return sendRedirect(event, '/dashboard')
})
