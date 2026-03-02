# Loadout Management

## Overview

Loadouts allow users to save and manage multiple weapon configurations. Each user can have multiple loadouts and switch between them.

::: warning Authentication Required
All loadout endpoints require a valid JWT token.
:::

## Get Loadouts

### `GET /api/loadouts`

Retrieve all loadouts for the authenticated user.

**Query Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `steamId` | string | Yes | User's Steam ID |

**Response**:

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "steamid": "76561198012345678",
      "name": "Competitive Setup",
      "active": 1,
      "is_default": 0,
      "selected_knife_t": 507,
      "selected_knife_ct": 507,
      "selected_glove_t": 5027,
      "selected_glove_ct": 5028,
      "selected_agent_ct": 5400,
      "selected_agent_t": 5600,
      "selected_music": 3,
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-15T10:30:00Z"
    }
  ],
  "count": 1
}
```

---

## Get Equipped Loadout

### `GET /api/loadouts/equipped`

Retrieve the currently equipped loadout for a user. This is primarily designed for the CS2 server plugin to determine which loadout to apply when a player joins.

**Query Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `steamId` | string | Yes | User's Steam ID |

**Loadout Selection Logic**:

1. Checks for a loadout with `is_default = 1`
2. If none, checks for a loadout with `active = 1`
3. If none, falls back to the first available loadout

**Response**:

```json
{
  "success": true,
  "message": "Equipped loadout retrieved successfully",
  "data": {
    "loadout": {
      "id": 1,
      "steamid": "76561198012345678",
      "name": "Competitive Setup",
      "active": 0,
      "is_default": 1,
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-15T10:30:00Z"
    }
  }
}
```

---

## Create Loadout

### `POST /api/loadouts`

Create a new loadout for the authenticated user.

**Query Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `steamId` | string | Yes | User's Steam ID |

**Request Body**:

```json
{
  "name": "New Loadout"
}
```

**Response**:

```json
{
  "success": true,
  "data": {
    "id": 2,
    "steamid": "76561198012345678",
    "name": "New Loadout",
    "created_at": "2024-01-20T12:00:00Z"
  }
}
```

---

## Update Loadout

### `PUT /api/loadouts`

Update an existing loadout.

**Query Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `steamId` | string | Yes | User's Steam ID |

**Request Body**:

```json
{
  "id": 1,
  "name": "Updated Loadout Name"
}
```

**Response**:

```json
{
  "success": true,
  "message": "Loadout updated successfully"
}
```

---

## Delete Loadout

### `DELETE /api/loadouts`

Delete a loadout.

::: warning
Cannot delete if it's the only loadout.
:::

**Query Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `steamId` | string | Yes | User's Steam ID |
| `id` | number | Yes | Loadout ID to delete |

**Response**:

```json
{
  "success": true,
  "message": "Loadout deleted successfully"
}
```

---

## Select Loadout

### `POST /api/loadouts/select`

Switch the active loadout.

**Query Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `steamId` | string | Yes | User's Steam ID |

**Request Body**:

```json
{
  "loadoutId": 2
}
```

**Response**:

```json
{
  "success": true,
  "message": "Loadout selected successfully"
}
```

---

## Set Default Loadout

### `POST /api/loadouts/default`

Set a loadout as the default for the CS2 plugin.

**Request Body**:

```json
{
  "loadoutId": 1
}
```

**Response**:

```json
{
  "success": true,
  "message": "Default loadout set successfully"
}
```

---

## Duplicate Loadout

### `POST /api/loadouts/duplicate`

Create a copy of an existing loadout.

**Request Body**:

```json
{
  "loadoutId": 1,
  "name": "Copy of Competitive Setup"
}
```

**Response**:

```json
{
  "success": true,
  "data": {
    "id": 3,
    "name": "Copy of Competitive Setup"
  }
}
```

---

## Import Loadout

### `POST /api/loadouts/import`

Import a loadout from a shared configuration.

**Request Body**:

```json
{
  "shareCode": "ABC123XYZ"
}
```

**Response**:

```json
{
  "success": true,
  "data": {
    "id": 4,
    "name": "Imported Loadout"
  }
}
```

---

## Share Loadout

### `POST /api/loadouts/share`

Generate a share code for a loadout.

**Request Body**:

```json
{
  "loadoutId": 1
}
```

**Response**:

```json
{
  "success": true,
  "data": {
    "shareCode": "ABC123XYZ",
    "expiresAt": "2024-02-01T00:00:00Z"
  }
}
```

---

## Clear Loadout

### `POST /api/loadouts/clear`

Clear all items from a loadout.

**Request Body**:

```json
{
  "loadoutId": 1
}
```

**Response**:

```json
{
  "success": true,
  "message": "Loadout cleared successfully"
}
```

---

## Loadout Limits

| Limit                 | Value         |
| --------------------- | ------------- |
| Max loadouts per user | 10            |
| Max name length       | 50 characters |
| Share code expiry     | 7 days        |
