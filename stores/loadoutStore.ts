import { defineStore } from 'pinia'
import {DBLoadout, IEnhancedItem, IEnhancedWeapon} from '~/server/utils/interfaces'

interface LoadoutState {
    loadouts: DBLoadout[];
    currentSkins: IEnhancedItem[] | IEnhancedKnife[] | IEnhancedWeapon[];
    selectedLoadoutId: string | null;
    isLoading: boolean;
    error: string | null;
}

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
                console.info(`Fetched ${data.meta.rows} skins for loadout ${data.meta.loadoutId} from ${data.meta.steamId}`)
                this.currentSkins = data.skins;
                console.log("Fetched skins: ", data.skins)
            }).catch((error) => {
                console.error(error)
                throw error
            }).finally(() => this.isLoading = false);
        },

        async fetchLoadoutKnifes(steamId: string) {
            this.isLoading = true;
            await fetch(`/api/knifes?loadoutId=${this.selectedLoadoutId}&steamId=${steamId}`, {
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
                this.currentSkins = data.knifes;
                console.info(`Fetched ${data.meta.rows} knifes for loadout ${data.meta.loadoutId} from ${data.meta.steamId}`)
                console.log("Fetched knifes: ", data.knifes)
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
                this.currentSkins = data.gloves;
                console.info(`Fetched ${data.meta.rows} gloves for loadout ${data.meta.loadoutId} from ${data.meta.steamId}`)
                console.log("Fetched gloves: ", data.gloves)
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

        /**
         * Fetch loadouts for the given Steam ID
         * @param steamId
         */
        async fetchLoadouts(steamId: string) {
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

                if (!data.loadouts) {
                    this.error = 'Failed to fetch loadouts API data';
                    return;
                }

                this.loadouts = data.loadouts;
                if (!this.selectedLoadoutId && this.loadouts.length > 0) {
                    this.selectedLoadoutId = this.loadouts[0].id;
                }
            } catch (error: any) {
                this.error = 'Failed to fetch loadouts: ' + error.message;
            } finally {
                this.isLoading = false;
            }
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

                this.loadouts.push(data.loadout);
                this.selectedLoadoutId = data.loadout.id;
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
                const index = this.loadouts.findIndex(l => l.id === id);
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

                this.loadouts = this.loadouts.filter(l => l.id !== id);
                this.selectedLoadoutId = this.loadouts.length > 0 ? this.loadouts[0].id : '0';
            }).catch(error => {
                console.error(error);
                throw error
            }).finally(() => this.isLoading = false);
        },

        selectLoadout(id: string) {
            this.selectedLoadoutId = id;
        }
    }
});