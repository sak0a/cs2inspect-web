# Steam Service Setup Guide

## Overview

The Steam Service is a standalone Node.js application that provides shared Steam account access via REST API. This prevents "LoggedInElsewhere" errors when multiple applications need to use the same Steam account.

> **For Local Testing**: See [Local Testing Guide](./steam-service-local-testing.md) for detailed instructions on running both services locally.

## Quick Start

### 1. Install Dependencies

```bash
cd services/steam-service
bun install
```

### 2. Configure Environment

Create a `.env` file in `services/steam-service/`:

```env
PORT=3000
HOST=0.0.0.0
NODE_ENV=development

STEAM_USERNAME=your_steam_username
STEAM_PASSWORD=your_steam_password
STEAM_API_KEY=your_steam_api_key

API_KEYS=your_api_key_here,another_key_here
CORS_ORIGINS=http://localhost:3000

LOG_API_REQUESTS=true
```

### 3. Start the Service

**Development:**

```bash
bun run dev
```

**Production:**

```bash
bun run build
bun start
```

### 4. Configure Main App

Add to your main app's `.env`:

```env
STEAM_SERVICE_URL=http://localhost:3000
STEAM_SERVICE_API_KEY=your_api_key_here
```

## Docker Setup

### Using Docker Compose

The `docker-compose.yml` already includes the steam service. Just add these environment variables:

```env
STEAM_SERVICE_PORT=3000
STEAM_SERVICE_API_KEYS=your_api_key_here
STEAM_SERVICE_CORS_ORIGINS=http://localhost:3000
```

Then start both services:

```bash
docker-compose up -d
```

## API Usage

### Authentication

All inspect endpoints require an `X-API-Key` header:

```bash
curl -X POST http://localhost:3000/api/inspect/inspect-item \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your_api_key_here" \
  -d '{"inspectUrl": "steam://..."}'
```

### Available Endpoints

- `POST /api/inspect/create-url` - Create inspect URL
- `POST /api/inspect/inspect-item` - Inspect item (requires Steam client)
- `POST /api/inspect/decode-masked-only` - Decode masked URL only
- `POST /api/inspect/decode-hex-data` - Decode hex data
- `POST /api/inspect/validate-url` - Validate inspect URL
- `POST /api/inspect/analyze-url` - Analyze URL structure
- `GET /api/health` - Health check
- `GET /api/status` - Service status

## Migration from Local Client

The main app automatically uses the steam service if `STEAM_SERVICE_URL` and `STEAM_SERVICE_API_KEY` are configured. Otherwise, it falls back to the local Steam client.

### Step 1: Deploy Service

Deploy the steam service alongside your main app.

### Step 2: Configure Main App

Add the service configuration to your main app's environment variables.

### Step 3: Test

Test that the main app can communicate with the service.

### Step 4: Remove Local Client (Optional)

Once confirmed working, you can remove Steam credentials from the main app's environment variables.

## Troubleshooting

### Service Won't Start

- Check that all required environment variables are set
- Verify Steam credentials are correct
- Check port 3000 is not already in use

### "Invalid API Key" Errors

- Verify `API_KEYS` in service `.env` matches `STEAM_SERVICE_API_KEY` in main app
- Check the `X-API-Key` header is being sent correctly

### "Steam Client Unavailable" Errors

- Check Steam credentials in service `.env`
- Verify Steam account is not logged in elsewhere
- Check service logs for connection errors

### Connection Timeouts

- Verify `STEAM_SERVICE_URL` is correct
- Check network connectivity between services
- Increase timeout values if needed

## Monitoring

### Health Checks

```bash
# General health
curl http://localhost:3000/api/health

# Readiness probe
curl http://localhost:3000/api/health/ready

# Liveness probe
curl http://localhost:3000/api/health/live
```

### Status Endpoint

```bash
curl http://localhost:3000/api/status
```

Returns:

- Steam client status
- Queue statistics
- Server uptime

## Security Considerations

1. **API Keys**: Use strong, unique API keys for each client application
2. **CORS**: Configure `CORS_ORIGINS` to only allow trusted domains
3. **Network**: Run service on private network when possible
4. **Rate Limiting**: Adjust rate limits based on your needs

## Performance Tuning

### Queue Configuration

- `STEAM_MAX_QUEUE_SIZE`: Maximum queue size (default: 100)
- `STEAM_RATE_LIMIT_DELAY`: Delay between requests in ms (default: 1500)
- `STEAM_REQUEST_TIMEOUT`: Request timeout in ms (default: 10000)
- `STEAM_QUEUE_TIMEOUT`: Queue timeout in ms (default: 30000)

### Rate Limiting

- `RATE_LIMIT_MAX`: Maximum requests per window (default: 100)
- `RATE_LIMIT_WINDOW`: Time window in ms (default: 60000)

## Next Steps

1. Review the [Implementation Plan](./steam-service-implementation-plan.md) for detailed architecture
2. Check the [Service README](./services/steam-service/README.md) for API documentation
3. Monitor service health and performance
4. Scale service as needed
