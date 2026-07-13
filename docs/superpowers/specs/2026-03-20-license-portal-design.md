# CS2Inspect License Portal — Design Spec

## Overview

A standalone Nuxt 4 application (`manage.cs2inspect.com`) that handles plugin licensing, payments, and customer management for CS2Inspect. The existing CS2Inspect Web app remains open source and untouched — this portal is a separate commercial product.

**Business model:** CS2 community server operators buy prepaid time blocks to license the CS2Inspect plugin for their game servers. The web app is free/self-hostable; the plugin requires a paid license.

## Architecture

### Components

1. **License Portal** (new) — standalone Nuxt 4 + MariaDB app deployed on Coolify. Handles auth, dashboard, payments, and license validation API.
2. **Payment Providers** — Stripe + PayPal for one-time prepaid checkout. Webhooks confirm payment and extend license expiry.
3. **CS2 Plugin** (modified) — existing C# plugin gets a license validation module. Reads license key from config, validates on startup + every 24h via heartbeat to the portal API.
4. **CS2Inspect Web** (existing) — no changes. Remains open source and self-hostable.

### How they connect

- Customer signs up on portal via Steam → buys time via Stripe/PayPal → gets license key
- Server operator enters key in plugin config → plugin validates against portal API
- Portal is the single source of truth for license validity

## Database Schema

### `customers`

| Column | Type | Notes |
|--------|------|-------|
| id | int, PK, auto-increment | |
| steam_id | varchar, unique | Steam 64-bit ID |
| persona_name | varchar | From Steam profile |
| avatar_url | varchar | From Steam profile |
| email | varchar, nullable | For receipts |
| trial_used | boolean, default false | One trial per customer |
| created_at | datetime | |
| last_seen_at | datetime | |

### `licenses`

| Column | Type | Notes |
|--------|------|-------|
| id | int, PK, auto-increment | |
| customer_id | FK → customers | |
| license_key | varchar, unique | Generated key (format: `CS2I-XXXX-XXXX-XXXX`, uppercase alphanumeric A-Z0-9, 36^12 entropy) |
| server_address | varchar, nullable | Bound on first plugin activation (format: `IP:port`, e.g. `1.2.3.4:27015`) |
| activated_at | datetime, nullable | First heartbeat timestamp |
| expires_at | datetime | Calculated from purchases |
| is_trial | boolean | 3-day trial flag |
| status | enum: active, expired, revoked | |
| last_heartbeat | datetime, nullable | |
| created_at | datetime | |
| updated_at | datetime | Auto-updated on any change |

### `purchases`

| Column | Type | Notes |
|--------|------|-------|
| id | int, PK, auto-increment | |
| customer_id | FK → customers | |
| license_id | FK → licenses | |
| provider | enum: stripe, paypal | |
| provider_tx_id | varchar, unique | Stripe/PayPal transaction ID (unique constraint for webhook idempotency) |
| plan | enum: 30d, 90d, 365d | |
| amount_cents | int | e.g., 300 for €3 |
| currency | varchar, default 'eur' | |
| days_added | int | 30, 90, or 365 |
| discount_pct | int, nullable | Multi-server discount applied |
| created_at | datetime | |
| status | enum: completed, refunded | |

### Key constraints

- One customer can have multiple licenses (one per server)
- `expires_at` stacking: `new_expires_at = max(now, current_expires_at) + days_added` (expired licenses count from now, not from old expiry)
- `server_address` is bound on first plugin activation — prevents key sharing
- `server_address` can be rebound from the dashboard (max once per 7 days, cooldown per license)
- `trial_used` is per customer, not per license — only one trial ever
- Webhook handlers must be idempotent — check `provider_tx_id` uniqueness before creating purchase records
- All prices are in EUR only for v1

## License Validation API

### `POST /api/licenses/validate`

**Request body:**
```json
{
  "key": "CS2I-XXXX-XXXX-XXXX",
  "server_address": "1.2.3.4:27015"
}
```

POST is used instead of GET to keep the license key out of URL logs, proxy logs, and CDN logs.

**Success response (200):**
```json
{
  "valid": true,
  "expires_at": "2026-04-20T00:00:00Z",
  "days_remaining": 31,
  "server_address": "1.2.3.4:27015"
}
```

**Invalid response (200):**
```json
{
  "valid": false,
  "reason": "expired | revoked | address_mismatch | not_found"
}
```

### Behaviors

- First call with a new `server_address` binds the license to that address (IP:port)
- Subsequent calls from a different address return `address_mismatch`
- Updates `last_heartbeat` on every valid call
- No auth required — the license key itself is the credential
- Rate limited: 10 requests per minute per IP, returns 429 when exceeded
- TLS required — the portal must be served over HTTPS

## Plugin Modifications (C#)

### New config field

```json
{
  "LicenseKey": "CS2I-XXXX-XXXX-XXXX"
}
```

### Validation behavior

