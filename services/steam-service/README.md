# Steam Service

Standalone SteamUser/CS2Inspect service for shared Steam account access across multiple applications.

## Features

- **Shared Steam Account**: Single Steam account instance accessible via REST API
- **Request Queue**: Manages concurrent requests with rate limiting
- **API Key Authentication**: Secure access control
- **Health Checks**: Monitoring endpoints for service status
- **Error Handling**: Comprehensive error responses

## Quick Start

### Installation

```bash
cd services/steam-service
bun install
```

### Configuration

Copy `.env.example` to `.env` and configure:

```env
PORT=3001
STEAM_USERNAME=your_steam_username
STEAM_PASSWORD=your_steam_password
STEAM_API_KEY=your_steam_api_key
API_KEYS=your_api_key_here
```

### Development

```bash
bun run dev
```

### Production

```bash
bun run build
bun start
```

## Important: Runtime (Node vs Bun)

`cs2-inspect-lib` uses Steam libraries that are significantly more reliable on **Node.js** than on **Bun**.

- This service **uses Bun for package management/build** (`bun install`, `bun run build`)
- But it **runs on Node.js** (`tsx watch ...` for dev, `node dist/index.js` for production)

### Testing

**Unit Tests (No Steam Account Required):**

```bash
# Run all unit tests
bun test

# Run unit tests only
bun test:unit
```

**Integration Tests (Requires Steam Account):**

```bash
# Set up test environment
export STEAM_USERNAME=your_test_account
export STEAM_PASSWORD=your_test_password
export STEAM_API_KEY=your_api_key
export STEAM_TEST_ENABLED=true

# Run integration tests
bun test:integration

# Or run all tests (unit + integration)
bun test:all
```

**Test Files:**

- `src/routes/inspect.test.ts` - Inspect endpoint tests (no Steam account)
- `src/routes/inspect.integration.test.ts` - Integration tests (requires Steam account)
- `src/services/steamClient.test.ts` - Steam client service tests
- `src/services/queue.test.ts` - Queue management tests
- `src/middleware/auth.test.ts` - Authentication tests
- `src/routes/health.test.ts` - Health check tests

## API Endpoints

### Authentication

All inspect endpoints require an `X-API-Key` header:

```
X-API-Key: your_api_key_here
```

### Inspect Endpoints

- `POST /api/inspect/create-url` - Create inspect URL
- `POST /api/inspect/inspect-item` - Inspect item (requires Steam client)
- `POST /api/inspect/decode-masked-only` - Decode masked URL only
- `POST /api/inspect/decode-hex-data` - Decode hex data
- `POST /api/inspect/validate-url` - Validate inspect URL
- `POST /api/inspect/analyze-url` - Analyze URL structure

### Health Endpoints

- `GET /api/health` - General health check
- `GET /api/health/ready` - Readiness probe
- `GET /api/health/live` - Liveness probe

### Status Endpoints

- `GET /api/status` - General service status
- `GET /api/status/steam-client` - Steam client status
- `GET /api/status/queue` - Queue status

## Error Codes

- `STEAM_CLIENT_UNAVAILABLE` - Steam client not initialized/connected
- `INVALID_API_KEY` - API key authentication failed
- `RATE_LIMIT_EXCEEDED` - Too many requests
- `QUEUE_FULL` - Request queue is full
- `REQUEST_TIMEOUT` - Request timed out
- `INVALID_INSPECT_URL` - Inspect URL format is invalid

## Environment Variables

See `.env.example` for all available configuration options.

## Deployment

This service is deployed as a standalone container using the `steam-service-only` branch. To push updates from the main monorepo to the deployment branch, run:

```bash
git subtree push --prefix=services/steam-service origin steam-service-only
```

Always ensure your changes are committed to the `master` branch before pushing to the deployment branch.
