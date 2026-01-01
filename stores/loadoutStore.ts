import { defineStore } from 'pinia'
import type { DBLoadout } from '~/types'
import type { IEnhancedItem, IEnhancedWeapon } from '~/server/types'

interface LoadoutState {
    loadouts: DBLoadout[];
    currentSkins: IEnhancedItem[] | IEnhancedKnife[] | IEnhancedWeapon[];
    selectedLoadoutId: string | null;
    isLoading: boolean;
    error: string | null;
}

const fetchPromises = new Map<string, Promise<void>>();

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
            state.loadouts.find((loadout: DBLoadout) => loadout.id === state.selectedLoadoutId),
        hasLoadouts: (state) => state.loadouts.length > 0,
        loadoutSkins: (state) => state.currentSkins,
    },

    actions: {
        /**
         * Fetch the skins for the given loadout
         * @param type rifles | pistols | heavys | smgs
         * @param steamId
         */
        async fetchLoadoutWeaponSkins(type: string, steamId: string) {
            this.isLoading = true;
            await fetch(`/api/weapons/${type}?loadoutId=${this.selectedLoadoutId}&steamId=${steamId}`, {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                }
            }).then(async (response) => {
                if (!response.ok) {
                    if (response.status === 401) {
                        navigateTo('/')
                        return
                    }
                    throw new Error('Failed to fetch loadout weapon skin; Authentication / Response failed')
                }

                const data = await response.json();
                // Handle both old and new API response formats
                const skins = data.data || data.skins;
                console.info(`Fetched ${skins?.length || 0} skins for loadout ${data.meta?.loadoutId || 'unknown'} from ${data.meta?.steamId || 'unknown'}`)
                this.currentSkins = skins;
                console.log("Fetched skins: ", skins)
            }).catch((error) => {
                console.error(error)
                throw error
            }).finally(() => this.isLoading = false);
        },

        async fetchLoadoutKnives(steamId: string) {
            this.isLoading = true;
            await fetch(`/api/knives?loadoutId=${this.selectedLoadoutId}&steamId=${steamId}`, {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                }
            }).then(async (response) => {
                if (!response.ok) {
                    if (response.status === 401) {
                        navigateTo('/')
                        return
                    }
                    throw new Error('Failed to fetch loadout weapon skin; Authentication / Response failed')
                }
                const data = await response.json();
                // Handle both old and new API response formats
                const knives = data.data || data.knives;
                this.currentSkins = knives;
                console.info(`Fetched ${knives?.length || 0} knives for loadout ${data.meta?.loadoutId || 'unknown'} from ${data.meta?.steamId || 'unknown'}`)
                console.log("Fetched knives: ", knives)
            }).catch((error) => {
                console.error(error)
                throw error
            }).finally(() => this.isLoading = false);
        },

        async fetchLoadoutGloves(steamId: string) {
            this.isLoading = true;
            await fetch(`/api/gloves?loadoutId=${this.selectedLoadoutId}&steamId=${steamId}`, {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                }
            }).then(async (response) => {
                if (!response.ok) {
                    if (response.status === 401) {
                        navigateTo('/')
                        return
                    }
                    throw new Error('Failed to fetch loadout gloves; Authentication / Response failed')
                }
                const data = await response.json();
                // Handle both old and new API response formats
                const gloves = data.data || data.gloves;
                this.currentSkins = gloves;
                console.info(`Fetched ${gloves?.length || 0} gloves for loadout ${data.meta?.loadoutId || 'unknown'} from ${data.meta?.steamId || 'unknown'}`)
                console.log("Fetched gloves: ", gloves)
            }).catch((error) => {
                console.error(error)
                throw error
            }).finally(() => this.isLoading = false);
        },

        async fetchLoadoutMusicKits(steamId: string) {
            this.isLoading = true;
            await fetch(`/api/music?loadoutId=${this.selectedLoadoutId}&steamId=${steamId}`, {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                }
            }).then(async (response) => {
                if (!response.ok) {
                    if (response.status === 401) {
                        navigateTo('/')
                        return
                    }
                    throw new Error('Failed to fetch loadout music kits; Authentication / Response failed')
                }
                const data = await response.json();
                this.currentSkins = data.musicKits;
                console.info(`Fetched ${data.meta.rows} music kits for loadout ${data.meta.loadoutId} from ${data.meta.steamId}`)
                console.log("Fetched music kits: ", data.musicKits)
            }).catch((error) => {
                console.error(error)
                throw error
            }).finally(() => this.isLoading = false);
        },

        async fetchLoadoutPins(steamId: string) {
            this.isLoading = true;
            await fetch(`/api/pins?loadoutId=${this.selectedLoadoutId}&steamId=${steamId}`, {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                }
            }).then(async (response) => {
                if (!response.ok) {
                    if (response.status === 401) {
                        navigateTo('/')
                        return
                    }
                    throw new Error('Failed to fetch loadout pins; Authentication / Response failed')
                }
                const data = await response.json();
                // Handle both old and new API response formats
                const pins = data.data || data.pins;
                this.currentSkins = pins;
                console.info(`Fetched ${pins?.length || 0} pins for loadout ${data.meta?.loadoutId || 'unknown'} from ${data.meta?.steamId || 'unknown'}`)
                console.log("Fetched pins: ", pins)
            }).catch((error) => {
                console.error(error)
                throw error
            }).finally(() => this.isLoading = false);
        },

        /**
         * Fetch loadouts for the given Steam ID
         * @param steamId
         */
        async fetchLoadouts(steamId: string) {
            if (fetchPromises.has(steamId)) return fetchPromises.get(steamId);

            const promise = (async () => {
                this.isLoading = true;
                this.error = null;

                try {
                    const response = await fetch('/api/loadouts?steamId=' + steamId, {
                        method: 'GET',
                        credentials: 'include',
                        headers: {
                            'Content-Type': 'application/json',
                        }
                    })
                    if (!response.ok) {
                        this.error = 'Failed to fetch loadouts API response';
                    }

                    const data = await response.json();

                    // Handle both old and new API response formats
                    const loadouts = data.data || data.loadouts;
                    if (!loadouts) {
                        this.error = 'Failed to fetch loadouts API data';
                        return;
                    }

                    this.loadouts = loadouts;
                    if (!this.selectedLoadoutId && this.loadouts.length > 0) {
                        // Find the active loadout, or fall back to the first one if none is active
                        const activeLoadout = this.loadouts.find((loadout: DBLoadout) => loadout.active === true || loadout.active === 1);
                        this.selectedLoadoutId = activeLoadout ? activeLoadout.id : (this.loadouts[0]?.id || null);
                    } else if (this.selectedLoadoutId) {
                        // If we have a selected loadout ID, verify it still exists in the fetched loadouts
                        const selectedLoadoutId = this.selectedLoadoutId; // Capture value for TS
                        const selectedLoadout = this.loadouts.find((loadout: DBLoadout) => loadout.id === selectedLoadoutId);
                        if (!selectedLoadout) {
                            // Selected loadout no longer exists, select the active one or first one
                            const activeLoadout = this.loadouts.find((loadout: DBLoadout) => loadout.active === true || loadout.active === 1);
                            this.selectedLoadoutId = activeLoadout ? activeLoadout.id : (this.loadouts.length > 0 ? (this.loadouts[0]?.id || null) : null);
                        }
                    }
                } catch (error: unknown) {
                    this.error = 'Failed to fetch loadouts: ' + (error instanceof Error ? error.message : String(error));
                } finally {
                    this.isLoading = false;
                    fetchPromises.delete(steamId);
                }
            })();

            fetchPromises.set(steamId, promise);
            return promise;
        },

        /**
         * Create a new loadout for the given Steam ID
         * @param steamId
         * @param name
         */
        async createLoadout(steamId: string, name: string) {
            this.isLoading = true;
            await fetch(`/api/loadouts?steamId=${steamId}`, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ name }),
            }).then(async (response) => {
                if (!response.ok) {
                    if (response.status === 401) {
                        navigateTo('/')
                        return
                    }
                    throw new Error('Failed to create loadout; Authentication / Response failed')
                }
                const data = await response.json();

                if (!data.loadout) {
                    throw new Error('Failed to create loadout, data not present');
                }

                // Activate the newly created loadout
                await this.activateLoadout(data.loadout.id, steamId);

                // Refresh loadouts to get the updated active status
                await this.fetchLoadouts(steamId);
            }).catch((error) => {
                console.error(error);
                throw error
            }).finally(() => this.isLoading = false);
        },

        /**
         * Update the name of the given loadout
         * @param id
         * @param steamId
         * @param newName
         */
        async updateLoadout(id: string, steamId: string, newName: string) {
            this.isLoading = true;

            if (newName.length <= 0) {
                throw new Error("Failed to update loadout; newName too short")
            }

            if (newName.length > 20) {
                throw new Error("Failed to update loadout; newName too long")
            }

            await fetch(`/api/loadouts?steamId=${steamId}&id=${id}`, {
                method: 'PUT',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ name: newName })
            }).then(async (response) => {
                if (!response.ok) {
                    if (response.status === 401) {
                        window.location.href = '/'
                        return
                    }
                    throw new Error('Failed to update loadout; Authentication / Response failed');
                }
                const data = await response.json();
                const index = this.loadouts.findIndex((l: DBLoadout) => l.id === id);
                if (index !== -1) {
                    this.loadouts[index] = data.loadout
                }
            }).catch((error) => {
                console.error(error)
                throw error
            }).finally(() => this.isLoading = false);
        },

        /**
         * Delete the loadout with the given ID
         * @param steamId
         * @param id
         */
        async deleteLoadout(steamId: string, id: string) {
            this.isLoading = true;
            await fetch(`/api/loadouts?steamId=${steamId}&id=${id}`, {
                method: 'DELETE',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                },
            }).then(async (response) => {
                if (!response.ok) {
                    if (response.status === 401) {
                        window.location.href = '/'
                        return
                    }
                    throw new Error('Failed to delete loadout; Authentication / Response failed');
                }

                // Refresh loadouts to get updated list and active status
                await this.fetchLoadouts(steamId);
            }).catch(error => {
                console.error(error);
                throw error
            }).finally(() => this.isLoading = false);
        },

        selectLoadout(id: string) {
            this.selectedLoadoutId = id;
        },

        /**
         * Activate a loadout (set it as active in the database)
         * @param id - The loadout ID to activate
         * @param steamId - The Steam ID of the user
         */
        async activateLoadout(id: string, steamId: string) {
            this.isLoading = true;
            try {
                const response = await fetch(`/api/loadouts/activate?steamId=${steamId}&loadoutId=${id}`, {
                    method: 'POST',
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json',
                    }
                });

                if (!response.ok) {
                    if (response.status === 401) {
                        navigateTo('/')
                        return
                    }
                    throw new Error('Failed to activate loadout; Authentication / Response failed')
                }

                // const data = await response.json();
                // const updatedLoadout = data.data || data.loadout;

                // Update the loadout in the store
                const index = this.loadouts.findIndex((l: DBLoadout) => l.id === id);
                if (index !== -1) {
                    // Update all loadouts: set the selected one as active, others as inactive
                    this.loadouts = this.loadouts.map((loadout: DBLoadout) => ({
                        ...loadout,
                        active: loadout.id === id ? true : false
                    }));
                }

                this.selectedLoadoutId = id;
            } catch (error) {
                console.error(error);
                throw error;
            } finally {
                this.isLoading = false;
            }
        },

        async duplicateLoadout(steamId: string, loadoutId: string) {
            this.isLoading = true;
            await fetch('/api/loadouts/duplicate', {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ steamId, loadoutId })
            }).then(async (res) => {
                if (!res.ok) throw new Error('Failed to duplicate loadout');
                await this.fetchLoadouts(steamId);
            }).finally(() => this.isLoading = false);
        },

        async shareLoadout(steamId: string, loadoutId: string): Promise<string> {
            this.isLoading = true;
            try {
                const res = await fetch('/api/loadouts/share', {
                    method: 'POST',
                    credentials: 'include',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ steamId, loadoutId })
                });
                if (!res.ok) throw new Error('Failed to share loadout');
                const data = await res.json();
                return data.data.shareCode;
            } finally {
                this.isLoading = false;
            }
        },

        async setLoadoutAsDefault(steamId: string, loadoutId: string) {
            this.isLoading = true;
            await fetch('/api/loadouts/default', {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ steamId, loadoutId })
            }).then(async (res) => {
                if (!res.ok) throw new Error('Failed to set default loadout');
                await this.fetchLoadouts(steamId);
            }).finally(() => this.isLoading = false);
        },

        async clearLoadout(steamId: string, loadoutId: string, categories: string[] = []) {
            this.isLoading = true;
            try {
                const response = await fetch('/api/loadouts/clear', {
                    method: 'POST',
                    credentials: 'include',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ steamId, loadoutId, categories })
                });

                if (!response.ok) throw new Error('Failed to clear loadout');

                // Refresh current skins if the cleared loadout is selected AND we cleared relevant categories
                // For simplicity, just refresh if selected
                if (this.selectedLoadoutId === loadoutId) {
                    // Logic to clear specific items from store if needed, or just fetch again?
                    // Fetching again is safer but expensive?
                    // clearing currentSkins entirely is aggressive if we only cleared "Pistols" and we are viewing "Knives".
                    // But currentSkins usually holds items of ONE type (e.g. knives). 
                    // If we clear "Pistols", currentSkins (Knives) should be fine.
                    // If we clear "Knives" and we are viewing Knives, we should clear currentSkins.
                    // Let's just trust the user navigation or generic refresh.

                    // Actually, let's keep it simple: if clearing ALL (categories matches nothing?), or clearing the current View's type...
                    // But store doesn't easily know current "View Type" (it's in component state or URL).
                    // We can just leave `currentSkins` alone and let the user navigate/refresh, OR clear it if "Clear All".
                    if (categories.length === 0) {
                        this.currentSkins = [];
                    }
                }
            } finally {
                this.isLoading = false;
            }
        },

        async importLoadout(steamId: string, shareCode: string) {
            this.isLoading = true;
            try {
                const response = await fetch('/api/loadouts/import', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ steamId, shareCode })
                });

                if (!response.ok) {
                    const data = await response.json();
                    throw new Error(data.message || 'Failed to import loadout');
                }

                const data = await response.json();

                await this.fetchLoadouts(steamId);
                // Select the new loadout
                if (data.data && data.data.id) {
                    this.selectedLoadoutId = data.data.id;
                }
            } finally {
                this.isLoading = false;
            }
        }
    }
});