- **On startup:** call validation endpoint, cache result
- **Every 24h:** re-validate via heartbeat
- **If invalid:** log warning, disable weapon customization commands, show message to server operator in console
- **If license server unreachable:** keep running with cached result for up to 48h grace period (prevents portal outage from breaking customer servers)

## Customer Dashboard

### Authentication

Steam OpenID login (reuse existing auth pattern from cs2inspect-web). JWT cookie-based sessions.

### Pages (5 total)

#### 0. Landing Page (public, non-authenticated)

- Hero section: headline, short description of the plugin, "Start Free Trial" CTA
- Features section: key capabilities (weapon skins, knives, gloves, stickers, StatTrak, etc.)
- Pricing section: 3 plan cards (30d/90d/365d) with savings, multi-server discount note
- How it works: 3-step overview (sign up, get key, activate on server)
- FAQ section (common questions: what happens when license expires, can I change servers, etc.)
- Footer with "Login with Steam" button
- Redirects to Dashboard if already authenticated

#### 1. Dashboard (Home)

- Trial banner (if trial not yet used): "Your 3-day trial is ready" with link to setup guide
- License cards: shows each license with key (copyable), status badge, server address, expiry date, days remaining
- "Add Server License" card with multi-server discount note (15% off)
- Each license card has a "Change Server" button (rebind address, 7-day cooldown)
- Quick actions: "Buy More Time", "View Purchase History"

#### 2. Buy Time (Pricing)

- Select which license to extend
- Three plan cards: 30d/€3, 90d/€8 (highlighted as "Popular", save 11%), 365d/€30 (save 17%)
- Multi-server discount (15%) applied automatically for 2nd+ licenses
- Payment method selection: Stripe or PayPal → redirect to hosted checkout

#### 3. Setup Guide (Onboarding)

- Step-by-step walkthrough:
  1. Download the CS2Inspect Plugin from GitHub
  2. Add license key to plugin config
  3. Restart CS2 server
  4. Done — players can customize weapons

#### 4. Settings

- Steam account info (read-only)
- Email field (for receipts)
- Purchase history table (date, plan, license, amount)

## Payment Flow

### Purchase flow

1. Customer selects plan → selects license → picks Stripe or PayPal
2. If 2nd+ license for same customer → multi-server discount applied automatically
3. Redirect to hosted checkout (Stripe Checkout / PayPal)
4. After payment confirmed:
   - **Stripe:** webhook `checkout.session.completed`
   - **PayPal:** webhook `PAYMENT.CAPTURE.COMPLETED`
5. Webhook handler: create `purchases` record, extend `licenses.expires_at` by `days_added`
6. Customer redirected back to dashboard with success message

### Trial flow

1. On first Steam login → customer record created with `trial_used: false`
2. Customer clicks "Start Trial" → creates license with `is_trial: true`, `expires_at: now + 3 days`
3. Sets `trial_used: true` on customer (can never trial again)
4. Trial activates on first plugin heartbeat (binds server address)
5. On expiry → license status flips to `expired`, plugin disables on next heartbeat

### Trial-to-paid conversion

When a customer buys time for a trial license, the purchase extends that same license. The `is_trial` flag is cleared on first purchase. No new license is created — the trial license becomes the paid license.

### Refund handling (v1)

- Manual: refund via Stripe/PayPal dashboard
- Optionally revoke license via direct DB update
- No automated refund→revoke webhook for v1

## Pricing

| Plan | Price | Per-month equivalent | Discount |
|------|-------|---------------------|----------|
| 30 days | €3 | €3.00/mo | — |
| 90 days | €8 | ~€2.67/mo | 11% |
| 365 days | €30 | €2.50/mo | 17% |

**Multi-server discount:** flat 15% off all additional licenses (2nd+) for the same customer. Applied at checkout automatically.

## Deployment

- Private GitHub repository (commercial code, not open source)
- Standalone Coolify stack (separate from cs2inspect-web)
- Coolify builds directly from the private repo (via GitHub App integration) using Nixpacks or Docker Compose
- No GHCR — no public image registry needed
- Services: Nuxt app + MariaDB
- Own domain: `manage.cs2inspect.com` (or similar)

## Out of Scope (v1)

- Hosted website instances for customers
- Admin dashboard for license management (use DB queries for now)
- Automated refund→revoke webhooks
- Subscription billing (prepaid only)
- Email notifications (beyond payment receipts from Stripe/PayPal)

## Acceptance Criteria

1. Customer can sign up via Steam and see their dashboard
2. Customer can start a 3-day trial (once per account)
3. Customer can purchase 30d/90d/365d time blocks via Stripe or PayPal
4. License key is generated and displayed with copy functionality
5. Purchase extends `expires_at` (stacks, doesn't reset)
6. Multi-server discount is applied automatically for 2nd+ licenses
7. CS2 plugin validates license on startup + every 24h heartbeat
8. Plugin disables gracefully when license is expired/invalid
9. Plugin continues working for 48h if license server is unreachable
10. Setup guide walks customer through plugin installation
11. Settings page allows email entry and shows purchase history
