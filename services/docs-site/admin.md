# Admin Panel <Badge type="warning" text="Admin Only" />

## Overview

The admin panel provides site administrators with a dashboard for managing users, viewing analytics, configuring application settings, and auditing admin actions. It is accessible at `/admin` and requires an entry in the `admin_users` database table.

### Roles

| Role | Capabilities |
|------|-------------|
| `admin` | View dashboard stats, manage users (ban/unban), view activity log |
| `superadmin` | All admin capabilities + manage other admins, edit app settings |

---

## Authentication Flow

Admin access is enforced by three numbered server middlewares that run in order:

1. **`01.steam-auth.ts`** — Handles Steam OpenID authentication
2. **`02.auth.ts`** — Validates JWT tokens, sets `event.context.auth` with the user's `steamId`
3. **`03.admin-auth.ts`** — Intercepts `/api/admin/*` routes, checks the `admin_users` table for the authenticated Steam ID, and sets `event.context.admin`

The admin context interface:

```typescript
interface AdminContext {
    steamId: string;
    role: 'admin' | 'superadmin';
    permissions: string[];
}
```

**Error responses:**
- `401 Unauthorized` — User is not authenticated (no JWT or missing Steam ID)
- `403 Forbidden` — User is authenticated but not in the `admin_users` table

---

## Database Tables

Defined in `server/database/schema/admin.ts` using Drizzle ORM.

### `admin_users`

Stores designated administrators.

| Column | Type | Description |
|--------|------|-------------|
| `id` | INT PK | Auto-increment |
| `steamid` | VARCHAR(64) | Steam ID (unique) |
| `role` | VARCHAR(20) | `'admin'` or `'superadmin'` |
| `permissions` | JSON | Array of permission strings |
| `created_by` | VARCHAR(64) | Steam ID of the admin who added this entry |
| `created_at` | TIMESTAMP | Creation time |
| `updated_at` | TIMESTAMP | Last update (auto-updates) |

### `banned_users`

Tracks user bans. Users with active bans are prevented from accessing the application.

| Column | Type | Description |
|--------|------|-------------|
| `id` | INT PK | Auto-increment |
| `steamid` | VARCHAR(64) | Banned user's Steam ID (unique) |
| `reason` | TEXT | Ban reason |
| `banned_by` | VARCHAR(64) | Admin who issued the ban |
| `banned_at` | TIMESTAMP | Ban time |
| `expires_at` | TIMESTAMP | Expiration (null = permanent) |
| `active` | TINYINT | 1 = active, 0 = lifted |

### `app_settings`

Application configuration key-value store.

| Column | Type | Description |
|--------|------|-------------|
| `id` | INT PK | Auto-increment |
| `key` | VARCHAR(64) | Setting key (unique) |
| `value` | TEXT | Setting value |
| `type` | VARCHAR(20) | `'string'`, `'boolean'`, `'number'`, or `'json'` |
| `description` | TEXT | Human-readable description |
| `updated_by` | VARCHAR(64) | Last editor's Steam ID |
| `updated_at` | TIMESTAMP | Last update (auto-updates) |

### `admin_activity_log`

Audit trail for admin actions.

| Column | Type | Description |
|--------|------|-------------|
| `id` | INT PK | Auto-increment |
| `admin_steamid` | VARCHAR(64) | Admin who performed the action |
| `action` | VARCHAR(64) | Action type (see below) |
| `target_steamid` | VARCHAR(64) | Affected user (if applicable) |
| `details` | JSON | Additional action details |
| `created_at` | TIMESTAMP | Action time |

**Logged actions:** `ban_user`, `unban_user`, `delete_user_data`, `update_setting`, `add_admin`, `remove_admin`

---

## Pages

### Dashboard (`/admin`)

Overview page with:
- Stats cards (total users, active users, loadouts, items, banned users)
- Activity line chart with time range selection (7d / 30d / 90d)
- Top users leaderboard
- Item distribution pie chart

### User Management (`/admin/users`)

Paginated user table with:
- Search by Steam ID
- Ban/unban quick actions
- Filter for banned users only
- Click through to user detail page

### User Detail (`/admin/users/[steamId]`)

Individual user view with:
- User info card (Steam ID, activity dates, ban status)
- Ban/unban/delete actions
- Loadout table showing all user loadouts with item counts

### Settings (`/admin/settings`) <Badge type="tip" text="Superadmin" />

Application settings editor:
- Type-aware inline editing (string, boolean, number, JSON)
- Last updated timestamp and editor info

### Activity Log (`/admin/activity`)

Admin action audit log:
- Paginated list of all admin actions
- Filter by action type
- Shows admin, action, target, timestamp

### Admin Management (`/admin/admins`) <Badge type="tip" text="Superadmin" />

Manage admin users:
- List current admins with roles
- Add new admins (requires Steam ID and role selection)
- Remove admin privileges

---

## Components

All admin components are in `components/admin/`.

### Layout & Display

| Component | Purpose |
|-----------|---------|
| `AdminLayout.vue` | Main layout with responsive sidebar navigation. Shows admin management link for superadmins only. |
| `AdminStatsCard.vue` | Dashboard stat card with icon, value, and optional trend indicator (up/down). |
| `AdminUserCard.vue` | Detailed user info card with ban/unban/delete action buttons and date formatting. |

