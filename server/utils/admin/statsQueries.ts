/**
 * Admin Statistics Database Query Helpers
 *
 * Functions for querying user statistics, item counts, and activity data
 * for the admin panel dashboard.
 */
import { sql, eq, gte, desc } from 'drizzle-orm'
import { db } from '~/server/database/client'
import {
  loadouts,
  pistols,
  rifles,
  smgs,
  heavys,
  knives,
  gloves,
  agents,
  music,
  pins,
  bannedUsers,
} from '~/server/database/schema'

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface ItemCategoryCount {
  weapons: number
  knives: number
  gloves: number
  agents: number
  musicKits: number
  pins: number
}

export interface TopUser {
  steamId: string
  loadoutCount: number
  totalItems: number
}

export interface ActivityTimeseriesEntry {
  date: string
  newUsers: number
  activeUsers: number
  loadoutsCreated: number
  itemsSaved: number
}

export interface HeatmapEntry {
  date: string
  value: number
}

// ============================================================================
// USER STATISTICS
// ============================================================================

/**
 * Count distinct users across all loadouts
 */
export async function countDistinctUsers(): Promise<number> {
  const result = await db
    .select({ count: sql<number>`COUNT(DISTINCT ${loadouts.steamid})` })
    .from(loadouts)

  return Number(result[0]?.count ?? 0)
}

/**
 * Count users who have had loadout updates in the last N days
 */
export async function countActiveUsers(days: number): Promise<number> {
  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - days)

  const result = await db
    .select({ count: sql<number>`COUNT(DISTINCT ${loadouts.steamid})` })
    .from(loadouts)
    .where(gte(loadouts.updated_at, cutoffDate))

  return Number(result[0]?.count ?? 0)
}

/**
 * Count total number of loadouts
 */
export async function countTotalLoadouts(): Promise<number> {
  const result = await db.select({ count: sql<number>`COUNT(*)` }).from(loadouts)

  return Number(result[0]?.count ?? 0)
}

/**
 * Count banned users (active bans only)
 */
export async function countBannedUsers(): Promise<number> {
  const result = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(bannedUsers)
    .where(eq(bannedUsers.active, 1))

  return Number(result[0]?.count ?? 0)
}

// ============================================================================
// ITEM STATISTICS
// ============================================================================

/**
 * Count items by category across all tables
 */
export async function countItemsByCategory(): Promise<ItemCategoryCount> {
  // Count weapons (pistols + rifles + smgs + heavys)
  const [
    pistolCount,
    rifleCount,
    smgCount,
    heavyCount,
    knifeCount,
    gloveCount,
    agentCount,
    musicCount,
    pinCount,
  ] = await Promise.all([
    db.select({ count: sql<number>`COUNT(*)` }).from(pistols),
    db.select({ count: sql<number>`COUNT(*)` }).from(rifles),
    db.select({ count: sql<number>`COUNT(*)` }).from(smgs),
    db.select({ count: sql<number>`COUNT(*)` }).from(heavys),
    db.select({ count: sql<number>`COUNT(*)` }).from(knives),
    db.select({ count: sql<number>`COUNT(*)` }).from(gloves),
    db.select({ count: sql<number>`COUNT(*)` }).from(agents),
    db.select({ count: sql<number>`COUNT(*)` }).from(music),
    db.select({ count: sql<number>`COUNT(*)` }).from(pins),
  ])

  const weaponTotal =
    Number(pistolCount[0]?.count ?? 0) +
    Number(rifleCount[0]?.count ?? 0) +
    Number(smgCount[0]?.count ?? 0) +
    Number(heavyCount[0]?.count ?? 0)

  return {
    weapons: weaponTotal,
    knives: Number(knifeCount[0]?.count ?? 0),
    gloves: Number(gloveCount[0]?.count ?? 0),
    agents: Number(agentCount[0]?.count ?? 0),
    musicKits: Number(musicCount[0]?.count ?? 0),
    pins: Number(pinCount[0]?.count ?? 0),
  }
}

