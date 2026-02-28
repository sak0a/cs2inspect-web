# Admin API <Badge type="warning" text="Admin Only" />

All admin endpoints require authentication via JWT and admin authorization. The `03.admin-auth.ts` middleware checks the `admin_users` table and returns:

- `401 Unauthorized` if the user has no valid JWT
- `403 Forbidden` if the user is not in the `admin_users` table

All responses use the standard `ApiResponse<T>` wrapper with `success`, `data`, `error`, and `meta` fields.

---

## Statistics

### GET `/api/admin/stats/overview`

Dashboard overview statistics.

**Response:** `ApiResponse<AdminOverviewStats>`

```json
{
    "success": true,
    "data": {
        "totalUsers": 1250,
        "activeUsers7d": 340,
        "activeUsers30d": 780,
        "totalLoadouts": 3200,
        "totalItems": {
            "weapons": 15000,
            "knives": 2400,
            "gloves": 1800,
            "agents": 900,
            "musicKits": 600,
            "pins": 450
        },
        "bannedUsers": 12
    }
}
```

---

### GET `/api/admin/stats/activity`

Activity data for time-series charts.

**Query Parameters:**

| Param   | Type                     | Default | Description |
| ------- | ------------------------ | ------- | ----------- |
| `range` | `'7d' \| '30d' \| '90d'` | `'7d'`  | Time range  |

**Response:** `ApiResponse<AdminActivityData[]>`

```json
{
    "success": true,
    "data": [
        {
            "date": "2026-02-12",
            "newUsers": 5,
            "activeUsers": 42,
            "loadoutsCreated": 18,
            "itemsSaved": 120
        }
    ]
}
```

---

### GET `/api/admin/stats/users`

Top users for leaderboard display.

**Query Parameters:**

| Param   | Type     | Default | Description                 |
| ------- | -------- | ------- | --------------------------- |
| `limit` | `number` | `10`    | Max users to return (1-100) |

**Response:** `ApiResponse<AdminTopUser[]>`

```json
{
    "success": true,
    "data": [
        {
            "steamId": "76561198012345678",
            "loadoutCount": 12,
            "totalItems": 156
        }
    ]
}
```

---

### GET `/api/admin/stats/items`

Item distribution statistics by category.

**Response:** `ApiResponse<Record<string, number>>`

---

## User Management

### GET `/api/admin/users`

List users with search and pagination.

**Query Parameters:**

| Param        | Type      | Default | Description            |
| ------------ | --------- | ------- | ---------------------- |
| `search`     | `string`  | —       | Filter by Steam ID     |
| `page`       | `number`  | `1`     | Page number            |
| `limit`      | `number`  | `20`    | Items per page (1-100) |
| `bannedOnly` | `boolean` | `false` | Show only banned users |

**Response:** `ApiResponse<AdminUserSummary[]>` with pagination meta.

```json
{
    "success": true,
    "data": [
        {
            "steamId": "76561198012345678",
            "loadoutCount": 3,
            "totalItems": 45,
            "lastActivity": "2026-02-18T14:30:00.000Z",
            "isBanned": false
        }
    ],
    "meta": { "page": 1, "totalPages": 5, "rows": 100 }
}
```

---

### GET `/api/admin/users/[steamId]`

Detailed user information including loadout and item counts.

**Response:** `ApiResponse<AdminUserDetails>`

```json
{
    "success": true,
    "data": {
        "steamId": "76561198012345678",
        "loadoutCount": 3,
        "itemCounts": {
            "weapons": 24,
            "knives": 4,
            "gloves": 2,
            "agents": 2,
            "musicKits": 1,
            "pins": 3
        },
        "firstActivity": "2025-06-15T10:00:00.000Z",
        "lastActivity": "2026-02-18T14:30:00.000Z",
        "isBanned": false
    }
}
```

---

### POST `/api/admin/users/[steamId].ban`

Ban a user. Logs `ban_user` in the activity log.

**Request Body:**

```json
{
    "reason": "Violation of terms of service",
    "duration": 72
}
```

| Field      | Type     | Required | Description                                |
| ---------- | -------- | -------- | ------------------------------------------ |
| `reason`   | `string` | Yes      | Ban reason (1-500 chars)                   |
| `duration` | `number` | No       | Duration in hours. Omit for permanent ban. |

