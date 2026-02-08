// server/middleware/steam-auth.ts
import { defineEventHandler, readBody, getQuery } from 'h3'
import jwt from "jsonwebtoken";
import type { SignOptions } from 'jsonwebtoken';


const JWT_SECRET = process.env.JWT_TOKEN || ''

export default defineEventHandler(async (event) => {
    const url = event.node.req.url

    if (url?.startsWith('/api/steam/validate')) {
        const body = await readBody(event)
        // Convert body object to URL-encoded string for Steam's OpenID endpoint
        const formBody = new URLSearchParams(body as Record<string, string>).toString()
        const responseData = await $fetch<string>('https://steamcommunity.com/openid/login', {
            method: 'POST',
            body: formBody,
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        })
        if (responseData.includes('is_valid:true')) {
            // Extract Steam ID from the validation response
            const steamId = body['openid.claimed_id']?.match(/(\d+)$/)?.[1]
            if (steamId) {
                const payload: { steamId: string; type: string } = {
                    steamId,
                    type: 'steam_auth'
                };

                // Create JWT token with Steam ID and additional claims
                const token = jwt.sign(payload, JWT_SECRET, {
                    expiresIn: String(process.env.JWT_EXPIRY || '7d')
                } as SignOptions);

                // Set JWT as an HTTP-only cookie
                setCookie(event, 'auth_token', token, {
                    httpOnly: true,
                    secure: true,
                    sameSite: 'lax',
                    maxAge: 60 * 60 * 24 * 7 // 7d
                })
            }
        }
        return responseData
    }

    if (url?.startsWith('/api/steam/user')) {
        const query = getQuery(event)
        const apiKey = process.env.STEAM_API_KEY
        const userData = await $fetch(
            `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key=${apiKey}&steamids=${query.steamid}`
        )
        return userData
    }
})