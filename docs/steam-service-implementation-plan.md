# SteamUser Service Implementation Plan

## Overview

This document outlines the plan to extract the SteamUser/CS2Inspect client into a separate standalone Node.js service that can be accessed via REST API. This will allow multiple applications to share the same Steam account instance, preventing "LoggedInElsewhere" errors.

## Architecture

```
┌─────────────────┐         ┌──────────────────┐         ┌─────────────────┐
│   Main Nuxt App │         │  Steam Service   │         │   Other Apps    │
│                 │         │  (Standalone)    │         │                 │
│  - Web UI       │────────▶│                  │◀────────│  - Future Apps  │
│  - API Routes   │  HTTP   │  - Steam Client │  HTTP   │  - Mobile Apps  │
│  - Database     │         │  - Queue System │         │  - Bots         │
└─────────────────┘         │  - Rate Limiting │         └─────────────────┘
                            └──────────────────┘
```

## Directory Structure

```
cs2inspect-web/
├── services/
│   └── steam-service/              # New standalone service
│       ├── src/
│       │   ├── index.ts            # Entry point
│       │   ├── server.ts           # Express/Fastify server setup
│       │   ├── routes/
│       │   │   ├── inspect.ts      # Inspect endpoints
│       │   │   ├── health.ts        # Health check endpoints
│       │   │   └── status.ts        # Status endpoints
│       │   ├── services/
│       │   │   ├── steamClient.ts  # CS2Inspect client wrapper
│       │   │   └── queue.ts         # Request queue management
│       │   ├── middleware/
│       │   │   ├── auth.ts          # API key authentication
│       │   │   ├── rateLimit.ts     # Rate limiting per client
│       │   │   └── errorHandler.ts   # Error handling
│       │   ├── types/
│       │   │   └── index.ts         # TypeScript types
│       │   └── utils/
│       │       ├── logger.ts         # Logging utility
│       │       └── config.ts         # Configuration loader
│       ├── package.json
│       ├── tsconfig.json
│       ├── .env.example
│       └── README.md
├── server/
│   └── utils/
│       └── steamServiceClient.ts    # Client wrapper for main app
└── ...
```

## Implementation Steps

### Phase 1: Service Setup

#### 1.1 Create Service Directory Structure
- Create `services/steam-service/` directory
- Initialize new Node.js project with TypeScript
- Set up build configuration

#### 1.2 Choose Framework
**Recommendation: Fastify** (faster than Express, built-in TypeScript support)
- Lightweight and performant
- Built-in JSON schema validation
- Excellent TypeScript support
- Plugin architecture

#### 1.3 Dependencies
```json
{
  "dependencies": {
    "fastify": "^4.24.0",
    "@fastify/cors": "^8.4.0",
    "@fastify/rate-limit": "^9.1.0",
    "cs2-inspect-lib": "^latest",
    "dotenv": "^16.3.1"
  },
  "devDependencies": {
    "@types/node": "^20.10.0",
    "typescript": "^5.3.0",
    "tsx": "^4.7.0"
  }
}
```

### Phase 2: Core Service Implementation

#### 2.1 Steam Client Service (`src/services/steamClient.ts`)
```typescript
import { CS2Inspect } from 'cs2-inspect-lib';
import type { SteamClientConfig } from 'cs2-inspect-lib';

class SteamClientService {
  private client: CS2Inspect | null = null;
  private isInitialized = false;
  private initPromise: Promise<void> | null = null;

  async initialize(config: SteamClientConfig): Promise<void> {
    if (this.isInitialized && this.client) {
      return;
    }

    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = this._doInitialize(config);
    await this.initPromise;
  }

  private async _doInitialize(config: SteamClientConfig): Promise<void> {
    this.client = new CS2Inspect({
      steamClient: config,
      enableLogging: process.env.LOG_API_REQUESTS === 'true',
      validateInput: true
    });

    if (config.enabled) {
      await this.client.initializeSteamClient();
    }

    this.isInitialized = true;
  }

  getClient(): CS2Inspect {
    if (!this.client) {
      throw new Error('Steam client not initialized');
    }
    return this.client;
  }

  getStatus() {
    if (!this.client) {
      return { available: false, status: 'not_initialized' };
    }
    const stats = this.client.getSteamClientStats();
    return {
      available: stats.isAvailable,
      status: stats.status,
      ...stats
    };
  }
}

export const steamClientService = new SteamClientService();
```

#### 2.2 Request Queue Service (`src/services/queue.ts`)
- Manage concurrent requests
- Rate limiting (1.5s between requests)
- Queue size limits
- Request timeout handling

