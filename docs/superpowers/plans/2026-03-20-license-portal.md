# CS2Inspect License Portal — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a standalone Nuxt 4 license portal for CS2Inspect plugin sales — Steam auth, prepaid payments (Stripe + PayPal), license validation API, and customer dashboard.

**Architecture:** Standalone Nuxt 4 app with MariaDB (Drizzle ORM), deployed on Coolify from a private GitHub repo. Follows the same patterns as cs2inspect-web (Steam OpenID → JWT, file-based API routing, Drizzle schema conventions). The CS2 plugin C# modifications are out of scope for this plan — they'll be a separate plan.

**Tech Stack:** Nuxt 4, Vue 3, Tailwind CSS, Naive UI, Pinia, Drizzle ORM (mysql2), Stripe SDK, PayPal REST SDK, jsonwebtoken

**Spec:** `docs/superpowers/specs/2026-03-20-license-portal-design.md`

---

## File Structure

```
cs2inspect-portal/              # New private repo
├── app/
│   ├── pages/
│   │   ├── index.vue                   # Landing page (public)
│   │   ├── dashboard.vue               # Customer dashboard (auth required)
│   │   ├── buy.vue                     # Buy time / pricing page
│   │   ├── setup.vue                   # Setup guide / onboarding
│   │   └── settings.vue                # Account settings + purchase history
│   ├── components/
│   │   ├── landing/
│   │   │   ├── HeroSection.vue
│   │   │   ├── FeaturesSection.vue
│   │   │   ├── PricingSection.vue
│   │   │   ├── HowItWorks.vue
│   │   │   └── FaqSection.vue
│   │   ├── dashboard/
│   │   │   ├── LicenseCard.vue
│   │   │   ├── AddLicenseCard.vue
│   │   │   └── TrialBanner.vue
│   │   ├── buy/
│   │   │   └── PlanCard.vue
│   │   └── AppNavbar.vue               # Shared nav (public + auth states)
│   ├── composables/
│   │   └── useAuth.ts                  # Client-side auth state
│   ├── middleware/
│   │   └── auth.ts                     # Client-side route guard
│   ├── stores/
│   │   └── authStore.ts                # Pinia auth store
│   └── utils/
│       └── api.ts                      # Typed API client
├── server/
│   ├── api/
│   │   ├── auth/
│   │   │   ├── steam-validate.get.ts   # Steam OpenID callback
│   │   │   ├── me.get.ts               # Get current user
│   │   │   └── logout.post.ts          # Clear auth cookie
│   │   ├── licenses/
│   │   │   ├── index.get.ts            # List customer's licenses
│   │   │   ├── trial.post.ts           # Start 3-day trial
│   │   │   ├── [id].rebind.post.ts     # Rebind server address
│   │   │   └── validate.post.ts        # Plugin validation endpoint (public)
│   │   ├── purchases/
│   │   │   ├── index.get.ts            # Purchase history
│   │   │   └── create.post.ts          # Create checkout session
│   │   ├── webhooks/
│   │   │   ├── stripe.post.ts          # Stripe webhook handler
│   │   │   └── paypal.post.ts          # PayPal webhook handler
│   │   ├── settings/
│   │   │   └── email.put.ts            # Update email
│   │   └── health.get.ts               # Health check
│   ├── middleware/
│   │   ├── 01.steam-auth.ts            # Steam OpenID validation
│   │   └── 02.auth.ts                  # JWT verification
│   ├── database/
│   │   ├── client.ts                   # Drizzle + mysql2 pool
│   │   └── schema/
│   │       ├── index.ts                # Central export
│   │       ├── customers.ts
│   │       ├── licenses.ts
│   │       └── purchases.ts
│   ├── utils/
│   │   ├── database.ts                 # useDatabase() composable
│   │   ├── license-keys.ts             # Key generation
│   │   ├── stripe.ts                   # Stripe client init
│   │   ├── paypal.ts                   # PayPal client init
│   │   └── rate-limit.ts              # IP-based rate limiter
│   └── plugins/
│       └── database.ts                 # DB init on startup
├── nuxt.config.ts
├── drizzle.config.ts
├── package.json
├── tsconfig.json
├── Dockerfile
├── docker-compose.yml                  # For local dev + Coolify
├── .env.example
└── tailwind.config.ts
```

---

## Task 1: Project Scaffolding

**Files:**
- Create: `cs2inspect-portal/` (new repo root)
- Create: `package.json`, `nuxt.config.ts`, `tsconfig.json`, `drizzle.config.ts`, `.env.example`, `tailwind.config.ts`

- [ ] **Step 1: Initialize the Nuxt 4 project**

```bash
cd /Users/laurinfrank/Library/CloudStorage/Dropbox/Code/Web
npx nuxi@latest init cs2inspect-portal
cd cs2inspect-portal
```

- [ ] **Step 2: Install dependencies**

```bash
bun add drizzle-orm mysql2 jsonwebtoken zod stripe @paypal/paypal-server-sdk naive-ui @css-render/vue3-ssr pinia @pinia/nuxt
bun add -d drizzle-kit @types/jsonwebtoken tailwindcss @nuxtjs/tailwindcss typescript
```

- [ ] **Step 3: Configure nuxt.config.ts**

```typescript
export default defineNuxtConfig({
  compatibilityDate: '2025-01-01',
  future: { compatibilityVersion: 4 },
  devServer: { port: 3220 },
  ssr: true,

  modules: [
    '@nuxtjs/tailwindcss',
    '@pinia/nuxt',
  ],

  routeRules: {
    '/dashboard': { ssr: false },
    '/buy': { ssr: false },
    '/settings': { ssr: false },
  },

  runtimeConfig: {
    jwtSecret: process.env.JWT_SECRET || '',
    jwtExpiry: process.env.JWT_EXPIRY || '7d',
    steamApiKey: process.env.STEAM_API_KEY || '',
    stripeSecretKey: process.env.STRIPE_SECRET_KEY || '',
    stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
    paypalClientId: process.env.PAYPAL_CLIENT_ID || '',
    paypalClientSecret: process.env.PAYPAL_CLIENT_SECRET || '',
    paypalWebhookId: process.env.PAYPAL_WEBHOOK_ID || '',
    portalBaseUrl: process.env.PORTAL_BASE_URL || 'http://localhost:3220',
    public: {
      portalBaseUrl: process.env.PORTAL_BASE_URL || 'http://localhost:3220',
    },
  },
})
```

- [ ] **Step 4: Create .env.example**

