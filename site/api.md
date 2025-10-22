# API Reference <Badge type="info" text="REST API" />

## Overview

The CS2Inspect API provides RESTful endpoints for managing user loadouts, weapon customizations, and CS2 item data. All endpoints return JSON responses and require authentication unless otherwise noted.

::: tip API Version
This documentation covers API version 1.0
:::

## Base URL

```
Development: http://localhost:3000/api
Production:  https://your-domain.com/api
```

## Authentication <Badge type="warning" text="Required" />

### JWT Token Authentication

Most endpoints require authentication via JWT token passed in cookies or Authorization header.

**Cookie-based** (recommended): <Badge type="tip" text="Preferred" />
```http
Cookie: jwt=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Header-based**:
```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Obtaining a Token

**Endpoint**: `POST /api/auth/validate` <Badge type="tip" text="Public" />

**Request**:
```json
{
  "steamId": "76561198012345678",
  "openIdData": {
    "identity": "https://steamcommunity.com/openid/id/76561198012345678",
    "claimed_id": "https://steamcommunity.com/openid/id/76561198012345678"
  }
}
```

**Response**:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "steamId": "76561198012345678",
    "username": "PlayerName",
    "avatar": "https://avatars.steamstatic.com/..."
  }
}
```

**Token Expiry**: 7 days (configurable via `JWT_EXPIRY` env var)

---

## Health Check Endpoints

### Liveness Probe

Check if the application process is running.

**Endpoint**: `GET /api/health/live`

**Authentication**: Not required

**Response**:
```json
{
  "status": "ok",
  "timestamp": "2024-10-21T00:00:00.000Z"
}
```

**Status Codes**:
- `200 OK` - Application is alive

**Usage**: Container orchestrators use this to determine if the container should be restarted.

---

### Readiness Probe

Check if the application is ready to serve traffic.

**Endpoint**: `GET /api/health/ready`

**Authentication**: Not required

**Response (Healthy)**:
```json
{
  "status": "ok",
  "timestamp": "2024-10-21T00:00:00.000Z",
  "ready": true,
  "checks": [
    {
      "name": "database",
      "status": "ok",
      "latency_ms": 15
    },
    {
      "name": "environment",
      "status": "ok",
      "latency_ms": 2
    }
  ]
}
```

**Response (Unhealthy)**:
```json
{
  "status": "fail",
  "timestamp": "2024-10-21T00:00:00.000Z",
  "ready": false,
  "checks": [
    {
      "name": "database",
      "status": "fail",
      "latency_ms": 5000,
      "error": "Connection timeout"
    }
  ]
}
```

**Status Codes**:
- `200 OK` - All critical dependencies are healthy
- `503 Service Unavailable` - One or more critical dependencies are unhealthy

**Critical Checks**: Database connectivity, Environment configuration

---

### Detailed Health Information

Get comprehensive health information for all system components.

**Endpoint**: `GET /api/health/details`

**Authentication**: Not required

**Response**:
```json
{
  "status": "ok",
  "timestamp": "2024-10-21T00:00:00.000Z",
  "checks": [
    {
      "name": "database",
      "status": "ok",
      "latency_ms": 15,
      "message": "Database connection healthy",
      "metadata": {
        "pool_active_connections": 2,
        "pool_total_connections": 5,
        "pool_idle_connections": 3
      }
    },
    {
      "name": "environment",
      "status": "ok",
      "latency_ms": 2,
      "message": "All required environment variables present",
      "metadata": {
        "variables_checked": 10,
        "variables_present": 10
      }
    },
    {
      "name": "steam_api",
      "status": "ok",
      "latency_ms": 250,
      "message": "Steam API accessible"
    },
    {
      "name": "disk_space",
      "status": "ok",
      "latency_ms": 5,
      "metadata": {
        "total_gb": 100,
        "used_gb": 45,
        "available_gb": 55,
        "usage_percent": 45
      }
    },
    {
      "name": "memory",
      "status": "ok",
      "latency_ms": 1,
      "metadata": {
        "total_mb": 4096,
        "used_mb": 1024,
        "free_mb": 3072,
        "usage_percent": 25
      }
    }
  ]
}
```

**Status Codes**:
- `200 OK` - Returns health information for all components

---

### Health History

Get historical health check data with trends.

**Endpoint**: `GET /api/health/history`

**Authentication**: Not required

**Query Parameters**:
- `hours` (optional): Number of hours of history (default: 24, max: 168)
- `component` (optional): Filter by specific component name

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "timestamp": "2024-10-21T00:00:00.000Z",
      "component": "database",
      "status": "ok",
      "latency_ms": 15,
      "metadata": {
        "pool_active_connections": 2
      }
    },
    {
      "timestamp": "2024-10-21T00:01:00.000Z",
      "component": "database",
      "status": "ok",
      "latency_ms": 18,
      "metadata": {
        "pool_active_connections": 3
      }
    }
  ],
  "summary": {
    "total_checks": 1440,
    "uptime_percentage": 99.9,
    "average_latency_ms": 16,
    "max_latency_ms": 45
  }
}
```

