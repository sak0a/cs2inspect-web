import type { DBLoadout } from '~/server/utils/interfaces'
import { executeQuery } from './database'

export const getLoadoutsBySteamId = async (steamId: string): Promise<DBLoadout[]> =>
    executeQuery<DBLoadout[]>(
        'SELECT * FROM wp_player_loadouts WHERE steamid = ?',
        [steamId],
        'Failed to fetch loadouts from database'
    );

export const getLoadout = async (id: string, steamId: string): Promise<DBLoadout> => {
    const loadout = await executeQuery<DBLoadout[]>(
        'SELECT * FROM wp_player_loadouts WHERE id = ? AND steamid = ?',
        [id, steamId],
        'Failed to fetch loadout'
    );
    return loadout[0];
};

export const getLoadoutByName = async (steamId: string, name: string): Promise<DBLoadout> => {
    const loadout = await executeQuery<DBLoadout[]>(
        'SELECT * FROM wp_player_loadouts WHERE steamid = ? AND name = ?',
        [steamId, name.toLowerCase()],
        'Failed to fetch loadout from database'
    );
    return loadout[0];
};

export const updateLoadout = async (id: string, steamid: string, name: string): Promise<void> =>
    executeQuery<void>(
        'UPDATE wp_player_loadouts SET name = ? WHERE id = ? AND steamid = ?',
        [name, id, steamid],
        'Failed to update loadout'
    );

export const updateLoadoutByName = async (steamId: string, name: string, newName: string): Promise<void> =>
    executeQuery<void>(
        'UPDATE wp_player_loadouts SET name = ? WHERE steamid = ? AND name = ?',
        [newName, steamId, name.toLowerCase()],
        'Failed to update loadout'
    );

export const createLoadout = async (steamId: string, name: string): Promise<void> =>
    executeQuery<void>(
        'INSERT INTO wp_player_loadouts (steamid, name) VALUES (?, ?)',
        [steamId, name],
        'Failed to create loadout'
    );

export const loadoutExists = async (steamId: string, name: string): Promise<boolean> => {
    const loadout = await executeQuery<any[]>(
        'SELECT * FROM wp_player_loadouts WHERE steamid = ? AND name = ?',
        [steamId, name.toLowerCase()],
        'Failed to check if loadout exists'
    );
    return loadout.length > 0;
};

export const loadoutExistsById = async (id: string): Promise<boolean> => {
    const loadout = await executeQuery<any[]>(
        'SELECT * FROM wp_player_loadouts WHERE id = ?',
        [id],
        'Failed to check if loadout exists'
    );
    return loadout.length > 0;
};

export const deleteLoadout = async (id: string, steamId: string): Promise<void> => {
    await executeQuery<void>('DELETE FROM wp_player_heavys WHERE loadoutid = ? AND steamid = ?',
        [id, steamId],

        'Failed to delete heavys');
    await executeQuery<void>('DELETE FROM wp_player_pistols WHERE loadoutid = ? AND steamid = ?',
        [id, steamId],
        'Failed to delete pistols');
    await executeQuery<void>('DELETE FROM wp_player_rifles WHERE loadoutid = ? AND steamid = ?',
        [id, steamId],
        'Failed to delete rifles');
    await executeQuery<void>('DELETE FROM wp_player_smgs WHERE loadoutid = ? AND steamid = ?',
        [id, steamId],
        'Failed to delete smgs');
    await executeQuery<void>('DELETE FROM wp_player_knifes WHERE loadoutid = ? AND steamid = ?',
        [id, steamId],
        'Failed to delete knifes');
    await executeQuery<void>('DELETE FROM wp_player_gloves WHERE loadoutid = ? AND steamid = ?',
        [id, steamId],
        'Failed to delete gloves');
    await executeQuery<void>('DELETE FROM wp_player_pins WHERE loadoutid = ? AND steamid = ?',
        [id, steamId],
        'Failed to delete pins');
    await executeQuery<void>('DELETE FROM wp_player_music WHERE loadoutid = ? AND steamid = ?',
        [id, steamId],
        'Failed to delete music kits');
    await executeQuery<void>('DELETE FROM wp_player_agents WHERE loadoutid = ? AND steamid = ?',
        [id, steamId],
        'Failed to delete agents');
    await executeQuery<void>(
        'DELETE FROM wp_player_loadouts WHERE id = ? AND steamid = ?',
        [id, steamId],
        'Failed to delete loadout'
    );

}
export const deleteLoadoutByName = async (steamId: string, name: string): Promise<void> =>
    executeQuery<void>(
        'DELETE FROM wp_player_loadouts WHERE steamid = ? AND name = ?',
        [steamId, name.toLowerCase()],
        'Failed to delete loadout'
    );