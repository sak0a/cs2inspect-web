# Admin Panel <Badge type="warning" text="Admin Only" />

## Overview

The admin panel provides dashboards and controls for moderation, settings, plugin config management, and audit logging. It is accessible at `/admin` and requires an entry in `admin_users`.

### Roles

| Role         | Capabilities                                                                            |
| ------------ | --------------------------------------------------------------------------------------- |
| `admin`      | View stats, manage users (ban/unban/delete), view activity logs, view plugin settings   |
| `superadmin` | All admin capabilities + manage admins + edit app settings + edit/reset plugin settings |

---

## Authentication & Middleware

Admin access is enforced by ordered middleware:

1. `01.steam-auth.ts` - Steam OpenID flow
2. `02.auth.ts` - JWT validation (`event.context.auth`)
3. `03.admin-auth.ts` - `/api/admin/*` authorization (`event.context.admin`)
4. `04.maintenance.ts` - Blocks non-admin traffic during maintenance mode (admins bypass)

Error responses:

- `401 Unauthorized`: Missing/invalid auth
- `403 Forbidden`: Authenticated, but not admin/superadmin for the action

---

## Database Tables

Defined in `server/database/schema/`.

### `admin_users`

Designated administrators.

### `banned_users`

Active and historical user bans.

### `app_settings`

Application-wide settings and feature flags.

### `plugin_settings`

Plugin configuration overrides editable from `/admin/plugin`.

- Categories: `general`, `features`, `permissions`, `commands`, `sync`, `logging`
- Types: `string`, `boolean`, `number`, `json`
- Reload behavior: `immediate` or `restart`

### `admin_activity_log`

Audit trail for admin actions.

Logged actions include:

- `ban_user`, `unban_user`, `delete_user_data`
- `update_setting`
- `update_plugin_setting`, `reset_plugin_settings`
- `add_admin`, `remove_admin`

---

## Pages

### Dashboard (`/admin`)

Overview stats and charts.

### User Management (`/admin/users`)

Searchable, paginated user management with ban/unban actions.

### User Detail (`/admin/users/[steamId]`)

Per-user moderation and loadout overview.

### App Settings (`/admin/settings`) <Badge type="tip" text="Superadmin" />

Manage app settings and feature flags (e.g. maintenance mode, share codes, tutorial toggles, loadout limits).

### Plugin Settings (`/admin/plugin`) <Badge type="tip" text="Superadmin" />

Manage plugin config values stored in `plugin_settings`.

- Category tabs (general/features/permissions/commands/sync/logging)
- Type-aware editor (`string`, `number`, `boolean`, `json`)
- Live/restart badge from `reload_behavior`
- Reset all settings to seeded defaults

### Activity Log (`/admin/activity`)

Audit log with action filters and pagination.

### Admin Management (`/admin/admins`) <Badge type="tip" text="Superadmin" />

Add/remove admin users and manage roles.

---

## Public Settings Endpoint

`GET /api/public/settings` exposes a safe subset of app settings for client-side feature awareness.

Examples include:

- `MAINTENANCE_MODE`
- `FEATURE_INSPECT_URLS`, `FEATURE_STICKERS`, `FEATURE_KEYCHAINS`, `FEATURE_TUTORIALS`, `FEATURE_SHARE_CODES`
- `MAX_LOADOUTS_PER_USER`, `MAX_LOADOUT_NAME_LENGTH`

---

## Initial Superadmin Setup

Insert first admin manually:

```sql
INSERT INTO admin_users (steamid, role, created_by)
VALUES ('76561198012345678', 'superadmin', '76561198012345678');
```

---

## Related Documentation

- [Admin API](./api/admin.md)
- [Environment Variables](./reference-env.md)
- [Backend Architecture](./architecture-backend.md)
