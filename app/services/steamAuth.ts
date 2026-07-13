export interface SteamUser {
  steamId: string
  personaName: string
  profileUrl: string
  avatar: string
  avatarMedium: string
  avatarFull: string
  realName: string | null
  timeCreated: number
  lastLogoff: number
}

export class SteamAuthService {
  private readonly returnUrl: string
  private static instance: SteamAuthService

  public static getInstance(): SteamAuthService {
    if (!this.instance) {
      this.instance = new SteamAuthService()
    }
    return this.instance
  }

  constructor() {
    this.returnUrl = `${import.meta.client ? window.location.origin : ''}/auth/callback`
  }

  private handleUnauthorized() {
    this.logout()
    if (window.location.pathname !== '/') {
      window.location.href = '/'
    } else {
      window.location.reload()
    }
  }

  async login(): Promise<void> {
    if (!import.meta.client) return

    const openIdParams = new URLSearchParams({
      'openid.ns': 'http://specs.openid.net/auth/2.0',
      'openid.mode': 'checkid_setup',
      'openid.return_to': this.returnUrl,
      'openid.realm': window.location.origin,
      'openid.identity': 'http://specs.openid.net/auth/2.0/identifier_select',
      'openid.claimed_id': 'http://specs.openid.net/auth/2.0/identifier_select',
    })

    window.location.href = `https://steamcommunity.com/openid/login?${openIdParams}`
  }

  async validateLogin(params: Record<string, string>): Promise<boolean> {
    const validationParams = new URLSearchParams({
      ...params,
      'openid.mode': 'check_authentication',
    })

    try {
      const response = await $fetch<string>('/api/steam/validate', {
        method: 'POST',
        body: validationParams.toString(),
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      })
      return response.includes('is_valid:true')
    } catch (error: unknown) {
      // Handle 401 errors globally
      if (error && typeof error === 'object' && 'status' in error && error.status === 401) {
        this.handleUnauthorized()
      }
      console.error('Steam validation error:', error)
      return false
    }
  }

  async getUserInfo(steamId: string): Promise<SteamUser> {
    try {
      const data = await $fetch<{
        response: {
          players: Array<{
            steamid: string
            personaname: string
            profileurl: string
            avatar: string
            avatarmedium: string
            avatarfull: string
            realname?: string
            timecreated: number
            lastlogoff: number
          }>
        }
      }>(`/api/steam/user?steamid=${steamId}`)

      const player = data.response.players[0]
      if (!player) {
        throw new Error('Player not found')
      }
      return {
        steamId: player.steamid,
        personaName: player.personaname,
        profileUrl: player.profileurl,
        avatar: player.avatar,
        avatarMedium: player.avatarmedium,
        avatarFull: player.avatarfull,
        realName: player.realname ?? null,
        timeCreated: player.timecreated,
        lastLogoff: player.lastlogoff,
      }
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'status' in error && error.status === 401) {
        this.handleUnauthorized()
      }
      throw error
    }
  }

  extractSteamId(params: Record<string, string>): string | null {
    const matched = params['openid.claimed_id']?.match(/(\d+)$/)
    return matched ? (matched[1] ?? null) : null
  }

  logout(): void {
    if (import.meta.client) {
      localStorage.removeItem('steamUser')
      // Clear the SSR layout hint cookie
      document.cookie = 'steam_logged_in=; path=/; max-age=0'
      // Send logout request to clear the auth cookie
      $fetch('/api/auth/logout', { method: 'POST' }).catch((error) =>
        console.error('Logout error:', error)
      )
    }
  }

  getSavedUser(): SteamUser | null {
    if (!import.meta.client) return null
    const savedUser = localStorage.getItem('steamUser')
    return savedUser ? JSON.parse(savedUser) : null
  }

  saveUser(user: SteamUser): void {
    if (import.meta.client) {
      localStorage.setItem('steamUser', JSON.stringify(user))
      // Set SSR layout hint cookie so server renders the correct layout branch
      document.cookie = 'steam_logged_in=1; path=/; max-age=31536000; SameSite=Lax'
    }
  }

  async devLogin(as: 'user' | 'admin' = 'user'): Promise<SteamUser> {
    const config = useRuntimeConfig()
    if (!config.public.devAuthEnabled) {
      throw new Error('Dev auth is not enabled')
    }

    try {
      const data = await $fetch<{
        steamId: string
        personaName: string
        avatarFull: string
        role: 'user' | 'admin'
        authenticated: boolean
      }>('/api/auth/dev/login', {
        method: 'POST',
        body: { as },
        credentials: 'include',
      })

      const user: SteamUser = {
        steamId: data.steamId,
        personaName: data.personaName,
        profileUrl: `https://steamcommunity.com/profiles/${data.steamId}`,
        avatar: data.avatarFull.replace(/_full\.jpg$/, '.jpg'),
        avatarMedium: data.avatarFull.replace(/_full\.jpg$/, '_medium.jpg'),
        avatarFull: data.avatarFull,
        realName: data.personaName,
        timeCreated: 0,
        lastLogoff: 0,
      }

      this.saveUser(user)
      return user
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'status' in error && error.status === 401) {
        this.handleUnauthorized()
      }
      throw error
    }
  }
}

export const steamAuth = new SteamAuthService()