/**
 * Get detailed weapon breakdown by category
 */
export async function getWeaponBreakdown(): Promise<{
  pistols: number
  rifles: number
  smgs: number
  heavys: number
}> {
  const [pistolCount, rifleCount, smgCount, heavyCount] = await Promise.all([
    db.select({ count: sql<number>`COUNT(*)` }).from(pistols),
    db.select({ count: sql<number>`COUNT(*)` }).from(rifles),
    db.select({ count: sql<number>`COUNT(*)` }).from(smgs),
    db.select({ count: sql<number>`COUNT(*)` }).from(heavys),
  ])

  return {
    pistols: Number(pistolCount[0]?.count ?? 0),
    rifles: Number(rifleCount[0]?.count ?? 0),
    smgs: Number(smgCount[0]?.count ?? 0),
    heavys: Number(heavyCount[0]?.count ?? 0),
  }
}

// ============================================================================
// TOP USERS
// ============================================================================

/**
 * Get top users by loadout count with total items
 */
export async function getTopUsersByLoadouts(limit: number = 10): Promise<TopUser[]> {
  // Get users with most loadouts
  const topLoadoutUsers = await db
    .select({
      steamId: loadouts.steamid,
      loadoutCount: sql<number>`COUNT(*)`.as('loadout_count'),
    })
    .from(loadouts)
    .groupBy(loadouts.steamid)
    .orderBy(desc(sql`loadout_count`))
    .limit(limit)

  // For each user, count their total items across all tables
  const usersWithItems = await Promise.all(
    topLoadoutUsers.map(async (user) => {
      const [
        pistolCount,
        rifleCount,
        smgCount,
        heavyCount,
        knifeCount,
        gloveCount,
        agentCount,
        musicCount,
        pinCount,
      ] = await Promise.all([
        db
          .select({ count: sql<number>`COUNT(*)` })
          .from(pistols)
          .where(eq(pistols.steamid, user.steamId)),
        db
          .select({ count: sql<number>`COUNT(*)` })
          .from(rifles)
          .where(eq(rifles.steamid, user.steamId)),
        db
          .select({ count: sql<number>`COUNT(*)` })
          .from(smgs)
          .where(eq(smgs.steamid, user.steamId)),
        db
          .select({ count: sql<number>`COUNT(*)` })
          .from(heavys)
          .where(eq(heavys.steamid, user.steamId)),
        db
          .select({ count: sql<number>`COUNT(*)` })
          .from(knives)
          .where(eq(knives.steamid, user.steamId)),
        db
          .select({ count: sql<number>`COUNT(*)` })
          .from(gloves)
          .where(eq(gloves.steamid, user.steamId)),
        db
          .select({ count: sql<number>`COUNT(*)` })
          .from(agents)
          .where(eq(agents.steamid, user.steamId)),
        db
          .select({ count: sql<number>`COUNT(*)` })
          .from(music)
          .where(eq(music.steamid, user.steamId)),
        db
          .select({ count: sql<number>`COUNT(*)` })
          .from(pins)
          .where(eq(pins.steamid, user.steamId)),
      ])

      const totalItems =
        Number(pistolCount[0]?.count ?? 0) +
        Number(rifleCount[0]?.count ?? 0) +
        Number(smgCount[0]?.count ?? 0) +
        Number(heavyCount[0]?.count ?? 0) +
        Number(knifeCount[0]?.count ?? 0) +
        Number(gloveCount[0]?.count ?? 0) +
        Number(agentCount[0]?.count ?? 0) +
        Number(musicCount[0]?.count ?? 0) +
        Number(pinCount[0]?.count ?? 0)

      return {
        steamId: user.steamId,
        loadoutCount: Number(user.loadoutCount),
        totalItems,
      }
    })
  )

  return usersWithItems
}