```env
# Database
DATABASE_HOST=localhost
DATABASE_PORT=3306
DATABASE_USER=portal
DATABASE_PASSWORD=
DATABASE_NAME=cs2inspect_portal
DATABASE_CONNECTION_LIMIT=5

# Auth
JWT_SECRET=change-me-to-a-random-string
JWT_EXPIRY=7d
STEAM_API_KEY=

# Stripe
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=

# PayPal
PAYPAL_CLIENT_ID=
PAYPAL_CLIENT_SECRET=
PAYPAL_WEBHOOK_ID=
PAYPAL_SANDBOX=true

# App
PORTAL_BASE_URL=http://localhost:3220
PORT=3220
HOST=0.0.0.0
```

- [ ] **Step 5: Create drizzle.config.ts**

```typescript
import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  schema: './server/database/schema',
  out: './server/database/drizzle',
  dialect: 'mysql',
  dbCredentials: {
    host: process.env.DATABASE_HOST || 'localhost',
    port: Number(process.env.DATABASE_PORT) || 3306,
    user: process.env.DATABASE_USER || 'portal',
    password: process.env.DATABASE_PASSWORD || '',
    database: process.env.DATABASE_NAME || 'cs2inspect_portal',
  },
})
```

- [ ] **Step 6: Initialize git repo**

```bash
git init
git add -A
git commit -m "chore: scaffold Nuxt 4 license portal"
```

---

## Task 2: Database Schema & Client

**Files:**
- Create: `server/database/schema/customers.ts`
- Create: `server/database/schema/licenses.ts`
- Create: `server/database/schema/purchases.ts`
- Create: `server/database/schema/index.ts`
- Create: `server/database/client.ts`
- Create: `server/utils/database.ts`
- Create: `server/plugins/database.ts`

- [ ] **Step 1: Create customers schema**

```typescript
// server/database/schema/customers.ts
import { mysqlTable, int, varchar, boolean, timestamp } from 'drizzle-orm/mysql-core'

export const customers = mysqlTable('customers', {
  id: int('id').primaryKey().autoincrement(),
  steamid: varchar('steamid', { length: 64 }).notNull().unique(),
  personaname: varchar('personaname', { length: 128 }).notNull(),
  avatarurl: varchar('avatarurl', { length: 512 }),
  email: varchar('email', { length: 256 }),
  trialused: boolean('trialused').notNull().default(false),
  created_at: timestamp('created_at').defaultNow().notNull(),
  lastseen: timestamp('lastseen').defaultNow().onUpdateNow().notNull(),
})

export type Customer = typeof customers.$inferSelect
export type NewCustomer = typeof customers.$inferInsert
```

- [ ] **Step 2: Create licenses schema**

```typescript
// server/database/schema/licenses.ts
import { mysqlTable, int, varchar, boolean, timestamp, mysqlEnum } from 'drizzle-orm/mysql-core'
import { customers } from './customers'

export const licenses = mysqlTable('licenses', {
  id: int('id').primaryKey().autoincrement(),
  customerid: int('customerid').notNull().references(() => customers.id),
  licensekey: varchar('licensekey', { length: 19 }).notNull().unique(), // CS2I-XXXX-XXXX-XXXX
  serveraddress: varchar('serveraddress', { length: 64 }),
  activatedat: timestamp('activatedat'),
  expiresat: timestamp('expiresat').notNull(),
  istrial: boolean('istrial').notNull().default(false),
  status: mysqlEnum('status', ['active', 'expired', 'revoked']).notNull().default('active'),
  lastheartbeat: timestamp('lastheartbeat'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
})

export type License = typeof licenses.$inferSelect
export type NewLicense = typeof licenses.$inferInsert
```

- [ ] **Step 3: Create purchases schema**

```typescript
// server/database/schema/purchases.ts
import { mysqlTable, int, varchar, timestamp, mysqlEnum } from 'drizzle-orm/mysql-core'
import { customers } from './customers'
import { licenses } from './licenses'

export const purchases = mysqlTable('purchases', {
  id: int('id').primaryKey().autoincrement(),
  customerid: int('customerid').notNull().references(() => customers.id),
  licenseid: int('licenseid').notNull().references(() => licenses.id),
  provider: mysqlEnum('provider', ['stripe', 'paypal']).notNull(),
  providertxid: varchar('providertxid', { length: 256 }).notNull().unique(),
  plan: mysqlEnum('plan', ['30d', '90d', '365d']).notNull(),
  amountcents: int('amountcents').notNull(),
  currency: varchar('currency', { length: 3 }).notNull().default('eur'),
  daysadded: int('daysadded').notNull(),
  discountpct: int('discountpct'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  status: mysqlEnum('status', ['completed', 'refunded']).notNull().default('completed'),
})

export type Purchase = typeof purchases.$inferSelect
export type NewPurchase = typeof purchases.$inferInsert
```

- [ ] **Step 4: Create schema index**

```typescript
// server/database/schema/index.ts
export * from './customers'
export * from './licenses'
export * from './purchases'
```

- [ ] **Step 5: Create database client**

```typescript
// server/database/client.ts
import { drizzle } from 'drizzle-orm/mysql2'
import mysql from 'mysql2/promise'
import * as schema from './schema'

const connectionLimit = Number(process.env.DATABASE_CONNECTION_LIMIT) || 5

const pool = mysql.createPool({
  host: process.env.DATABASE_HOST || 'localhost',
  port: Number(process.env.DATABASE_PORT) || 3306,
  user: process.env.DATABASE_USER || 'portal',
  password: process.env.DATABASE_PASSWORD || '',
  database: process.env.DATABASE_NAME || 'cs2inspect_portal',
  connectionLimit,
  maxIdle: Math.min(connectionLimit, 5),
  idleTimeout: 60_000,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
})

export const db = drizzle(pool, { schema, mode: 'default' })
export { pool }
export * from './schema'
```

- [ ] **Step 6: Create useDatabase utility**

```typescript
// server/utils/database.ts
import { db } from '~/server/database/client'

export function useDatabase() {
  return db
}
```

Reference: cs2inspect-web uses the same pattern — a `useDatabase()` helper that all API routes call.

- [ ] **Step 7: Create database plugin**

```typescript
// server/plugins/database.ts
import { pool } from '~/server/database/client'

export default defineNitroPlugin(async () => {
  try {
    const connection = await pool.getConnection()
    console.log('[database] Connected to MariaDB')
    connection.release()
  }
  catch (error) {
    console.error('[database] Failed to connect:', error)
  }
})
```

