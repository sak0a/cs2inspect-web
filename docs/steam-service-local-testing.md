# Steam Service Local Testing Guide

This guide explains how to run and test the Steam Service locally alongside your main Nuxt application for development and testing purposes.

## Overview

When testing locally, you'll run:
1. **Steam Service** - Standalone service on port 3001 (or custom port)
2. **Main Nuxt App** - Your main application on port 3000 (or custom port)

Both services run on your local machine and communicate via HTTP.

```
┌─────────────────────────────────────────────────┐
│           Local Development Setup                │
│                                                  │
│  ┌──────────────────┐      ┌──────────────────┐ │
│  │  Main Nuxt App   │─────▶│  Steam Service   │ │
│  │  Port: 3000      │ HTTP │  Port: 3001      │ │
│  │  http://local... │      │  http://local... │ │
│  └──────────────────┘      └──────────────────┘ │
│         │                           │            │
│         └───────────┬───────────────┘            │
│                     ▼                            │
│            Steam Network                         │
└─────────────────────────────────────────────────┘
```

## Prerequisites

- **Bun** installed (package manager)
- **Steam Account** credentials ready
- **Steam API Key** from [Steam Web API](https://steamcommunity.com/dev/apikey)
- Both services cloned/available in your project

## Step 1: Set Up Steam Service

### 1.1 Navigate to Service Directory

```bash
cd services/steam-service
```

### 1.2 Install Dependencies

```bash
bun install
```

### 1.3 Create Environment File

Create a `.env` file in `services/steam-service/`:

```bash
cp .env.example .env
```

Or create it manually:

```env
# Server Configuration
PORT=3001
HOST=0.0.0.0
NODE_ENV=development

# Steam Account Configuration (Required)
STEAM_USERNAME=your_steam_username
STEAM_PASSWORD=your_steam_password
STEAM_API_KEY=your_steam_api_key

# API Security
# Generate a strong random key: openssl rand -hex 32
API_KEYS=your_local_test_api_key_here

# CORS Configuration
# Add your main app's URL
CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000

# Logging (Helpful for debugging)
LOG_API_REQUESTS=true
LOG_LEVEL=debug

# Rate Limiting (Optional - adjust for local testing)
RATE_LIMIT_MAX=100
RATE_LIMIT_WINDOW=60000

# Steam Client Configuration (Optional)
STEAM_RATE_LIMIT_DELAY=1500
STEAM_MAX_QUEUE_SIZE=100
STEAM_REQUEST_TIMEOUT=10000
STEAM_QUEUE_TIMEOUT=30000
```

**Important Notes:**
- Replace `your_steam_username`, `your_steam_password`, and `your_steam_api_key` with your actual credentials
- Generate a secure API key: `openssl rand -hex 32`
- Use the same API key in both services (see Step 2)

### 1.4 Start the Steam Service

**Development Mode (with hot reload):**
```bash
bun run dev
```

**Production Mode:**
```bash
bun run build
bun start
```

You should see output like:
```
Steam service started on http://0.0.0.0:3001
Steam client initialized successfully
```

### 1.5 Verify Service is Running

Open a new terminal and test the health endpoint:

```bash
curl http://localhost:3001/api/health/live
```

Expected response:
```json
{
  "status": "ok",
  "alive": true,
  "timestamp": "2024-..."
}
```

## Step 2: Configure Main App

### 2.1 Add Environment Variables

Add these to your main app's `.env` file (in the project root):

```env
# Steam Service Configuration
STEAM_SERVICE_URL=http://localhost:3001
STEAM_SERVICE_API_KEY=your_local_test_api_key_here
```

**Important:** The `STEAM_SERVICE_API_KEY` must match one of the keys in the `API_KEYS` list in the steam service `.env` file!

### 2.2 Verify Configuration

Check that your main app can access the service:

```bash
# From project root
curl http://localhost:3001/api/status
```

## Step 3: Start Main App

### 3.1 Start Development Server

```bash
# From project root
bun run dev
```

### 3.2 Verify Integration

Check the console output. You should see:
- No errors about Steam client initialization
- Messages indicating the service is being used (if logging is enabled)

## Step 4: Test the Integration

### 4.1 Test Health Endpoints

**From Terminal:**
```bash
# Service health
curl http://localhost:3001/api/health

# Service status
curl http://localhost:3001/api/status

# Steam client status
curl http://localhost:3001/api/status/steam-client
```

### 4.2 Test Inspect Endpoint

**Create Inspect URL:**
```bash
curl -X POST http://localhost:3001/api/inspect/create-url \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your_local_test_api_key_here" \
  -d '{
    "itemType": "weapon",
    "defindex": 7,
    "paintindex": 179,
    "paintseed": 661,
    "paintwear": 0.15
  }'
```

**Analyze URL:**
```bash
curl -X POST http://localhost:3001/api/inspect/analyze-url \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your_local_test_api_key_here" \
  -d '{
    "inspectUrl": "steam://rungame/730/76561202255233023/+csgo_econ_action_preview%20M4A1-S"
  }'
```

### 4.3 Test from Main App UI

1. Open your main app in browser: `http://localhost:3000`
2. Navigate to a page that uses inspect functionality
3. Try to inspect an item
4. Check browser DevTools Network tab for requests to `http://localhost:3001`
5. Verify the inspect works correctly

### 4.4 Monitor Logs

**Steam Service Logs:**
Watch the terminal where the steam service is running. You should see:
- Incoming API requests
- Steam client activity
- Any errors

**Main App Logs:**
Check the main app console for:
- Successful connections to steam service
- Any timeout or connection errors

## Step 5: Verify Service is Being Used

### 5.1 Check Service Logs

When you use inspect functionality in the main app, you should see requests in the steam service logs:

```
[INFO] POST /api/inspect/analyze-url
[INFO] POST /api/inspect/inspect-item
```

### 5.2 Check Main App Behavior

- Inspect functionality should work normally
- No "LoggedInElsewhere" errors (if using service)
- Faster response times (service handles queue)

### 5.3 Disable Service to Test Fallback

Temporarily remove or comment out the environment variables:

```env
# STEAM_SERVICE_URL=http://localhost:3001
# STEAM_SERVICE_API_KEY=your_local_test_api_key_here
```

Restart the main app. It should fall back to using the local Steam client (if configured).

## Troubleshooting

### Service Won't Start

**Check Port Availability:**
```bash
# Check if port 3001 is in use
lsof -i :3001

# Or use a different port
PORT=3002 bun run dev
```

**Check Environment Variables:**
```bash
cd services/steam-service
cat .env
```

Ensure all required variables are set.

**Check Logs:**
Look for error messages in the service startup logs.

### "Invalid API Key" Errors

**Verify API Key Match:**
1. Check `API_KEYS` in `services/steam-service/.env`
2. Check `STEAM_SERVICE_API_KEY` in main app `.env`
3. They must match exactly (including any commas if multiple keys)

**Test API Key:**
```bash
curl -X POST http://localhost:3001/api/inspect/analyze-url \
  -H "X-API-Key: your_key_here" \
  -H "Content-Type: application/json" \
  -d '{"inspectUrl": "test"}'
```

If you get 401, the key is wrong.

### "Connection Refused" or Timeout Errors

**Check Service is Running:**
```bash
curl http://localhost:3001/api/health/live
```

**Check URL in Main App:**
Verify `STEAM_SERVICE_URL` in main app `.env` is correct:
- Should be `http://localhost:3001` (not `https://`)
- Port must match the service port

**Check CORS:**
Ensure `CORS_ORIGINS` in steam service includes your main app URL:
```env
CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
```

### Steam Client Not Connecting

**Check Credentials:**
- Verify `STEAM_USERNAME` and `STEAM_PASSWORD` are correct
- Ensure account is not logged in elsewhere
- Check `STEAM_API_KEY` is valid

**Check Service Logs:**
Look for Steam connection errors:
```
[ERROR] Failed to initialize Steam client: LoggedInElsewhere
[ERROR] Failed to initialize Steam client: InvalidPassword
```

**Common Issues:**
- Account logged in on Steam client → Log out from Steam
- Wrong credentials → Double-check username/password
- Steam Guard enabled → May need to disable or handle 2FA

### Main App Still Using Local Client

**Check Environment Variables:**
```bash
# From project root
cat .env | grep STEAM_SERVICE
```

**Restart Main App:**
Environment variables are loaded on startup. Restart the dev server after changing `.env`.

**Check Code:**
Verify the main app is checking for service configuration:
```typescript
// Should be in server/plugins/init.ts
const useSteamService = !!(process.env.STEAM_SERVICE_URL && process.env.STEAM_SERVICE_API_KEY);
```

### Port Conflicts

**Change Steam Service Port:**
1. Update `PORT=3002` in `services/steam-service/.env`
2. Update `STEAM_SERVICE_URL=http://localhost:3002` in main app `.env`
3. Restart both services

**Change Main App Port:**
1. Update `PORT=3001` in main app `.env` (or `nuxt.config.ts`)
2. Update `CORS_ORIGINS` in steam service to include new port
3. Restart both services

## Development Workflow

### Running Both Services

**Option 1: Two Terminal Windows**

Terminal 1 (Steam Service):
```bash
cd services/steam-service
bun run dev
```

Terminal 2 (Main App):
```bash
# From project root
bun run dev
```

**Option 2: Background Process**

Terminal 1:
```bash
cd services/steam-service
bun run dev &
cd ../..
bun run dev
```

**Option 3: Use a Process Manager**

Install `concurrently`:
```bash
bun add -d concurrently
```

Add to `package.json`:
```json
{
  "scripts": {
    "dev:all": "concurrently \"bun run dev\" \"cd services/steam-service && bun run dev\""
  }
}
```

Run:
```bash
bun run dev:all
```

### Hot Reload

Both services support hot reload:
- **Steam Service**: Uses `bun --watch` (automatic)
- **Main App**: Uses Nuxt's built-in HMR (automatic)

Changes to either service will automatically reload.

### Debugging

**Enable Verbose Logging:**

Steam Service `.env`:
```env
LOG_LEVEL=debug
LOG_API_REQUESTS=true
```

**Check Network Requests:**

1. Open browser DevTools
2. Go to Network tab
3. Filter by `localhost:3001`
4. Inspect requests/responses

**Check Service Status:**

```bash
# Real-time status
watch -n 1 'curl -s http://localhost:3001/api/status | jq'
```

## Testing Checklist

- [ ] Steam service starts without errors
- [ ] Health endpoint returns 200
- [ ] Main app connects to service
- [ ] API key authentication works
- [ ] Inspect URL creation works
- [ ] Inspect item functionality works
- [ ] No "LoggedInElsewhere" errors
- [ ] Queue management works
- [ ] Error handling works correctly
- [ ] Fallback to local client works (when service disabled)

## Common Local Testing Scenarios

### Scenario 1: Test Service Without Steam Account

You can test most endpoints without a Steam account:

```bash
# These work without Steam:
curl -X POST http://localhost:3001/api/inspect/create-url \
  -H "X-API-Key: your_key" \
  -H "Content-Type: application/json" \
  -d '{"itemType": "weapon", "defindex": 7}'

curl -X POST http://localhost:3001/api/inspect/analyze-url \
  -H "X-API-Key: your_key" \
  -H "Content-Type: application/json" \
  -d '{"inspectUrl": "steam://..."}'

curl -X POST http://localhost:3001/api/inspect/validate-url \
  -H "X-API-Key: your_key" \
  -H "Content-Type: application/json" \
  -d '{"inspectUrl": "steam://..."}'
```

### Scenario 2: Test with Steam Account

For full testing with unmasked URLs:

1. Ensure Steam credentials are in `.env`
2. Service will initialize Steam client on startup
3. Test unmasked URL inspection:
```bash
curl -X POST http://localhost:3001/api/inspect/inspect-item \
  -H "X-API-Key: your_key" \
  -H "Content-Type: application/json" \
  -d '{
    "inspectUrl": "steam://rungame/730/76561202255233023/+csgo_econ_action_preview%20S123456A789D123",
    "itemType": "weapon"
  }'
```

### Scenario 3: Test Queue and Rate Limiting

Send multiple rapid requests:

```bash
for i in {1..10}; do
  curl -X POST http://localhost:3001/api/inspect/analyze-url \
    -H "X-API-Key: your_key" \
    -H "Content-Type: application/json" \
    -d '{"inspectUrl": "steam://..."}' &
done
wait
```

Check queue status:
```bash
curl http://localhost:3001/api/status/queue
```

## Quick Reference

### Service URLs

- **Health**: `http://localhost:3001/api/health/live`
- **Status**: `http://localhost:3001/api/status`
- **Inspect**: `http://localhost:3001/api/inspect/*`

### Environment Variables

**Steam Service** (`services/steam-service/.env`):
- `PORT=3001`
- `STEAM_USERNAME=...`
- `STEAM_PASSWORD=...`
- `STEAM_API_KEY=...`
- `API_KEYS=your_key`
- `CORS_ORIGINS=http://localhost:3000`

**Main App** (`.env`):
- `STEAM_SERVICE_URL=http://localhost:3001`
- `STEAM_SERVICE_API_KEY=your_key`

### Useful Commands

```bash
# Start steam service
cd services/steam-service && bun run dev

# Start main app
bun run dev

# Test service health
curl http://localhost:3001/api/health/live

# Test API endpoint
curl -X POST http://localhost:3001/api/inspect/analyze-url \
  -H "X-API-Key: your_key" \
  -H "Content-Type: application/json" \
  -d '{"inspectUrl": "steam://..."}'

# Check service status
curl http://localhost:3001/api/status | jq

# View service logs (if running in foreground)
# Check terminal output
```

## Next Steps

After successful local testing:

1. **Deploy to Production**: Follow [Coolify Setup Guide](./steam-service-coolify-setup.md)
2. **Monitor Performance**: Check queue stats and response times
3. **Scale if Needed**: Deploy multiple service instances for higher load
4. **Update Documentation**: Document any custom configurations

## Additional Resources

- [Steam Service Setup](./steam-service-setup.md) - General setup guide
- [Coolify Deployment](./steam-service-coolify-setup.md) - Production deployment
- [Service README](../services/steam-service/README.md) - API documentation
- [Implementation Plan](./steam-service-implementation-plan.md) - Architecture details
