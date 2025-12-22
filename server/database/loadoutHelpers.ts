import type { DBLoadout } from '~/server/utils/interfaces'
import { executeQuery } from './database'

export const getLoadoutsBySteamId = async (steamId: string): Promise<DBLoadout[]> =>
    executeQuery<DBLoadout[]>(
        'SELECT * FROM wp_player_loadouts WHERE steamid = ? ORDER BY active DESC, id ASC',
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

export const updateLoadout = async (id: string, steamid: string, name: string): Promise<void> => {
    const exists = await loadoutExists(steamid, name);
    if (exists) {
        // Check if the existing one is NOT the one we are updating
        const existing = await getLoadoutByName(steamid, name);
        if (existing.id.toString() !== id.toString()) {
            throw new Error('A loadout with this name already exists');
        }
    }

    await executeQuery<unknown[]>(
        'UPDATE wp_player_loadouts SET name = ? WHERE id = ? AND steamid = ?',
        [name, id, steamid],
        'Failed to update loadout'
    );
};

export const updateLoadoutByName = async (steamId: string, name: string, newName: string): Promise<void> => {
    await executeQuery<unknown[]>(
        'UPDATE wp_player_loadouts SET name = ? WHERE steamid = ? AND name = ?',
        [newName, steamId, name.toLowerCase()],
        'Failed to update loadout'
    );
};

export const createLoadout = async (steamId: string, name: string): Promise<void> => {
    const exists = await loadoutExists(steamId, name);
    if (exists) {
        throw new Error('A loadout with this name already exists');
    }

    await executeQuery<unknown[]>(
        'INSERT INTO wp_player_loadouts (steamid, name) VALUES (?, ?)',
        [steamId, name],
        'Failed to create loadout'
    );
};

export const loadoutExists = async (steamId: string, name: string): Promise<boolean> => {
    const loadout = await executeQuery<Array<{ id: string }>>(
        'SELECT * FROM wp_player_loadouts WHERE steamid = ? AND name = ?',
        [steamId, name.toLowerCase()],
        'Failed to check if loadout exists'
    );
    return loadout.length > 0;
};

export const loadoutExistsById = async (id: string): Promise<boolean> => {
    const loadout = await executeQuery<Array<{ id: string }>>(
        'SELECT * FROM wp_player_loadouts WHERE id = ?',
        [id],
        'Failed to check if loadout exists'
    );
    return loadout.length > 0;
};

export const deleteLoadout = async (id: string, steamId: string): Promise<void> => {
    await executeQuery<unknown[]>('DELETE FROM wp_player_heavys WHERE loadoutid = ? AND steamid = ?',
        [id, steamId],

        'Failed to delete heavys');
    await executeQuery<unknown[]>('DELETE FROM wp_player_pistols WHERE loadoutid = ? AND steamid = ?',
        [id, steamId],
        'Failed to delete pistols');
    await executeQuery<unknown[]>('DELETE FROM wp_player_rifles WHERE loadoutid = ? AND steamid = ?',
        [id, steamId],
        'Failed to delete rifles');
    await executeQuery<unknown[]>('DELETE FROM wp_player_smgs WHERE loadoutid = ? AND steamid = ?',
        [id, steamId],
        'Failed to delete smgs');
    await executeQuery<unknown[]>('DELETE FROM wp_player_knifes WHERE loadoutid = ? AND steamid = ?',
        [id, steamId],
        'Failed to delete knives');
    await executeQuery<unknown[]>('DELETE FROM wp_player_gloves WHERE loadoutid = ? AND steamid = ?',
        [id, steamId],
        'Failed to delete gloves');
    await executeQuery<unknown[]>('DELETE FROM wp_player_music WHERE loadoutid = ? AND steamid = ?',
        [id, steamId],
        'Failed to delete music kits');
    await executeQuery<unknown[]>('DELETE FROM wp_player_agents WHERE loadoutid = ? AND steamid = ?',
        [id, steamId],
        'Failed to delete agents');
    await executeQuery<unknown[]>(
        'DELETE FROM wp_player_loadouts WHERE id = ? AND steamid = ?',
        [id, steamId],
        'Failed to delete loadout'
    );

}
export const deleteLoadoutByName = async (steamId: string, name: string): Promise<void> => {
    await executeQuery<unknown[]>(
        'DELETE FROM wp_player_loadouts WHERE steamid = ? AND name = ?',
        [steamId, name.toLowerCase()],
        'Failed to delete loadout'
    );
};

/**
 * Set a loadout as active and deactivate all other loadouts for the user
 * @param id - The loadout ID to activate
 * @param steamId - The Steam ID of the user
 */
export const setActiveLoadout = async (id: string, steamId: string): Promise<void> => {
    // First, set all loadouts for this user to inactive
    await executeQuery<unknown[]>(
        'UPDATE wp_player_loadouts SET active = 0 WHERE steamid = ?',
        [steamId],
        'Failed to deactivate loadouts'
    );
    // Then, set the specified loadout as active
    await executeQuery<unknown[]>(
        'UPDATE wp_player_loadouts SET active = 1 WHERE id = ? AND steamid = ?',
        [id, steamId],
        'Failed to activate loadout'
    );
};

// Helper to get formatted current time for MySQL
const getCurrentMysqlTime = () => new Date().toISOString().slice(0, 19).replace('T', ' ');

export const duplicateLoadout = async (steamId: string, originalLoadoutId: string): Promise<DBLoadout> => {
    // 1. Get original loadout to verify ownership
    const original = await getLoadout(originalLoadoutId, steamId);
    if (!original) throw new Error('Original loadout not found');

    // 2. Create new loadout with unique name: "{Name} Copy-{XY}"
    let uniqueNameFound = false;
    let newName = '';

    while (!uniqueNameFound) {
        const randomSuffix = Math.random().toString(36).substring(2, 4).toUpperCase();
        newName = `${original.name} Copy-${randomSuffix}`.substring(0, 20); // Basic truncation

        const exists = await loadoutExists(steamId, newName);
        if (!exists) {
            uniqueNameFound = true;
        }
    }

    await createLoadout(steamId, newName);
    const newLoadout = await getLoadoutByName(steamId, newName);

    // 3. Duplicate items from all tables
    const tables = ['knifes', 'gloves', 'pistols', 'rifles', 'smgs', 'heavys', 'agents', 'music', 'pins'];

    for (const table of tables) {
        // Get columns for the table to construct the query safely
        const columns = await executeQuery<Array<{ Field: string }>>(
            `SHOW COLUMNS FROM wp_player_${table}`,
            [],
            `Failed to get columns for table ${table}`
        );
        const colNames = columns.map(c => c.Field).filter(c => c !== 'id' && c !== 'created_at' && c !== 'updated_at');

        if (colNames.length === 0) continue;

        const cols = colNames.join(', ');
        // We replace 'loadoutid' in the SELECT part with the new ID
        const selectCols = colNames.map(c => c === 'loadoutid' ? '?' : c).join(', ');

        await executeQuery(
            `INSERT INTO wp_player_${table} (${cols}) SELECT ${selectCols} FROM wp_player_${table} WHERE loadoutid = ?`,
            [newLoadout.id, originalLoadoutId],
            `Failed to duplicate items for table ${table}`
        );
    }

    return newLoadout;
}

export const setShareCode = async (loadoutId: string, steamId: string, shareCode: string): Promise<void> => {
    await executeQuery(
        'UPDATE wp_player_loadouts SET share_code = ? WHERE id = ? AND steamid = ?',
        [shareCode, loadoutId, steamId],
        'Failed to set share code'
    );
};

export const getLoadoutByShareCode = async (shareCode: string): Promise<DBLoadout | undefined> => {
    const res = await executeQuery<DBLoadout[]>(
        'SELECT * FROM wp_player_loadouts WHERE share_code = ?',
        [shareCode],
        'Failed to get loadout by share code'
    );
    return res[0];
}

export const setLoadoutAsDefault = async (loadoutId: string, steamId: string): Promise<void> => {
    // 1. Reset all defaults for this user
    await executeQuery(
        'UPDATE wp_player_loadouts SET is_default = 0 WHERE steamid = ?',
        [steamId],
        'Failed to reset default loadouts'
    );

    // 2. Set new default
    await executeQuery(
        'UPDATE wp_player_loadouts SET is_default = 1 WHERE id = ? AND steamid = ?',
        [loadoutId, steamId],
        'Failed to set default loadout'
    );
};

export const clearLoadoutItems = async (loadoutId: string, steamId: string, categories: string[] = []): Promise<void> => {
    const allTables = ['knifes', 'gloves', 'pistols', 'rifles', 'smgs', 'heavys', 'agents', 'music', 'pins'];

    const categoryMap: Record<string, string> = {
        'knives': 'knifes',
        'gloves': 'gloves',
        'pistols': 'pistols',
        'rifles': 'rifles',
        'smgs': 'smgs',
        'heavys': 'heavys',
        'agents': 'agents',
        'music': 'music',
        'pins': 'pins'
    };

    const tablesToClear = categories.length > 0
        ? categories.map(c => categoryMap[c.toLowerCase()] || c.toLowerCase()).filter(t => allTables.includes(t))
        : allTables;

    for (const table of tablesToClear) {
        await executeQuery(
            `DELETE FROM wp_player_${table} WHERE loadoutid = ? AND steamid = ?`,
            [loadoutId, steamId],
            `Failed to clear items from ${table}`
        );
    }
}

/**
 * Import a loadout from a share code into the current user's account
 */
export const importLoadoutFromShareCode = async (steamId: string, shareCode: string): Promise<DBLoadout> => {
    // 1. Find the source loadout
    const sourceLoadout = await getLoadoutByShareCode(shareCode);
    if (!sourceLoadout) throw new Error('Invalid share code');

    // 2. Generate a unique name
    let uniqueNameFound = false;
    let newName = '';

    while (!uniqueNameFound) {
        // format: "{Name} Import-{XY}"
        const randomSuffix = Math.random().toString(36).substring(2, 4).toUpperCase();
        newName = `${sourceLoadout.name} Import-${randomSuffix}`.substring(0, 20);

        const exists = await loadoutExists(steamId, newName);
        if (!exists) {
            uniqueNameFound = true;
        }
    }

    // 3. Create the new loadout container
    await createLoadout(steamId, newName);
    const newLoadout = await getLoadoutByName(steamId, newName);

    // 4. Copy all items from source loadout to new loadout
    const tables = ['knifes', 'gloves', 'pistols', 'rifles', 'smgs', 'heavys', 'agents', 'music', 'pins'];

    for (const table of tables) {
        const columns = await executeQuery<Array<{ Field: string }>>(
            `SHOW COLUMNS FROM wp_player_${table}`,
            [],
            `Failed to get columns for table ${table}`
        );
        const colNames = columns.map(c => c.Field).filter(c => c !== 'id' && c !== 'created_at' && c !== 'updated_at');
        if (colNames.length === 0) continue;

        const cols = colNames.join(', ');

        // Construct INSERT ... SELECT statement
        // Columns needed: loadoutid (new), steamid (new), everything else (copy)

        const selectExpressions = colNames.map(col => {
            if (col === 'loadoutid') return '?';
            if (col === 'steamid') return '?';
            return col;
        }).join(', ');

        // Prepare parameters list: [newLoadoutId, newSteamId]
        const params: any[] = [];
        colNames.forEach(col => {
            if (col === 'loadoutid') params.push(newLoadout.id);
            if (col === 'steamid') params.push(steamId);
        });

        // Add source loadout ID for WHERE clause
        params.push(sourceLoadout.id);

        await executeQuery(
            `INSERT INTO wp_player_${table} (${cols}) SELECT ${selectExpressions} FROM wp_player_${table} WHERE loadoutid = ?`,
            params,
            `Failed to import items for table ${table}`
        );
    }

    return newLoadout;
}