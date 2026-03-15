// server/middleware/steam-auth.ts
import { defineEventHandler, readBody, getQuery } from 'h3'
import jwt from 'jsonwebtoken'
import type { SignOptions } from 'jsonwebtoken'
import { eq } from 'drizzle-orm'
import { Logger } from '~/server/utils/logger'
import { db } from '~/server/database/client'
import { userProfiles } from '~/server/database/schema'
import { getCachedSetting } from '~/server/utils/settingsCache'

// Use process.env directly instead of ~/server/env to avoid pulling
// @t3-oss/env-nuxt validation into the Nitro prerender bundle, which
// would fail in CI where DATABASE_HOST etc. are not set.
const JWT_SECRET = process.env.JWT_TOKEN
if (!JWT_SECRET) {
  throw new Error('JWT_TOKEN environment variable is required')
}

export default defineEventHandler(async (event) => {
  const url = event.node.req.url

  if (url?.startsWith('/api/steam/validate')) {
    const body = await readBody(event)
    // Convert body object to URL-encoded string for Steam's OpenID endpoint
    const formBody = new URLSearchParams(body as Record<string, string>).toString()
    const responseData = await $fetch<string>('https://steamcommunity.com/openid/login', {
      method: 'POST',
      body: formBody,
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    })
    if (responseData.includes('is_valid:true')) {
      // Extract Steam ID from the validation response
      const steamId = body['openid.claimed_id']?.match(/(\d+)$/)?.[1]
      if (steamId) {
        // Check if this is a new user and registration is disabled
        const [existingUser] = await db
          .select({ steamid: userProfiles.steamid })
          .from(userProfiles)
          .where(eq(userProfiles.steamid, steamId))
          .limit(1)

        if (!existingUser) {
          const registrationEnabled = await getCachedSetting('REGISTRATION_ENABLED', true)
          if (!registrationEnabled) {
            return 'is_valid:false\nregistration_disabled:true'
          }
        }

        const payload: { steamId: string; type: string } = {
          steamId,
          type: 'steam_auth',
        }

        // Create JWT token with Steam ID and additional claims
        const token = jwt.sign(payload, JWT_SECRET, {
          expiresIn: String(process.env.JWT_EXPIRY || '7d'),
        } as SignOptions)

        // Set JWT as an HTTP-only cookie
        setCookie(event, 'auth_token', token, {
          httpOnly: true,
          secure: true,
          sameSite: 'lax',
          maxAge: 60 * 60 * 24 * 7, // 7d
        })
      }
    }
    return responseData
  }

  if (url?.startsWith('/api/steam/user')) {
    const query = getQuery(event)
    const apiKey = process.env.STEAM_API_KEY
    const userData = await $fetch<{
      response: {
        players: Array<{
          steamid: string
          personaname: string
          avatarfull: string
        }>
      }
    }>(
      `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key=${apiKey}&steamids=${query.steamid}`
    )

    // Upsert profile to database (fire-and-forget)
    // Skip insert for new users when registration is disabled
    const player = userData?.response?.players?.[0]
    if (player) {
      const [existingProfile] = await db
        .select({ steamid: userProfiles.steamid })
        .from(userProfiles)
        .where(eq(userProfiles.steamid, player.steamid))
        .limit(1)

      if (existingProfile) {
        // Update existing user's profile data
        db.update(userProfiles)
          .set({
            personaname: player.personaname,
            avatarfull: player.avatarfull,
          })
          .where(eq(userProfiles.steamid, player.steamid))
          .then(() => {})
          .catch((err: unknown) =>
            Logger.error(
              `Failed to update user profile: ${err instanceof Error ? err.message : String(err)}`,
              'SteamAuth'
            )
          )
      } else {
        const registrationEnabled = await getCachedSetting('REGISTRATION_ENABLED', true)
        if (registrationEnabled) {
          db.insert(userProfiles)
            .values({
              steamid: player.steamid,
              personaname: player.personaname,
              avatarfull: player.avatarfull,
            })
            .then(() => {})
            .catch((err: unknown) =>
              Logger.error(
                `Failed to insert user profile: ${err instanceof Error ? err.message : String(err)}`,
                'SteamAuth'
              )
            )
        }
      }
    }

    return userData
  }
})