**Status Codes**:
- `200 OK` - Returns historical data

**Usage**: Status dashboard uses this to display health trends and uptime statistics.

---

## Data Endpoints

### Get Weapon Skins

Retrieve all available weapon skins.

**Endpoint**: `GET /api/data/skins`

**Authentication**: Not required

**Query Parameters**:
- `weapon` (optional): Filter by weapon defindex
- `search` (optional): Search skin names

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "defindex": 7,
      "paintindex": 253,
      "name": "AK-47 | Fire Serpent",
      "weapon": "AK-47",
      "pattern": "Fire Serpent",
      "rarity": "Covert",
      "collection": "The Bravo Collection",
      "minFloat": 0.06,
      "maxFloat": 0.76,
      "image": "https://...",
      "statTrakAvailable": true
    }
  ],
  "count": 1
}
```

---

### Get Agents

Retrieve all available agents.

**Endpoint**: `GET /api/data/agents`

**Authentication**: Not required

**Query Parameters**:
- `team` (optional): Filter by team (`t` or `ct`)

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "defindex": 4711,
      "name": "The Elite Mr. Muhlik | Elite Crew",
      "team": "t",
      "faction": "Elite Crew",
      "image": "https://...",
      "rarity": "Master"
    }
  ],
  "count": 1
}
```

---

### Get Stickers

Retrieve all available stickers.

**Endpoint**: `GET /api/data/stickers`

**Authentication**: Not required

**Query Parameters**:
- `search` (optional): Search sticker names
- `tournament` (optional): Filter by tournament
- `team` (optional): Filter by team

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "defindex": 1230,
      "name": "iBUYPOWER (Holo) | Katowice 2014",
      "tournament": "Katowice 2014",
      "team": "iBUYPOWER",
      "type": "team_holo",
      "image": "https://...",
      "rarity": "Exotic"
    }
  ],
  "count": 1
}
```

---

### Get Keychains

Retrieve all available keychains.

**Endpoint**: `GET /api/data/keychains`

**Authentication**: Not required

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "defindex": 6001,
      "name": "Chicken",
      "image": "https://...",
      "hasSeed": true
    }
  ],
  "count": 1
}
```

---

### Get Music Kits

Retrieve all available music kits.

**Endpoint**: `GET /api/data/musickits`

**Authentication**: Not required

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "defindex": 3,
      "name": "AWOLNATION, I Am",
      "artist": "AWOLNATION",
      "track": "I Am",
      "image": "https://...",
      "statTrakAvailable": true
    }
  ],
  "count": 1
}
```

---

### Get Collectibles (Pins)

Retrieve all available pins and collectibles.

**Endpoint**: `GET /api/data/collectibles`

**Authentication**: Not required

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "defindex": 6001,
      "name": "Skillful Pin",
      "series": "Series 1",
      "image": "https://...",
      "rarity": "Classified"
    }
  ],
  "count": 1
}
```

---

## Loadout Management

### Get Loadouts

Retrieve all loadouts for the authenticated user.

**Endpoint**: `GET /api/loadouts`

**Authentication**: Required

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "steamid": "76561198012345678",
      "name": "Competitive Setup",
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

### Create Loadout

Create a new loadout for the authenticated user.

**Endpoint**: `POST /api/loadouts`

**Authentication**: Required

**Request**:
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

### Select Loadout

Switch the active loadout.

**Endpoint**: `POST /api/loadouts/select`

**Authentication**: Required

**Request**:
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

### Delete Loadout

