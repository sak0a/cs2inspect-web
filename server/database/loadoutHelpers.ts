import { DBLoadout } from '~/server/utils/interfaces'
import { pool } from './database'

export const getLoadoutsBySteamId = async (steamId: string): Promise<DBLoadout[]> => {
    let conn
    try {
        conn = await pool.getConnection()

        const loadouts: DBLoadout[] = await conn.query(
            'SELECT * FROM wp_player_loadouts WHERE steamid = ?',
            [steamId]
        )
        return loadouts
    } catch (e) {
        throw new Error('Failed to fetch loadouts from database')
    } finally {
        if (conn) conn.release()
    }
}
export const getLoadout = async (id: string, steamid: string): Promise<DBLoadout> => {
    let conn
    try {
        conn = await pool.getConnection()

        const loadout = await conn.query(
            'SELECT * FROM wp_player_loadouts WHERE id = ? AND steamid = ?', [id, steamid]
        )
        return loadout[0]
    } catch (e) {
        throw new Error('Failed to fetch loadout')
    }  finally {
        if (conn) conn.release()
    }
}
export const getLoadoutByName = async (steamId: string, name: string): Promise<DBLoadout> => {
    let conn
    try {
        conn = await pool.getConnection()

        const loadout = await conn.query(
            'SELECT * FROM wp_player_loadouts WHERE steamid = ? AND name = ?',
            [steamId, name.toLowerCase()]
        )
        return loadout[0]
    } catch (e) {
        throw new Error('Failed to fetch loadout from database')
    }  finally {
        if (conn) conn.release()
    }
}
export const updateLoadout = async (id: string, steamid: string, name: string): Promise<void> => {
    let conn
    try {
        conn = await pool.getConnection()

        await conn.query(
            'UPDATE wp_player_loadouts SET name = ? WHERE id = ? AND steamid = ?',
            [name, id, steamid]
        )
    } catch (e) {
        throw new Error('Failed to update loadout')
    }  finally {
        if (conn) conn.release()
    }
}
export const updateLoadoutByName = async (steamId: string, name: string, newName: string): Promise<void> => {
    let conn
    try {
        conn = await pool.getConnection()
        await conn.query(
            'UPDATE wp_player_loadouts SET name = ? WHERE steamid = ? AND name = ?',
            [newName, steamId, name.toLowerCase()]);
    } catch (e) {
        throw new Error('Failed to update loadout')
    }  finally {
        if (conn) conn.release()
    }
}
export const createLoadout = async (steamId: string, name: string): Promise<void> => {
    let conn
    try {
        conn = await pool.getConnection()

        await conn.query(
            'INSERT INTO wp_player_loadouts (steamid, name) VALUES (?, ?)',
            [steamId, name]
        )
    } catch (e) {
        throw new Error('Failed to create loadout')
    } finally {
        if (conn) conn.release()
    }
}
export const loadoutExists = async (steamId: string, name: string): Promise<boolean> => {
    let conn
    try {
        conn = await pool.getConnection()

        const loadout = await conn.query(
            'SELECT * FROM wp_player_loadouts WHERE steamid = ? AND name = ?',
            [steamId, name.toLowerCase()]
        )
        return loadout.length > 0
    } catch (e) {
        throw new Error('Failed to check if loadout exists')
    }  finally {
        if (conn) conn.release()
    }
}
export const loadoutExistsById = async (id: string): Promise<boolean> => {
    let conn
    try {
        conn = await pool.getConnection()

        const loadout = await conn.query(
            'SELECT * FROM wp_player_loadouts WHERE id = ?',
            [id]
        )
        return loadout.length > 0
    } catch (e) {
        throw new Error('Failed to check if loadout exists')
    }  finally {
        if (conn) conn.release()
    }
}
export const deleteLoadout = async (id: string, steamId: string): Promise<void> => {
    let conn
    try {
        conn = await pool.getConnection()

        await conn.query('DELETE FROM wp_player_loadouts WHERE id = ? AND steamid = ?', [id, steamId])
    } catch (e) {
        throw new Error('Failed to delete loadout')
    }  finally {
        if (conn) conn.release()
    }
}
export const deleteLoadoutByName = async (steamId: string, name: string): Promise<void> => {
    let conn
    try {
        conn = await pool.getConnection()

        await conn.query('DELETE FROM wp_player_loadouts WHERE steamid = ? AND name = ?', [steamId, name.toLowerCase()])
    } catch (e) {
        throw new Error('Failed to delete loadout')
    }  finally {
        if (conn) conn.release()
    }
}