- [ ] **Step 8: Generate initial migration**

```bash
bun run drizzle-kit generate
```

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "feat: add database schema and Drizzle client"
```

---

## Task 3: Steam Authentication

**Files:**
- Create: `server/middleware/01.steam-auth.ts`
- Create: `server/middleware/02.auth.ts`
- Create: `server/api/auth/steam-validate.get.ts`
- Create: `server/api/auth/me.get.ts`
- Create: `server/api/auth/logout.post.ts`
- Create: `app/stores/authStore.ts`
- Create: `app/composables/useAuth.ts`
- Create: `app/middleware/auth.ts`

- [ ] **Step 1: Create Steam auth middleware**

Port from cs2inspect-web's `server/middleware/01.steam-auth.ts`. Key changes:
- Use `customers` table instead of `user_profiles`
- Same JWT pattern: sign `{ steamId, type: 'steam_auth' }` with `JWT_SECRET`
- Set `auth_token` HTTP-only cookie
- On new user: upsert customer record with Steam profile data

```typescript
// server/middleware/01.steam-auth.ts
import jwt from 'jsonwebtoken'
import { eq } from 'drizzle-orm'
import { customers } from '~/server/database/schema'

export default defineEventHandler(async (event) => {
  const url = getRequestURL(event)

  // Only handle Steam validate endpoint
  if (url.pathname !== '/api/auth/steam-validate') return

  const query = getQuery(event)
  const claimedId = query['openid.claimed_id'] as string
  if (!claimedId) throw createError({ statusCode: 400, statusMessage: 'Missing Steam ID' })

  // Verify with Steam OpenID
  const params = new URLSearchParams()
  params.set('openid.mode', 'check_authentication')
  for (const [key, value] of Object.entries(query)) {
    if (key.startsWith('openid.') && key !== 'openid.mode') {
      params.set(key, value as string)
    }
  }

  const verifyRes = await fetch('https://steamcommunity.com/openid/login', {
    method: 'POST',
    body: params,
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  })
  const verifyText = await verifyRes.text()
  if (!verifyText.includes('is_valid:true')) {
    throw createError({ statusCode: 401, statusMessage: 'Steam validation failed' })
  }

  // Extract Steam ID
  const steamId = claimedId.split('/').pop()!
  const config = useRuntimeConfig()

  // Fetch Steam profile
  const profileRes = await fetch(
    `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/?key=${config.steamApiKey}&steamids=${steamId}`
  )
  const profileData = await profileRes.json()
  const player = profileData.response.players[0]

  // Upsert customer
  const db = useDatabase()
  await db.insert(customers).values({
    steamid: steamId,
    personaname: player?.personaname || 'Unknown',
    avatarurl: player?.avatarfull || null,
  }).onDuplicateKeyUpdate({
    set: {
      personaname: player?.personaname || 'Unknown',
      avatarurl: player?.avatarfull || null,
      lastseen: new Date(),
    },
  })

  // Create JWT
  const token = jwt.sign({ steamId, type: 'steam_auth' }, config.jwtSecret, {
    expiresIn: config.jwtExpiry,
  })

  // Set cookie
  setCookie(event, 'auth_token', token, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
  })

  // Redirect to dashboard
  return sendRedirect(event, '/dashboard')
})
```

- [ ] **Step 2: Create JWT auth middleware**

```typescript
// server/middleware/02.auth.ts
import jwt from 'jsonwebtoken'

const PUBLIC_PATHS = [
  '/api/auth/steam-validate',
  '/api/licenses/validate',
  '/api/webhooks/',
  '/api/health',
]

export default defineEventHandler(async (event) => {
  const url = getRequestURL(event)
  if (!url.pathname.startsWith('/api/')) return
  if (PUBLIC_PATHS.some(p => url.pathname.startsWith(p))) return

  const token = getCookie(event, 'auth_token')
  if (!token) {
    throw createError({ statusCode: 401, statusMessage: 'Not authenticated' })
  }

  try {
    const config = useRuntimeConfig()
    const decoded = jwt.verify(token, config.jwtSecret) as { steamId: string; type: string }
    if (decoded.type !== 'steam_auth') {
      throw new Error('Invalid token type')
    }
    event.context.auth = decoded
  }
  catch {
    throw createError({ statusCode: 401, statusMessage: 'Invalid token' })
  }
})
```

- [ ] **Step 3: Create auth API routes**

```typescript
// server/api/auth/me.get.ts
import { eq } from 'drizzle-orm'
import { customers } from '~/server/database/schema'

export default defineEventHandler(async (event) => {
  const { steamId } = event.context.auth
  const db = useDatabase()
  const customer = await db.query.customers.findFirst({
    where: eq(customers.steamid, steamId),
  })
  if (!customer) throw createError({ statusCode: 404, statusMessage: 'Customer not found' })
  return customer
})
```

```typescript
// server/api/auth/logout.post.ts
export default defineEventHandler(async (event) => {
  deleteCookie(event, 'auth_token', { path: '/' })
  return { ok: true }
})
```

- [ ] **Step 4: Create client-side auth store**

```typescript
// app/stores/authStore.ts
import type { Customer } from '~/server/database/schema'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    customer: null as Customer | null,
    loading: true,
  }),
  getters: {
    isAuthenticated: (state) => !!state.customer,
  },
  actions: {
    async fetchUser() {
      try {
        this.customer = await $fetch('/api/auth/me')
      }
      catch {
        this.customer = null
      }
      finally {
        this.loading = false
      }
    },
    async logout() {
      await $fetch('/api/auth/logout', { method: 'POST' })
      this.customer = null
      navigateTo('/')
    },
  },
})
```

- [ ] **Step 5: Create client-side auth middleware**

```typescript
// app/middleware/auth.ts
export default defineNuxtRouteMiddleware(async () => {
  const auth = useAuthStore()
  if (auth.loading) await auth.fetchUser()
  if (!auth.isAuthenticated) return navigateTo('/')
})
```

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: add Steam OpenID auth with JWT sessions"
```

---

## Task 4: License Key Generation & Core API

**Files:**
- Create: `server/utils/license-keys.ts`
- Create: `server/api/licenses/index.get.ts`
- Create: `server/api/licenses/trial.post.ts`
- Create: `server/api/licenses/[id].rebind.post.ts`
- Create: `server/api/licenses/validate.post.ts`
- Create: `server/utils/rate-limit.ts`

- [ ] **Step 1: Create license key generator**

