# Steam Service Setup with Coolify and Nixpacks

This guide explains how to deploy the Steam Service alongside your main Nuxt application using Coolify with Nixpacks.

## Overview

The Steam Service runs as a separate containerized service that can be:

- Deployed independently from the main app
- Accessed via internal network or external subdomain
- Scaled independently
- Monitored separately

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Coolify Server                        │
│                                                          │
│  ┌──────────────────┐         ┌──────────────────┐    │
│  │  Main Nuxt App   │         │  Steam Service   │    │
│  │  (Nixpacks)     │────────▶│  (Nixpacks)      │    │
│  │  Port: 3000     │  HTTP   │  Port: 3001     │    │
│  │  Domain: app.com │         │  Domain: steam.  │    │
│  └──────────────────┘         │     app.com      │    │
│                                └──────────────────┘    │
│                                         │               │
│                                         ▼               │
│                                ┌──────────────────┐    │
│                                │  Steam Network   │    │
│                                │  (Game Coord)    │    │
│                                └──────────────────┘    │
└─────────────────────────────────────────────────────────┘
```

## Prerequisites

- Coolify instance running
- Main Nuxt app already deployed
- Steam account credentials ready
- Domain/subdomain configured (optional, for external access)

## Step 1: Prepare the Service

### 1.1 Create Nixpacks Configuration

Create a `nixpacks.toml` file in `services/steam-service/`:

```toml
[phases.setup]
nixPkgs = ["nodejs_20", "bun"]

[phases.install]
cmds = ["bun install --frozen-lockfile"]

[phases.build]
cmds = ["bun run build"]

[start]
cmd = "bun run dist/index.js"
```

### 1.2 Create Build Configuration

Alternatively, create a `Dockerfile` (already exists) which Nixpacks can use as a fallback.

## Step 2: Deploy in Coolify

### 2.1 Create New Resource

1. In Coolify, go to **Resources** → **New Resource**
2. Select **Docker Compose** or **Standalone Application**
3. Choose **Git Repository** as source

### 2.2 Configure Repository

**Repository Settings:**

- **Repository URL**: Your Git repository URL
- **Branch**: `main` or your deployment branch
- **Build Pack**: Select **Nixpacks** or **Dockerfile**
- **Dockerfile Path**: `services/steam-service/Dockerfile`
- **Docker Build Context**: `services/steam-service/`

### 2.3 Configure Environment Variables

Add these environment variables in Coolify:

```env
# Server Configuration
PORT=3001
HOST=0.0.0.0
NODE_ENV=production

# Steam Account (Required)
STEAM_USERNAME=your_steam_username
STEAM_PASSWORD=your_steam_password
STEAM_API_KEY=your_steam_api_key

# API Security (Required)
# Generate a strong random key for production
API_KEYS=your_secure_api_key_here

# CORS Configuration
# Add your main app domain and any other allowed origins
CORS_ORIGINS=https://your-main-app.com,https://www.your-main-app.com

# Logging
LOG_API_REQUESTS=true
LOG_LEVEL=info

# Rate Limiting
RATE_LIMIT_MAX=100
RATE_LIMIT_WINDOW=60000

# Steam Client Configuration
STEAM_RATE_LIMIT_DELAY=1500
STEAM_MAX_QUEUE_SIZE=100
STEAM_REQUEST_TIMEOUT=10000
STEAM_QUEUE_TIMEOUT=30000
```

**Important Security Notes:**

- Generate a strong, random API key (use `openssl rand -hex 32`)
- Never commit API keys to Git
- Use Coolify's secret management for sensitive values

### 2.4 Configure Ports

**Port Configuration:**

- **Internal Port**: `3001`
- **Public Port**: Leave empty for internal-only, or set to `3001` for external access

### 2.5 Configure Networking

#### Option A: Internal Network Only (Recommended for Production)

1. **Don't expose port publicly**
2. Use Coolify's internal DNS: `steam-service:3001`
3. Services on the same Coolify instance can communicate via service name

#### Option B: External Access via Subdomain

1. **Expose port**: Set public port to `3001`
2. **Configure Domain**: Add a subdomain (e.g., `steam.yourdomain.com`)
3. **SSL**: Enable automatic SSL via Coolify
4. **Access URL**: `https://steam.yourdomain.com`

