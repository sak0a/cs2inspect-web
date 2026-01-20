/**
 * Loadout Helper Functions using Drizzle ORM
 * Provides type-safe database operations for loadouts
 */
import { eq, and, desc, asc } from 'drizzle-orm';
import { db } from './client';
import {
    loadouts,
    knives,
    gloves,
    pistols,
    rifles,
    smgs,
    heavys,
    agents,
    music,
    pins
} from './schema';
import type { InferSelectModel } from 'drizzle-orm';
import { toLoadoutId } from '~/types/core/common';

// Export inferred type for loadouts
export type DBLoadout = InferSelectModel<typeof loadouts>;

export const getLoadoutsBySteamId = async (steamId: string): Promise<DBLoadout[]> => {
    return db.select()
        .from(loadouts)
        .where(eq(loadouts.steamid, steamId))
        .orderBy(desc(loadouts.active), asc(loadouts.id));
};

export const getLoadout = async (id: string, steamId: string): Promise<DBLoadout | undefined> => {
    const result = await db.select()
        .from(loadouts)
        .where(and(eq(loadouts.id, toLoadoutId(id)), eq(loadouts.steamid, steamId)))
        .limit(1);
    return result[0];
};

export const getLoadoutByName = async (steamId: string, name: string): Promise<DBLoadout | undefined> => {
    const result = await db.select()
        .from(loadouts)
        .where(and(
            eq(loadouts.steamid, steamId),
            eq(loadouts.name, name.toLowerCase())
        ))
        .limit(1);
    return result[0];
};

export const updateLoadout = async (id: string, steamid: string, name: string): Promise<void> => {
    const exists = await loadoutExists(steamid, name);
    if (exists) {
        // Check if the existing one is NOT the one we are updating
        const existing = await getLoadoutByName(steamid, name);
        if (existing && existing.id.toString() !== id.toString()) {
            throw new Error('A loadout with this name already exists');
        }
    }

    await db.update(loadouts)
        .set({ name })
        .where(and(eq(loadouts.id, toLoadoutId(id)), eq(loadouts.steamid, steamid)));
};

export const updateLoadoutByName = async (steamId: string, name: string, newName: string): Promise<void> => {
    await db.update(loadouts)
        .set({ name: newName })
        .where(and(
            eq(loadouts.steamid, steamId),
            eq(loadouts.name, name.toLowerCase())
        ));
};

export const createLoadout = async (steamId: string, name: string): Promise<void> => {
    const exists = await loadoutExists(steamId, name);
    if (exists) {
        throw new Error('A loadout with this name already exists');
    }

    await db.insert(loadouts).values({
        steamid: steamId,
        name: name
    });
};

export const loadoutExists = async (steamId: string, name: string): Promise<boolean> => {
    const result = await db.select({ id: loadouts.id })
        .from(loadouts)
        .where(and(
            eq(loadouts.steamid, steamId),
            eq(loadouts.name, name.toLowerCase())
        ))
        .limit(1);
    return result.length > 0;
};

export const loadoutExistsById = async (id: string): Promise<boolean> => {
    const result = await db.select({ id: loadouts.id })
        .from(loadouts)
        .where(eq(loadouts.id, toLoadoutId(id)))
        .limit(1);
    return result.length > 0;
};

export const deleteLoadout = async (id: string, steamId: string): Promise<void> => {
    const loadoutId = toLoadoutId(id);

    // Delete all associated items first (foreign key cascade should handle this, but being explicit)
    await db.delete(heavys).where(and(eq(heavys.loadoutid, loadoutId), eq(heavys.steamid, steamId)));
    await db.delete(pistols).where(and(eq(pistols.loadoutid, loadoutId), eq(pistols.steamid, steamId)));
    await db.delete(rifles).where(and(eq(rifles.loadoutid, loadoutId), eq(rifles.steamid, steamId)));
    await db.delete(smgs).where(and(eq(smgs.loadoutid, loadoutId), eq(smgs.steamid, steamId)));
    await db.delete(knives).where(and(eq(knives.loadoutid, loadoutId), eq(knives.steamid, steamId)));
    await db.delete(gloves).where(and(eq(gloves.loadoutid, loadoutId), eq(gloves.steamid, steamId)));
    await db.delete(music).where(and(eq(music.loadoutid, loadoutId), eq(music.steamid, steamId)));
    await db.delete(agents).where(and(eq(agents.loadoutid, loadoutId), eq(agents.steamid, steamId)));
    await db.delete(pins).where(and(eq(pins.loadoutid, loadoutId), eq(pins.steamid, steamId)));

    // Delete the loadout itself
    await db.delete(loadouts).where(and(eq(loadouts.id, loadoutId), eq(loadouts.steamid, steamId)));
};

export const deleteLoadoutByName = async (steamId: string, name: string): Promise<void> => {
    await db.delete(loadouts).where(and(
        eq(loadouts.steamid, steamId),
        eq(loadouts.name, name.toLowerCase())
    ));
};

/**
 * Set a loadout as active and deactivate all other loadouts for the user
 */