Delete a loadout (cannot delete if it's the only loadout).

**Endpoint**: `DELETE /api/loadouts/:id`

**Authentication**: Required

**Response**:
```json
{
  "success": true,
  "message": "Loadout deleted successfully"
}
```

---

## Weapon Management

### Get Weapons by Type

Retrieve weapons of a specific type for the authenticated user's active loadout.

**Endpoint**: `GET /api/weapons/:type`

**Authentication**: Required

**Parameters**:
- `:type` - Weapon type: `pistol`, `smg`, `rifle`, `heavy`, `knife`, `glove`

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "steamid": "76561198012345678",
      "loadoutid": 1,
      "team": 2,
      "weapon_defindex": 7,
      "weapon_name": "AK-47",
      "active": 1,
      "paintindex": 253,
      "paintseed": 661,
      "paintwear": 0.15,
      "stattrak_enabled": 1,
      "stattrak_count": 1337,
      "nametag": "The Beast",
      "stickers": [
        {
          "slot": 0,
          "stickerId": 1230,
          "wear": 0.0,
          "rotation": 0,
          "scale": 1.0
        }
      ],
      "keychain": {
        "keychainId": 6001,
        "seed": 42
      }
    }
  ],
  "count": 1
}
```

---

### Save Weapon

Save or update a weapon customization.

**Endpoint**: `POST /api/weapons/save`

**Authentication**: Required

**Request**:
```json
{
  "loadoutId": 1,
  "team": 2,
  "weaponDefindex": 7,
  "paintindex": 253,
  "paintseed": 661,
  "paintwear": 0.15,
  "statTrak": true,
  "statTrakCount": 1337,
  "nameTag": "The Beast",
  "stickers": [
    {
      "slot": 0,
      "stickerId": 1230,
      "wear": 0.0
    }
  ],
  "keychain": {
    "keychainId": 6001,
    "seed": 42
  }
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "message": "Weapon saved successfully"
  }
}
```

---

## Knife Management

### Get Knives

Retrieve knives for the authenticated user's active loadout.

**Endpoint**: `GET /api/knifes`

**Authentication**: Required

**Query Parameters**:
- `team` (optional): Filter by team (2 for T, 3 for CT)

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "steamid": "76561198012345678",
      "loadoutid": 1,
      "team": 2,
      "weapon_defindex": 507,
      "weapon_name": "Karambit",
      "active": 1,
      "paintindex": 418,
      "paintseed": 412,
      "paintwear": 0.01,
      "stattrak_enabled": 1,
      "stattrak_count": 500,
      "nametag": "Ruby Slayer"
    }
  ],
  "count": 1
}
```

---

### Save Knife

Save or update a knife customization.

**Endpoint**: `POST /api/knifes/save`

**Authentication**: Required

**Request**:
```json
{
  "loadoutId": 1,
  "team": 2,
  "weaponDefindex": 507,
  "paintindex": 418,
  "paintseed": 412,
  "paintwear": 0.01,
  "statTrak": true,
  "statTrakCount": 500,
  "nameTag": "Ruby Slayer"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "message": "Knife saved successfully"
  }
}
```

---

## Glove Management

### Get Gloves

Retrieve gloves for the authenticated user's active loadout.

**Endpoint**: `GET /api/gloves`

**Authentication**: Required