```typescript
// server/utils/license-keys.ts
import crypto from 'node:crypto'

const CHARSET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'

function randomBlock(length: number): string {
  const bytes = crypto.randomBytes(length)
  return Array.from(bytes)
    .map(b => CHARSET[b % CHARSET.length])
    .join('')
}

export function generateLicenseKey(): string {
  return `CS2I-${randomBlock(4)}-${randomBlock(4)}-${randomBlock(4)}`
}
```

- [ ] **Step 2: Create rate limiter**

```typescript
// server/utils/rate-limit.ts
const store = new Map<string, { count: number; resetAt: number }>()

export function checkRateLimit(ip: string, maxRequests = 10, windowMs = 60_000): boolean {
  const now = Date.now()
  const entry = store.get(ip)

  if (!entry || now > entry.resetAt) {
    store.set(ip, { count: 1, resetAt: now + windowMs })
    return true
  }

  if (entry.count >= maxRequests) return false
  entry.count++
  return true
}
```

- [ ] **Step 3: Create list licenses endpoint**

```typescript
// server/api/licenses/index.get.ts
import { eq } from 'drizzle-orm'
import { licenses, customers } from '~/server/database/schema'

export default defineEventHandler(async (event) => {
  const { steamId } = event.context.auth
  const db = useDatabase()

  const customer = await db.query.customers.findFirst({
    where: eq(customers.steamid, steamId),
  })
  if (!customer) throw createError({ statusCode: 404, statusMessage: 'Customer not found' })

  return db.query.licenses.findMany({
    where: eq(licenses.customerid, customer.id),
    orderBy: (licenses, { desc }) => [desc(licenses.created_at)],
  })
})
```

- [ ] **Step 4: Create trial endpoint**

```typescript
// server/api/licenses/trial.post.ts
import { eq } from 'drizzle-orm'
import { customers, licenses } from '~/server/database/schema'
import { generateLicenseKey } from '~/server/utils/license-keys'

export default defineEventHandler(async (event) => {
  const { steamId } = event.context.auth
  const db = useDatabase()

  const customer = await db.query.customers.findFirst({
    where: eq(customers.steamid, steamId),
  })
  if (!customer) throw createError({ statusCode: 404, statusMessage: 'Customer not found' })
  if (customer.trialused) {
    throw createError({ statusCode: 409, statusMessage: 'Trial already used' })
  }

  const licenseKey = generateLicenseKey()
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + 3)

  const [result] = await db.insert(licenses).values({
    customerid: customer.id,
    licensekey: licenseKey,
    expiresat: expiresAt,
    istrial: true,
    status: 'active',
  })

  await db.update(customers)
    .set({ trialused: true })
    .where(eq(customers.id, customer.id))

  return {
    id: result.insertId,
    licenseKey,
    expiresAt: expiresAt.toISOString(),
  }
})
```

- [ ] **Step 5: Create rebind endpoint**

```typescript
// server/api/licenses/[id].rebind.post.ts
import { eq, and } from 'drizzle-orm'
import { licenses, customers } from '~/server/database/schema'

export default defineEventHandler(async (event) => {
  const licenseId = Number(getRouterParam(event, 'id'))
  const { steamId } = event.context.auth
  const db = useDatabase()

  const customer = await db.query.customers.findFirst({
    where: eq(customers.steamid, steamId),
  })
  if (!customer) throw createError({ statusCode: 404 })

  const license = await db.query.licenses.findFirst({
    where: and(eq(licenses.id, licenseId), eq(licenses.customerid, customer.id)),
  })
  if (!license) throw createError({ statusCode: 404 })

  // Check 7-day cooldown based on activation time (not updated_at, which changes on heartbeats)
  if (license.activatedat && license.serveraddress) {
    const cooldownEnd = new Date(license.activatedat)
    cooldownEnd.setDate(cooldownEnd.getDate() + 7)
    if (new Date() < cooldownEnd) {
      throw createError({
        statusCode: 429,
        statusMessage: `Server rebind available after ${cooldownEnd.toISOString()}`,
      })
    }
  }

  await db.update(licenses)
    .set({ serveraddress: null, activatedat: null })
    .where(eq(licenses.id, licenseId))

  return { ok: true, message: 'Server address cleared. Will rebind on next plugin heartbeat.' }
})
```

- [ ] **Step 6: Create validation endpoint (public, rate-limited)**

```typescript
// server/api/licenses/validate.post.ts
import { eq } from 'drizzle-orm'
import { licenses } from '~/server/database/schema'
import { checkRateLimit } from '~/server/utils/rate-limit'

export default defineEventHandler(async (event) => {
  // Rate limit
  const clientIp = getRequestIP(event, { xForwardedFor: true }) || 'unknown'
  if (!checkRateLimit(clientIp)) {
    throw createError({ statusCode: 429, statusMessage: 'Rate limit exceeded' })
  }

  const body = await readBody(event)
  const { key, server_address } = body || {}
  if (!key || !server_address) {
    throw createError({ statusCode: 400, statusMessage: 'Missing key or server_address' })
  }

  const db = useDatabase()
  const license = await db.query.licenses.findFirst({
    where: eq(licenses.licensekey, key),
  })

  if (!license) {
    return { valid: false, reason: 'not_found' }
  }

  if (license.status === 'revoked') {
    return { valid: false, reason: 'revoked' }
  }

  // Check expiry
  if (new Date() > license.expiresat) {
    if (license.status !== 'expired') {
      await db.update(licenses).set({ status: 'expired' }).where(eq(licenses.id, license.id))
    }
    return { valid: false, reason: 'expired' }
  }

  // Bind server address on first activation
  if (!license.serveraddress) {
    await db.update(licenses)
      .set({ serveraddress: server_address, activatedat: new Date(), lastheartbeat: new Date() })
      .where(eq(licenses.id, license.id))
  }
  else if (license.serveraddress !== server_address) {
    return { valid: false, reason: 'address_mismatch' }
  }
  else {
    await db.update(licenses)
      .set({ lastheartbeat: new Date() })
      .where(eq(licenses.id, license.id))
  }

  const daysRemaining = Math.ceil((license.expiresat.getTime() - Date.now()) / (1000 * 60 * 60 * 24))

  return {
    valid: true,
    expires_at: license.expiresat.toISOString(),
    days_remaining: daysRemaining,
    server_address: server_address,
  }
})
```

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: add license management and validation API"
```

---

## Task 5: Stripe Integration

**Files:**
- Create: `server/utils/stripe.ts`
- Create: `server/api/purchases/create.post.ts`
- Create: `server/api/webhooks/stripe.post.ts`

- [ ] **Step 1: Create Stripe client utility**

```typescript
// server/utils/stripe.ts
import Stripe from 'stripe'

