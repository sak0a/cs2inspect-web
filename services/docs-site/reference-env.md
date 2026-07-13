# Environment Variables Reference

## Overview

CS2Inspect uses environment variables for configuration. This document provides a comprehensive reference of all available environment variables, their purposes, and recommended values.

## Configuration File

Environment variables are defined in a `.env` file in the project root. Create this file from the template:

```bash
cp .env.example .env
```

## Variable Categories

- [Server Configuration](#server-configuration)
- [JWT Authentication](#jwt-authentication)
- [Dev Mock Authentication](#dev-mock-authentication)
- [Database Configuration](#database-configuration)
- [Steam API Configuration](#steam-api-configuration)
- [Steam Service Client](#steam-service-client)
- [Assets & CDN](#assets--cdn)
- [Logging & Monitoring](#logging--monitoring)
- [Advanced Settings](#advanced-settings)

---

## Server Configuration

### `PORT`

**Type**: `number`
**Required**: Yes
**Default**: `3210`

Port number on which the server will listen for incoming connections.

**Example**:

```env
PORT=3210
```

**Notes**:

- Use non-privileged ports (1024-65535) for security
- Default is `3210` for the web app, `3211` for the steam service
- Must be available (not used by another service)
- Firewall must allow this port

---

### `HOST`

**Type**: `string`
**Required**: Yes
**Default**: `127.0.0.1`

Host address where the server will bind.

**Example**:

```env
# Local development (localhost only)
HOST=127.0.0.1

# Production (all network interfaces)
HOST=0.0.0.0
```

**Values**:

- `127.0.0.1` - Localhost only (development)
- `0.0.0.0` - All network interfaces (production)
- Specific IP - Bind to specific interface

**Security**:

- Use `127.0.0.1` for development
- Use `0.0.0.0` for production with reverse proxy
- Never expose directly to internet without reverse proxy

---

## JWT Authentication

### `JWT_TOKEN`

**Type**: `string`
**Required**: Yes
**Default**: None

Secret key for generating and verifying JWT tokens for API authentication.

**Example**:

```env
JWT_TOKEN=K32DJVFIRF93EDKKCSLFRPL2AO20E
```

**Security**:

- **CRITICAL**: Use a strong, random string (minimum 32 characters)
- **NEVER** commit to version control
- Rotate periodically (every 90 days)
- Different value per environment

**Generate secure token**:

```bash
# Using OpenSSL
openssl rand -hex 32

# Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Using Bun
bun -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

### `JWT_EXPIRY`

**Type**: `string`
**Required**: No
**Default**: `7d`

JWT token expiration time.

**Format**: `<number><unit>`

**Units**:

- `s` - seconds
- `m` - minutes
- `h` - hours
- `d` - days

**Examples**:

```env
# 1 hour
JWT_EXPIRY=1h

# 24 hours
JWT_EXPIRY=24h

# 7 days (default)
JWT_EXPIRY=7d

# 30 days
JWT_EXPIRY=30d
```

**Recommendations**:

- Development: `1h` or `24h`
- Production: `7d` or `14d`
- Consider security vs user convenience

---

## Dev Mock Authentication

::: danger Never enable in production
`DEV_AUTH_ENABLED` must only be `true` in local development. `validate-env` fails if it is set with `NODE_ENV=production`.
:::

Mock Steam login for local development and AI agents. Bypasses Steam OpenID while issuing the same JWT session cookie (`auth_token`).

### `DEV_AUTH_ENABLED`

**Type**: `boolean` (string `"true"` / `"false"`)
**Required**: No
**Default**: `false`

Master switch. Also requires `NODE_ENV !== production`.

```env
DEV_AUTH_ENABLED=true
```

### `DEV_MOCK_STEAMID`

**Type**: `string`
**Required**: No
**Default**: `76561198000000001`

SteamID64 for the default dev user.

### `DEV_MOCK_PERSONANAME`

**Type**: `string`
**Required**: No
**Default**: `Dev User`

Display name for the dev user.

### `DEV_MOCK_AVATAR`

**Type**: `url`
**Required**: No

Avatar URL for mock Steam API responses.

### `DEV_AUTH_USERNAME` / `DEV_AUTH_PASSWORD`

**Type**: `string`
**Required**: No

Optional credential gate for `POST /api/auth/dev/login`. When unset, dev login is open (still gated by `DEV_AUTH_ENABLED`).

```env
DEV_AUTH_USERNAME=dev
DEV_AUTH_PASSWORD=devpassword
```

### `DEV_MOCK_ADMIN_STEAMID`

**Type**: `string`
**Required**: No
**Default**: `76561198000000002`

SteamID64 for the dev admin. Logged-in admin is inserted into `admin_users`.

### `DEV_MOCK_ADMIN_PERSONANAME`

**Type**: `string`
**Required**: No
**Default**: `Dev Admin`

### `DEV_MOCK_ADMIN_ROLE`

**Type**: `admin` | `superadmin`
**Required**: No
**Default**: `superadmin`

Role written to `admin_users` when seeding or logging in as admin.

### `DEV_MOCK_ADMIN_USERNAME` / `DEV_MOCK_ADMIN_PASSWORD`

**Type**: `string`
**Required**: No

Separate credentials for admin dev login. Falls back to `DEV_AUTH_USERNAME` / `DEV_AUTH_PASSWORD` when unset.

```env
DEV_MOCK_ADMIN_USERNAME=admin
DEV_MOCK_ADMIN_PASSWORD=adminpassword
```

### Agent quick start

```bash
bun run cli dev:seed
bun run cli dev:login
bun run test:e2e

curl -c /tmp/cs2-cookies.txt -X POST http://127.0.0.1:3210/api/auth/dev/login \
  -H 'Content-Type: application/json' \
  -d '{"username":"dev","password":"devpassword"}'
```

E2E tests build Nuxt and verify the dev login flow. Optional DB-backed admin test: `E2E_WITH_DB=true bun run test:e2e`.

See `AGENTS.md` in the repository root for the full agent workflow.

---

## Database Configuration

### `DATABASE_HOST`

**Type**: `string`
**Required**: Yes
**Default**: None

Database server hostname or IP address.

**Example**:

```env
# Local development
DATABASE_HOST=127.0.0.1

# Docker Compose service (Coolify)
DATABASE_HOST=database

# Remote server
DATABASE_HOST=db.example.com
```

---

### `DATABASE_PORT`

**Type**: `number`
**Required**: Yes
**Default**: `3306`

Database server port number.

**Example**:

```env
DATABASE_PORT=3306
```

**Common Ports**:

- MySQL/MariaDB: `3306`
- PostgreSQL: `5432` (not currently supported)

---

### `DATABASE_USER`

**Type**: `string`
**Required**: Yes
**Default**: None

Database username for authentication.

**Example**:

```env
DATABASE_USER=csinspect
```

**Recommendations**:

- Create dedicated user for the application
- Grant only necessary privileges
- Different user per environment

---

### `DATABASE_PASSWORD`

**Type**: `string`
**Required**: Yes
**Default**: None

Database password for authentication.

**Example**:

```env
DATABASE_PASSWORD=securePassword123!
```

**Security**:

- **Use strong passwords** (16+ characters)
- Mix uppercase, lowercase, numbers, symbols
- Different password per environment
- Never commit to version control
- Rotate periodically

**Generate secure password**:

```bash
openssl rand -base64 24
```

---

### `DATABASE_NAME`

**Type**: `string`
**Required**: Yes
**Default**: None

Name of the database to use.

**Example**:

```env
DATABASE_NAME=csinspect
```

**Notes**:

- Database must exist before first run
- Different database per environment recommended
- Create with UTF-8 encoding:
  ```sql
  CREATE DATABASE csinspect CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
  ```

---

### `DATABASE_CONNECTION_LIMIT`

**Type**: `number`
**Required**: No
**Default**: `5`

Maximum number of concurrent database connections in the pool.

**Example**:

```env
# Development
DATABASE_CONNECTION_LIMIT=5

# Production (high traffic)
DATABASE_CONNECTION_LIMIT=20
```

**Tuning**:

- Development: `5-10`
- Small production: `10-20`
- High traffic: `20-50`
- Consider server capacity and database limits

---

## Steam API Configuration

### `STEAM_API_KEY`

**Type**: `string`
**Required**: Yes
**Default**: None

Steam Web API Key for user authentication and profile data.

**Required for**:

- User authentication via Steam OpenID
- Fetching user profile data
- Inventory information

**How to obtain**:

1. Visit [https://steamcommunity.com/dev/apikey](https://steamcommunity.com/dev/apikey)
2. Log in with Steam account
3. Register new API key
4. Domain can be `localhost` for development
5. Copy the generated key

**Example**:

```env
STEAM_API_KEY=KDBEDI9593393EFKSKDBE3992206Z
```

**Security**:

- Keep secure and never expose in client-side code
- Different key per environment recommended
- Monitor usage in Steam API dashboard

---

## Steam Service Client

### `STEAM_SERVICE_URL`

**Type**: `string`
**Required**: Recommended
**Default**: None

Base URL of the Steam Service Client API (microservice for Steam interactions).

**Benefits**:

- Load balancing across multiple app instances
- Separation of concerns
- Easier scaling and maintenance
- Better resource management

**Example**:

```env
# Local development
STEAM_SERVICE_URL=http://127.0.0.1:3211

# Docker Compose (Coolify)
STEAM_SERVICE_URL=http://steam-service:3211

# Production
STEAM_SERVICE_URL=https://steam-service.yourdomain.com
```

**Format**: `http://hostname:port` (no trailing slash)

**Notes**:

- If set, this takes precedence over `STEAM_USERNAME`/`STEAM_PASSWORD`
- See [Steam Service Documentation](./services-steam.md) for setup

---

### `STEAM_SERVICE_API_KEY`

**Type**: `string`
**Required**: If using `STEAM_SERVICE_URL`
**Default**: None

API key for authenticating requests to the Steam Service.

**Example**:

```env
STEAM_SERVICE_API_KEY=sKqBnyZjaWjBx62JXTzsGKq85rdLm6JKJ
```

**Security**:

- Must match key configured in Steam Service
- Use strong, random key
- Never expose in client-side code
- Different key per environment

**Generate**:

```bash
openssl rand -hex 32
```

---

### `STEAM_USERNAME` (Deprecated)

**Type**: `string`
**Required**: Only if not using Steam Service
**Default**: None

**⚠️ DEPRECATED**: Use `STEAM_SERVICE_URL` instead.

Steam account username for direct Steam client login.

**Example**:

```env
STEAM_USERNAME=csinspectuser
```

**Important**:

- Use dedicated account (not personal)
- Steam Guard (2FA) NOT supported
- Only used if `STEAM_SERVICE_URL` not set

---

### `STEAM_PASSWORD` (Deprecated)

**Type**: `string`
**Required**: Only if not using Steam Service
**Default**: None

**⚠️ DEPRECATED**: Use `STEAM_SERVICE_URL` instead.

Steam account password for direct Steam client login.

**Example**:

```env
STEAM_PASSWORD=securePassword123!
```

**Security**:

- Use strong password
- Never commit to version control
- Use dedicated account only

---

## Assets & CDN

### `ASSETS_URL`

**Type**: `string`
**Required**: No
**Default**: `https://assets.cu.sakoa.xyz/cs2inspect`

Base URL for static assets (stickers, charms, weapon images).

**Example**:

```env
# Development (local)
ASSETS_URL=http://localhost:3210

# Production (CDN)
ASSETS_URL=https://cdn.example.com/cs2inspect

# Self-hosted
ASSETS_URL=https://assets.yourdomain.com/cs2inspect
```

**Configured in**: `nuxt.config.ts` → `runtimeConfig.public.assetsUrl`

---

### `ASSETS_STICKER_PATH`

**Type**: `string`
**Required**: No
**Default**: `/stickers`

Path to sticker assets relative to `ASSETS_URL`.

**Example**:

```env
ASSETS_STICKER_PATH=/stickers
```

**Full URL**: `${ASSETS_URL}${ASSETS_STICKER_PATH}/{id}/{wear}.webp`

---

### `ASSETS_CHARMS_PATH`

**Type**: `string`
**Required**: No
**Default**: `/charms`

Path to charm assets relative to `ASSETS_URL`.

**Example**:

```env
ASSETS_CHARMS_PATH=/charms
```

---

### `ASSETS_WEAPONS_PATH`

**Type**: `string`
**Required**: No
**Default**: `/weapons`

Path to weapon images relative to `ASSETS_URL`.

**Example**:

```env
ASSETS_WEAPONS_PATH=/weapons
```

---

## Logging & Monitoring

### `LOG_LEVEL`

**Type**: `string`
**Required**: No
**Default**: `info`

Server log level.

**Allowed values**:

- `fatal`
- `error`
- `warn`
- `info`
- `debug`
- `trace`

**Example**:

```env
LOG_LEVEL=info
```

**Recommendations**:

- Development: `debug` or `info`
- Production: `info` or `warn`

---

### `LOG_FORMAT`

**Type**: `string`
**Required**: No
**Default**: `pretty` in development, `json` in production

Log output format.

**Allowed values**:

- `pretty` - human-readable output
- `json` - structured output for log aggregation

**Pretty output behavior**:

- Server logs are prefixed with compact tags like `[Health]`, `[Auth]`, `[DB]`, `[Boot]`, `[Sync]`
- Prefixes are generated from structured `tag/context` metadata
- Avoid manual `[Tag]` text in message strings

**Example**:

```env
# Development
LOG_FORMAT=pretty

# Production
LOG_FORMAT=json
```

---

### `LOG_API_REQUESTS`

**Type**: `boolean`
**Required**: No
**Default**: `false`

Enable detailed logging of API requests for debugging and monitoring.

**Example**:

```env
# Development
LOG_API_REQUESTS=true

# Production
LOG_API_REQUESTS=false
```

**Recommendations**:

- Development: `true`
- Staging: `true`
- Production: `false` (unless debugging)

**Notes**:

- Logs include request method, path, params
- Can increase log volume significantly
- May contain sensitive data

### Log Tag Catalog (Server)

| Context                        | Pretty Prefix |
| ------------------------------ | ------------- |
| `healthcheck`                  | `[Health]`    |
| `auth`                         | `[Auth]`      |
| `migrations`, `db`, `database` | `[DB]`        |
| `startup`                      | `[Boot]`      |
| `sync-cleanup`, `sync`         | `[Sync]`      |
| `csgo-api`                     | `[Data]`      |
| `gloves-api`                   | `[Gloves]`    |
| `skin-match`                   | `[Skin]`      |
| `stickers`                     | `[Img]`       |
| request logger default         | `[Req]`       |

Compact style example:

- `Sampler start interval=60s`
- `Request done statusCode=200 durationMs=12`

---

### `LOG_HEALTH_REQUESTS`

**Type**: `boolean`
**Required**: No
**Default**: `false`

Enable access logs for health endpoints (`/api/health`, `/health`, `/status`).

**Example**:

```env
LOG_HEALTH_REQUESTS=false
```

**Recommendations**:

- Development: `false` (unless debugging health probes)
- Staging: `true` (optional)
- Production: `false` (enable temporarily for incident debugging)

---

### `PROXY_HEALTH_BASE_URL`

**Type**: `string`
**Required**: Only if behind reverse proxy
**Default**: Auto-derived from `HOST`:`PORT`

Base URL used for image proxy health check endpoint.

**When to set**:

- App runs behind reverse proxy (nginx, Apache, Cloudflare)
- App accessed via different external URL than HOST:PORT
- Using load balancer or CDN

**When to leave empty**:

- App directly accessible at HOST:PORT
- Health check auto-derives URL

**Example**:

```env
# Local development
PROXY_HEALTH_BASE_URL=http://127.0.0.1:3210

# Production with reverse proxy
PROXY_HEALTH_BASE_URL=https://your-domain.com

# Subdomain setup
PROXY_HEALTH_BASE_URL=https://api.yourdomain.com
```

**Format**: Absolute URL with protocol (`http://` or `https://`)

---

## Advanced Settings

### `NODE_ENV`

**Type**: `string`
**Required**: No
**Default**: `development`

Node.js environment mode.

**Values**:

- `development` - Development mode
- `production` - Production mode
- `test` - Test environment

**Example**:

```env
NODE_ENV=production
```

**Effects**:

- Enables/disables certain features
- Changes logging levels
- Affects performance optimizations

---

### `NUXT_TELEMETRY_DISABLED`

**Type**: `boolean`
**Required**: No
**Default**: `false`

Disable Nuxt telemetry data collection.

**Example**:

```env
NUXT_TELEMETRY_DISABLED=true
```

---

## Example Configurations

### Development (`.env.development`)

```env
########## Server ##########
PORT=3210
HOST=127.0.0.1

########## JWT ##########
JWT_TOKEN=dev_token_K32DJVFIRF93EDKKCSLFRPL2AO20E
JWT_EXPIRY=24h

########## Database ##########
DATABASE_HOST=127.0.0.1
DATABASE_PORT=3306
DATABASE_USER=csinspect_dev
DATABASE_PASSWORD=dev_password_123
DATABASE_NAME=csinspect_dev
DATABASE_CONNECTION_LIMIT=5

########## Steam API ##########
STEAM_API_KEY=YOUR_STEAM_API_KEY_HERE

########## Steam Service ##########
STEAM_SERVICE_URL=http://127.0.0.1:3211
STEAM_SERVICE_API_KEY=dev_service_key_123

########## Assets ##########
ASSETS_URL=http://localhost:3210
ASSETS_STICKER_PATH=/stickers
ASSETS_CHARMS_PATH=/charms
ASSETS_WEAPONS_PATH=/weapons

########## Logging ##########
LOG_LEVEL=debug
LOG_FORMAT=pretty
LOG_API_REQUESTS=true
LOG_HEALTH_REQUESTS=false
PROXY_HEALTH_BASE_URL=http://127.0.0.1:3210

########## Advanced ##########
NODE_ENV=development
NUXT_TELEMETRY_DISABLED=true

########## Dev Auth (AI agents / local only) ##########
DEV_AUTH_ENABLED=true
DEV_AUTH_USERNAME=dev
DEV_AUTH_PASSWORD=devpassword
DEV_MOCK_ADMIN_USERNAME=admin
DEV_MOCK_ADMIN_PASSWORD=adminpassword
```

---

### Production (`.env.production`)

```env
########## Server ##########
PORT=3210
HOST=0.0.0.0

########## JWT ##########
JWT_TOKEN=prod_token_RANDOM_64_CHAR_STRING_HERE
JWT_EXPIRY=7d

########## Database ##########
DATABASE_HOST=db.internal.yourdomain.com
DATABASE_PORT=3306
DATABASE_USER=csinspect_prod
DATABASE_PASSWORD=STRONG_RANDOM_PASSWORD_HERE
DATABASE_NAME=csinspect_production
DATABASE_CONNECTION_LIMIT=20

########## Steam API ##########
STEAM_API_KEY=PRODUCTION_STEAM_API_KEY

########## Steam Service ##########
STEAM_SERVICE_URL=https://steam-service.yourdomain.com
STEAM_SERVICE_API_KEY=PRODUCTION_SERVICE_API_KEY

########## Assets ##########
ASSETS_URL=https://cdn.yourdomain.com/cs2inspect
ASSETS_STICKER_PATH=/stickers
ASSETS_CHARMS_PATH=/charms
ASSETS_WEAPONS_PATH=/weapons

########## Logging ##########
LOG_LEVEL=info
LOG_FORMAT=json
LOG_API_REQUESTS=false
LOG_HEALTH_REQUESTS=false
PROXY_HEALTH_BASE_URL=https://cs2inspect.yourdomain.com

########## Advanced ##########
NODE_ENV=production
NUXT_TELEMETRY_DISABLED=true
```

---

### Docker Compose (Coolify)

::: tip Coolify Env Var Prefixes
When deploying with `docker-compose.coolify.yml`, environment variables use prefixes (`SHARED_*`, `DB_*`, `SS_*`, `WEB_*`) to avoid name collisions. The compose file maps them to the underlying variable names shown here. See the [Coolify Deployment Guide](./coolify.md) for details.
:::

```env
########## Server ##########
PORT=3210
HOST=0.0.0.0

########## JWT ##########
JWT_TOKEN=docker_token_RANDOM_STRING_HERE
JWT_EXPIRY=7d

########## Database ##########
DATABASE_HOST=database
DATABASE_PORT=3306
DATABASE_USER=csinspect
DATABASE_PASSWORD=DOCKER_DB_PASSWORD
DATABASE_NAME=csinspect
DATABASE_CONNECTION_LIMIT=10

########## Steam API ##########
STEAM_API_KEY=YOUR_STEAM_API_KEY

########## Steam Service ##########
STEAM_SERVICE_URL=http://steam-service:3211
STEAM_SERVICE_API_KEY=DOCKER_SERVICE_KEY

########## Assets ##########
ASSETS_URL=http://localhost:3210
ASSETS_STICKER_PATH=/stickers
ASSETS_CHARMS_PATH=/charms
ASSETS_WEAPONS_PATH=/weapons

########## Logging ##########
LOG_LEVEL=info
LOG_FORMAT=json
LOG_API_REQUESTS=true
LOG_HEALTH_REQUESTS=false
PROXY_HEALTH_BASE_URL=http://localhost:3210

########## Advanced ##########
NODE_ENV=production
```

---

## Validation

The application uses `@t3-oss/env-nuxt` with Zod schemas for environment variable validation. The validation is defined in `server/env.ts` using `createEnv()` with Zod schemas for type-safe runtime validation.

**Validation rules**:

- Required variables must be set
- Type checking enforced
- Format validation for specific variables

**Error messages**:

```
❌ Invalid environment variables: {
  "JWT_TOKEN": "Required"
}
```

---

## Security Best Practices

### 1. **Never Commit Secrets**

Add to `.gitignore`:

```gitignore
.env
.env.local
.env.production
.env.*.local
```

### 2. **Use Strong Random Values**

Generate secure values:

```bash
# For JWT_TOKEN, STEAM_SERVICE_API_KEY
openssl rand -hex 32

# For DATABASE_PASSWORD
openssl rand -base64 24
```

### 3. **Different Values Per Environment**

```
Development:  dev_jwt_abc123...
Staging:      staging_jwt_def456...
Production:   prod_jwt_xyz789...
```

### 4. **Rotate Regularly**

Schedule for sensitive values:

- JWT tokens: Every 90 days
- Database passwords: Every 180 days
- API keys: Yearly or on suspected compromise

### 5. **Use Secret Management**

For production, consider:

- Docker Secrets
- Kubernetes Secrets
- HashiCorp Vault
- AWS Secrets Manager
- Azure Key Vault

---

## Troubleshooting

### Variable Not Loading

**Check**:

1. Variable defined in `.env`
2. No spaces around `=`
3. File in correct location (project root)
4. Server restarted after changes

### Type Errors

```typescript
// Environment variables are typed
const port = process.env.PORT // Type: string | undefined
const portNum = Number(process.env.PORT) // Type: number
```

### Missing Required Variables

Application will fail to start with clear error:

```
Error: Missing required environment variables:
- JWT_TOKEN
- DATABASE_HOST
```

---

## Related Documentation

- [Setup Guide](./setup.md) - Initial setup instructions
- [Deployment Guide](./deployment.md) - Deployment strategies
- [Self-Hosting](./self-hosting.md) - Self-hosting instructions
- [Steam Service](./services-steam.md) - Steam service configuration

---

## Contributing

When adding new environment variables:

1. **Add to `.env.example`** with comments
2. **Document here** with full details
3. **Add validation** in env config
4. **Update setup guide** if needed
5. **Consider backward compatibility**
