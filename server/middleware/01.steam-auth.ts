import { defineEventHandler, readBody, getQuery } from 'h3'
import {
  buildMockSteamPlayer,
  isDevAuthEnabled,
  isMockSteamId,
  issueAuthCookie,
} from '~/server/utils/devAuth'

const JWT_SECRET = process.env.JWT_TOKEN || ''

export default defineEventHandler(async (event) => {
  const url = event.node.req.url

  if (url?.startsWith('/api/steam/validate')) {
    const body = await readBody(event)
    const formBody = new URLSearchParams(body as Record<string, string>).toString()
    const responseData = await $fetch<string>('https://steamcommunity.com/openid/login', {
      method: 'POST',
      body: formBody,
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    })

    if (responseData.includes('is_valid:true')) {
      const steamId = body['openid.claimed_id']?.match(/(\d+)$/)?.[1]
      if (steamId && JWT_SECRET) {
        issueAuthCookie(event, steamId, 'steam_auth')
      }
    }

    return responseData
  }

  if (url?.startsWith('/api/steam/user')) {
    const query = getQuery(event)
    const steamId = String(query.steamid || '')

    if (isDevAuthEnabled() && isMockSteamId(steamId)) {
      return {
        response: {
          players: [buildMockSteamPlayer(steamId)],
        },
      }
    }

    const apiKey = process.env.STEAM_API_KEY
    const userData = await $fetch(
      `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key=${apiKey}&steamids=${query.steamid}`
    )
    return userData
  }
})
