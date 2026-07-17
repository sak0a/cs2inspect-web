# Onyx Redesign — Design Spec

**Date:** 2026-07-15
**Status:** Awaiting user approval
**Direction:** "Onyx" (ultra-dark minimal, rarity-as-light) with data-forward touches from the "Killfeed" direction. Chosen by the user from three interactive previews (artifact `three-directions-v1`).
**Motion:** Full awwwards tier (GSAP choreography, pointer parallax, directional team wipes, branded preloader).
**Scope:** User-facing app. Admin inherits tokens only; no dedicated admin pass.
**Supersedes:** `docs/superpowers/specs/2026-07-14-default-shadcn-controls-design.md` (registry-default recipes). Shared controls now follow the Onyx recipes defined here.

---

## 1. Design language

The interface recedes to near-black; skin art becomes the light source. Rarity is no longer a 135-degree gradient wash but a glow the weapon casts on its surface. One yellow accent. Hairline borders. Deep soft shadows instead of border-everywhere elevation. Data (floats, seeds, StatTrak) is pulled forward in monospace, borrowed from the Killfeed direction.

Killfeed elements adopted: mono micro-labels (uppercase, tracked JetBrains Mono) for metadata and section labels; float/seed/counter readouts surfaced on cards and in the modal; team-switch directional wipe. Killfeed elements rejected: notched corners, rarity rails, all-uppercase display type.

## 2. Token layer (single source of truth)

All tokens live in `app/assets/css/tailwind.css` `@theme`. `theme-variables.css` legacy vars are re-aliased to the new tokens (values updated, names kept) so the ~300 scoped-style usages keep working; they are burned down opportunistically, not exhaustively, in this pass.