### 2.6 Health Checks

Configure health checks in Coolify:

**Health Check Settings:**

- **Path**: `/api/health/live`
- **Interval**: `30s`
- **Timeout**: `5s`
- **Retries**: `3`
- **Start Period**: `60s` (Steam client needs time to initialize)

## Step 3: Configure Main App

### 3.1 Update Main App Environment Variables

In your main Nuxt app's Coolify configuration, add:

```env
# Steam Service Configuration
STEAM_SERVICE_URL=http://steam-service:3001
STEAM_SERVICE_API_KEY=your_secure_api_key_here
```

**For External Access:**

```env
STEAM_SERVICE_URL=https://steam.yourdomain.com
STEAM_SERVICE_API_KEY=your_secure_api_key_here
```

**Important**: Use the same API key value in both services!

### 3.2 Network Configuration

If using internal networking:

- Both services must be on the same Coolify instance
- Use service name: `steam-service:3001`
- No external network access needed

If using external access:

- Use the full domain: `https://steam.yourdomain.com`
- Ensure CORS is configured correctly
- SSL certificate must be valid

## Step 4: Docker Compose Alternative (Advanced)

If you prefer Docker Compose, create a `docker-compose.steam.yml`:

```yaml
version: '3.9'

services:
    steam-service:
        build:
            context: ./services/steam-service
            dockerfile: Dockerfile
        container_name: cs2inspect-steam-service
        restart: unless-stopped
        environment:
            - NODE_ENV=production
            - PORT=3001
            - HOST=0.0.0.0
            - STEAM_USERNAME=${STEAM_USERNAME}
            - STEAM_PASSWORD=${STEAM_PASSWORD}
            - STEAM_API_KEY=${STEAM_API_KEY}
            - API_KEYS=${STEAM_SERVICE_API_KEY}
            - CORS_ORIGINS=${STEAM_SERVICE_CORS_ORIGINS}
            - LOG_API_REQUESTS=${LOG_API_REQUESTS}
        ports:
            - '3001:3001'
        healthcheck:
            test:
                [
                    'CMD',
                    'wget',
                    '--no-verbose',
                    '--tries=1',
                    '--spider',
                    'http://localhost:3001/api/health/live',
                ]
            interval: 30s
            timeout: 5s
            retries: 3
            start_period: 60s
        networks:
            - app-network

networks:
    app-network:
        driver: bridge
```

Then deploy this as a Docker Compose resource in Coolify.

## Step 5: Testing the Setup

### 5.1 Test Service Health

```bash
# Internal (from main app container)
curl http://steam-service:3001/api/health

# External (if configured)
curl https://steam.yourdomain.com/api/health
```

### 5.2 Test API Endpoint

```bash
curl -X POST https://steam.yourdomain.com/api/inspect/analyze-url \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your_api_key" \
  -d '{"inspectUrl": "steam://rungame/730/76561202255233023/+csgo_econ_action_preview%20test"}'
```

### 5.3 Test from Main App

1. Log into your main app
2. Try to inspect an item
3. Check main app logs for service communication
4. Check steam service logs for requests

## Step 6: Monitoring

### 6.1 Health Check Endpoints

Monitor these endpoints:

- **Liveness**: `GET /api/health/live` - Always returns 200 if service is running
- **Readiness**: `GET /api/health/ready` - Returns 200 only if Steam client is ready
- **Status**: `GET /api/status` - Detailed service status

### 6.2 Logs

View logs in Coolify:

- **Service Logs**: Check for Steam client connection status
- **Error Logs**: Monitor for authentication failures, queue overflows
- **Request Logs**: If `LOG_API_REQUESTS=true`

### 6.3 Metrics to Watch

- Steam client connection status
- Queue size and processing time
- Request success/failure rates
- API key usage patterns

## Step 7: Troubleshooting

### Service Won't Start

**Check:**

1. Environment variables are set correctly
2. Steam credentials are valid
3. Port 3001 is not already in use
4. Build completed successfully

**Logs to check:**

```bash
# In Coolify, check service logs for:
- "Steam service started on..."
- "Steam client initialized successfully"
- Any error messages
```

### "Invalid API Key" Errors

**Check:**

1. `API_KEYS` in steam service matches `STEAM_SERVICE_API_KEY` in main app
2. API key is sent in `X-API-Key` header
3. No extra spaces or newlines in API key