export const setActiveLoadout = async (id: string, steamId: string): Promise<void> => {
    // First, set all loadouts for this user to inactive
    await db.update(loadouts)
        .set({ active: 0 })
        .where(eq(loadouts.steamid, steamId));

    // Then, set the specified loadout as active
    await db.update(loadouts)
        .set({ active: 1 })
        .where(and(eq(loadouts.id, toLoadoutId(id)), eq(loadouts.steamid, steamId)));
};

/**
 * Duplicate a loadout with all its items
 */
export const duplicateLoadout = async (steamId: string, originalLoadoutId: string): Promise<DBLoadout> => {
    // 1. Get original loadout to verify ownership
    const original = await getLoadout(originalLoadoutId, steamId);
    if (!original) throw new Error('Original loadout not found');

    // 2. Create new loadout with unique name: "{Name} Copy-{XY}"
    let uniqueNameFound = false;
    let newName = '';

    while (!uniqueNameFound) {
        const randomSuffix = Math.random().toString(36).substring(2, 4).toUpperCase();
        newName = `${original.name} Copy-${randomSuffix}`.substring(0, 20);

        const exists = await loadoutExists(steamId, newName);
        if (!exists) {
            uniqueNameFound = true;
        }
    }

    await createLoadout(steamId, newName);
    const newLoadout = await getLoadoutByName(steamId, newName);
    if (!newLoadout) throw new Error('Failed to create new loadout');

    const originalId = toLoadoutId(originalLoadoutId);
    const newLoadoutId = newLoadout.id;

    // 3. Duplicate items from all tables using Drizzle
    // Knives
    const originalKnives = await db.select().from(knives).where(eq(knives.loadoutid, originalId));
    for (const knife of originalKnives) {
        const { id: _id, created_at: _created, updated_at: _updated, ...knifeData } = knife;
        await db.insert(knives).values({ ...knifeData, loadoutid: newLoadoutId });
    }

    // Gloves
    const originalGloves = await db.select().from(gloves).where(eq(gloves.loadoutid, originalId));
    for (const glove of originalGloves) {
        const { id: _id, created_at: _created, updated_at: _updated, ...gloveData } = glove;
        await db.insert(gloves).values({ ...gloveData, loadoutid: newLoadoutId });
    }

    // Pistols
    const originalPistols = await db.select().from(pistols).where(eq(pistols.loadoutid, originalId));
    for (const pistol of originalPistols) {
        const { id: _id, created_at: _created, updated_at: _updated, ...pistolData } = pistol;
        await db.insert(pistols).values({ ...pistolData, loadoutid: newLoadoutId });
    }

    // Rifles
    const originalRifles = await db.select().from(rifles).where(eq(rifles.loadoutid, originalId));
    for (const rifle of originalRifles) {
        const { id: _id, created_at: _created, updated_at: _updated, ...rifleData } = rifle;
        await db.insert(rifles).values({ ...rifleData, loadoutid: newLoadoutId });
    }

    // SMGs
    const originalSmgs = await db.select().from(smgs).where(eq(smgs.loadoutid, originalId));
    for (const smg of originalSmgs) {
        const { id: _id, created_at: _created, updated_at: _updated, ...smgData } = smg;
        await db.insert(smgs).values({ ...smgData, loadoutid: newLoadoutId });
    }

    // Heavys
    const originalHeavys = await db.select().from(heavys).where(eq(heavys.loadoutid, originalId));
    for (const heavy of originalHeavys) {
        const { id: _id, created_at: _created, updated_at: _updated, ...heavyData } = heavy;
        await db.insert(heavys).values({ ...heavyData, loadoutid: newLoadoutId });
    }

    // Agents
    const originalAgents = await db.select().from(agents).where(eq(agents.loadoutid, originalId));
    for (const agent of originalAgents) {
        const { id: _id, created_at: _created, updated_at: _updated, ...agentData } = agent;
        await db.insert(agents).values({ ...agentData, loadoutid: newLoadoutId });
    }

    // Music
    const originalMusic = await db.select().from(music).where(eq(music.loadoutid, originalId));
    for (const musicKit of originalMusic) {
        const { id: _id, created_at: _created, updated_at: _updated, ...musicData } = musicKit;
        await db.insert(music).values({ ...musicData, loadoutid: newLoadoutId });
    }

    // Pins
    const originalPins = await db.select().from(pins).where(eq(pins.loadoutid, originalId));
    for (const pin of originalPins) {
        const { id: _id, created_at: _created, updated_at: _updated, ...pinData } = pin;
        await db.insert(pins).values({ ...pinData, loadoutid: newLoadoutId });
    }

    return newLoadout;
};

export const setShareCode = async (loadoutId: string, steamId: string, shareCode: string): Promise<void> => {
    await db.update(loadouts)
        .set({ share_code: shareCode })
        .where(and(eq(loadouts.id, toLoadoutId(loadoutId)), eq(loadouts.steamid, steamId)));
};

export const getLoadoutByShareCode = async (shareCode: string): Promise<DBLoadout | undefined> => {
    const result = await db.select()
        .from(loadouts)
        .where(eq(loadouts.share_code, shareCode))
        .limit(1);
    return result[0];
};

