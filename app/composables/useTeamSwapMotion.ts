import { tryOnScopeDispose } from '@vueuse/core'
import { gsap } from 'gsap'
import type { Ref } from 'vue'
import { DUR, EASE } from '~/utils/motion'

type TeamSide = 'ct' | 't'

const TINT_CLASSES: Record<TeamSide, string> = {
  ct: 'team-swap-tint--ct',
  t: 'team-swap-tint--t',
}

export interface UseTeamSwapMotionReturn {
  /** `@enter` hook for a `<Transition :css="false" mode="out-in">`. */
  onEnter: (el: Element, done: () => void) => void
  /** `@leave` hook. */
  onLeave: (el: Element, done: () => void) => void
  /** `@enter-cancelled` hook — kills the tween and clears residue. */
  onEnterCancelled: (el: Element) => void
  /** `@leave-cancelled` hook. */
  onLeaveCancelled: (el: Element) => void
}

/**
 * Directional team-switch wipe (design spec §5/§8), shared by every item page
 * with team filtering.
 *
 * Attach the returned hooks to a `<Transition :css="false" mode="out-in">`
 * whose child is keyed by `teamRef` — the out-in semantics (and therefore the
 * grid remount behavior) stay exactly as with the old CSS crossfade.
 *
 * Choreography (transform/opacity only):
 *  - CT → T: outgoing grid slides x→-24 fading out (0.2s power2.in); the
 *    incoming grid's cards stagger in from x=+24 (expo.out, 30ms stagger).
 *  - T → CT: mirrored (out +24, in from -24).
 *  - The incoming grid briefly carries a `team-swap-tint--{side}` class: CSS
 *    (transitions.sass) tints the cards' glow with the team color at 8%, and
 *    removing the class lets ItemCard's own box-shadow transition fade it.
 *
 * Under reduced motion / the E2E kill-switch the hooks call `done()`
 * immediately (jump to end state, no tint). Tweens are killed on scope
 * dispose, so a modal/page teardown mid-flight leaves nothing running.
 */
export function useTeamSwapMotion(teamRef: Ref<TeamSide>): UseTeamSwapMotionReturn {
  const reducedMotion = useReducedMotion()
  let enterTween: gsap.core.Tween | null = null
  let leaveTween: gsap.core.Tween | null = null
  let tintEl: HTMLElement | null = null

  /**
   * +1 when the active team is T (we came from CT), -1 when it is CT.
   * Read at hook time — `teamRef` already holds the incoming side.
   */
  const direction = (): number => (teamRef.value === 't' ? 1 : -1)

  function clearTint(): void {
    if (!tintEl) return
    tintEl.classList.remove(TINT_CLASSES.ct, TINT_CLASSES.t)
    tintEl = null
  }

  function childrenOf(el: Element): HTMLElement[] {
    return Array.from(el.children).filter(
      (child): child is HTMLElement => child instanceof HTMLElement
    )
  }

  function onLeave(el: Element, done: () => void): void {
    if (reducedMotion.value) {
      done()
      return
    }
    leaveTween?.kill()
    leaveTween = gsap.to(el, {
      x: -24 * direction(),
      opacity: 0,
      duration: 0.2,
      ease: 'power2.in',
      overwrite: 'auto',
      onComplete: done,
    })
  }

  function onEnter(el: Element, done: () => void): void {
    if (reducedMotion.value) {
      done()
      return
    }
    const children = childrenOf(el)
    if (children.length === 0) {
      done()
      return
    }

    // Brief team-colored glow on the incoming cards; the class removal in
    // onComplete lets the CSS box-shadow transition fade the tint out.
    clearTint()
    tintEl = el as HTMLElement
    tintEl.classList.add(TINT_CLASSES[teamRef.value])

    enterTween?.kill()
    enterTween = gsap.fromTo(
      children,
      { x: 24 * direction(), opacity: 0 },
      {
        x: 0,
        opacity: 1,
        duration: DUR.slow,
        ease: EASE.out,
        stagger: 0.03,
        overwrite: 'auto',
        clearProps: 'opacity,transform',
        onComplete: () => {
          clearTint()
          done()
        },
      }
    )
  }

  function onEnterCancelled(el: Element): void {
    enterTween?.kill()
    enterTween = null
    gsap.set(childrenOf(el), { clearProps: 'opacity,transform' })
    clearTint()
  }

  function onLeaveCancelled(el: Element): void {
    leaveTween?.kill()
    leaveTween = null
    gsap.set(el, { clearProps: 'opacity,transform' })
  }

  tryOnScopeDispose(() => {
    enterTween?.kill()
    leaveTween?.kill()
    enterTween = null
    leaveTween = null
    clearTint()
  })

  return { onEnter, onLeave, onEnterCancelled, onLeaveCancelled }
}