**Query Parameters**:
- `team` (optional): Filter by team (2 for T, 3 for CT)

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "steamid": "76561198012345678",
      "loadoutid": 1,
      "team": 2,
      "weapon_defindex": 5027,
      "weapon_name": "Hand Wraps",
      "active": 1,
      "paintindex": 10006,
      "paintseed": 0,
      "paintwear": 0.25
    }
  ],
  "count": 1
}
```

---

### Save Gloves

Save or update glove customization.

**Endpoint**: `POST /api/gloves/save`

**Authentication**: Required

**Request**:
```json
{
  "loadoutId": 1,
  "team": 2,
  "weaponDefindex": 5027,
  "paintindex": 10006,
  "paintseed": 0,
  "paintwear": 0.25
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "message": "Gloves saved successfully"
  }
}
```

---

## CS2 Inspect System

### Analyze Inspect Link

Process a CS2 inspect link and extract item data.

**Endpoint**: `POST /api/inspect`

**Authentication**: Optional (required for unmasked URLs)

**Request**:
```json
{
  "url": "steam://rungame/730/76561202255233023/+csgo_econ_action_preview%20S76561198012345678A123456789D123456789"
}
```

**Response for Masked URL**:
```json
{
  "success": true,
  "data": {
    "urlType": "masked",
    "item": {
      "defindex": 7,
      "paintindex": 253,
      "paintseed": 661,
      "paintwear": 0.15,
      "rarity": 6,
      "quality": 4,
      "statTrak": {
        "enabled": true,
        "count": 1337
      },
      "nameTag": "The Beast",
      "stickers": [
        {
          "slot": 0,
          "stickerId": 1230,
          "wear": 0.0
        }
      ]
    },
    "parsed": {
      "weaponName": "AK-47",
      "skinName": "Fire Serpent",
      "wear": "Minimal Wear",
      "floatValue": 0.15
    }
  }
}
```

**Response for Unmasked URL**:
```json
{
  "success": true,
  "data": {
    "urlType": "unmasked",
    "requiresSteam": true,
    "item": {
      "ownerId": "76561198012345678",
      "assetId": "123456789",
      "classId": "123456789",
      "defindex": 7,
      "paintindex": 253,
      "paintseed": 661,
      "paintwear": 0.15,
      "statTrak": {
        "enabled": false
      }
    }
  }
}
```

**Error Response** (Invalid URL):
```json
{
  "success": false,
  "error": "Invalid inspect URL format",
  "code": "INVALID_URL"
}
```

**Error Response** (Steam GC Timeout):
```json
{
  "success": false,
  "error": "Steam Game Coordinator timeout",
  "code": "GC_TIMEOUT"
}
```

---

## Pin Management

### Get Pins

Retrieve pins for the authenticated user's active loadout.

**Endpoint**: `GET /api/pins`

**Authentication**: Required

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "steamid": "76561198012345678",
      "loadoutid": 1,
      "pin_defindex": 6001,
      "pin_name": "Skillful Pin"
    }
  ],
  "count": 1
}
```

---

### Save Pins

Add or update pins in the user's collection.

**Endpoint**: `POST /api/pins`

**Authentication**: Required

**Request**:
```json
{
  "loadoutId": 1,
  "pins": [6001, 6002, 6003]
}
```

**Response**:
```json
{
  "success": true,
  "message": "Pins updated successfully"
}
```

---

## Error Responses

All endpoints follow a consistent error response format:

```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": {}
}
```

### Common Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `UNAUTHORIZED` | 401 | Missing or invalid authentication token |
| `FORBIDDEN` | 403 | User doesn't have permission |
| `NOT_FOUND` | 404 | Resource not found |
| `VALIDATION_ERROR` | 400 | Invalid request data |
| `DATABASE_ERROR` | 500 | Database operation failed |
| `STEAM_ERROR` | 502 | Steam API unavailable |
| `GC_TIMEOUT` | 504 | Steam Game Coordinator timeout |
| `INVALID_URL` | 400 | Invalid inspect URL format |
| `RATE_LIMIT` | 429 | Too many requests |

---

## Rate Limiting

### Current Limits

- **Steam Inspect API**: 1 request per 1.5 seconds (per Steam account)
- **Other endpoints**: No hard limits (subject to server capacity)

### Future Rate Limits

Consider implementing rate limits for:
- Authentication endpoints: 5 requests per minute
- Save endpoints: 30 requests per minute
- Data endpoints: 100 requests per minute

---

## Request/Response Headers

### Standard Headers

**Request**:
```http
Content-Type: application/json
Accept: application/json
Authorization: Bearer {token}
```

**Response**:
```http
Content-Type: application/json
X-Request-ID: {unique-id}
X-Response-Time: {ms}
```

---

## Pagination

For endpoints that return large datasets, pagination may be implemented:

**Query Parameters**:
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 50, max: 100)

**Response**:
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 500,
    "pages": 10
  }
}
```

---

## WebSocket API (Future)

Real-time updates for:
- Loadout changes
- Inspect link processing progress
- Multi-user collaboration

**Connection**:
```javascript
const ws = new WebSocket('wss://your-domain.com/ws')
ws.send(JSON.stringify({ type: 'subscribe', channel: 'loadout:123' }))
```

---

## Related Documentation

- [Architecture](architecture.md) - System architecture
- [How It Works](how-it-works.md) - User flows
- [Setup Guide](setup.md) - Development setup
- [CS2 Inspect System](../CS2_INSPECT_SYSTEM_README.md) - Inspect system details
