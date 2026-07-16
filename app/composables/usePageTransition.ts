import { gsap } from 'gsap'
import type { TransitionProps } from 'vue'
import { EASE } from '~/utils/motion'

/**
 * GSAP-driven page transition for `<NuxtPage :transition>` (replaces the old
 * CSS blur transitions from `transitions.sass`).
 *
 * - `mode: 'out-in'`: leave finishes before enter starts.
 * - Leave: quick dip (y -10 / fade) over 0.22s `power2.in`.
 * - Enter: rise (from y 14 / fade) over 0.45s `expo.out`.
 * - Reduced motion / E2E kill-switch: hooks call `done()` immediately with
 *   end states applied — navigation must never hang on a missing callback.
 *
 * Call from a component `setup()` (app.vue) — `useReducedMotion()` needs the
 * Nuxt context. The hooks themselves only run client-side (Vue transitions
 * never fire during SSR), so touching gsap inside them is SSR-safe.
 */
export function usePageTransition(): TransitionProps {
  const reducedMotion = useReducedMotion()

  /** Drop any in-flight tween so rapid navigations can't stack/fight. */
  const kill = (el: Element) => {
    gsap.killTweensOf(el)
  }

  const onBeforeEnter = (el: Element) => {
    if (reducedMotion.value) return
    // Initial state via gsap.set (never CSS-hidden SSR markup).
    gsap.set(el, { opacity: 0, y: 14 })
  }

  const onEnter = (el: Element, done: () => void) => {
    kill(el)
    if (reducedMotion.value) {
      gsap.set(el, { clearProps: 'opacity,transform' })
      done()
      return
    }
    gsap.to(el, {
      opacity: 1,
      y: 0,
      duration: 0.45,
      ease: EASE.out,
      onComplete: () => {
        // Leave the page unstyled at rest (no lingering transform contexts).
        gsap.set(el, { clearProps: 'opacity,transform' })
        done()
      },
    })
  }

  const onLeave = (el: Element, done: () => void) => {
    kill(el)
    if (reducedMotion.value) {
      done()
      return
    }
    gsap.to(el, {
      opacity: 0,
      y: -10,
      duration: 0.22,
      ease: 'power2.in',
      onComplete: done,
    })
  }

  return {
    css: false,
    mode: 'out-in',
    onBeforeEnter,
    onEnter,
    onLeave,
    onEnterCancelled: kill,
    onLeaveCancelled: kill,
  }
}
