/**
 * User Profiles Database Schema
 *
 * Stores Steam profile data (persona name, avatar) for registered users.
 * Upserted on each login/profile fetch so names and avatars stay current.
 */
import { mysqlTable, int, varchar, timestamp, index } from 'drizzle-orm/mysql-core'

export const userProfiles = mysqlTable(
  'user_profiles',
  {
    id: int('id').primaryKey().autoincrement(),
    steamid: varchar('steamid', { length: 64 }).notNull().unique(),
    personaname: varchar('personaname', { length: 128 }).notNull(),
    avatarfull: varchar('avatarfull', { length: 512 }),
    lastseen: timestamp('lastseen').defaultNow().onUpdateNow().notNull(),
    created_at: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [index('idx_userprofiles_personaname').on(table.personaname)]
)

export type UserProfile = typeof userProfiles.$inferSelect
export type NewUserProfile = typeof userProfiles.$inferInsert
