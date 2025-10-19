import axios from 'axios'

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
    private apiKey: string
    private readonly returnUrl: string
    private apiBase: string
    private static instance: SteamAuthService

    public static getInstance(): SteamAuthService {
        if (!this.instance) {
            this.instance = new SteamAuthService()
        }
        return this.instance
    }

    constructor() {
        this.apiKey = process.env.STEAM_API_KEY || 'defaultKey=323'
        this.returnUrl = `${import.meta.client ? window.location.origin : ''}/auth/callback`
        this.apiBase = 'https://api.steampowered.com'

        if (import.meta.client) {
            this.setupAxiosInterceptors()
        }
    }


    private setupAxiosInterceptors() {
        axios.interceptors.response.use(
            (response) => response,
            (error) => {
                if (error.response?.status === 401) {
                    this.handleUnauthorized()
                }
                return Promise.reject(error)
            }
        )
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
            'openid.claimed_id': 'http://specs.openid.net/auth/2.0/identifier_select'
        })

        window.location.href = `https://steamcommunity.com/openid/login?${openIdParams}`
    }

    async validateLogin(params: Record<string, string>): Promise<boolean> {
        const validationParams = new URLSearchParams({
            ...params,
            'openid.mode': 'check_authentication'
        })

        try {
            const response = await axios.post('/api/steam/validate', validationParams)
            return response.data.includes('is_valid:true')
        } catch (error) {
            console.error('Steam validation error:', error)
            return false
        }
    }

    async getUserInfo(steamId: string): Promise<SteamUser> {
        const response = await axios.get(`/api/steam/user?steamid=${steamId}`)
        const player = response.data.response.players[0]
        return {
            steamId: player.steamid,
            personaName: player.personaname,
            profileUrl: player.profileurl,
            avatar: player.avatar,
            avatarMedium: player.avatarmedium,
            avatarFull: player.avatarfull,
            realName: player.realname || null,
            timeCreated: player.timecreated,
            lastLogoff: player.lastlogoff
        }
    }

    extractSteamId(params: Record<string, string>): string | null {
        const matched = params['openid.claimed_id']?.match(/(\d+)$/)
        return matched ? matched[1] : null
    }

    logout(): void {
        if (import.meta.client) {
            localStorage.removeItem('steamUser')
            // Send logout request to clear the auth cookie
            axios.post('/api/auth/logout')
                .catch(error => console.error('Logout error:', error))
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
        }
    }
}

export const steamAuth = new SteamAuthService()