// ============================================================================
// USER DISTRIBUTION STATISTICS
// ============================================================================

/**
 * Get user distribution stats (average, median loadouts per user)
 */
export async function getUserDistributionStats(): Promise<{
  averageLoadoutsPerUser: number
  maxLoadoutsPerUser: number
  usersWithSingleLoadout: number
  usersWithMultipleLoadouts: number
}> {
  // Get loadout counts per user
  const loadoutCounts = await db
    .select({
      steamId: loadouts.steamid,
      count: sql<number>`COUNT(*)`.as('count'),
    })
    .from(loadouts)
    .groupBy(loadouts.steamid)

  if (loadoutCounts.length === 0) {
    return {
      averageLoadoutsPerUser: 0,
      maxLoadoutsPerUser: 0,
      usersWithSingleLoadout: 0,
      usersWithMultipleLoadouts: 0,
    }
  }

  const counts = loadoutCounts.map((u) => Number(u.count))
  const totalLoadouts = counts.reduce((a, b) => a + b, 0)
  const averageLoadoutsPerUser = totalLoadouts / loadoutCounts.length
  const maxLoadoutsPerUser = Math.max(...counts)
  const usersWithSingleLoadout = counts.filter((c) => c === 1).length
  const usersWithMultipleLoadouts = counts.filter((c) => c > 1).length

  return {
    averageLoadoutsPerUser: Math.round(averageLoadoutsPerUser * 100) / 100,
    maxLoadoutsPerUser,
    usersWithSingleLoadout,
    usersWithMultipleLoadouts,
  }
}

// ============================================================================
// ACTIVITY TIMESERIES
// ============================================================================

/**
 * Get activity time-series data for the last N days
 * Returns daily counts of new users, active users, loadouts created, and items saved
 */
