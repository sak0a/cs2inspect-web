# API Reference

## Overview

The CS2Inspect API provides RESTful endpoints for managing user loadouts, weapon customizations, and CS2 item data. All endpoints return JSON responses and require authentication unless otherwise noted.

::: tip Auto-Generated Documentation
This API reference includes both manually curated documentation and auto-generated endpoint listings. See [Generated API Reference](./api-reference) for the complete auto-generated endpoint list.
:::

## Base URL

```
Development: http://localhost:3210/api
Production:  https://your-domain.com/api
```

## Quick Links

| Category | Description |
|----------|-------------|
| [Authentication](./authentication) | JWT tokens, Steam OpenID login |
| [Health Checks](./health) | Liveness, readiness, and detailed health probes |
| [Data Endpoints](./data) | Weapons, skins, stickers, agents, and more |
| [Loadouts](./loadouts) | User loadout management |
| [Items](./items) | Weapon, knife, glove, and pin management |
| [Inspect System](./inspect) | CS2 inspect URL processing |
| [Error Handling](./errors) | Error codes and responses |

## API Categories

### 🔐 [Authentication](./authentication)
Steam OpenID authentication and JWT token management.
- Token-based authentication
- Cookie and header support
- 7-day token expiry

### 💚 [Health Checks](./health)
Monitoring endpoints for container orchestration and status dashboards.
- Liveness probe (`/api/health/live`)
- Readiness probe (`/api/health/ready`)
- Detailed health information (`/api/health/details`)
- Historical health data (`/api/health/history`)

### 📦 [Data Endpoints](./data)
Static data retrieval for weapons, skins, stickers, and more.
- Weapon skins
- Agents
- Stickers
- Keychains
- Music kits
- Collectibles (Pins)

### 🎒 [Loadouts](./loadouts)
User loadout management system.
- Create, update, delete loadouts
- Switch active loadout
- Equipped loadout for CS2 plugin

### 🔫 [Items](./items)
Weapon, knife, glove, and pin customization.
- Weapon management
- Knife management
- Glove management
- Pin management

### 🔍 [Inspect System](./inspect)
CS2 inspect URL processing and generation.
- Analyze inspect links
- Create custom inspect URLs
- Extract item data

### ⚠️ [Error Handling](./errors)
Consistent error response format and codes.
- Standard error format
- Common error codes
- HTTP status codes

## Request/Response Format

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

## Related Documentation

- [Architecture](../architecture) - System architecture
- [How It Works](../how-it-works) - User flows
- [Setup Guide](../setup) - Development setup