#### 2.3 API Routes

**Inspect Routes (`src/routes/inspect.ts`)**
```typescript
POST /api/inspect/create-url
POST /api/inspect/inspect-item
POST /api/inspect/decode-masked-only
POST /api/inspect/decode-hex-data
POST /api/inspect/validate-url
POST /api/inspect/analyze-url
```

**Health Routes (`src/routes/health.ts`)**
```typescript
GET /api/health
GET /api/health/ready
GET /api/health/live
```

**Status Routes (`src/routes/status.ts`)**
```typescript
GET /api/status
GET /api/status/steam-client
GET /api/status/queue
```

### Phase 3: Authentication & Security

#### 3.1 API Key Authentication
- Each client application gets an API key
- Store keys in environment variables or database
- Validate on every request via middleware

#### 3.2 Rate Limiting
- Per-API-key rate limiting
- Global rate limiting
- Queue-based throttling

#### 3.3 CORS Configuration
- Allow specific origins
- Configurable via environment variables

### Phase 4: Main App Integration

#### 4.1 Create Service Client (`server/utils/steamServiceClient.ts`)
```typescript
class SteamServiceClient {
  private baseUrl: string;
  private apiKey: string;

  constructor() {
    this.baseUrl = process.env.STEAM_SERVICE_URL || 'http://localhost:3001';
    this.apiKey = process.env.STEAM_SERVICE_API_KEY || '';
  }

  async inspectItem(inspectUrl: string, itemType?: string) {
    const response = await fetch(`${this.baseUrl}/api/inspect/inspect-item`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': this.apiKey
      },
      body: JSON.stringify({ inspectUrl, itemType })
    });
    return response.json();
  }

  async createInspectUrl(itemData: CreateUrlRequest) {
    // Similar implementation
  }

  // ... other methods
}

export const steamServiceClient = new SteamServiceClient();
```

#### 4.2 Update Main App Inspect Endpoint
- Replace direct `getCS2Client()` calls with `steamServiceClient` calls
- Handle service unavailable errors gracefully
- Add fallback mechanisms if needed

#### 4.3 Remove Steam Client from Main App
- Remove `initializeSteamClient()` from `server/plugins/init.ts`
- Remove Steam client dependencies from main app
- Update health checks

### Phase 5: Configuration & Deployment

#### 5.1 Environment Variables

**Steam Service (`.env`)**
```env
# Server Configuration
PORT=3001
HOST=0.0.0.0
NODE_ENV=production

# Steam Account
STEAM_USERNAME=your_steam_username
STEAM_PASSWORD=your_steam_password
STEAM_API_KEY=your_steam_api_key

# API Security
API_KEYS=key1,key2,key3  # Comma-separated API keys
CORS_ORIGINS=http://localhost:3000,https://yourdomain.com

# Logging
LOG_API_REQUESTS=true
LOG_LEVEL=info

# Rate Limiting
RATE_LIMIT_MAX=100
RATE_LIMIT_WINDOW=60000  # 1 minute
```

**Main App (`.env`)**
```env
# Steam Service Configuration
STEAM_SERVICE_URL=http://localhost:3001
STEAM_SERVICE_API_KEY=your_api_key_here

# Remove these (no longer needed in main app):
# STEAM_USERNAME=
# STEAM_PASSWORD=
```

#### 5.2 Docker Configuration

**docker-compose.yml** (add service)
```yaml
services:
  steam-service:
    build:
      context: ./services/steam-service
      dockerfile: Dockerfile
    ports:
      - "3001:3001"
    environment:
      - STEAM_USERNAME=${STEAM_USERNAME}
      - STEAM_PASSWORD=${STEAM_PASSWORD}
      - STEAM_API_KEY=${STEAM_API_KEY}
      - API_KEYS=${STEAM_SERVICE_API_KEYS}
    restart: unless-stopped
    networks:
      - app-network

  # ... existing services
```

#### 5.3 Process Management
- Use PM2 for production
- Or systemd service
- Health check endpoints for monitoring

## API Specification

### Authentication
All requests require an `X-API-Key` header:
```
X-API-Key: your_api_key_here
```

### Endpoints

#### 1. Create Inspect URL
```http
POST /api/inspect/create-url
Content-Type: application/json
X-API-Key: your_api_key

{
  "itemType": "weapon",
  "defindex": 7,
  "paintindex": 179,
  "paintseed": 420,
  "paintwear": 0.15,
  "statTrak": true,
  "stickers": [...],
  "keychain": {...}
}
```