export const setLoadoutAsDefault = async (loadoutId: string, steamId: string): Promise<void> => {
    // 1. Reset all defaults for this user
    await db.update(loadouts)
        .set({ is_default: 0 })
        .where(eq(loadouts.steamid, steamId));

    // 2. Set new default
    await db.update(loadouts)
        .set({ is_default: 1 })
        .where(and(eq(loadouts.id, toLoadoutId(loadoutId)), eq(loadouts.steamid, steamId)));
};

export const clearLoadoutItems = async (loadoutId: string, steamId: string, categories: string[] = []): Promise<void> => {
    const loadoutIdNum = toLoadoutId(loadoutId);

    const categoryToTable: Record<string, typeof knives | typeof gloves | typeof pistols | typeof rifles | typeof smgs | typeof heavys | typeof agents | typeof music | typeof pins> = {
        'knives': knives,
        'knifes': knives,
        'gloves': gloves,
        'pistols': pistols,
        'rifles': rifles,
        'smgs': smgs,
        'heavys': heavys,
        'agents': agents,
        'music': music,
        'pins': pins
    };

    const allCategories = ['knives', 'gloves', 'pistols', 'rifles', 'smgs', 'heavys', 'agents', 'music', 'pins'];

    const tablesToClear = categories.length > 0
        ? categories.map(c => c.toLowerCase()).filter(c => categoryToTable[c])
        : allCategories;

    for (const category of tablesToClear) {
        const table = categoryToTable[category];
        if (table) {
            await db.delete(table).where(and(
                eq(table.loadoutid, loadoutIdNum),
                eq(table.steamid, steamId)
            ));
        }
    }
};

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
    if (!newLoadout) throw new Error('Failed to create new loadout');

    const sourceId = sourceLoadout.id;
    const newLoadoutId = newLoadout.id;

    // 4. Copy all items from source loadout to new loadout
    // Knives
    const sourceKnives = await db.select().from(knives).where(eq(knives.loadoutid, sourceId));
    for (const knife of sourceKnives) {
        const { id: _id, created_at: _created, updated_at: _updated, ...knifeData } = knife;
        await db.insert(knives).values({ ...knifeData, loadoutid: newLoadoutId, steamid: steamId });
    }

    // Gloves
    const sourceGloves = await db.select().from(gloves).where(eq(gloves.loadoutid, sourceId));
    for (const glove of sourceGloves) {
        const { id: _id, created_at: _created, updated_at: _updated, ...gloveData } = glove;
        await db.insert(gloves).values({ ...gloveData, loadoutid: newLoadoutId, steamid: steamId });
    }

    // Pistols
    const sourcePistols = await db.select().from(pistols).where(eq(pistols.loadoutid, sourceId));
    for (const pistol of sourcePistols) {
        const { id: _id, created_at: _created, updated_at: _updated, ...pistolData } = pistol;
        await db.insert(pistols).values({ ...pistolData, loadoutid: newLoadoutId, steamid: steamId });
    }

    // Rifles
    const sourceRifles = await db.select().from(rifles).where(eq(rifles.loadoutid, sourceId));
    for (const rifle of sourceRifles) {
        const { id: _id, created_at: _created, updated_at: _updated, ...rifleData } = rifle;
        await db.insert(rifles).values({ ...rifleData, loadoutid: newLoadoutId, steamid: steamId });
    }

    // SMGs
    const sourceSmgs = await db.select().from(smgs).where(eq(smgs.loadoutid, sourceId));
    for (const smg of sourceSmgs) {
        const { id: _id, created_at: _created, updated_at: _updated, ...smgData } = smg;
        await db.insert(smgs).values({ ...smgData, loadoutid: newLoadoutId, steamid: steamId });
    }

    // Heavys
    const sourceHeavys = await db.select().from(heavys).where(eq(heavys.loadoutid, sourceId));
    for (const heavy of sourceHeavys) {
        const { id: _id, created_at: _created, updated_at: _updated, ...heavyData } = heavy;
        await db.insert(heavys).values({ ...heavyData, loadoutid: newLoadoutId, steamid: steamId });
    }

    // Agents
    const sourceAgents = await db.select().from(agents).where(eq(agents.loadoutid, sourceId));
    for (const agent of sourceAgents) {
        const { id: _id, created_at: _created, updated_at: _updated, ...agentData } = agent;
        await db.insert(agents).values({ ...agentData, loadoutid: newLoadoutId, steamid: steamId });
    }

    // Music
    const sourceMusic = await db.select().from(music).where(eq(music.loadoutid, sourceId));
    for (const musicKit of sourceMusic) {
        const { id: _id, created_at: _created, updated_at: _updated, ...musicData } = musicKit;
        await db.insert(music).values({ ...musicData, loadoutid: newLoadoutId, steamid: steamId });
    }

    // Pins
    const sourcePins = await db.select().from(pins).where(eq(pins.loadoutid, sourceId));
    for (const pin of sourcePins) {
        const { id: _id, created_at: _created, updated_at: _updated, ...pinData } = pin;
        await db.insert(pins).values({ ...pinData, loadoutid: newLoadoutId, steamid: steamId });
    }

    return newLoadout;
};
