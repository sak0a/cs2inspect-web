# Steam Service Deployment Guide for Coolify/Nixpacks

This guide explains how to deploy the Steam Service alongside your existing Nuxt application in Coolify using Nixpacks.

## Overview

The Steam Service is a standalone Node.js service that provides shared Steam account access. This guide covers:
- Setting up the service in Coolify
- Network configuration
- Environment variables
- Exposing the service via subdomain/port
- Connecting the main Nuxt app to the service

## Prerequisites

- Coolify instance running
- Existing Nuxt app deployed via Nixpacks
- Domain or subdomain for the Steam Service (optional)
- Steam account credentials

## Deployment Options

### Option 1: Separate Application in Coolify (Recommended)

This creates a completely separate application that can be accessed independently.

#### Step 1: Create New Application

1. In Coolify, go to **Applications** → **New Application**
2. Name it: `steam-service` or `cs2inspect-steam-service`
3. Choose **Docker Compose** or **Dockerfile** deployment

#### Step 2: Configure Repository

1. **Repository URL**: Your Git repository URL
2. **Branch**: `master` or your main branch
3. **Build Pack**: Select **Dockerfile** (not Nixpacks)
4. **Dockerfile Path**: `services/steam-service/Dockerfile`
5. **Docker Context**: `services/steam-service`

#### Step 3: Configure Environment Variables

Add these environment variables in Coolify:

```env
# Server Configuration
PORT=3001
HOST=0.0.0.0
NODE_ENV=production

# Steam Account (REQUIRED)
STEAM_USERNAME=your_steam_username
STEAM_PASSWORD=your_steam_password
STEAM_API_KEY=your_steam_api_key

# API Security (REQUIRED)
# Generate a strong API key for your main app
API_KEYS=your_secure_api_key_here

# CORS Configuration
# Add your main app domain(s)
CORS_ORIGINS=https://your-main-app-domain.com,https://www.your-main-app-domain.com

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

#### Step 4: Configure Ports

1. In Coolify application settings, set:
   - **Port**: `3001`
   - **Expose Port**: `3001`

#### Step 5: Configure Domain/Subdomain (Optional but Recommended)

**Option A: Subdomain**
1. Add a subdomain: `steam-api.yourdomain.com`
2. Point it to the Steam Service application
3. Enable SSL/TLS in Coolify

**Option B: Port Access**
- Access via: `your-server-ip:3001`
- Less secure, but simpler setup

#### Step 6: Deploy

1. Click **Deploy** in Coolify
2. Monitor the build logs
3. Wait for deployment to complete

### Option 2: Docker Compose in Same Project

If you want to manage both services together:

#### Step 1: Update docker-compose.yml

Your existing `docker-compose.yml` should already include the steam-service (from our earlier setup). Ensure it's configured correctly.

#### Step 2: Deploy via Coolify

1. In your main application, ensure `docker-compose.yml` is in the root
2. Coolify will detect and deploy both services
3. Configure environment variables for both services

## Network Configuration

### Internal Network Communication

Both services should be on the same Docker network:

```yaml
# In docker-compose.yml
networks:
  app-network:
    driver: bridge
```

### Service Discovery

The main Nuxt app can reach the Steam Service via:

- **Same Docker Compose**: `http://steam-service:3001`
- **Separate Applications**: Use the subdomain or internal IP

## Environment Variables for Main App

Update your main Nuxt app's environment variables in Coolify:

```env
# Steam Service Configuration
STEAM_SERVICE_URL=https://steam-api.yourdomain.com
# OR if using internal network:
# STEAM_SERVICE_URL=http://steam-service:3001

STEAM_SERVICE_API_KEY=your_secure_api_key_here

# Remove or comment out these (no longer needed):
# STEAM_USERNAME=
# STEAM_PASSWORD=
```

## Testing the Deployment

### 1. Check Service Health

```bash
# Via subdomain
curl https://steam-api.yourdomain.com/api/health

# Via port (if exposed)
curl http://your-server-ip:3001/api/health
```

Expected response:
```json
{
  "status": "ok",
  "ready": true,
  "checks": {
    "steam_client": { "status": "ok" },
    "queue": { "status": "ok" }
  }
}
```

### 2. Test API Endpoint

```bash
curl -X POST https://steam-api.yourdomain.com/api/inspect/create-url \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your_secure_api_key_here" \
  -d '{
    "itemType": "weapon",
    "defindex": 7,
    "paintindex": 179
  }'
```

