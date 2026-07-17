/**
 * GSAP-side mirrors of the CSS motion tokens defined in
 * `app/assets/css/tailwind.css` (`--dur-*`, `--ease-*`).
 *
 * CSS transitions consume the custom properties directly
 * (`duration-[var(--dur-fast)] ease-[var(--ease-out)]`); GSAP cannot read CSS
 * variables for durations/eases, so these constants keep both worlds in sync.
 * If a token changes, update BOTH places together.
 */

/** Durations in seconds (GSAP units). CSS token equivalents in comments. */
export const DUR = {
  /** --dur-fast: 150ms — hovers, presses, small state flips */
  fast: 0.15,
  /** --dur-base: 250ms — standard component transitions */
  base: 0.25,
  /** --dur-slow: 400ms — entrances, reveals, modal choreography */
  slow: 0.4,
} as const

/**
 * Ease names — GSAP built-ins only (no CustomEase plugin). Mapping to the CSS
 * cubic-bezier tokens (close approximations, not bit-exact):
 *
 * - `out`    → `'expo.out'`      ≈ `--ease-out: cubic-bezier(0.16, 1, 0.3, 1)`
 * - `snap`   → `'power3.inOut'`  ≈ `--ease-snap: cubic-bezier(0.3, 0, 0, 1)`
 *   (emphasized accelerate-then-long-decelerate)
 * - `reveal` → `'power3.out'`    — softer deceleration reserved for grid
 *   entrance staggers (design spec §5), no CSS counterpart
 */
export const EASE = {
  out: 'expo.out',
  snap: 'power3.inOut',
  reveal: 'power3.out',
} as const
