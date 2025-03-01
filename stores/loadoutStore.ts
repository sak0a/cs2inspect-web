import { defineStore } from 'pinia'
import {DBLoadout, IEnhancedItem} from '~/server/utils/interfaces'

interface LoadoutState {
    loadouts: DBLoadout[];
    currentSkins: IEnhancedItem[];
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
        error: null
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
         * @param type
         * @param steamId
         */
        async fetchLoadoutWeaponSkins(type: string, steamId: string) {
            try {
                this.isLoading = true;
                const response = await fetch(`/api/weapons/${type}?loadoutId=${this.selectedLoadoutId}&steamId=${steamId}`, {
                    method: 'GET',
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json',
                    }
                })
                const data = await response.json()
                this.currentSkins = data.skins;
            } catch (error) {
                this.error = 'Failed to fetch loadouts';
            } finally {
                this.isLoading = false;
            }
        },

        async fetchLoadoutKnifes(steamId: string) {
            try {
                this.isLoading = true;
                const response = await fetch(`/api/knifes?loadoutId=${this.selectedLoadoutId}&steamId=${steamId}`, {
                    method: 'GET',
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json',
                    }
                })
                const data = await response.json()
                this.currentSkins = data.knifes;
            } catch (error) {
                this.error = 'Failed to fetch loadouts';
            } finally {
                this.isLoading = false;
            }
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
                });

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
            this.error = null;
            try {
                const response = await fetch(`/api/loadouts?steamId=${steamId}`, {
                    method: 'POST',
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ name }),
                });

                if (!response.ok) {
                    if (response.status === 401) {
                        window.location.href = '/login';
                        return;
                    }
                    throw new Error('Failed to create loadout');
                }

                const data = await response.json();

                if (!data.loadout) {
                    throw new Error('Failed to create loadout');
                }

                this.loadouts.push(data.loadout);
                this.selectedLoadoutId = data.loadout.id;
            } catch (error) {
                this.error = 'Failed to create loadout';
                console.error('Error creating loadout:', error);
                throw error;
            } finally {
                this.isLoading = false;
            }
        },

        /**
         * Update the name of the given loadout
         * @param id
         * @param steamId
         * @param newName
         */
        async updateLoadout(id: string, steamId: string, newName: string) {
            this.isLoading = true;
            this.error = null;

            try {
                if (newName.length === 0 || newName.length > 20) {
                    this.error = 'Loadout name must be between 1 and 20 characters';
                    throw new Error('Invalid loadout name');
                }

                const response = await fetch(`/api/loadouts?steamId=${steamId}&id=${id}`, {
                    method: 'PUT',
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ name: newName })
                });

                if (!response.ok) {
                    if (response.status === 401) {
                        window.location.href = '/login';
                        return;
                    }
                    throw new Error('Failed to update loadout');
                }

                const data = await response.json();
                const index = this.loadouts.findIndex(l => l.id === id);
                if (index !== -1) {
                    this.loadouts[index] = data.loadout;
                }
            } catch (error) {
                throw error;
            } finally {
                this.isLoading = false;
            }
        },

        /**
         * Delete the loadout with the given ID
         * @param steamId
         * @param id
         */
        async deleteLoadout(steamId: string, id: string) {
            this.isLoading = true;
            this.error = null;
            try {
                const response = await fetch(`/api/loadouts?steamId=${steamId}&id=${id}`, {
                    method: 'DELETE',
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                });

                if (!response.ok) {
                    if (response.status === 401) {
                        window.location.href = '/login';
                        return;
                    }
                    throw new Error('Failed to delete loadout');
                }

                this.loadouts = this.loadouts.filter(l => l.id !== id);
                this.selectedLoadoutId = this.loadouts.length > 0 ? this.loadouts[0].id : null;
            } catch (error) {
                this.error = 'Failed to delete loadout';
                console.error('Error deleting loadout:', error);
            } finally {
                this.isLoading = false;
            }
        },

        selectLoadout(id: string) {
            this.selectedLoadoutId = id;
        }
    }
});