**Test:**

```bash
# Verify API key format
echo $API_KEYS | tr ',' '\n' | wc -l  # Should show number of keys
```

### Steam Client Not Connecting

**Check:**

1. Steam credentials are correct
2. Account is not logged in elsewhere
3. Steam Guard is disabled (if applicable)
4. Network connectivity to Steam servers

**Common Errors:**

- `LoggedInElsewhere` - Account is in use elsewhere
- `InvalidPassword` - Wrong credentials
- `RateLimited` - Too many login attempts

### Network Connection Issues

**Internal Network:**

- Verify both services are on same Coolify instance
- Check service name resolution: `ping steam-service`
- Verify port is accessible: `telnet steam-service 3001`

**External Network:**

- Verify domain DNS points to server
- Check SSL certificate is valid
- Verify CORS origins include your main app domain
- Test with `curl` from external machine

### Queue Full Errors

**Solutions:**

1. Increase `STEAM_MAX_QUEUE_SIZE` (default: 100)
2. Increase `STEAM_RATE_LIMIT_DELAY` to process slower
3. Scale service horizontally (multiple instances with different Steam accounts)

## Step 8: Production Best Practices

### 8.1 Security

- ✅ Use strong, unique API keys
- ✅ Rotate API keys periodically
- ✅ Use HTTPS for external access
- ✅ Restrict CORS origins to known domains
- ✅ Monitor for unauthorized access attempts
- ✅ Keep Steam credentials secure (use Coolify secrets)

### 8.2 Performance

- ✅ Monitor queue size and adjust `STEAM_MAX_QUEUE_SIZE`
- ✅ Tune rate limiting based on usage patterns
- ✅ Set appropriate timeouts
- ✅ Use health checks for automatic restarts

### 8.3 Reliability

- ✅ Enable automatic restarts in Coolify
- ✅ Set up monitoring alerts
- ✅ Keep logs for debugging
- ✅ Have backup Steam account ready

### 8.4 Scaling

**Horizontal Scaling:**

- Deploy multiple steam-service instances
- Each instance uses different Steam account
- Load balance requests across instances
- Update main app to use multiple service URLs

**Vertical Scaling:**

- Increase queue size
- Adjust rate limits
- Increase timeout values

## Step 9: Update Main App

After deploying steam service, update your main app:

1. **Add Environment Variables** (as shown in Step 3.1)
2. **Redeploy Main App** to pick up new variables
3. **Verify Integration** by testing inspect functionality
4. **Monitor Logs** for any connection issues

## Step 10: Rollback Plan

If something goes wrong:

1. **Disable Service**: Remove `STEAM_SERVICE_URL` from main app
2. **Redeploy Main App**: Falls back to local Steam client
3. **Fix Service**: Debug and fix steam service issues
4. **Re-enable**: Add `STEAM_SERVICE_URL` back when ready

## Quick Reference

### Service URLs

**Internal:**

```
http://steam-service:3001
```

**External:**

```
https://steam.yourdomain.com
```

### Health Check URLs

```
GET /api/health/live      # Liveness probe
GET /api/health/ready     # Readiness probe
GET /api/health           # Full health check
GET /api/status           # Service status
```

### Environment Variables Checklist

**Steam Service:**

- [ ] `STEAM_USERNAME`
- [ ] `STEAM_PASSWORD`
- [ ] `STEAM_API_KEY`
- [ ] `API_KEYS`
- [ ] `CORS_ORIGINS`
- [ ] `PORT=3001`

**Main App:**

- [ ] `STEAM_SERVICE_URL`
- [ ] `STEAM_SERVICE_API_KEY`

### Testing Commands

```bash
# Health check
curl http://steam-service:3001/api/health/live

# Status
curl http://steam-service:3001/api/status

# Test inspect (requires API key)
curl -X POST http://steam-service:3001/api/inspect/analyze-url \
  -H "X-API-Key: your_key" \
  -H "Content-Type: application/json" \
  -d '{"inspectUrl": "steam://..."}'
```

## Support

If you encounter issues:

1. Check service logs in Coolify
2. Verify all environment variables
3. Test health endpoints
4. Review this guide's troubleshooting section
5. Check main app logs for connection errors