let stripeClient: Stripe | null = null

export function useStripe(): Stripe {
  if (!stripeClient) {
    const config = useRuntimeConfig()
    stripeClient = new Stripe(config.stripeSecretKey)
  }
  return stripeClient
}

// Pricing in cents (EUR)
export const PLANS = {
  '30d': { days: 30, price: 300, label: '30 Days' },
  '90d': { days: 90, price: 800, label: '90 Days' },
  '365d': { days: 365, price: 3000, label: '365 Days' },
} as const

export const MULTI_SERVER_DISCOUNT_PCT = 15

export type PlanId = keyof typeof PLANS
```

- [ ] **Step 2: Create purchase checkout endpoint**

```typescript
// server/api/purchases/create.post.ts
import { eq, and } from 'drizzle-orm'
import { customers, licenses } from '~/server/database/schema'
import { useStripe, PLANS, MULTI_SERVER_DISCOUNT_PCT, type PlanId } from '~/server/utils/stripe'

export default defineEventHandler(async (event) => {
  const { steamId } = event.context.auth
  const body = await readBody(event)
  const { licenseId, plan, provider } = body as { licenseId: number; plan: PlanId; provider: 'stripe' | 'paypal' }

  if (!PLANS[plan]) throw createError({ statusCode: 400, statusMessage: 'Invalid plan' })
  if (!['stripe', 'paypal'].includes(provider)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid provider' })
  }

  const db = useDatabase()
  const customer = await db.query.customers.findFirst({
    where: eq(customers.steamid, steamId),
  })
  if (!customer) throw createError({ statusCode: 404 })

  const license = await db.query.licenses.findFirst({
    where: and(eq(licenses.id, licenseId), eq(licenses.customerid, customer.id)),
  })
  if (!license) throw createError({ statusCode: 404 })

  // Check if multi-server discount applies (2nd+ license)
  const allLicenses = await db.query.licenses.findMany({
    where: eq(licenses.customerid, customer.id),
  })
  const isAdditionalLicense = allLicenses.length > 1 ||
    (allLicenses.length === 1 && allLicenses[0].id !== licenseId)

  let priceCents = PLANS[plan].price
  let discountPct = 0
  if (isAdditionalLicense) {
    discountPct = MULTI_SERVER_DISCOUNT_PCT
    priceCents = Math.round(priceCents * (1 - discountPct / 100))
  }

  const config = useRuntimeConfig()

  if (provider === 'stripe') {
    const stripe = useStripe()
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'eur',
          product_data: {
            name: `CS2Inspect Plugin — ${PLANS[plan].label}`,
            description: discountPct > 0
              ? `${discountPct}% multi-server discount applied`
              : undefined,
          },
          unit_amount: priceCents,
        },
        quantity: 1,
      }],
      metadata: {
        customerId: String(customer.id),
        licenseId: String(licenseId),
        plan,
        daysAdded: String(PLANS[plan].days),
        discountPct: String(discountPct),
      },
      success_url: `${config.portalBaseUrl}/dashboard?payment=success`,
      cancel_url: `${config.portalBaseUrl}/buy?payment=cancelled`,
    })

    return { url: session.url, provider: 'stripe' }
  }

  // PayPal handled in Task 6
  throw createError({ statusCode: 501, statusMessage: 'PayPal not yet implemented' })
})
```

- [ ] **Step 3: Create Stripe webhook handler**

```typescript
// server/api/webhooks/stripe.post.ts
import { eq } from 'drizzle-orm'
import { licenses, purchases } from '~/server/database/schema'
import { useStripe } from '~/server/utils/stripe'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const stripe = useStripe()
  const body = await readRawBody(event)
  const sig = getHeader(event, 'stripe-signature')

  if (!body || !sig) {
    throw createError({ statusCode: 400, statusMessage: 'Missing body or signature' })
  }

  let stripeEvent
  try {
    stripeEvent = stripe.webhooks.constructEvent(body, sig, config.stripeWebhookSecret)
  }
  catch {
    throw createError({ statusCode: 400, statusMessage: 'Invalid webhook signature' })
  }

  if (stripeEvent.type !== 'checkout.session.completed') {
    return { received: true }
  }

  const session = stripeEvent.data.object
  const { customerId, licenseId, plan, daysAdded, discountPct } = session.metadata!

  const db = useDatabase()

  // Idempotency: check if we already processed this transaction
  const existing = await db.query.purchases.findFirst({
    where: eq(purchases.providertxid, session.id),
  })
  if (existing) return { received: true, duplicate: true }

  // Get current license
  const license = await db.query.licenses.findFirst({
    where: eq(licenses.id, Number(licenseId)),
  })
  if (!license) {
    console.error(`[stripe-webhook] License ${licenseId} not found`)
    return { received: true, error: 'license_not_found' }
  }

  // Calculate new expiry: max(now, current_expires_at) + days_added
  const now = new Date()
  const baseDate = license.expiresat > now ? license.expiresat : now
  const newExpiry = new Date(baseDate)
  newExpiry.setDate(newExpiry.getDate() + Number(daysAdded))

  // Create purchase record
  await db.insert(purchases).values({
    customerid: Number(customerId),
    licenseid: Number(licenseId),
    provider: 'stripe',
    providertxid: session.id,
    plan: plan as '30d' | '90d' | '365d',
    amountcents: session.amount_total!,
    currency: 'eur',
    daysadded: Number(daysAdded),
    discountpct: Number(discountPct) || null,
    status: 'completed',
  })

  // Update license expiry + clear trial flag if applicable
  await db.update(licenses)
    .set({
      expiresat: newExpiry,
      status: 'active',
      istrial: false,
    })
    .where(eq(licenses.id, Number(licenseId)))

  return { received: true }
})
```

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: add Stripe checkout and webhook integration"
```

---

## Task 6: PayPal Integration

**Files:**
- Create: `server/utils/paypal.ts`
- Create: `server/api/webhooks/paypal.post.ts`
- Modify: `server/api/purchases/create.post.ts` (add PayPal branch)

- [ ] **Step 1: Create PayPal client utility**

