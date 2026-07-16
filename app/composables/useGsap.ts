import { tryOnScopeDispose } from '@vueuse/core'
import { gsap } from 'gsap'
import type { ComputedRef, Ref } from 'vue'

declare global {
  interface Window {
    /**
     * E2E kill-switch: set to `true` before app boot (e.g. via Playwright
     * `addInitScript`) to disable all JS-driven motion so `networkidle` /
     * screenshot waits stay stable.
     */
    __E2E_DISABLE_MOTION?: boolean
  }
}

/** Element ref a gsap.context gets scoped to (selector text inside `ctx` runs only match descendants). */
export type GsapScopeRef = Ref<HTMLElement | null | undefined>

export interface UseGsapReturn {
  /** The gsap singleton (plugins registered by `app/plugins/gsap.client.ts`). */
  gsap: typeof gsap
  /**
   * Run `fn` inside a lazily-created `gsap.context` bound to `scope`.
   * Everything created inside is auto-reverted when the component unmounts.
   * Call from `onMounted`/watchers (client-side), after `scope` has an element.
   */
  ctx: <T>(fn: (self: gsap.Context) => T) => T
}

/**
 * Component-scoped GSAP access with automatic cleanup.
 *
 * The context is created on first `ctx()` invocation so the scope element is
 * resolved after mount (a setup-time creation would always see `null`).
 */
export function useGsap(scope?: GsapScopeRef): UseGsapReturn {
  let context: gsap.Context | undefined

  const ctx = <T>(fn: (self: gsap.Context) => T): T => {
    // NOTE: the no-op function is required — `gsap.context(func, scope)` only
    // creates a Context when `func` is truthy (with `undefined` it returns the
    // currently-active context, i.e. `undefined` at boot, and `.add` throws).
    context ??= gsap.context(() => {}, scope?.value ?? undefined)
    return context.add(fn)
  }

  tryOnScopeDispose(() => {
    context?.revert()
    context = undefined
  })

  return { gsap, ctx }
}

/** Shared media-query state — one listener for the whole app. */
const prefersReducedMotion = ref(false)
let mediaQueryBound = false

function bindMediaQuery(): void {
  if (mediaQueryBound || import.meta.server) return
  mediaQueryBound = true
  const query = window.matchMedia('(prefers-reduced-motion: reduce)')
  prefersReducedMotion.value = query.matches
  query.addEventListener('change', (event) => {
    prefersReducedMotion.value = event.matches
  })
}

/**
 * `true` when JS-driven motion must be skipped (jump straight to end states).
 *
 * Sources, in order:
 * 1. OS-level `prefers-reduced-motion: reduce` (reactive to live changes)
 * 2. E2E kill-switch `window.__E2E_DISABLE_MOTION === true`
 * 3. Runtime config `public.disableMotion` (env: `NUXT_PUBLIC_DISABLE_MOTION`)
 *
 * CSS transitions/animations are handled separately by the global
 * reduced-motion block in `tailwind.css`.
 */
export function useReducedMotion(): ComputedRef<boolean> {
  bindMediaQuery()
  const config = useRuntimeConfig()
  return computed(() => {
    if (config.public.disableMotion) return true
    if (import.meta.client && window.__E2E_DISABLE_MOTION === true) return true
    return prefersReducedMotion.value
  })
}