### Color
| Token | Value | Notes |
|---|---|---|
| `--background` | `#070708` | page ground (replaces #121212 and the four competing blacks) |
| `--card` / `--surface` | `#0e0e10` | primary surface |
| `--surface-2` / `--popover` | `#141417` | elevated surface |
| `--border` | `rgba(255,255,255,0.07)` | hairline |
| `--border-strong` | `rgba(255,255,255,0.13)` | interactive hairline |
| `--input` | `rgba(255,255,255,0.09)` | input borders/fills |
| `--foreground` | `#f2f2f4` | primary text |
| `--muted-foreground` | `#a2a2aa` | secondary text |
| `--text-tertiary` | `#67676f` | tertiary/labels |
| `--primary` | `#facc15` | unchanged brand accent |
| primary hover | `#fde047` | luminance shift, never hue shift to amber |
| primary pressed | `#eab308` | |
| `--destructive` | `#ef4444` (text tint `#ff7a7a` on dark) | |
| `--ring` | `#facc15` | focus ring softened to `ring-2` at 40 percent alpha |

CT blue `rgb(93,140,255)` and T orange `rgb(255,138,61)` are the only other hues, reserved for team semantics. The home page's blue/indigo accent system is retired; the inspect tool adopts the standard accent.

### Radius
`--radius-ctl: 9px` (buttons, inputs, selects), `--radius-card: 14px` (cards, panels), `--radius-modal: 20px` (dialog shells), pills 999px. Checkbox hard-coded 4px replaced with a token-derived value.

### Shadows
`--shadow-card: 0 18px 40px -12px rgba(0,0,0,0.7)`, `--shadow-modal: 0 32px 80px -16px rgba(0,0,0,0.85), inset 0 1px 0 rgba(255,255,255,0.05)`. Stock shadcn shadow-xs/sm (invisible on dark) removed from recipes.

### Motion tokens
`--ease-out: cubic-bezier(0.16,1,0.3,1)`, `--ease-snap: cubic-bezier(0.3,0,0,1)`, `--dur-fast: 150ms`, `--dur-base: 250ms`, `--dur-slow: 400ms`. All component transitions reference these; the five ad-hoc beziers are swept.

### Rarity channel
Rarity colors remain runtime data (API hex). Standard delivery: each card/stage sets `--rc` inline; shared recipes (`rarity glow`, hairline tint, selected treatments) consume `--rc` via `color-mix`. `hexToRgba` remains for canvas code only.

### Glassmorphism
Retired as the primary surface language. Overlay backdrop keeps `bg-black/70 + backdrop-blur-[8px]` (unified across dialog, alert-dialog, sheet, scroll-content). Panels are near-opaque `#0e0e10`; no per-component blur recipes. `glassmorphism.css` footer styles are removed with the footer redesign.

## 3. Typography

First webfonts ever shipped in this app. Self-hosted woff2 (latin subsets) in `public/fonts/`, `@font-face` with `font-display: swap`, preloaded in `nuxt.config` head. No runtime CDN.

- `--font-display`: **Space Grotesk** 500/700 — page titles, weapon names, modal titles, nav brand, login hero.
- `--font-mono`: **JetBrains Mono** 400/600 — floats, seeds, micro-labels, badges, JSON editor (which currently references it without loading it).
- Body stays system sans (`ui-sans-serif`) for perf and neutrality.

Type scale: 12/13.5/15/18/24/32/44 with `-0.02em` tracking on display sizes, `0.12em` tracking + uppercase on mono micro-labels. Item pages gain an H1 (currently none exists).

## 4. Component kit (`app/components/ui/`)

Onyx recipes replace registry defaults. Contracts preserved: props, emits, `data-slot` names, `buttonVariants` composition into alert-dialog/pagination, Button's `loading`/`iconLeft` extensions, `DialogFooter showCloseButton`, sheet 500/300ms asymmetry.

- **Button**: luminance-based hovers, `active:scale-[0.98]` press, focus `ring-2 ring-ring/40`. Variants unchanged in API.
- **Dialog family**: unified overlay recipe; content radius `--radius-modal`; entrance handed to GSAP where AppModal hosts it, tw-animate elsewhere retuned to motion tokens.
- **Tabs**: animated active indicator (shared pill morph). **Collapsible**: height ease via `--reka-collapsible-content-height`. **Checkbox**: check scale/draw-in (removing `transition-none`).
- **NumberField**: input rewritten to the v4 Input recipe (fixes the v3 leftover focus divergence); keep reka clear-restore semantics (documented gotcha).
- **Skeleton**: neutral shimmer sweep replacing yellow `bg-primary/10` pulse.
- **Slider**: thumb tokenized (no hard-coded white); used as base for the new WearSlider.
- **Sonner**: token bridge kept; rich-color success/error/warning overridden to palette-consistent tints.
- **Tooltip**: joins the dark surface family (`--surface-2`), no longer inverted white.

## 5. ItemCard and grids (the hero surface)

One `ItemCard.vue` replaces the six diverged card recipes in `app/components/tabs/*`. Variants: `weapon | knife | glove | agent | musickit | pin`. States: `unconfigured` (dashed hairline, art dimmed/desaturated), `inactive` (reduced opacity), `active`, `selected` (accent ring + check badge, replaces "yellow ring + opacity-85").

Anatomy: surface `#0e0e10`, hairline border, radial rarity glow under the art (`--rc` at 13 percent idle, 30 percent hover), art with deep drop-shadow, name line (display face), mono rarity label + float readout row (Killfeed touch), StatTrak chip, quick-action dropdown (ported from WeaponTabs to all variants). `data-tutorial` attributes and the `.weapon-card` class hook preserved verbatim. Rarity hex keeps arriving via inline `--rc`.

Grid behavior: GSAP entrance stagger (40ms, y+opacity, `--ease-out`) via a shared `useGridReveal` composable replacing the three competing systems (TransitionGroup, IntersectionObserver + `ensureCardsVisible` hacks, bare Transition). Hover: pointer-parallax art tilt + glow bloom. Team switch: directional wipe keyed to CT/T with color-tinted edge. Skeleton grids crossfade into real cards.

## 6. Modals

**AppModal** (single choke point): near-opaque `#0e0e10` shell, `--radius-modal`, `--shadow-modal`, simplified header (hairline, no glass strip). Inline `:style` glass recipe replaced by classes + tokens; admin modals' `:has()` override replaced by a `variant="admin"` prop with a darker surface. GSAP open/close: panel scale 0.97 + y 12 + settle, header/body staggered 60ms; close reversed and faster. Sub-modal stacking: parent scales to 0.98 and dims. Close-animation-coupled timings preserved: WeaponSkinModal state reset at 300ms, weapons page `selectedWeapon` clear at 500ms (constants updated together with the new durations).

**Shared extraction before restyling** (precondition for consistency): `SkinGridCard`, `ItemBrowserGrid` (grid + skeleton + Empty + pagination incl. the `total=totalPages, items-per-page=1` semantics), `ModalToolbar` (actions + search, lucide icons replacing hand-inlined Tabler SVGs), `SelectedItemStage` (preview panel). The three skin modals (Weapon/Knife/Glove) and three sticker browsers consume these. All emits/props contracts preserved exactly (`select` vs `save` vs `submit` vs `confirm` differences included); knife/glove `user` prop untouched; keyboard shortcuts (Enter/1-5/R/D) and their sub-modal guards untouched; auto-save debounce/flush order untouched.

**Stage**: the video wear-scrub preview becomes the hero — larger canvas, name + float overlay typography, wear-band tag. VideoCanvasManager lifecycle and DPR handling preserved; container resize accompanied by re-init.

**WearSlider**: rebuilt on reka-ui SliderRoot (keyboard/touch/ARIA). Visual: minimal hairline track, band tick marks at 0.07/0.15/0.38/0.45, mono readout, accent fill, spring on release (GSAP). Contract preserved: `v-model` number, min/max props, 3-decimal rounding write-back.

**Sticker slots**: reactive drag state replaces imperative classList mutation; GSAP-animated swap; slot hover/drop states via tokens.

Small modals (Reset/Duplicate/InspectURL) restyled on the same shell; contracts untouched.

## 7. Navigation, layout, chrome

- **MainNav rebuild**: persistent labels with reserved width (kills the expand-reflow), GSAP-morphing active pill indicator, weapon-silhouette SVGs converted from innerHTML vnodes to components, grouped category popover at narrow widths, and a mobile Sheet drawer (currently no mobile nav exists). Route-path-driven active state preserved; `steam_logged_in` SSR branch preserved.
- **TeamToggle**: refined pill, animated thumb, drives the team wipe.
- **Background**: `AppBackground.vue` replaces the duplicated dot-grid inline styles (app.vue + error.vue): near-black ground, subtle vignette + faint noise, slow ambient drift with pointer response (Full awwwards), static under reduced motion.
- **Footer**: quiet neutral hairline strip; yellow tint retired.
- **Page transitions**: CSS blur transitions replaced with GSAP JS hooks on `<NuxtPage>` (y+opacity, no filter), `NuxtLoadingIndicator` hairline in accent; layoutTransition removed to avoid double-fades.
- **Preloader**: SitePreloader rebuilt as a branded GSAP intro (wordmark reveal into staggered UI), correct sessionStorage gating (fixing the key mismatch), skipped under reduced motion, and chained into the first grid reveal.
- **Login screen**: hero treatment (display type, ambient rarity glow, Steam CTA) — it is the first impression and currently an unstyled string.
- **error.vue**: ported to tokens + AppBackground; strings moved to i18n keys.
- **Announcement banner / maintenance state**: token-conformant restyle, animated entrance.

## 8. Motion system (Full awwwards tier)

- `gsap` dependency added; `app/plugins/gsap.client.ts` registers core + ScrollTrigger + Flip once; `useGsap()` composable wraps `gsap.context` with auto-cleanup; ScrollTrigger configured with the layout root div as scroller (html/body are overflow hidden).
- Global reduced-motion strategy: `gsap.matchMedia` + a CSS token block; replaces the current 2-file coverage. E2E stability: animations gated off when `E2E_DISABLE_BACKGROUND_JOBS` or an equivalent flag is set so `networkidle` waits stay stable.
- Signature moments: preloader chain, grid staggers, card pointer parallax, card-to-modal Flip morph of the weapon image (the app's heartbeat interaction), team-switch directional wipe, wear-scrub spring, save-status pill morph, nav indicator morph, modal choreography, toast entrance.
- Guardrails: animate transform/opacity only; never animate blur or backdrop-filter; no scroll listeners (ScrollTrigger/IO only); `will-change` hygiene; tw-animate-css retained for small primitives (load-bearing for reka data-state exits).

## 9. States, i18n, a11y

- Empty states standardized on `ui/empty` with weapon-silhouette illustrations and CTAs (replacing bare gray strings).
- New/changed copy goes through `t()` with keys in all six locales; fixed-width elements sized for ~1.3x German strings.
- Focus-visible preserved everywhere; `::selection` styled; skip-to-content link added; WCAG AA contrast maintained (mono labels at `--text-tertiary` pass on `#0e0e10`).
- `prefers-reduced-motion` honored globally (see 8).

## 10. Hard constraints (verified in exploration)

1. All modal/page emits + props contracts unchanged (`select`/`save`/`duplicate`/`auto-save`/`confirm`/`submit`, `BaseModalProps` inheritance).
2. `data-tutorial` attributes and tutorial DOM hooks (incl. `.weapon-card` querySelector) preserved.
3. E2E contract: `/dev` testids (`dev-auth-card`, `dev-login-user`, `dev-login-admin`), `localStorage.steamUser` behavior, admin "Overview" heading, `/admin` non-redirect.
4. `steam_logged_in` SSR layout branch (CLS guard) preserved.
5. Auto-save: 1500ms debounce, flush-before-close ordering, `isInitializing` guard, 3-decimal wear rounding.
6. No `structuredClone` on reactive objects; JSON round-trip stays.
7. tw-animate-css import stays; reka `data-[state]` exit animations must not break (GSAP layered on top or presence-managed).
8. Rarity colors stay runtime-hex-driven; default rarity `#B0C3D9`, fallbacks preserved.
9. Canvas customizer: container dimensions/lifecycle unchanged in this pass (frame styling only around it); no `crossorigin` added to CDN images.
10. Sonner, pagination hack, `Default` synthetic skin entry, SSE force-close behavior all preserved.
11. Unit tests asserting colors (`rarity.test.ts`, `stickerEffects.test.ts`, `hexToRgba.test.ts`) must keep passing — rarity mappings are data, not theme, and stay untouched.
12. z-index hierarchy: preloader > tutorial > modals > nav preserved.

## 11. Implementation phases

Each phase lands compiling + verified before the next starts.

- **Phase 0 — Foundation**: gsap + fonts shipped; token layer rewrite + legacy alias bridge; motion tokens; AppBackground; ui-kit recipe updates; Sonner/rich-colors; global reduced-motion. App must look coherent (darker, new type) with zero behavior change.
- **Phase 1 — Extraction**: ItemCard (+ 6 call sites), ItemBrowserGrid/ModalToolbar/SelectedItemStage/SkinGridCard extraction inside modals, WearSlider rebuild. Behavior-preserving refactors with new visuals.
- **Phase 2 — Surfaces**: MainNav rebuild + mobile drawer, layout/footer/banner, login hero, error page, item pages (H1s, empty states, skeletons), home/inspect page accent unification, AppModal restyle + admin variant bridge.
- **Phase 3 — Choreography**: GSAP page transitions + loading hairline, grid staggers + team wipe, card parallax, card-to-modal Flip, modal open/close, wear spring, sticker drag animation, preloader, save-status morph.
- **Phase 4 — Verification & polish**: browser walkthrough with dev mock auth (user + all item pages + all modals + tutorial), unit tests, e2e (local DB or skip-DB mode only — never `db:push` against the remote), i18n sweep, reduced-motion pass, perf sanity (no long tasks from entrance animations, images lazy).

Verification environment: `DEV_AUTH_ENABLED=true` added to `.env` (dev-only), dev server on 3210, login via `/dev` page or `POST /api/auth/dev/login`, mock user `76561198000000001`. Writes are limited to the reserved dev SteamID block on the configured dev database; no destructive operations, no schema pushes.

## 12. Out of scope

Admin-specific redesign (inherits tokens only), InlineVisualCustomizer internal canvas UX (frame restyle only), history panel deep redesign (tokens + icon swap only if time allows), PWA/manifest/OG assets, light theme, pagination semantics fix, i18n locale-file dead-directory cleanup.