### 3. Test from Main App

1. Visit your main Nuxt app
2. Try creating an inspect URL
3. Check browser console for any errors
4. Verify requests are going to the Steam Service

## Troubleshooting

### Service Won't Start

**Check Logs in Coolify:**
1. Go to your Steam Service application
2. Click **Logs**
3. Look for initialization errors

**Common Issues:**
- Missing `STEAM_USERNAME` or `STEAM_PASSWORD`
- Invalid `API_KEYS` format
- Port 3001 already in use

### "Steam Client Unavailable" Errors

1. **Check Steam Credentials**: Verify they're correct in environment variables
2. **Check Logs**: Look for Steam connection errors
3. **Verify Account**: Ensure Steam account is not logged in elsewhere
4. **Check Network**: Ensure the service can reach Steam servers

### Connection Timeouts

1. **Check Service URL**: Verify `STEAM_SERVICE_URL` is correct
2. **Check Network**: Ensure services can communicate
3. **Check Firewall**: Ensure port 3001 is accessible
4. **Check SSL**: If using HTTPS, verify certificates are valid

### CORS Errors

1. **Check CORS_ORIGINS**: Ensure your main app domain is included
2. **Check Protocol**: Use `https://` for production domains
3. **Check Wildcards**: CORS doesn't support wildcards, list domains explicitly

## Security Best Practices

### 1. API Key Security

- Use strong, random API keys
- Never commit API keys to Git
- Rotate keys periodically
- Use different keys for different environments

### 2. Network Security

- Use HTTPS for production
- Restrict CORS origins to known domains
- Use internal Docker network when possible
- Consider VPN for internal services

### 3. Rate Limiting

- Adjust `RATE_LIMIT_MAX` based on your needs
- Monitor for abuse
- Consider per-API-key rate limiting (future enhancement)

## Monitoring

### Health Checks

Coolify can monitor the service health:

1. Go to application settings
2. Configure health check:
   - **Path**: `/api/health/ready`
   - **Interval**: 30 seconds
   - **Timeout**: 5 seconds

### Logs

Monitor logs in Coolify:
- Application logs show all requests
- Error logs show failures
- Steam client logs show connection status

### Metrics

Check service status:
```bash
curl https://steam-api.yourdomain.com/api/status
```

Returns:
- Steam client status
- Queue statistics
- Server uptime

## Scaling

### Horizontal Scaling

If you need multiple Steam Service instances:

1. **Different Steam Accounts**: Each instance uses a different account
2. **Load Balancing**: Use a load balancer to distribute requests
3. **Account Rotation**: Implement account rotation logic

### Vertical Scaling

Increase resources in Coolify:
- More CPU for faster processing
- More memory for larger queues
- Adjust `STEAM_MAX_QUEUE_SIZE` if needed

## Backup and Recovery

### Environment Variables

1. Export all environment variables from Coolify
2. Store them securely (password manager, secrets manager)
3. Document the setup process

### Configuration Backup

Keep a backup of:
- `docker-compose.yml` (if using)
- Environment variable list
- Domain/DNS configuration

## Migration from Local Client

### Step 1: Deploy Service

Deploy the Steam Service first and verify it works.

### Step 2: Update Main App

Add `STEAM_SERVICE_URL` and `STEAM_SERVICE_API_KEY` to main app environment variables.

### Step 3: Test

Test that the main app can communicate with the service.

### Step 4: Remove Local Client (Optional)

Once confirmed working, you can remove Steam credentials from the main app (they're no longer needed).

## Quick Reference

### Service URLs

- **Health**: `https://steam-api.yourdomain.com/api/health`
- **Status**: `https://steam-api.yourdomain.com/api/status`
- **Inspect**: `https://steam-api.yourdomain.com/api/inspect/*`

### Required Environment Variables

**Steam Service:**
- `STEAM_USERNAME`
- `STEAM_PASSWORD`
- `STEAM_API_KEY`
- `API_KEYS`

**Main App:**
- `STEAM_SERVICE_URL`
- `STEAM_SERVICE_API_KEY`

### Ports

- **Steam Service**: `3001`
- **Main App**: `3000` (or your configured port)

## Support

If you encounter issues:

1. Check Coolify logs
2. Verify environment variables
3. Test service endpoints directly
4. Check network connectivity
5. Review this documentation

For additional help, refer to:
- [Steam Service Setup Guide](./steam-service-setup.md)
- [Steam Service Implementation Plan](./steam-service-implementation-plan.md)
