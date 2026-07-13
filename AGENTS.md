# Agent Guide

Instructions for AI agents and automated tooling working on CS2Inspect Web.

## Dev mock authentication

Agents cannot complete the Steam OpenID browser redirect. Use **dev mock auth** instead when `DEV_AUTH_ENABLED=true` in `.env` (development only — never in production).

### 1. Enable in `.env`

```env
DEV_AUTH_ENABLED=true
DEV_AUTH_USERNAME=dev
DEV_AUTH_PASSWORD=devpassword
DEV_MOCK_ADMIN_USERNAME=admin
DEV_MOCK_ADMIN_PASSWORD=adminpassword
```

### 2. Seed mock users (optional)

Creates the dev admin row in `admin_users`:

```bash
bun run cli dev:seed
```

### 3. Log in via API

**Dev user:**

```bash
curl -c /tmp/cs2-cookies.txt -X POST http://127.0.0.1:3210/api/auth/dev/login \
  -H 'Content-Type: application/json' \
  -d '{"username":"dev","password":"devpassword"}'
```

**Dev admin:**

```bash
curl -c /tmp/cs2-cookies.txt -X POST http://127.0.0.1:3210/api/auth/dev/login \
  -H 'Content-Type: application/json' \
  -d '{"username":"admin","password":"adminpassword","as":"admin"}'
```

Or print ready-made curl commands:

```bash
bun run cli dev:login
bun run cli dev:login:admin
```

### 4. Call authenticated APIs

```bash
curl -b /tmp/cs2-cookies.txt http://127.0.0.1:3210/api/loadouts
curl -b /tmp/cs2-cookies.txt http://127.0.0.1:3210/api/admin/stats/overview
```

Auth is cookie-based: the login response sets an HTTP-only `auth_token` JWT cookie.

### Default mock identities

| Role | SteamID | DB table |
|------|---------|----------|
| User | `76561198000000001` | — (JWT only) |
| Admin | `76561198000000002` | `admin_users` (superadmin) |

Reserved SteamID block: `76561198000000XXX`. Override via `DEV_MOCK_STEAMID`, `DEV_MOCK_ADMIN_STEAMID`, etc.

### Browser UI

When dev auth is enabled, `/dev` shows **Login as Dev User** and **Login as Dev Admin** buttons.

### Security rules for agents

- Do **not** set `DEV_AUTH_ENABLED=true` in production configs.
- `validate-env` errors if dev auth is enabled with `NODE_ENV=production`.
- Dev JWTs use `type: "dev_auth"` and are rejected when dev auth is off.
- The dev login endpoint returns **404** when disabled.

## E2E tests

API-level e2e tests live in `test/e2e/` and use `@nuxt/test-utils` with Bun:

```bash
bun run test:e2e
```

These build Nuxt, start a test server, and verify dev login, session cookies, protected routes, and mock Steam profiles. They are excluded from `bun test` (see `bunfig.toml`) because they are slower.

Optional database-backed admin test:

```bash
E2E_WITH_DB=true bun run test:e2e
```

Requires a running MariaDB matching `.env` database settings.

## Key files

| File | Purpose |
|------|---------|
| `server/utils/devAuth.ts` | Core dev auth helpers |
| `server/api/auth/dev/login.post.ts` | Login endpoint |
| `scripts/dev-auth.ts` | CLI seed/login helpers |
| `services/steamAuth.ts` | Client `devLogin()` method |

## See also

- `CLAUDE.md` — project conventions and gotchas
- `services/docs-site/api/authentication.md` — full auth documentation
- `services/docs-site/reference-env.md` — all `DEV_*` environment variables
