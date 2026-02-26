# Error Handling

## Overview

All API endpoints follow a consistent error response format for easy error handling in client applications.

## Standard Error Format

```json
{
  "success": false,
  "error": "Human-readable error message",
  "code": "ERROR_CODE",
  "details": {}
}
```

## HTTP Status Codes

| Status | Meaning | When Used |
|--------|---------|-----------|
| `200 OK` | Success | Request completed successfully |
| `201 Created` | Created | Resource created successfully |
| `400 Bad Request` | Client Error | Invalid request data |
| `401 Unauthorized` | Auth Required | Missing or invalid token |
| `403 Forbidden` | Access Denied | User lacks permission |
| `404 Not Found` | Not Found | Resource doesn't exist |
| `429 Too Many Requests` | Rate Limited | Too many requests |
| `500 Internal Server Error` | Server Error | Unexpected server error |
| `502 Bad Gateway` | External Error | External service (Steam) error |
| `503 Service Unavailable` | Unavailable | Service temporarily unavailable |
| `504 Gateway Timeout` | Timeout | External service timeout |

---

## Common Error Codes

### Authentication Errors

| Code | HTTP | Description |
|------|------|-------------|
| `UNAUTHORIZED` | 401 | Missing or invalid authentication token |
| `TOKEN_EXPIRED` | 401 | JWT token has expired |
| `FORBIDDEN` | 403 | User doesn't have permission |
| `INVALID_STEAM_ID` | 400 | Steam ID format is invalid |

**Example**:
```json
{
  "success": false,
  "error": "Authentication required",
  "code": "UNAUTHORIZED"
}
```

### Validation Errors

| Code | HTTP | Description |
|------|------|-------------|
| `VALIDATION_ERROR` | 400 | Invalid request data |
| `MISSING_PARAM` | 400 | Required parameter missing |
| `INVALID_PARAM` | 400 | Parameter value is invalid |

**Example**:
```json
{
  "success": false,
  "error": "Missing required parameter: steamId",
  "code": "MISSING_PARAM",
  "details": {
    "field": "steamId",
    "type": "required"
  }
}
```

### Resource Errors

| Code | HTTP | Description |
|------|------|-------------|
| `NOT_FOUND` | 404 | Resource not found |
| `LOADOUT_NOT_FOUND` | 404 | Loadout doesn't exist |
| `ITEM_NOT_FOUND` | 404 | Item doesn't exist |
| `DUPLICATE` | 409 | Resource already exists |

**Example**:
```json
{
  "success": false,
  "error": "Loadout not found",
  "code": "LOADOUT_NOT_FOUND",
  "details": {
    "loadoutId": 999
  }
}
```

### Server Errors

| Code | HTTP | Description |
|------|------|-------------|
| `DATABASE_ERROR` | 500 | Database operation failed |
| `INTERNAL_ERROR` | 500 | Unexpected server error |

**Example**:
```json
{
  "success": false,
  "error": "Database connection failed",
  "code": "DATABASE_ERROR"
}
```

### External Service Errors

| Code | HTTP | Description |
|------|------|-------------|
| `STEAM_ERROR` | 502 | Steam API unavailable |
| `GC_TIMEOUT` | 504 | Steam Game Coordinator timeout |
| `EXTERNAL_ERROR` | 502 | External service error |

**Example**:
```json
{
  "success": false,
  "error": "Steam Game Coordinator timeout",
  "code": "GC_TIMEOUT",
  "details": {
    "timeout_ms": 30000
  }
}
```

### Inspect System Errors

| Code | HTTP | Description |
|------|------|-------------|
| `INVALID_URL` | 400 | Invalid inspect URL format |
| `INVALID_ITEM_TYPE` | 400 | Unknown item type |
| `DECODE_ERROR` | 400 | Failed to decode masked data |

**Example**:
```json
{
  "success": false,
  "error": "Invalid inspect URL format",
  "code": "INVALID_URL",
  "details": {
    "url": "invalid-url-here"
  }
}
```

### Rate Limiting Errors

| Code | HTTP | Description |
|------|------|-------------|
| `RATE_LIMIT` | 429 | Too many requests |

**Example**:
```json
{
  "success": false,
  "error": "Rate limit exceeded",
  "code": "RATE_LIMIT",
  "details": {
    "retryAfter": 60,
    "limit": 100,
    "remaining": 0
  }
}
```

---

## Error Handling Best Practices

### Client-Side Handling

```typescript
async function fetchLoadouts(steamId: string) {
  try {
    const response = await fetch(`/api/loadouts?steamId=${steamId}`);
    const data = await response.json();
    
    if (!data.success) {
      switch (data.code) {
        case 'UNAUTHORIZED':
          // Redirect to login
          break;
        case 'NOT_FOUND':
          // Show empty state
          break;
        default:
          // Show generic error
          console.error(data.error);
      }
      return null;
    }
    
    return data.data;
  } catch (error) {
    // Network error
    console.error('Network error:', error);
    return null;
  }
}
```

### Retry Logic

```typescript
async function fetchWithRetry(url: string, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.code === 'RATE_LIMIT') {
        const retryAfter = data.details?.retryAfter || 60;
        await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
        continue;
      }
      
      if (data.code === 'GC_TIMEOUT' && i < retries - 1) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        continue;
      }
      
      return data;
    } catch (error) {
      if (i === retries - 1) throw error;
    }
  }
}
```

---

## Debugging

### Request ID

All API responses include an `X-Request-ID` header for debugging:

```http
X-Request-ID: abc123-def456-ghi789
```

Include this ID when reporting issues.

### Response Time

API responses include timing information via `X-Response-Time`:

```http
X-Response-Time: 45ms
```

---

## Related Documentation

- [API Reference](./index) - API overview
- [Health Checks](./health) - Health monitoring