```typescript
// server/utils/paypal.ts
const PAYPAL_BASE = process.env.PAYPAL_SANDBOX === 'true'
  ? 'https://api-m.sandbox.paypal.com'
  : 'https://api-m.paypal.com'

let accessToken: string | null = null
let tokenExpiry = 0

async function getAccessToken(): Promise<string> {
  if (accessToken && Date.now() < tokenExpiry) return accessToken

  const config = useRuntimeConfig()
  const auth = Buffer.from(`${config.paypalClientId}:${config.paypalClientSecret}`).toString('base64')

  const res = await fetch(`${PAYPAL_BASE}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  })
  const data = await res.json()
  accessToken = data.access_token
  tokenExpiry = Date.now() + (data.expires_in - 60) * 1000
  return accessToken!
}

export async function createPayPalOrder(amountEur: string, description: string, metadata: Record<string, string>): Promise<{ id: string; approveUrl: string }> {
  const token = await getAccessToken()
  const config = useRuntimeConfig()

  const res = await fetch('${PAYPAL_BASE}/v2/checkout/orders', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      intent: 'CAPTURE',
      purchase_units: [{
        amount: { currency_code: 'EUR', value: amountEur },
        description,
        custom_id: JSON.stringify(metadata),
      }],
      application_context: {
        return_url: `${config.portalBaseUrl}/dashboard?payment=success`,
        cancel_url: `${config.portalBaseUrl}/buy?payment=cancelled`,
      },
    }),
  })

  const order = await res.json()
  const approveUrl = order.links.find((l: { rel: string }) => l.rel === 'approve')?.href
  return { id: order.id, approveUrl }
}

export async function verifyPayPalWebhook(headers: Record<string, string>, body: string, webhookId: string): Promise<boolean> {
  const token = await getAccessToken()

  const res = await fetch('${PAYPAL_BASE}/v1/notifications/verify-webhook-signature', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      auth_algo: headers['paypal-auth-algo'],
      cert_url: headers['paypal-cert-url'],
      transmission_id: headers['paypal-transmission-id'],
      transmission_sig: headers['paypal-transmission-sig'],
      transmission_time: headers['paypal-transmission-time'],
      webhook_id: webhookId,
      webhook_event: JSON.parse(body),
    }),
  })

  const result = await res.json()
  return result.verification_status === 'SUCCESS'
}
```

- [ ] **Step 2: Add PayPal branch to create purchase endpoint**

In `server/api/purchases/create.post.ts`, replace the PayPal 501 error with:

```typescript
// PayPal branch (in the else block after Stripe)
if (provider === 'paypal') {
  const amountEur = (priceCents / 100).toFixed(2)
  const description = `CS2Inspect Plugin — ${PLANS[plan].label}${discountPct > 0 ? ` (${discountPct}% discount)` : ''}`
  const metadata = {
    customerId: String(customer.id),
    licenseId: String(licenseId),
    plan,
    daysAdded: String(PLANS[plan].days),
    discountPct: String(discountPct),
    amountCents: String(priceCents),
  }

  const { approveUrl } = await createPayPalOrder(amountEur, description, metadata)
  return { url: approveUrl, provider: 'paypal' }
}
```

- [ ] **Step 3: Create PayPal webhook handler**

```typescript
// server/api/webhooks/paypal.post.ts
import { eq } from 'drizzle-orm'
import { licenses, purchases } from '~/server/database/schema'
import { verifyPayPalWebhook } from '~/server/utils/paypal'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const rawBody = await readRawBody(event)
  if (!rawBody) throw createError({ statusCode: 400 })

  const headers: Record<string, string> = {}
  for (const key of ['paypal-auth-algo', 'paypal-cert-url', 'paypal-transmission-id', 'paypal-transmission-sig', 'paypal-transmission-time']) {
    headers[key] = getHeader(event, key) || ''
  }

  const verified = await verifyPayPalWebhook(headers, rawBody, config.paypalWebhookId)
  if (!verified) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid webhook signature' })
  }

  const webhookEvent = JSON.parse(rawBody)
  if (webhookEvent.event_type !== 'PAYMENT.CAPTURE.COMPLETED') {
    return { received: true }
  }

  const capture = webhookEvent.resource
  const customId = capture.custom_id
  if (!customId) return { received: true }

  const metadata = JSON.parse(customId)
  const { customerId, licenseId, plan, daysAdded, discountPct, amountCents } = metadata

  const db = useDatabase()

  // Idempotency check
  const existing = await db.query.purchases.findFirst({
    where: eq(purchases.providertxid, capture.id),
  })
  if (existing) return { received: true, duplicate: true }

  const license = await db.query.licenses.findFirst({
    where: eq(licenses.id, Number(licenseId)),
  })
  if (!license) {
    console.error(`[paypal-webhook] License ${licenseId} not found`)
    return { received: true, error: 'license_not_found' }
  }

  // Calculate new expiry
  const now = new Date()
  const baseDate = license.expiresat > now ? license.expiresat : now
  const newExpiry = new Date(baseDate)
  newExpiry.setDate(newExpiry.getDate() + Number(daysAdded))

  await db.insert(purchases).values({
    customerid: Number(customerId),
    licenseid: Number(licenseId),
    provider: 'paypal',
    providertxid: capture.id,
    plan: plan as '30d' | '90d' | '365d',
    amountcents: Number(amountCents),
    currency: 'eur',
    daysadded: Number(daysAdded),
    discountpct: Number(discountPct) || null,
    status: 'completed',
  })

  await db.update(licenses)
    .set({ expiresat: newExpiry, status: 'active', istrial: false })
    .where(eq(licenses.id, Number(licenseId)))

  return { received: true }
})
```

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: add PayPal checkout and webhook integration"
```

---

## Task 7: Purchase History & Settings API

**Files:**
- Create: `server/api/purchases/index.get.ts`
- Create: `server/api/settings/email.put.ts`
- Create: `server/api/health.get.ts`

- [ ] **Step 1: Create purchase history endpoint**

```typescript
// server/api/purchases/index.get.ts
import { eq } from 'drizzle-orm'
import { purchases, customers } from '~/server/database/schema'

export default defineEventHandler(async (event) => {
  const { steamId } = event.context.auth
  const db = useDatabase()

  const customer = await db.query.customers.findFirst({
    where: eq(customers.steamid, steamId),
  })
  if (!customer) throw createError({ statusCode: 404 })

  return db.query.purchases.findMany({
    where: eq(purchases.customerid, customer.id),
    orderBy: (purchases, { desc }) => [desc(purchases.created_at)],
  })
})
```

- [ ] **Step 2: Create email update endpoint**

