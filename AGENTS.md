# AGENTS.md

See `CLAUDE.md` for the project overview, tech stack, conventions, ports, and known pre-existing issues. This file adds environment/run notes for AI agents.

## Cursor Cloud specific instructions

The startup update script runs `bun install` (root) and `bun install --cwd services/steam-service`. Everything below is NOT handled automatically and must be done by the agent when needed.

### Toolchain
- Package manager/runtime is **Bun** (installed at `~/.bun`). It is only on `PATH` in login shells; in non-interactive shells use `$HOME/.bun/bin/bun` (this is why the update script uses the full path).
- Node 22 is available and satisfies the repo's `>=20` engine requirement (`.nvmrc` pins 20, but 22 works fine).

### Database (MariaDB) — required, NOT auto-started
- MariaDB is installed via apt but there is no systemd; start it manually before running the app/tests that touch the DB:
  `sudo mysqld_safe --datadir=/var/lib/mysql &` (verify with `sudo mysqladmin ping`).
- A `csinspect` database plus user `csinspect`/`devpass` (on `localhost` and `127.0.0.1`) already exist in the datadir; the schema is applied. If starting from a fresh datadir, recreate them and run `bun run db:push`.
- The app also auto-runs Drizzle migrations at boot (`server/plugins/init.ts`), so a running DB matching `.env` is enough.

### Environment file
- A local `.env` exists (git-ignored) with working DB creds and a placeholder `STEAM_API_KEY`. The placeholder lets the app boot, but real Steam OpenID login needs a valid key (`https://steamcommunity.com/dev/apikey`) and a real Steam account, which are not available in this environment.

### Running / testing
- Standard commands are in `README.md` / root `package.json`: `bun run dev` (web app, port 3210), `bun run lint`, `bun test`, `bun run db:push`.
- On first `bun run dev`, the server fetches CS2 asset JSON from a remote CDN (GitHub) into `storage/csgo-api/` — this needs network and takes a few seconds; the server serves immediately while it loads.
- `bun test` at the repo root also runs `services/steam-service` tests; those need `services/steam-service` deps installed (the update script handles this). Steam integration tests are skipped without a real Steam account.

### Testing authenticated features without Steam login
- All `/api/loadouts`, `/api/inspect`, `/api/items/*`, `/api/admin/*` routes require an `auth_token` JWT cookie signed with `JWT_TOKEN` (`server/middleware/02.auth.ts`). The Steam OpenID login flow (`server/middleware/01.steam-auth.ts`) is external and cannot be completed here.
- To exercise authenticated flows, mint a token with the same secret:
  `bun -e "import jwt from 'jsonwebtoken'; console.log(jwt.sign({steamId:'7656119...',type:'steam_auth'}, process.env.JWT_TOKEN, {expiresIn:'7d'}))"`
  then send it as cookie `auth_token=<token>`. Most endpoints also expect a `steamId` query param (e.g. `POST /api/loadouts?steamId=...`).
- In the browser UI, the frontend shows the logged-out view until a `steam_logged_in=true` cookie is also present; set both `auth_token` and `steam_logged_in` cookies (via DevTools console) to render the authenticated UI.
