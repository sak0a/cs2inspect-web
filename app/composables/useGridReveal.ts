import { tryOnScopeDispose } from '@vueuse/core'
import { gsap } from 'gsap'
import type { Ref, WatchSource } from 'vue'
import { DUR, EASE } from '~/utils/motion'

export interface UseGridRevealOptions {
  /** Vertical offset (px) children rise from. Default 14. */
  y?: number
  /** Per-child stagger in seconds. Default 0.04 (40ms). */
  stagger?: number
  /** Tween duration in seconds. Default 0.4 (`DUR.slow`). */
  duration?: number
  /**
   * Optional source(s) to watch — `reveal()` re-runs after each change, with
   * `flush: 'post'` so the new grid children are already in the DOM.
   */
  watch?: WatchSource<unknown> | WatchSource<unknown>[]
}

export interface UseGridRevealReturn {
  /**
   * Stagger-reveal the container's current direct children. Safe to call
   * repeatedly (kills any in-flight run first). No-op on the server or while
   * the container ref is empty.
   */
  reveal: () => void
}

/**
 * Shared grid entrance animation (design spec §5): direct children fade/rise
 * in (opacity 0→1, y 14→0) with a 40ms stagger.
 *
 * SSR-safe by construction: initial hidden states are applied via `gsap.set`
 * (inside the `fromTo`) only when `reveal()` runs on the client — never via a
 * CSS class — so server-rendered markup is fully visible and there is no
 * flash of hidden content. `clearProps` removes inline styles on completion,
 * returning cards to their natural CSS.
 *
 * `reveal()` is NOT called automatically on mount — callers decide when
 * (e.g. `onMounted`, after data resolves, or chained off the preloader).
 *
 * Under reduced motion (`useReducedMotion`) it jumps straight to the end
 * state instead of animating.
 */
export function useGridReveal(
  containerRef: Ref<HTMLElement | null | undefined>,
  opts: UseGridRevealOptions = {}
): UseGridRevealReturn {
  const reducedMotion = useReducedMotion()
  let tween: gsap.core.Tween | null = null

  function reveal(): void {
    if (import.meta.server) return
    const container = containerRef.value
    if (!container) return
    const children = Array.from(container.children).filter(
      (child): child is HTMLElement => child instanceof HTMLElement
    )
    if (children.length === 0) return

    tween?.kill()
    tween = null

    if (reducedMotion.value) {
      // Jump to the end state; also clears residue from an interrupted run.
      gsap.set(children, { clearProps: 'opacity,transform' })
      return
    }

    tween = gsap.fromTo(
      children,
      { opacity: 0, y: opts.y ?? 14 },
      {
        opacity: 1,
        y: 0,
        duration: opts.duration ?? DUR.slow,
        stagger: opts.stagger ?? 0.04,
        ease: EASE.reveal,
        overwrite: 'auto',
        // Per-target on completion — leaves no inline transform/opacity behind
        clearProps: 'opacity,transform',
      }
    )
  }

  if (import.meta.client && opts.watch) {
    const sources = Array.isArray(opts.watch) ? opts.watch : [opts.watch]
    watch(sources, () => reveal(), { flush: 'post' })
  }

  tryOnScopeDispose(() => {
    tween?.kill()
    tween = null
  })

  return { reveal }
}