```typescript
// server/api/settings/email.put.ts
import { eq } from 'drizzle-orm'
import { customers } from '~/server/database/schema'
import { z } from 'zod'

const emailSchema = z.object({
  email: z.string().email().max(256),
})

export default defineEventHandler(async (event) => {
  const { steamId } = event.context.auth
  const body = await readBody(event)
  const { email } = emailSchema.parse(body)

  const db = useDatabase()
  await db.update(customers)
    .set({ email })
    .where(eq(customers.steamid, steamId))

  return { ok: true }
})
```

- [ ] **Step 3: Create health check**

```typescript
// server/api/health.get.ts
import { pool } from '~/server/database/client'

export default defineEventHandler(async () => {
  try {
    const conn = await pool.getConnection()
    conn.release()
    return { status: 'ok', db: 'connected' }
  }
  catch {
    throw createError({ statusCode: 503, statusMessage: 'Database unavailable' })
  }
})
```

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: add purchase history, settings, and health check API"
```

---

## Task 8: Landing Page

**Files:**
- Create: `app/pages/index.vue`
- Create: `app/components/landing/HeroSection.vue`
- Create: `app/components/landing/FeaturesSection.vue`
- Create: `app/components/landing/PricingSection.vue`
- Create: `app/components/landing/HowItWorks.vue`
- Create: `app/components/landing/FaqSection.vue`
- Create: `app/components/AppNavbar.vue`

- [ ] **Step 1: Create AppNavbar component**

Shared navbar with public and auth states. Shows logo + nav links. When authenticated, shows Steam avatar + name + logout. When not authenticated, shows "Login with Steam" button.

The Steam login link should point to: `https://steamcommunity.com/openid/login?openid.mode=checkid_setup&openid.ns=http://specs.openid.net/auth/2.0&openid.claimed_id=http://specs.openid.net/auth/2.0/identifier_select&openid.identity=http://specs.openid.net/auth/2.0/identifier_select&openid.return_to=${portalBaseUrl}/api/auth/steam-validate`

- [ ] **Step 2: Create HeroSection**

Dark-themed hero with headline like "Weapon Skins for Your CS2 Server", subtitle about plugin features, "Start Free Trial" CTA button, and a secondary "View Pricing" link.

- [ ] **Step 3: Create FeaturesSection**

Grid of feature cards: weapon skins, knives, gloves, stickers, StatTrak, real-time customization. Use Lucide icons or simple SVGs.

- [ ] **Step 4: Create PricingSection**

3 plan cards matching the wireframe: 30d/€3, 90d/€8 (Popular badge), 365d/€30. Show savings percentages. Note multi-server 15% discount.

- [ ] **Step 5: Create HowItWorks**

3-step visual: 1) Sign up with Steam, 2) Get your license key, 3) Activate on your server.

- [ ] **Step 6: Create FaqSection**

Accordion/collapsible FAQ items: What happens when license expires? Can I change servers? Is the web app included? How does the trial work?

- [ ] **Step 7: Create index.vue page**

Compose all landing sections. Redirect to `/dashboard` if already authenticated.

```vue
<script setup>
const auth = useAuthStore()
if (auth.isAuthenticated) navigateTo('/dashboard')
</script>

<template>
  <div>
    <AppNavbar />
    <HeroSection />
    <FeaturesSection />
    <PricingSection />
    <HowItWorks />
    <FaqSection />
  </div>
</template>
```

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: add landing page with hero, features, pricing, FAQ"
```

---

## Task 9: Dashboard Page

**Files:**
- Create: `app/pages/dashboard.vue`
- Create: `app/components/dashboard/LicenseCard.vue`
- Create: `app/components/dashboard/AddLicenseCard.vue`
- Create: `app/components/dashboard/TrialBanner.vue`

- [ ] **Step 1: Create TrialBanner component**

Shows when `customer.trialused === false`. Contains "Your 3-day trial is ready" message with a "Start Trial" button and link to setup guide. Calls `POST /api/licenses/trial` on click.

- [ ] **Step 2: Create LicenseCard component**

Props: `license` object. Displays:
- License key (monospace, with copy button)
- Status badge (active/expired/revoked)
- Server address (or "Not yet activated")
- Expiry date + days remaining
- "Change Server" button (disabled with tooltip if within 7-day cooldown)
- "Buy More Time" link → `/buy?license=${id}`

- [ ] **Step 3: Create AddLicenseCard component**

Dashed-border card with "+" icon, "Add Server License" text, "15% multi-server discount" note. On click, calls `POST /api/licenses/trial` or navigates to `/buy` for a new license purchase.

Note: For v1, creating a new paid license (non-trial) requires first buying time. The flow: customer clicks "Add Server" → create checkout for new license → webhook creates both the license and purchase. This means `server/api/purchases/create.post.ts` needs to handle `licenseId: 'new'` as a special case that creates a new license in the webhook handler.

- [ ] **Step 4: Create dashboard.vue page**

```vue
<script setup>
definePageMeta({ middleware: 'auth' })

const { data: licenses, refresh } = useFetch('/api/licenses')
const auth = useAuthStore()
</script>

<template>
  <div>
    <AppNavbar />
    <div class="max-w-4xl mx-auto p-6">
      <h1 class="text-2xl font-bold mb-6">Dashboard</h1>
      <TrialBanner
        v-if="auth.customer && !auth.customer.trialused"
        @started="refresh()"
      />
      <div class="grid gap-4 md:grid-cols-2">
        <LicenseCard
          v-for="license in licenses"
          :key="license.id"
          :license="license"
          @rebind="refresh()"
        />
        <AddLicenseCard />
      </div>
    </div>
  </div>
</template>
```

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: add customer dashboard with license cards and trial"
```

---

## Task 10: Buy Time Page

**Files:**
- Create: `app/pages/buy.vue`
- Create: `app/components/buy/PlanCard.vue`

- [ ] **Step 1: Create PlanCard component**

Props: `plan` (30d/90d/365d), `price`, `label`, `savings`, `popular` (boolean). Emits `select` on click. Highlighted border when `popular` is true.

- [ ] **Step 2: Create buy.vue page**

- Reads `?license=<id>` from query params to pre-select which license to extend
- If no license param, shows dropdown to select one
- Shows 3 PlanCard components
- Shows multi-server discount note if applicable
- Payment method buttons: Stripe / PayPal
- On select: calls `POST /api/purchases/create` with `{ licenseId, plan, provider }` → redirects to checkout URL