**Response:**
```json
{
  "success": true,
  "inspectUrl": "steam://rungame/730/...",
  "itemData": {...},
  "itemType": "weapon"
}
```

#### 2. Inspect Item
```http
POST /api/inspect/inspect-item
Content-Type: application/json
X-API-Key: your_api_key

{
  "inspectUrl": "steam://rungame/730/...",
  "itemType": "weapon"
}
```

**Response:**
```json
{
  "success": true,
  "itemData": {...},
  "metadata": {...}
}
```

#### 3. Get Service Status
```http
GET /api/status
X-API-Key: your_api_key
```

**Response:**
```json
{
  "steamClient": {
    "available": true,
    "status": "connected",
    "uptime": 3600000
  },
  "queue": {
    "pending": 0,
    "processing": 1,
    "maxSize": 100
  },
  "server": {
    "uptime": 3600000,
    "version": "1.0.0"
  }
}
```

#### 4. Health Check
```http
GET /api/health/ready
```

**Response:**
```json
{
  "status": "ok",
  "ready": true,
  "checks": {
    "steam_client": "ok",
    "queue": "ok"
  }
}
```

## Error Handling

### Error Response Format
```json
{
  "success": false,
  "error": {
    "code": "STEAM_CLIENT_UNAVAILABLE",
    "message": "Steam client is not connected",
    "details": {...}
  }
}
```

### Error Codes
- `STEAM_CLIENT_UNAVAILABLE` - Steam client not initialized/connected
- `INVALID_API_KEY` - API key authentication failed
- `RATE_LIMIT_EXCEEDED` - Too many requests
- `QUEUE_FULL` - Request queue is full
- `REQUEST_TIMEOUT` - Request timed out
- `INVALID_INSPECT_URL` - Inspect URL format is invalid
- `INTERNAL_ERROR` - Internal server error

## Migration Strategy

### Step 1: Deploy Service (Non-Breaking)
1. Deploy steam service alongside main app
2. Keep existing Steam client in main app
3. Test service endpoints independently

### Step 2: Gradual Migration
1. Add feature flag to switch between local client and service
2. Migrate one endpoint at a time
3. Monitor for errors

### Step 3: Full Migration
1. Remove Steam client from main app
2. Update all endpoints to use service
3. Remove unused dependencies

### Step 4: Cleanup
1. Remove old Steam client code
2. Update documentation
3. Update deployment scripts

## Testing Strategy

### Unit Tests
- Steam client service initialization
- Queue management
- Error handling

### Integration Tests
- API endpoint testing
- Authentication/authorization
- Rate limiting

### Load Tests
- Concurrent request handling
- Queue overflow scenarios
- Rate limit enforcement

## Monitoring & Observability

### Metrics to Track
- Request count per endpoint
- Response times
- Queue size
- Steam client connection status
- Error rates
- API key usage

### Logging
- Request/response logging
- Error logging with stack traces
- Steam client events
- Queue events

### Alerts
- Steam client disconnection
- High error rate
- Queue overflow
- Service unavailable

## Benefits

1. **Prevents "LoggedInElsewhere" Errors**
   - Single Steam account instance
   - Multiple apps can use same service

2. **Better Resource Management**
   - Centralized Steam client
   - Shared queue system
   - Efficient rate limiting

3. **Scalability**
   - Can scale service independently
   - Load balancing possible
   - Multiple service instances (with different Steam accounts)

4. **Maintainability**
   - Separation of concerns
   - Easier to update Steam client logic
   - Independent deployment

5. **Security**
   - Centralized authentication
   - API key management
   - Rate limiting per client

## Future Enhancements

1. **Multiple Steam Accounts**
   - Support multiple Steam accounts
   - Load balancing across accounts
   - Account rotation

2. **WebSocket Support**
   - Real-time status updates
   - Push notifications for queue completion

3. **Metrics Dashboard**
   - Real-time monitoring
   - Usage statistics
   - Performance metrics

4. **Caching Layer**
   - Cache inspect results
   - Reduce Steam API calls
   - Improve response times

## Timeline Estimate

- **Phase 1**: 2-3 days (Service setup)
- **Phase 2**: 3-4 days (Core implementation)
- **Phase 3**: 1-2 days (Authentication)
- **Phase 4**: 2-3 days (Main app integration)
- **Phase 5**: 1-2 days (Configuration & deployment)

**Total**: ~10-14 days

## Next Steps

1. Review and approve this plan
2. Create service directory structure
3. Set up initial project with Fastify
4. Implement Steam client service
5. Create API routes
6. Add authentication middleware
7. Test service independently
8. Integrate with main app
9. Deploy and monitor