### Tables

| Component | Purpose |
|-----------|---------|
| `AdminUserTable.vue` | Paginated user list with search, ban/unban actions. Debounced search (300ms). |
| `AdminLoadoutTable.vue` | User's loadouts with rename, delete, share, clear, and import actions. |

### Charts

| Component | Purpose |
|-----------|---------|
| `AdminActivityChart.vue` | Line chart (Chart.js) showing activity over time with selectable time ranges. |
| `AdminHeatmapChart.vue` | GitHub-style calendar heatmap for daily activity patterns. |
| `AdminLeaderboardChart.vue` | Bar chart showing top users by activity/loadouts. |
| `AdminPieChart.vue` | Doughnut chart showing item distribution by category with custom legend. |

### Modals

| Component | Purpose |
|-----------|---------|
| `AdminAddModal.vue` | Add new admin user. Validates Steam ID format (17-digit). Role selection (admin/superadmin). |
| `AdminBanModal.vue` | Ban a user. Requires reason (min 5 chars), optional duration in hours. |
| `AdminDeleteModal.vue` | Delete user data. Safety confirmation: requires typing the exact Steam ID. |

### Settings

| Component | Purpose |
|-----------|---------|
| `AdminSettingItem.vue` | Inline setting editor. Type-aware: toggle for boolean, number input for number, textarea for JSON. |

---

## Composables

### `useAdminAuth`

**Location:** `composables/useAdminAuth.ts`

Admin authentication and authorization with role-based access control.

```typescript
const {
  isAdmin,        // ComputedRef<boolean>
  isSuperAdmin,   // ComputedRef<boolean>
  adminRole,      // ComputedRef<'admin' | 'superadmin' | null>
  isChecking,     // ComputedRef<boolean>
  checkAdminStatus,   // () => Promise<void>
  requireAdmin,       // () => throws if not admin
  requireSuperAdmin,  // () => throws if not superadmin
  hasPermission,      // (permission: string) => boolean
} = useAdminAuth()
```

Route guards for navigation:
- `adminNavigationGuard()` — Redirects non-admins
- `superAdminNavigationGuard()` — Redirects non-superadmins

### `useAdminStats`

**Location:** `composables/useAdminStats.ts`

Statistics fetching with caching and auto-refresh.

```typescript
const {
  overviewStats,    // ComputedRef<AdminOverviewStats | null>
  activityData,     // ComputedRef<AdminActivityData | null>
  topUsers,         // ComputedRef<AdminTopUser[]>
  timeRange,        // Ref<'7d' | '30d' | '90d'>
  isLoading,        // ComputedRef<boolean>
  error,            // ComputedRef<string | null>
  fetchStats,       // (forceRefresh?) => Promise<void>
  fetchActivity,    // (range?, force?) => Promise<void>
  fetchTopUsers,    // (limit?) => Promise<void>
  refreshAll,       // (force?) => Promise<void>
  setTimeRange,     // (range) => Promise<void>
} = useAdminStats({
  fetchOnMount: true,          // default: true
  autoRefreshInterval: 0,      // ms, 0 = disabled
  defaultTimeRange: '30d',     // '7d' | '30d' | '90d'
})
```

Utility exports: `formatNumber()`, `calculatePercentChange()`, `formatPercent()`, `getTimeRangeLabel()`, `getDaysFromRange()`

---

## Store

The admin store (`stores/adminStore.ts`) provides centralized state management for all admin data. See the [Pinia Stores Reference](./reference-stores.md#adminstore) for full documentation.

---

## Validation Schemas

All admin API requests are validated with Zod schemas defined in `server/utils/validation/adminSchemas.ts`:

| Schema | Purpose |
|--------|---------|
| `adminBanUserSchema` | Ban request: `reason` (1-500 chars, required), `duration` (optional positive int, hours) |
| `adminUserSearchSchema` | User search: `search` (string), `page` (default 1), `limit` (1-100, default 20), `bannedOnly` (bool) |
| `adminUpdateSettingSchema` | Setting update: `key` (1-64 chars), `value` (string, number, or boolean) |
| `adminAddAdminSchema` | Add admin: `steamId` (1-64 chars), `role` ('admin' or 'superadmin') |
| `adminActivityLogQuerySchema` | Activity log query: `page` (default 1), `limit` (1-100, default 50), `action` (optional string) |
| `adminActivityRangeSchema` | Activity range: `range` ('7d', '30d', '90d', default '7d') |
| `adminTopUsersSchema` | Top users: `limit` (1-100, default 10) |

---

## Initial Setup

To add the first admin user, insert a record directly into the database:

```sql
INSERT INTO admin_users (steamid, role, created_by)
VALUES ('76561198012345678', 'superadmin', '76561198012345678');
```

Replace the Steam ID with your own 17-digit Steam ID. After this, you can manage additional admins through the admin panel UI.

---

## Related Documentation

- [Admin API Reference](./api/admin.md) — API endpoint documentation
- [Pinia Stores Reference](./reference-stores.md#adminstore) — Admin store details
- [TypeScript Types Reference](./reference-types.md) — Admin type definitions