export async function getActivityTimeseries(days: number): Promise<ActivityTimeseriesEntry[]> {
  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - days)

  // Generate date range
  const dates: string[] = []
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    const dateStr = date.toISOString().split('T')[0]
    if (dateStr) {
      dates.push(dateStr)
    }
  }

  // Get new users by first loadout creation date
  const newUsersQuery = await db
    .select({
      date: sql<string>`DATE(MIN(${loadouts.created_at}))`.as('date'),
      steamId: loadouts.steamid,
    })
    .from(loadouts)
    .groupBy(loadouts.steamid)
    .having(gte(sql`DATE(MIN(${loadouts.created_at}))`, cutoffDate))

  // Group new users by date
  const newUsersByDate = new Map<string, number>()
  for (const row of newUsersQuery) {
    const dateStr = row.date
    if (dateStr) {
      newUsersByDate.set(dateStr, (newUsersByDate.get(dateStr) || 0) + 1)
    }
  }

  // Get active users by date (users with any update)
  const activeUsersQuery = await db
    .select({
      date: sql<string>`DATE(${loadouts.updated_at})`.as('date'),
      count: sql<number>`COUNT(DISTINCT ${loadouts.steamid})`.as('count'),
    })
    .from(loadouts)
    .where(gte(loadouts.updated_at, cutoffDate))
    .groupBy(sql`DATE(${loadouts.updated_at})`)

  const activeUsersByDate = new Map<string, number>()
  for (const row of activeUsersQuery) {
    if (row.date) {
      activeUsersByDate.set(row.date, Number(row.count))
    }
  }

  // Get loadouts created by date
  const loadoutsCreatedQuery = await db
    .select({
      date: sql<string>`DATE(${loadouts.created_at})`.as('date'),
      count: sql<number>`COUNT(*)`.as('count'),
    })
    .from(loadouts)
    .where(gte(loadouts.created_at, cutoffDate))
    .groupBy(sql`DATE(${loadouts.created_at})`)

  const loadoutsCreatedByDate = new Map<string, number>()
  for (const row of loadoutsCreatedQuery) {
    if (row.date) {
      loadoutsCreatedByDate.set(row.date, Number(row.count))
    }
  }

  // Get items saved by date (sum of all item tables updated)
  const itemsUpdatedPromises = [
    db
      .select({
        date: sql<string>`DATE(${pistols.updated_at})`.as('date'),
        count: sql<number>`COUNT(*)`.as('count'),
      })
      .from(pistols)
      .where(gte(pistols.updated_at, cutoffDate))
      .groupBy(sql`DATE(${pistols.updated_at})`),
    db
      .select({
        date: sql<string>`DATE(${rifles.updated_at})`.as('date'),
        count: sql<number>`COUNT(*)`.as('count'),
      })
      .from(rifles)
      .where(gte(rifles.updated_at, cutoffDate))
      .groupBy(sql`DATE(${rifles.updated_at})`),
    db
      .select({
        date: sql<string>`DATE(${smgs.updated_at})`.as('date'),
        count: sql<number>`COUNT(*)`.as('count'),
      })
      .from(smgs)
      .where(gte(smgs.updated_at, cutoffDate))
      .groupBy(sql`DATE(${smgs.updated_at})`),
    db
      .select({
        date: sql<string>`DATE(${heavys.updated_at})`.as('date'),
        count: sql<number>`COUNT(*)`.as('count'),
      })
      .from(heavys)
      .where(gte(heavys.updated_at, cutoffDate))
      .groupBy(sql`DATE(${heavys.updated_at})`),
    db
      .select({
        date: sql<string>`DATE(${knives.updated_at})`.as('date'),
        count: sql<number>`COUNT(*)`.as('count'),
      })
      .from(knives)
      .where(gte(knives.updated_at, cutoffDate))
      .groupBy(sql`DATE(${knives.updated_at})`),
    db
      .select({
        date: sql<string>`DATE(${gloves.updated_at})`.as('date'),
        count: sql<number>`COUNT(*)`.as('count'),
      })
      .from(gloves)
      .where(gte(gloves.updated_at, cutoffDate))
      .groupBy(sql`DATE(${gloves.updated_at})`),
  ]

  const itemsUpdatedResults = await Promise.all(itemsUpdatedPromises)

  const itemsSavedByDate = new Map<string, number>()
  for (const result of itemsUpdatedResults) {
    for (const row of result) {
      if (row.date) {
        itemsSavedByDate.set(row.date, (itemsSavedByDate.get(row.date) || 0) + Number(row.count))
      }
    }
  }

  // Build result array
  return dates.map((date) => ({
    date,
    newUsers: newUsersByDate.get(date) || 0,
    activeUsers: activeUsersByDate.get(date) || 0,
    loadoutsCreated: loadoutsCreatedByDate.get(date) || 0,
    itemsSaved: itemsSavedByDate.get(date) || 0,
  }))
}

/**
 * Get heatmap data for the last N days
 * Returns daily activity counts for visualization
 */
export async function getHeatmapData(days: number): Promise<HeatmapEntry[]> {
  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - days)

  // Get combined activity (loadout updates) by date
  const activityQuery = await db
    .select({
      date: sql<string>`DATE(${loadouts.updated_at})`.as('date'),
      value: sql<number>`COUNT(*)`.as('value'),
    })
    .from(loadouts)
    .where(gte(loadouts.updated_at, cutoffDate))
    .groupBy(sql`DATE(${loadouts.updated_at})`)
    .orderBy(sql`DATE(${loadouts.updated_at})`)

  // Fill in missing dates with zero values
  const activityMap = new Map<string, number>()
  for (const row of activityQuery) {
    if (row.date) {
      activityMap.set(row.date, Number(row.value))
    }
  }

  const result: HeatmapEntry[] = []
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    const dateStr = date.toISOString().split('T')[0] as string
    result.push({
      date: dateStr,
      value: activityMap.get(dateStr) || 0,
    })
  }

  return result
}
