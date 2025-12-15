# Steam Service Troubleshooting Guide

This guide helps you diagnose and fix common issues with the Steam Service, particularly Steam client connection problems.

## Common Issues

### Steam Connection Timeout

**Symptoms:**
```
SteamTimeoutError: Steam connection timeout
Failed to initialize Steam client: Steam connection timeout
```

**Possible Causes:**
1. Network connectivity issues to Steam servers
2. Steam servers are slow or overloaded
3. Firewall blocking Steam connections
4. Steam Guard/2FA blocking automated login
5. Account is logged in elsewhere
6. Invalid credentials

**Solutions:**

#### 1. Check Network Connectivity

Test if you can reach Steam servers:
```bash
# Test Steam Web API
curl https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key=YOUR_API_KEY&steamids=76561198000000000

# Test Steam Community
curl https://steamcommunity.com/
```

#### 2. Verify Credentials

Check your `.env` file:
```bash
cd services/steam-service
cat .env | grep STEAM
```

Ensure:
- `STEAM_USERNAME` is correct (no extra spaces)
- `STEAM_PASSWORD` is correct (no extra spaces, special characters properly escaped)
- `STEAM_API_KEY` is valid (get from https://steamcommunity.com/dev/apikey)

#### 3. Check Account Status

**Steam Guard:**
- If Steam Guard is enabled, you may need to disable it for automated logins
- Or use a Steam Guard code if the library supports it

**Logged In Elsewhere:**
- Ensure the account is not logged into Steam client on another machine
- Log out from all Steam clients before starting the service

#### 4. Increase Timeout Values

Add to `services/steam-service/.env`:
```env
# Increase initialization timeout (default: 120000ms = 2 minutes)
STEAM_INIT_TIMEOUT=180000

# Increase request timeout (default: 30000ms = 30 seconds)
STEAM_REQUEST_TIMEOUT=60000

# Increase queue timeout (default: 60000ms = 1 minute)
STEAM_QUEUE_TIMEOUT=120000

# Increase retry attempts (default: 2)
STEAM_INIT_RETRIES=3
```

#### 5. Enable Detailed Logging

Add to `.env`:
```env
LOG_LEVEL=debug
LOG_API_REQUESTS=true
```

This will show more detailed information about the connection process.

#### 6. Test Without Steam Client

The service can run without Steam client for testing masked URLs:

Temporarily comment out credentials:
```env
# STEAM_USERNAME=your_username
# STEAM_PASSWORD=your_password
```

The service will start and work for masked URL operations (create-url, analyze-url, validate-url, decode-masked-only).

### Service Starts But Steam Client Fails

**Good News:** The service will start even if Steam client fails. You can still use:
- `POST /api/inspect/create-url` - Create inspect URLs
- `POST /api/inspect/analyze-url` - Analyze URL structure
- `POST /api/inspect/validate-url` - Validate URLs
- `POST /api/inspect/decode-masked-only` - Decode masked URLs
- `POST /api/inspect/decode-hex-data` - Decode hex data

**What Won't Work:**
- `POST /api/inspect/inspect-item` with unmasked URLs (requires Steam client)

**Check Status:**
```bash
curl http://localhost:3001/api/status/steam-client
```

### Invalid API Key Errors

**Symptoms:**
```
INVALID_API_KEY
401 Unauthorized
```

**Solutions:**

1. **Verify API Key Match:**
   - Check `API_KEYS` in `services/steam-service/.env`
   - Check `STEAM_SERVICE_API_KEY` in main app `.env`
   - They must match exactly

2. **Check for Extra Spaces:**
   ```bash
   # In steam service .env
   API_KEYS=your_key_here  # No spaces around =
   
   # In main app .env
   STEAM_SERVICE_API_KEY=your_key_here  # No spaces
   ```

3. **Test API Key:**
   ```bash
   curl -X POST http://localhost:3001/api/inspect/analyze-url \
     -H "X-API-Key: your_key" \
     -H "Content-Type: application/json" \
     -d '{"inspectUrl": "test"}'
   ```

### Connection Refused

**Symptoms:**
```
ECONNREFUSED
Connection refused
```

**Solutions:**

1. **Check Service is Running:**
   ```bash
   curl http://localhost:3001/api/health/live
   ```

2. **Check Port:**
   ```bash
   lsof -i :3001
   ```

3. **Verify URL:**
   - Main app `.env`: `STEAM_SERVICE_URL=http://localhost:3001`
   - No `https://` for local testing
   - Port must match service port

### Rate Limit Errors

**Symptoms:**
```
RATE_LIMIT_EXCEEDED
Queue is full
```

**Solutions:**

1. **Increase Rate Limits:**
   ```env
   RATE_LIMIT_MAX=200
   RATE_LIMIT_WINDOW=60000
   ```

2. **Increase Queue Size:**
   ```env
   STEAM_MAX_QUEUE_SIZE=200
   ```

3. **Increase Delays:**
   ```env
   STEAM_RATE_LIMIT_DELAY=2000
   ```

## Diagnostic Commands

### Check Service Health

```bash
# Liveness
curl http://localhost:3001/api/health/live

# Readiness
curl http://localhost:3001/api/health/ready

# Full status
curl http://localhost:3001/api/status
```

### Check Steam Client Status

```bash
curl http://localhost:3001/api/status/steam-client
```

Expected when working:
```json
{
  "available": true,
  "status": "connected",
  "message": "Steam client is ready"
}
```

Expected when failed:
```json
{
  "available": false,
  "status": "not_initialized",
  "message": "Steam client has not been initialized"
}
```

### Check Queue Status

```bash
curl http://localhost:3001/api/status/queue
```

### Test API Endpoint

```bash
curl -X POST http://localhost:3001/api/inspect/create-url \
  -H "X-API-Key: your_key" \
  -H "Content-Type: application/json" \
  -d '{
    "itemType": "weapon",
    "defindex": 7,
    "paintindex": 179
  }'
```

## Environment Variable Checklist

**Steam Service** (`services/steam-service/.env`):
- [ ] `PORT=3001` (or your port)
- [ ] `STEAM_USERNAME=...` (no spaces)
- [ ] `STEAM_PASSWORD=...` (no spaces, properly escaped)
- [ ] `STEAM_API_KEY=...` (valid API key)
- [ ] `API_KEYS=...` (comma-separated, no spaces)
- [ ] `CORS_ORIGINS=http://localhost:3000` (includes your main app URL)

**Main App** (`.env`):
- [ ] `STEAM_SERVICE_URL=http://localhost:3001` (matches service port)
- [ ] `STEAM_SERVICE_API_KEY=...` (matches one of the keys in service)

## Advanced Troubleshooting

### Enable Verbose Logging

```env
LOG_LEVEL=debug
LOG_API_REQUESTS=true
```

### Test Steam Connection Manually

You can test if Steam credentials work by using the Steam client directly:

```bash
# This is just for testing - the service handles this automatically
node -e "
const { CS2Inspect } = require('cs2-inspect-lib');
const client = new CS2Inspect({
  steamClient: {
    username: process.env.STEAM_USERNAME,
    password: process.env.STEAM_PASSWORD,
    apiKey: process.env.STEAM_API_KEY,
    enabled: true
  }
});
client.initializeSteamClient().then(() => {
  console.log('Success!');
  process.exit(0);
}).catch(err => {
  console.error('Failed:', err.message);
  process.exit(1);
});
"
```

### Check for Port Conflicts

```bash
# Check what's using port 3001
lsof -i :3001

# Or use a different port
PORT=3002 bun run dev
```

### Verify .env File Loading

Add temporary logging to verify env vars are loaded:

```typescript
// In src/utils/config.ts (temporary)
console.log('STEAM_USERNAME length:', config.steam.username.length);
console.log('STEAM_PASSWORD length:', config.steam.password.length);
console.log('STEAM_API_KEY length:', config.steam.apiKey.length);
```

## Common Error Messages

| Error | Cause | Solution |
|-------|-------|----------|
| `SteamTimeoutError` | Connection timeout | Increase `STEAM_INIT_TIMEOUT`, check network |
| `InvalidPassword` | Wrong password | Verify password in `.env` |
| `LoggedInElsewhere` | Account in use | Log out from other Steam clients |
| `INVALID_API_KEY` | API key mismatch | Verify keys match in both `.env` files |
| `ECONNREFUSED` | Service not running | Start the service |
| `RATE_LIMIT_EXCEEDED` | Too many requests | Increase rate limits or wait |

## Getting Help

If issues persist:

1. **Check Logs:**
   - Service logs: Terminal where service is running
   - Main app logs: Terminal where main app is running
   - Browser console: For frontend errors

2. **Verify Configuration:**
   - All environment variables are set
   - No typos in variable names
   - No extra spaces in values

3. **Test Incrementally:**
   - Start with service only (test health endpoints)
   - Then test API endpoints
   - Finally test main app integration

4. **Check Documentation:**
   - [Local Testing Guide](./steam-service-local-testing.md)
   - [Setup Guide](./steam-service-setup.md)
   - [Service README](../services/steam-service/README.md)
