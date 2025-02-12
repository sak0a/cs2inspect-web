import { pool } from './database'; // Adjust the import based on your project structure

export const tableMap: Record<string, string> = {
    knives: 'wp_player_knifes',
    smgs: 'wp_player_smgs',
    rifles: 'wp_player_rifles',
    heavys: 'wp_player_heavys',
    pistols: 'wp_player_pistols',
    gloves: 'wp_player_gloves',
    agents: 'wp_player_agents',
    pins: 'wp_player_pins',
    music: 'wp_player_music'
};

const getTable = (type: string): string => {
    const table = tableMap[type];
    if (!table) {
        throw new Error('Invalid type');
    }
    return table;
};

export const getData = async (type: string, criteria: Record<string, any>): Promise<any> => {
    const table = getTable(type);
    const keys = Object.keys(criteria);
    const values = Object.values(criteria);
    const whereClause = keys.map(key => `${key} = ?`).join(' AND ');

    const conn = await pool.getConnection();
    try {
        const query = `SELECT * FROM ${table} WHERE ${whereClause}`;
        const [rows] = await conn.query(query, values);
        return rows;
    } finally {
        conn.release();
    }
};

export const dataExists = async (type: string, criteria: Record<string, any>): Promise<boolean> => {
    const rows = await getData(type, criteria);
    return rows.length > 0;
}

export const createData = async (type: string, data: Record<string, any>): Promise<void> => {
    const table = getTable(type);
    const keys = Object.keys(data);
    const values = Object.values(data);
    const columns = keys.join(', ');
    const placeholders = keys.map(() => '?').join(', ');

    const conn = await pool.getConnection();
    try {
        const query = `INSERT INTO ${table} (${columns}) VALUES (${placeholders})`;
        await conn.query(query, values);
    } finally {
        conn.release();
    }
};

export const updateData = async (type: string, id: string, data: Record<string, any>): Promise<void> => {
    const table = getTable(type);
    const keys = Object.keys(data);
    const values = Object.values(data);
    const setClause = keys.map(key => `${key} = ?`).join(', ');

    const conn = await pool.getConnection();
    try {
        const query = `UPDATE ${table} SET ${setClause} WHERE id = ?`;
        await conn.query(query, [...values, id]);
    } finally {
        conn.release();
    }
};

export const deleteData = async (type: string, id: string): Promise<void> => {
    const table = getTable(type);

    const conn = await pool.getConnection();
    try {
        const query = `DELETE FROM ${table} WHERE id = ?`;
        await conn.query(query, [id]);
    } finally {
        conn.release();
    }
};