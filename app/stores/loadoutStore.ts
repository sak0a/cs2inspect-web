import { defineStore } from 'pinia'
import type {
    DBLoadout,
    IEnhancedItem,
    IEnhancedWeapon,
    IEnhancedKnife,
    LoadoutId,
    SteamId,
} from '~/types'
import { toLoadoutId } from '~/types'
import { api } from '~/utils/api'

interface LoadoutState {
    loadouts: DBLoadout[]
    currentSkins: IEnhancedItem[] | IEnhancedKnife[] | IEnhancedWeapon[]
    selectedLoadoutId: LoadoutId | null
    isLoading: boolean
    error: string | null
}

const fetchPromises = new Map<SteamId, Promise<void>>()

export const useLoadoutStore = defineStore('loadout', {
    state: (): LoadoutState => ({
        loadouts: [],
        currentSkins: [],
        selectedLoadoutId: null,
        isLoading: false,
        error: null,
    }),

    getters: {
        selectedLoadout: (state) =>
            state.loadouts.find(
                (loadout: DBLoadout) => toLoadoutId(loadout.id) === state.selectedLoadoutId
            ),
        hasLoadouts: (state) => state.loadouts.length > 0,
        loadoutSkins: (state) => state.currentSkins,
    },

    actions: {
        /**
         * Fetch the skins for the given loadout
         * @param type rifles | pistols | heavys | smgs
         * @param steamId
         */
        async fetchLoadoutWeaponSkins(type: string, steamId: SteamId) {
            this.isLoading = true
            try {
                const response = await api.get<IEnhancedWeapon[]>(`/api/items/weapons/${type}`, {
                    loadoutId: String(this.selectedLoadoutId),
                    steamId: String(steamId),
                })

                this.currentSkins = response.data ?? []
                console.info(
                    `Fetched ${this.currentSkins.length} skins for loadout ${response.meta?.loadoutId || 'unknown'} from ${response.meta?.steamId || 'unknown'}`
                )
                console.log('Fetched skins: ', this.currentSkins)
            } catch (error) {
                console.error(error)
                throw error
            } finally {
                this.isLoading = false
            }
        },

        async fetchLoadoutKnives(steamId: SteamId) {
            this.isLoading = true
            try {
                const response = await api.get<IEnhancedItem[]>('/api/items/knives', {
                    loadoutId: String(this.selectedLoadoutId),
                    steamId: String(steamId),
                })

                this.currentSkins = response.data ?? []
                console.info(
                    `Fetched ${this.currentSkins.length} knives for loadout ${response.meta?.loadoutId || 'unknown'} from ${response.meta?.steamId || 'unknown'}`
                )
                console.log('Fetched knives: ', this.currentSkins)
            } catch (error) {
                console.error(error)
                throw error
            } finally {
                this.isLoading = false
            }
        },

        async fetchLoadoutGloves(steamId: SteamId) {
            this.isLoading = true
            try {
                const response = await api.get<IEnhancedItem[]>('/api/items/gloves', {
                    loadoutId: String(this.selectedLoadoutId),
                    steamId: String(steamId),
                })

                this.currentSkins = response.data ?? []
                console.info(
                    `Fetched ${this.currentSkins.length} gloves for loadout ${response.meta?.loadoutId || 'unknown'} from ${response.meta?.steamId || 'unknown'}`
                )
                console.log('Fetched gloves: ', this.currentSkins)
            } catch (error) {
                console.error(error)
                throw error
            } finally {
                this.isLoading = false
            }
        },

        async fetchLoadoutMusicKits(steamId: SteamId) {
            this.isLoading = true
            try {
                const response = await api.get<IEnhancedItem[]>('/api/music', {
                    loadoutId: String(this.selectedLoadoutId),
                    steamId: String(steamId),
                })

                this.currentSkins = response.data ?? []
                console.info(
                    `Fetched ${this.currentSkins.length} music kits for loadout ${response.meta?.loadoutId || 'unknown'} from ${response.meta?.steamId || 'unknown'}`
                )
                console.log('Fetched music kits: ', this.currentSkins)
            } catch (error) {
                console.error(error)
                throw error
            } finally {
                this.isLoading = false
            }
        },

        async fetchLoadoutPins(steamId: SteamId) {
            this.isLoading = true
            try {
                const response = await api.get<IEnhancedItem[]>('/api/items/pins', {
                    loadoutId: String(this.selectedLoadoutId),
                    steamId: String(steamId),
                })

                this.currentSkins = response.data ?? []
                console.info(
                    `Fetched ${this.currentSkins.length} pins for loadout ${response.meta?.loadoutId || 'unknown'} from ${response.meta?.steamId || 'unknown'}`
                )
                console.log('Fetched pins: ', this.currentSkins)
            } catch (error) {
                console.error(error)
                throw error
            } finally {
                this.isLoading = false
            }
        },

        /**
         * Fetch loadouts for the given Steam ID
         * @param steamId
         */
        async fetchLoadouts(steamId: SteamId) {
            if (fetchPromises.has(steamId)) return fetchPromises.get(steamId)

            const promise = (async () => {
                this.isLoading = true
                this.error = null

                try {
                    const response = await api.get<{ loadouts: DBLoadout[] }>('/api/loadouts', {
                        steamId: String(steamId),
                    })

                    // Handle both old and new API response formats
                    const loadouts =
                        response.data?.loadouts ||
                        (Array.isArray(response.data) ? response.data : [])
                    if (!loadouts) {
                        this.error = 'Failed to fetch loadouts API data'
                        return
                    }

                    this.loadouts = loadouts
                    if (!this.selectedLoadoutId && this.loadouts.length > 0) {
                        // Find the active loadout, or fall back to the first one if none is active
                        const activeLoadout = this.loadouts.find(
                            (loadout: DBLoadout) =>
                                loadout.active === true || Number(loadout.active) === 1
                        )
                        this.selectedLoadoutId = activeLoadout
                            ? toLoadoutId(activeLoadout.id)
                            : this.loadouts[0]?.id
                              ? toLoadoutId(this.loadouts[0].id)
                              : null
                    } else if (this.selectedLoadoutId) {
                        // If we have a selected loadout ID, verify it still exists in the fetched loadouts
                        const selectedLoadoutId = this.selectedLoadoutId // Capture value for TS
                        const selectedLoadout = this.loadouts.find(
                            (loadout: DBLoadout) => toLoadoutId(loadout.id) === selectedLoadoutId
                        )
                        if (!selectedLoadout) {
                            // Selected loadout no longer exists, select the active one or first one
                            const activeLoadout = this.loadouts.find(
                                (loadout: DBLoadout) =>
                                    loadout.active === true || Number(loadout.active) === 1
                            )
                            this.selectedLoadoutId = activeLoadout
                                ? toLoadoutId(activeLoadout.id)
                                : this.loadouts.length > 0
                                  ? this.loadouts[0]?.id
                                      ? toLoadoutId(this.loadouts[0].id)
                                      : null
                                  : null
                        }
                    }
                } catch (error: unknown) {
                    this.error =
                        'Failed to fetch loadouts: ' +
                        (error instanceof Error ? error.message : String(error))
                } finally {
                    this.isLoading = false
                    fetchPromises.delete(steamId)
                }
            })()

            fetchPromises.set(steamId, promise)
            return promise
        },

        /**
         * Create a new loadout for the given Steam ID
         * @param steamId
         * @param name
         */
        async createLoadout(steamId: SteamId, name: string) {
            this.isLoading = true
            try {
                const response = await api.post<{ loadout: DBLoadout }>('/api/loadouts', {
                    steamId: String(steamId),
                    name,
                })

                if (!response.data?.loadout) {
                    throw new Error('Failed to create loadout, data not present')
                }

                // Activate the newly created loadout
                await this.activateLoadout(toLoadoutId(response.data.loadout.id), steamId)

                // Refresh loadouts to get the updated active status
                await this.fetchLoadouts(steamId)
            } catch (error) {
                console.error(error)
                throw error
            } finally {
                this.isLoading = false
            }
        },

        /**
         * Update the name of the given loadout
         * @param id
         * @param steamId
         * @param newName
         */
        async updateLoadout(id: LoadoutId, steamId: SteamId, newName: string) {
            this.isLoading = true

            if (newName.length <= 0) {
                throw new Error('Failed to update loadout; newName too short')
            }

            if (newName.length > 20) {
                throw new Error('Failed to update loadout; newName too long')
            }

            try {
                const response = await api.put<{ loadout: DBLoadout }>(`/api/loadouts/${id}`, {
                    steamId: String(steamId),
                    name: newName,
                })

                const index = this.loadouts.findIndex((l: DBLoadout) => toLoadoutId(l.id) === id)
                if (index !== -1 && response.data?.loadout) {
                    this.loadouts[index] = response.data.loadout
                }
            } catch (error) {
                console.error(error)
                throw error
            } finally {
                this.isLoading = false
            }
        },

        /**
         * Delete the loadout with the given ID
         * @param steamId
         * @param id
         */
        async deleteLoadout(steamId: SteamId, id: LoadoutId) {
            this.isLoading = true
            try {
                await api.delete(`/api/loadouts/${id}`, {
                    steamId: String(steamId),
                })

                // Refresh loadouts to get updated list and active status
                await this.fetchLoadouts(steamId)
            } catch (error) {
                console.error(error)
                throw error
            } finally {
                this.isLoading = false
            }
        },

        selectLoadout(id: LoadoutId) {
            this.selectedLoadoutId = id
        },

        /**
         * Activate a loadout (set it as active in the database)
         * @param id - The loadout ID to activate
         * @param steamId - The Steam ID of the user
         */
        async activateLoadout(id: LoadoutId, steamId: SteamId) {
            this.isLoading = true
            try {
                await api.post('/api/loadouts/activate', {
                    steamId: String(steamId),
                    loadoutId: String(id),
                })

                // Update the loadout in the store
                const index = this.loadouts.findIndex((l: DBLoadout) => toLoadoutId(l.id) === id)
                if (index !== -1) {
                    // Update all loadouts: set the selected one as active, others as inactive
                    this.loadouts = this.loadouts.map((loadout: DBLoadout) => ({
                        ...loadout,
                        active: toLoadoutId(loadout.id) === id ? true : false,
                    }))
                }

                this.selectedLoadoutId = id
            } catch (error) {
                console.error(error)
                throw error
            } finally {
                this.isLoading = false
            }
        },

        async duplicateLoadout(steamId: SteamId, loadoutId: LoadoutId) {
            this.isLoading = true
            try {
                await api.post('/api/loadouts/duplicate', {
                    steamId: String(steamId),
                    loadoutId: String(loadoutId),
                })
                await this.fetchLoadouts(steamId)
            } finally {
                this.isLoading = false
            }
        },

        async shareLoadout(steamId: SteamId, loadoutId: LoadoutId): Promise<string> {
            this.isLoading = true
            try {
                const response = await api.post<{ shareCode: string }>('/api/loadouts/share', {
                    steamId: String(steamId),
                    loadoutId: String(loadoutId),
                })
                return response.data?.shareCode || ''
            } finally {
                this.isLoading = false
            }
        },

        async deleteShareCode(steamId: SteamId, loadoutId: LoadoutId): Promise<void> {
            this.isLoading = true
            try {
                await api.post('/api/loadouts/share-delete', {
                    steamId: String(steamId),
                    loadoutId: String(loadoutId),
                })
            } finally {
                this.isLoading = false
            }
        },

        async setLoadoutAsDefault(steamId: SteamId, loadoutId: LoadoutId) {
            this.isLoading = true
            try {
                await api.post('/api/loadouts/default', {
                    steamId: String(steamId),
                    loadoutId: String(loadoutId),
                })
                await this.fetchLoadouts(steamId)
            } finally {
                this.isLoading = false
            }
        },

        async clearLoadout(steamId: SteamId, loadoutId: LoadoutId, categories: string[] = []) {
            this.isLoading = true
            try {
                await api.post('/api/loadouts/clear', {
                    steamId: String(steamId),
                    loadoutId: String(loadoutId),
                    categories,
                })

                // Refresh current skins if the cleared loadout is selected
                if (this.selectedLoadoutId === loadoutId) {
                    if (categories.length === 0) {
                        this.currentSkins = []
                    }
                }
            } finally {
                this.isLoading = false
            }
        },

        async importLoadout(steamId: SteamId, shareCode: string) {
            this.isLoading = true
            try {
                const response = await api.post<{ id: string }>('/api/loadouts/import', {
                    steamId: String(steamId),
                    shareCode,
                })

                await this.fetchLoadouts(steamId)
                // Select the new loadout
                if (response.data?.id) {
                    this.selectedLoadoutId = toLoadoutId(response.data.id)
                }
            } finally {
                this.isLoading = false
            }
        },
    },
})
