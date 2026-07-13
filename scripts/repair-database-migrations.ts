#!/usr/bin/env bun

import fs from 'fs'
import crypto from 'crypto'
import path from 'path'
import mysql from 'mysql2/promise'

const journal = JSON.parse(
  fs.readFileSync(path.resolve('./server/database/drizzle/meta/_journal.json'), 'utf-8')
) as { entries: Array<{ tag: string; when: number }> }

function migrationHash(tag: string): string {
  const sqlContent = fs.readFileSync(
    path.resolve(`./server/database/drizzle/${tag}.sql`),
    'utf-8'
  )
  return crypto.createHash('sha256').update(sqlContent).digest('hex')
}

async function ensureJournalEntry(
  conn: mysql.Connection,
  tag: string,
  when: number
): Promise<void> {
  const hash = migrationHash(tag)
  const [rows] = await conn.query('SELECT id FROM __drizzle_migrations WHERE hash = ?', [hash])
  if ((rows as Array<{ id: number }>).length > 0) {
    return
  }
  await conn.query('INSERT INTO __drizzle_migrations (hash, created_at) VALUES (?, ?)', [hash, when])
  console.log(`Recorded journal entry: ${tag}`)
}

async function applyMigrationSql(conn: mysql.Connection, tag: string): Promise<void> {
  const sqlPath = path.resolve(`./server/database/drizzle/${tag}.sql`)
  const sqlContent = fs.readFileSync(sqlPath, 'utf-8')
  const statements = sqlContent.split('--> statement-breakpoint').map((s) => s.trim()).filter(Boolean)

  for (const stmt of statements) {
    try {
      await conn.query(stmt)
    } catch (error) {
      const err = error as { code?: string; message?: string }
      if (
        err.code === 'ER_TABLE_EXISTS_ERROR' ||
        err.code === 'ER_DUP_KEYNAME' ||
        err.code === 'ER_DUP_FIELDNAME' ||
        err.message?.includes('Duplicate key name')
      ) {
        console.log(`  skip existing: ${stmt.slice(0, 70).replace(/\s+/g, ' ')}`)
        continue
      }
      throw error
    }
  }
}

async function completeItemHistory(conn: mysql.Connection): Promise<void> {
  await conn.query(
    'ALTER TABLE `wp_item_history` MODIFY COLUMN `loadoutid` int unsigned NOT NULL'
  )
  await conn.query(
    'ALTER TABLE `wp_item_history` ADD COLUMN IF NOT EXISTS `version_id` varchar(30) NOT NULL DEFAULT \'\''
  )

  const indexes = [
    'CREATE INDEX `idx_item_history_item` ON `wp_item_history` (`steamid`,`loadoutid`,`item_type`,`defindex`,`team`)',
    'CREATE INDEX `idx_item_history_loadout` ON `wp_item_history` (`steamid`,`loadoutid`)',
    'CREATE INDEX `idx_item_history_created` ON `wp_item_history` (`created_at`)',
  ]

  for (const stmt of indexes) {
    try {
      await conn.query(stmt)
    } catch (error) {
      const err = error as { code?: string }
      if (err.code === 'ER_DUP_KEYNAME') continue
      throw error
    }
  }

  try {
    await conn.query(
      'ALTER TABLE `wp_item_history` ADD CONSTRAINT `wp_item_history_loadoutid_wp_player_loadouts_id_fk` FOREIGN KEY (`loadoutid`) REFERENCES `wp_player_loadouts`(`id`) ON DELETE cascade ON UPDATE no action'
    )
  } catch (error) {
    const err = error as { code?: string }
    if (err.code !== 'ER_CANT_CREATE_TABLE' && err.code !== 'ER_DUP_KEYNAME') {
      throw error
    }
  }
}

async function main() {
  const conn = await mysql.createConnection({
    host: process.env.DATABASE_HOST,
    port: Number(process.env.DATABASE_PORT) || 3306,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_NAME,
    multipleStatements: true,
  })

  try {
    const pendingTags = [
      '0004_bitter_penance',
      '0005_ambiguous_black_widow',
      '0006_premium_onslaught',
    ]

    for (const tag of pendingTags) {
      console.log(`Applying ${tag}...`)
      await applyMigrationSql(conn, tag)
      const entry = journal.entries.find((e) => e.tag === tag)
      if (entry) {
        await ensureJournalEntry(conn, tag, entry.when)
      }
    }

    console.log('Completing wp_item_history schema...')
    await completeItemHistory(conn)

    for (const tag of ['0001_flashy_garia', '0002_tired_shockwave', '0003_little_puppet_master']) {
      const entry = journal.entries.find((e) => e.tag === tag)
      if (entry) {
        await ensureJournalEntry(conn, tag, entry.when)
      }
    }

    const [tables] = await conn.query(
      `SELECT table_name FROM information_schema.tables
       WHERE table_schema = DATABASE()
       AND table_name IN ('app_settings', 'plugin_settings', 'user_profiles')
       ORDER BY table_name`
    )
    console.log(
      'Verified tables:',
      (tables as Array<{ TABLE_NAME: string }>).map((t) => t.TABLE_NAME).join(', ')
    )
  } finally {
    await conn.end()
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
