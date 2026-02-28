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

## Error Responses

| Code                  | HTTP Status | Description                      |
| --------------------- | ----------- | -------------------------------- |
| `UNAUTHORIZED`        | 401         | Missing or invalid token         |
| `TOKEN_EXPIRED`       | 401         | Token has expired                |
| `INVALID_STEAM_ID`    | 400         | Invalid Steam ID format          |
| `STEAM_VERIFY_FAILED` | 400         | Steam OpenID verification failed |
