import jwt from 'jsonwebtoken'
import type { SignOptions } from 'jsonwebtoken'
import type { H3Event } from 'h3'
import { eq } from 'drizzle-orm'
import { db } from '~/server/database/client'
import { adminUsers } from '~/server/database/schema'
import type { AdminRole } from '~/server/database/schema'

export const DEV_AUTH_PUBLIC_PATH = '/api/auth/dev/'
export const DEV_STEAM_ID_PREFIX = '76561198000000'
export const DEFAULT_DEV_MOCK_STEAMID = '76561198000000001'
export const DEFAULT_DEV_MOCK_ADMIN_STEAMID = '76561198000000002'
export const DEFAULT_DEV_MOCK_AVATAR =
  'https://avatars.steamstatic.com/fef49e7fa7e1997310d705b2a6158ff8dc1cdfeb_full.jpg'

export type DevAuthRole = 'user' | 'admin'

export interface DevAuthProfile {
  steamid: string
  personaname: string
  avatarfull: string
}

export function isDevAuthEnabled(): boolean {
  return process.env.DEV_AUTH_ENABLED === 'true' && process.env.NODE_ENV !== 'production'
}

export function isMockSteamId(steamId: string): boolean {
  if (!steamId.startsWith(DEV_STEAM_ID_PREFIX)) {
    return false
  }

  const suffix = steamId.slice(DEV_STEAM_ID_PREFIX.length)
  return /^\d{3}$/.test(suffix)
}

export function getDevAuthConfig(role: DevAuthRole = 'user') {
  const isAdmin = role === 'admin'

  return {
    steamid: isAdmin
      ? process.env.DEV_MOCK_ADMIN_STEAMID || DEFAULT_DEV_MOCK_ADMIN_STEAMID
      : process.env.DEV_MOCK_STEAMID || DEFAULT_DEV_MOCK_STEAMID,
    personaname: isAdmin
      ? process.env.DEV_MOCK_ADMIN_PERSONANAME || 'Dev Admin'
      : process.env.DEV_MOCK_PERSONANAME || 'Dev User',
    avatarfull: isAdmin
      ? process.env.DEV_MOCK_ADMIN_AVATAR ||
        process.env.DEV_MOCK_AVATAR ||
        DEFAULT_DEV_MOCK_AVATAR
      : process.env.DEV_MOCK_AVATAR || DEFAULT_DEV_MOCK_AVATAR,
    adminRole: (process.env.DEV_MOCK_ADMIN_ROLE || 'superadmin') as AdminRole,
  }
}

export function validateDevCredentials(
  role: DevAuthRole,
  username?: string,
  password?: string
): boolean {
  if (!process.env.DEV_AUTH_USERNAME) {
    return true
  }

  const expectedUser =
    role === 'admin'
      ? process.env.DEV_MOCK_ADMIN_USERNAME || process.env.DEV_AUTH_USERNAME
      : process.env.DEV_AUTH_USERNAME
  const expectedPass =
    role === 'admin'
      ? process.env.DEV_MOCK_ADMIN_PASSWORD || process.env.DEV_AUTH_PASSWORD
      : process.env.DEV_AUTH_PASSWORD

  return username === expectedUser && password === expectedPass
}

export async function ensureDevUser(role: DevAuthRole = 'user'): Promise<DevAuthProfile> {
  const config = getDevAuthConfig(role)

  if (role === 'admin') {
    const [existingAdmin] = await db
      .select({ id: adminUsers.id })
      .from(adminUsers)
      .where(eq(adminUsers.steamid, config.steamid))
      .limit(1)

    if (existingAdmin) {
      await db
        .update(adminUsers)
        .set({ role: config.adminRole })
        .where(eq(adminUsers.steamid, config.steamid))
    } else {
      await db.insert(adminUsers).values({
        steamid: config.steamid,
        role: config.adminRole,
        created_by: config.steamid,
        permissions: [],
      })
    }
  }

  return {
    steamid: config.steamid,
    personaname: config.personaname,
    avatarfull: config.avatarfull,
  }
}

export async function seedDevUsers(): Promise<void> {
  await ensureDevUser('user')
  await ensureDevUser('admin')
}

export function buildMockSteamPlayer(steamId: string) {
  const userConfig = getDevAuthConfig('user')
  const adminConfig = getDevAuthConfig('admin')
  const personaname =
    steamId === adminConfig.steamid
      ? adminConfig.personaname
      : steamId === userConfig.steamid
        ? userConfig.personaname
        : `Dev User ${steamId.slice(-3)}`
  const avatarfull =
    steamId === adminConfig.steamid ? adminConfig.avatarfull : userConfig.avatarfull
  const avatarBase = avatarfull.replace(/_full\.jpg$/, '.jpg')

  return {
    steamid: steamId,
    personaname,
    profileurl: `https://steamcommunity.com/profiles/${steamId}`,
    avatar: avatarBase,
    avatarmedium: avatarBase.replace(/\.jpg$/, '_medium.jpg'),
    avatarfull,
    realname: personaname,
    timecreated: 0,
    lastlogoff: 0,
  }
}

export function issueAuthCookie(
  event: H3Event,
  steamId: string,
  type: 'steam_auth' | 'dev_auth' = 'dev_auth'
): void {
  const jwtSecret = process.env.JWT_TOKEN
  if (!jwtSecret) {
    throw new Error('JWT_TOKEN environment variable is required')
  }

  const token = jwt.sign({ steamId, type }, jwtSecret, {
    expiresIn: String(process.env.JWT_EXPIRY || '7d'),
  } as SignOptions)

  setCookie(event, 'auth_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7,
  })
}
