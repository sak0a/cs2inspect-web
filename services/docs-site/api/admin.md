# Admin API <Badge type="warning" text="Admin Only" />

All `/api/admin/*` routes require JWT auth and admin authorization middleware.

- `401 Unauthorized`: no valid auth
- `403 Forbidden`: authenticated user without required admin role

Responses use the standard API wrapper:

```json
{ "success": true, "data": {}, "meta": {} }
```

---

## Statistics

- `GET /api/admin/stats/overview`
- `GET /api/admin/stats/activity?range=7d|30d|90d`
- `GET /api/admin/stats/users?limit=10`
- `GET /api/admin/stats/items`

---

## User Management

- `GET /api/admin/users?search=&page=1&limit=20&bannedOnly=false`
- `GET /api/admin/users/[steamId]`
- `POST /api/admin/users/[steamId].ban`
- `POST /api/admin/users/[steamId].unban`
- `DELETE /api/admin/users/[steamId]`

---

## App Settings <Badge type="tip" text="Superadmin" />

- `GET /api/admin/settings`
- `PUT /api/admin/settings`

`PUT` body:

```json
{
    "key": "MAX_LOADOUTS_PER_USER",
    "value": 20
}
```

Updates are audited with `action = "update_setting"`.

---

## Plugin Settings <Badge type="tip" text="Superadmin" />

- `GET /api/admin/plugin-settings`
- `PUT /api/admin/plugin-settings`
- `POST /api/admin/plugin-settings/reset`

`PUT` body:

```json
{
    "key": "Additional.KnifeEnabled",
    "value": true
}
```

Notes:

- Values are persisted to `plugin_settings`
- Updates are audited with `action = "update_plugin_setting"`
- Reset is audited with `action = "reset_plugin_settings"`
- Config changes trigger plugin sync notification (`notifyPluginOfWebChange(..., 'config')`)

---

## Admin Management <Badge type="tip" text="Superadmin" />

- `GET /api/admin/admins`
- `POST /api/admin/admins`
- `DELETE /api/admin/admins/[steamId]`

---

## Activity & Health

- `GET /api/admin/activity-log?page=1&limit=50&action=`
- `GET /api/admin/health/details`
- `POST /api/admin/health/fetch-test`

---

## Public Settings (Unauthenticated)

For frontend feature awareness, see:

- `GET /api/public/settings`

This endpoint is intentionally outside `/api/admin` and only returns curated safe keys.

---

## Type References

Main type definitions:

- `app/types/api/admin.ts`
- `server/database/schema/admin.ts`
- `server/database/schema/pluginSettings.ts`