```vue
<script setup>
definePageMeta({ middleware: 'auth' })

const route = useRoute()
const { data: licenses } = await useFetch('/api/licenses')

const selectedLicenseId = ref(Number(route.query.license) || null)
const selectedPlan = ref<'30d' | '90d' | '365d' | null>(null)

async function checkout(provider: 'stripe' | 'paypal') {
  if (!selectedLicenseId.value || !selectedPlan.value) return
  const { url } = await $fetch('/api/purchases/create', {
    method: 'POST',
    body: {
      licenseId: selectedLicenseId.value,
      plan: selectedPlan.value,
      provider,
    },
  })
  if (url) window.location.href = url
}
</script>
```

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat: add buy time page with plan selection and checkout"
```

---

## Task 11: Setup Guide & Settings Pages

**Files:**
- Create: `app/pages/setup.vue`
- Create: `app/pages/settings.vue`

- [ ] **Step 1: Create setup.vue**

Static content page with 4 numbered steps (matching the spec wireframe):
1. Download the CS2Inspect Plugin — link to GitHub releases
2. Add Your License Key — code snippet showing where to paste the key
3. Restart Your Server — brief instruction
4. Done — confirmation message

Include a note about the license key (link to dashboard to copy it).

- [ ] **Step 2: Create settings.vue**

```vue
<script setup>
definePageMeta({ middleware: 'auth' })

const auth = useAuthStore()
const email = ref(auth.customer?.email || '')
const { data: purchaseHistory } = await useFetch('/api/purchases')

async function updateEmail() {
  await $fetch('/api/settings/email', {
    method: 'PUT',
    body: { email: email.value },
  })
  // Update local state
  if (auth.customer) auth.customer.email = email.value
}
</script>
```

Displays:
- Steam account card (avatar, name, Steam ID — read-only)
- Email input + save button
- Purchase history table (date, plan, license, amount, provider)

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat: add setup guide and settings pages"
```

---

## Task 12: Deployment Configuration

**Files:**
- Create: `Dockerfile`
- Create: `docker-compose.yml`

- [ ] **Step 1: Create Dockerfile**

Follow cs2inspect-web pattern (multi-stage build):

```dockerfile
# Build stage
FROM node:20-alpine AS build
RUN npm install -g bun
WORKDIR /app
COPY package.json bun.lock* ./
RUN bun install --frozen-lockfile --ignore-scripts
COPY . .
RUN bun run nuxt prepare && JWT_SECRET=build-placeholder bun run build

# Runtime stage
FROM oven/bun:1-alpine AS runtime
WORKDIR /app
COPY --from=build /app/.output .output
COPY --from=build /app/node_modules node_modules
COPY --from=build /app/server/database/drizzle server/database/drizzle
COPY --from=build /app/drizzle.config.ts drizzle.config.ts
COPY --from=build /app/server/database/schema server/database/schema

ENV NODE_ENV=production
ENV PORT=3220
ENV HOST=0.0.0.0

EXPOSE 3220

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -fsS http://localhost:3220/api/health || exit 1

CMD ["bun", "run", ".output/server/index.mjs"]
```

- [ ] **Step 2: Create docker-compose.yml**

```yaml
services:
  database:
    image: mariadb:11
    restart: unless-stopped
    environment:
      MYSQL_ROOT_PASSWORD: ${DB_ROOT_PASSWORD}
      MYSQL_DATABASE: ${DATABASE_NAME:-cs2inspect_portal}
      MYSQL_USER: ${DATABASE_USER:-portal}
      MYSQL_PASSWORD: ${DATABASE_PASSWORD}
    volumes:
      - db_data:/var/lib/mysql
    command: >
      --character-set-server=utf8mb4
      --collation-server=utf8mb4_unicode_ci
      --max-connections=100
    healthcheck:
      test: ["CMD", "healthcheck.sh", "--connect", "--innodb_initialized"]
      interval: 10s
      timeout: 5s
      retries: 5

  portal:
    build: .
    restart: unless-stopped
    depends_on:
      database:
        condition: service_healthy
    environment:
      DATABASE_HOST: database
      DATABASE_PORT: 3306
      DATABASE_USER: ${DATABASE_USER:-portal}
      DATABASE_PASSWORD: ${DATABASE_PASSWORD}
      DATABASE_NAME: ${DATABASE_NAME:-cs2inspect_portal}
      JWT_SECRET: ${JWT_SECRET}
      STEAM_API_KEY: ${STEAM_API_KEY}
      STRIPE_SECRET_KEY: ${STRIPE_SECRET_KEY}
      STRIPE_WEBHOOK_SECRET: ${STRIPE_WEBHOOK_SECRET}
      PAYPAL_CLIENT_ID: ${PAYPAL_CLIENT_ID}
      PAYPAL_CLIENT_SECRET: ${PAYPAL_CLIENT_SECRET}
      PAYPAL_WEBHOOK_ID: ${PAYPAL_WEBHOOK_ID}
      PORTAL_BASE_URL: ${PORTAL_BASE_URL}
    ports:
      - "${PORT:-3220}:3220"
    healthcheck:
      test: ["CMD", "curl", "-fsS", "http://localhost:3220/api/health"]
      interval: 30s
      timeout: 5s
      retries: 3

volumes:
  db_data:
```

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "chore: add Dockerfile and docker-compose for Coolify deployment"
```

---

## Task 13: Final Integration & Smoke Test

- [ ] **Step 1: Set up local .env from .env.example**

Copy `.env.example` to `.env` and fill in local development values. Use Stripe test keys.

- [ ] **Step 2: Start local database**

```bash
docker compose up -d database
```

- [ ] **Step 3: Push database schema**

```bash
bun run drizzle-kit push
```

- [ ] **Step 4: Start dev server and verify**

```bash
bun run dev
```

Verify each flow manually:
1. Landing page loads at `http://localhost:3220`
2. Steam login redirects and creates customer
3. Dashboard shows with trial banner
4. Starting trial creates license with 3-day expiry
5. License key is displayed and copyable
6. Validation API responds correctly: `curl -X POST http://localhost:3220/api/licenses/validate -H 'Content-Type: application/json' -d '{"key":"CS2I-XXXX","server_address":"1.2.3.4:27015"}'`
7. Stripe checkout flow (test mode) completes and extends license
8. Settings page shows and saves email
9. Purchase history displays

- [ ] **Step 5: Final commit**

```bash
git add -A
git commit -m "chore: final integration and config cleanup"
```

---

## Out of Scope (Separate Plans)

- **CS2 Plugin C# modifications** — license validation module in the C# plugin. Separate plan needed since it's a different repo/language.
- **PayPal sandbox testing** — requires PayPal developer account setup.
- **Production Coolify setup** — configuring the actual Coolify stack with domain, SSL, environment variables.
