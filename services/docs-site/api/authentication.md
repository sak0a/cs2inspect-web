# Authentication

## Overview

The CS2Inspect API uses JWT (JSON Web Tokens) for authentication. Most endpoints require a valid token to access user-specific data.

## JWT Token Authentication

Tokens can be passed via cookies or Authorization header.

### Cookie-based (Recommended)

```http
Cookie: jwt=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Header-based

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Obtaining a Token

### `POST /api/auth/validate`

Validate Steam OpenID response and receive a JWT token.

**Authentication**: Not required

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

### Token Details

| Property  | Value                                          |
| --------- | ---------------------------------------------- |
| Algorithm | HS256                                          |
| Expiry    | 7 days (configurable via `JWT_EXPIRY` env var) |
| Payload   | `{ steamId, iat, exp }`                        |

## Steam OpenID Flow

```mermaid
sequenceDiagram
    participant User
    participant App
    participant Steam
    participant API

    User->>App: Click "Login with Steam"
    App->>Steam: Redirect to Steam OpenID
    Steam->>User: Show login form
    User->>Steam: Enter credentials
    Steam->>App: Redirect with OpenID data
    App->>API: POST /api/auth/validate
    API->>App: Return JWT token
    App->>User: Set cookie & redirect
```

## Token Refresh

Currently, tokens are not automatically refreshed. Users must re-authenticate when their token expires.

::: tip Future Enhancement
Consider implementing token refresh for better UX.
:::

## Security Considerations

1. **Token Storage**: Tokens are stored in HTTP-only cookies by default
2. **HTTPS**: Always use HTTPS in production
3. **Token Validation**: Every authenticated request validates the token signature
4. **Steam Verification**: OpenID responses are verified against Steam's servers

## Dev Mock Authentication

::: warning Development Only
Dev mock auth is for local development and AI agents. It is disabled when `NODE_ENV=production` or `DEV_AUTH_ENABLED` is not `true`.
:::

When enabled, agents and developers can log in without Steam OpenID. The endpoint issues the same `auth_token` JWT cookie used by real Steam login.

### `POST /api/auth/dev/login`

**Authentication**: Not required (returns 404 when dev auth is disabled)

**Request**:
```json
{
  "as": "user"
}
```

When `DEV_AUTH_USERNAME` / `DEV_AUTH_PASSWORD` are set, you may include credentials in the body for API/CLI login. The `/dev` page buttons send only `as`; omitted credentials are allowed when the credential gate is enabled.

```json
{
  "username": "dev",
  "password": "devpassword",
  "as": "user"
}
```

Use `"as": "admin"` for the dev admin user (inserted into `admin_users`).

**Response**:
```json
{
  "steamId": "76561198000000001",
  "personaName": "Dev User",
  "avatarFull": "https://avatars.steamstatic.com/...",
  "role": "user",
  "authenticated": true
}
```

The `auth_token` cookie is set automatically on the response.

### CLI helpers

```bash
bun run cli dev:seed          # Seed dev user + admin in database
bun run cli dev:login         # Print curl command for dev user (does not log in)
bun run cli dev:login:admin   # Print curl command for dev admin (does not log in)
```

### Default mock SteamIDs

| Role | SteamID |
|------|---------|
| User | `76561198000000001` |
| Admin | `76561198000000002` |

Reserved block: `76561198000000XXX`. Mock `/api/steam/user` responses are returned for these IDs when dev auth is enabled.

See also: [Environment Variables — Dev Auth](/reference-env#dev-mock-authentication) and `AGENTS.md` in the repository root.

## Error Responses

| Code                  | HTTP Status | Description                      |
| --------------------- | ----------- | -------------------------------- |
| `UNAUTHORIZED`        | 401         | Missing or invalid token         |
| `TOKEN_EXPIRED`       | 401         | Token has expired                |
| `INVALID_STEAM_ID`    | 400         | Invalid Steam ID format          |
| `STEAM_VERIFY_FAILED` | 400         | Steam OpenID verification failed |