**Response:** `ApiResponse<{ success: true }>`

---

### POST `/api/admin/users/[steamId].unban`

Unban a user. Logs `unban_user` in the activity log.

**Response:** `ApiResponse<{ success: true }>`

---

### DELETE `/api/admin/users/[steamId]`

Delete all user data (loadouts, items, history). Logs `delete_user_data` in the activity log.

**Response:** `ApiResponse<{ success: true }>`

---

## Settings <Badge type="tip" text="Superadmin" />

### GET `/api/admin/settings`

Get all application settings.

**Response:** `ApiResponse<AdminSetting[]>`

```json
{
    "success": true,
    "data": [
        {
            "key": "max_loadouts_per_user",
            "value": "10",
            "type": "number",
            "description": "Maximum loadouts per user",
            "updatedAt": "2026-02-18T12:00:00.000Z",
            "updatedBy": "76561198012345678"
        }
    ]
}
```

---

### PUT `/api/admin/settings`

Update a setting value. Logs `update_setting` in the activity log.

**Request Body:**

```json
{
    "key": "max_loadouts_per_user",
    "value": 20
}
```

| Field   | Type                          | Required | Description              |
| ------- | ----------------------------- | -------- | ------------------------ |
| `key`   | `string`                      | Yes      | Setting key (1-64 chars) |
| `value` | `string \| number \| boolean` | Yes      | New value                |

**Response:** `ApiResponse<{ success: true }>`

---

## Admin Management <Badge type="tip" text="Superadmin" />

### GET `/api/admin/admins`

List all admin users.

**Response:** `ApiResponse<AdminInfo[]>`

```json
{
    "success": true,
    "data": [
        {
            "id": 1,
            "steamId": "76561198012345678",
            "role": "superadmin",
            "permissions": [],
            "createdBy": null,
            "createdAt": "2026-01-01T00:00:00.000Z"
        }
    ]
}
```

---

### POST `/api/admin/admins`

Add a new admin user. Logs `add_admin` in the activity log.

**Request Body:**

```json
{
    "steamId": "76561198087654321",
    "role": "admin"
}
```

| Field     | Type                      | Required | Description               |
| --------- | ------------------------- | -------- | ------------------------- |
| `steamId` | `string`                  | Yes      | Steam ID of the new admin |
| `role`    | `'admin' \| 'superadmin'` | Yes      | Admin role                |

**Response:** `ApiResponse<{ success: true }>`

---

### DELETE `/api/admin/admins/[steamId]`

Remove admin privileges. Logs `remove_admin` in the activity log.

**Response:** `ApiResponse<{ success: true }>`

---

## Activity Log

### GET `/api/admin/activity-log`

Paginated admin action audit log.

**Query Parameters:**

| Param    | Type     | Default | Description            |
| -------- | -------- | ------- | ---------------------- |
| `page`   | `number` | `1`     | Page number            |
| `limit`  | `number` | `50`    | Items per page (1-100) |
| `action` | `string` | —       | Filter by action type  |

**Response:** `ApiResponse<AdminActivityLogEntry[]>` with pagination meta.

```json
{
    "success": true,
    "data": [
        {
            "id": 42,
            "adminSteamId": "76561198012345678",
            "action": "ban_user",
            "targetSteamId": "76561198087654321",
            "details": { "reason": "Violation of TOS", "duration": 72 },
            "createdAt": "2026-02-18T15:30:00.000Z"
        }
    ],
    "meta": { "page": 1, "totalPages": 3, "rows": 142 }
}
```

---

## Type Reference

All admin types are defined in `types/api/admin.ts`. Key interfaces:

- `AdminOverviewStats` — Dashboard metrics
- `AdminUserDetails` / `AdminUserSummary` — User information
- `AdminActivityData` / `AdminHeatmapData` / `AdminTopUser` — Analytics data
- `AdminSetting` — Application setting
- `AdminInfo` — Admin user info
- `AdminActivityLogEntry` — Audit log entry
- `AdminBanUserRequest` / `AdminUpdateSettingRequest` / `AdminAddAdminRequest` — Request bodies
- `AdminUserSearchParams` / `AdminActivityParams` — Query parameters

See the [TypeScript Types Reference](../reference-types.md) for full type definitions.
