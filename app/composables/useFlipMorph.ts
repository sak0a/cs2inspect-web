import { tryOnScopeDispose } from '@vueuse/core'
import { gsap } from 'gsap'
import { Flip } from 'gsap/Flip'
import type { Ref } from 'vue'
import { EASE } from '~/utils/motion'

/**
 * Card → modal Flip morph (design spec §8 — "the app's heartbeat").
 *
 * A grid card's weapon art flies into the modal's preview stage when the
 * modal opens. The pairing uses `data-flip-id="weapon-art-<defindex>"` on
 * both the card `<img>` (ItemCard `flipId` prop) and the stage fallback
 * `<img>` (WeaponSkinModal).
 *
 * Flow:
 *  1. The page captures `Flip.getState(cardImg)` in a capture-phase click
 *     handler (`captureFlipMorph`) — only for trusted user clicks, so the
 *     tutorial's programmatic `.click()` falls back to the plain entrance.
 *  2. `AppModal` checks `hasPendingFlipMorph()` on open and switches to a
 *     fade-only entrance (no panel/section transforms) so the stage rect is
 *     stable while the art is in flight.
 *  3. `useStageFlipMorph` (modal side) waits for the stage img to mount and
 *     load, then runs `Flip.from` — targeting a fixed-position CLONE of the
 *     stage img appended to <body>. The clone is required because the modal
 *     panel is `overflow-hidden` (and its body scrolls): a transform on the
 *     real stage img would be clipped mid-flight, and the panel's entrance
 *     fade would dim it. The clone carries the same `data-flip-id`, so the
 *     Flip state still pairs by id. `scale: true` keeps the flight
 *     transform-only (motion law).
 *  4. The card art hides during flight and fades back on modal close
 *     (`restoreFlipMorphSource`) — no reverse Flip.
 *
 * Fallbacks (plain modal entrance, no morph): unconfigured card (no
 * flip-id), untrusted/programmatic open, reduced motion / E2E kill-switch,
 * source and stage art URL mismatch (e.g. vanilla flat renders), image not
 * loaded within 400ms, stale capture (>1.5s), modal closed mid-setup.
 *
 * Module state is client-only by construction: it is only ever written from
 * DOM event handlers and client watchers, never during SSR.
 */

interface PendingFlipMorph {
  /** Shared `data-flip-id` between the card img and the stage img. */
  id: string
  /** Flip snapshot of the card art, captured at click time. */
  state: ReturnType<typeof Flip.getState>
  /** The card `<img>` — hidden during flight, restored on modal close. */
  sourceEl: HTMLImageElement
  /** Resolved source URL — must match the stage img for a seamless morph. */
  src: string
  capturedAt: number
}

/** Captures older than this are considered stale (click never led to a modal). */
const FLIP_MORPH_MAX_AGE_MS = 1500

/** Stage-img load grace period before falling back to the plain entrance. */
const IMAGE_LOAD_TIMEOUT_MS = 400

/** Flight paints above the dialog overlay/panel (both z-50). */
const FLIGHT_Z_INDEX = 60

let pendingMorph: PendingFlipMorph | null = null
let hiddenSource: PendingFlipMorph | null = null

function isFresh(morph: PendingFlipMorph): boolean {
  return Date.now() - morph.capturedAt <= FLIP_MORPH_MAX_AGE_MS
}

/**
 * Snapshot a card art `<img>` as the source of the next modal-open morph.
 * Call from a trusted click handler, before the modal `visible` flips true.
 * No-ops when the image has no renderable pixels yet.
 */
export function captureFlipMorph(img: HTMLImageElement, id: string): void {
  if (import.meta.server) return
  if (!img.complete || img.naturalWidth === 0) {
    pendingMorph = null
    return
  }
  pendingMorph = {
    id,
    state: Flip.getState(img),
    sourceEl: img,
    src: img.currentSrc || img.src,
    capturedAt: Date.now(),
  }
}

/**
 * `true` while a fresh capture is waiting to be consumed — `AppModal` uses
 * this at open time to pick the fade-only entrance (stable stage rect).
 */
export function hasPendingFlipMorph(): boolean {
  if (import.meta.server) return false
  if (pendingMorph && !isFresh(pendingMorph)) pendingMorph = null
  return pendingMorph !== null
}

/**
 * Fade the hidden card art back in (modal closed / flight aborted).
 * Also re-shows any current grid img with the same flip id — the grid may
 * have been re-rendered (auto-save silent refresh, SSE reload) while the
 * modal was open, in which case Vue can have reused the patched element and
 * kept the inline `visibility:hidden`. Idempotent; no-op when nothing hid.
 */
export function restoreFlipMorphSource(): void {
  if (import.meta.server || !hiddenSource) return
  const { sourceEl, id } = hiddenSource
  hiddenSource = null
  const targets = new Set<HTMLElement>([sourceEl])
  document
    .querySelectorAll<HTMLElement>(`img[data-flip-id="${CSS.escape(id)}"]`)
    .forEach((el) => targets.add(el))
  gsap.to([...targets], {
    autoAlpha: 1,
    duration: 0.2,
    ease: 'power2.out',
    overwrite: 'auto',
    clearProps: 'opacity,visibility',
  })
}

export interface UseStageFlipMorphOptions {
  /** Modal visibility getter (`() => props.visible`). */
  visible: () => boolean
  /** Expected flip id for the current item (null → never morph). */
  flipId: () => string | null | undefined
  /** The stage fallback `<img>` (the one rendered before video takes over). */
  imgEl: Ref<HTMLImageElement | null>
}

export interface UseStageFlipMorphReturn {
  /**
   * Resolves once no morph flight is active or pending for this stage.
   * The modal awaits this before swapping the stage img for the video
   * canvas, so the art never vanishes mid-flight. Guaranteed to resolve
   * (flight end, any fallback path, or a 1.5s failsafe).
   */
  whenSettled: () => Promise<void>
}

/**
 * Modal-side engine of the card→stage morph. Instantiate once in the skin
 * modal; it watches `visible` and runs/aborts the flight by itself.
 */
export function useStageFlipMorph(options: UseStageFlipMorphOptions): UseStageFlipMorphReturn {
  const reducedMotion = useReducedMotion()

  let flightTween: gsap.core.Timeline | gsap.core.Tween | null = null
  let flightClone: HTMLImageElement | null = null
  /** true from the moment a morph looks plausible until it fully settles. */
  let flightActive = false
  let waiters: (() => void)[] = []

  function settle(): void {
    flightActive = false
    const resolvers = waiters
    waiters = []
    resolvers.forEach((resolve) => resolve())
  }

  /** Reveal the real stage img, drop the clone, resolve waiters. Idempotent. */
  function endFlight(): void {
    flightTween = null
    const img = options.imgEl.value
    if (img) gsap.set(img, { clearProps: 'opacity,visibility' })
    flightClone?.remove()
    flightClone = null
    settle()
  }

  /** Kill an in-progress flight (modal force-closed, unmount). */
  function abortFlight(): void {
    if (flightTween) {
      // .kill() fires onInterrupt → endFlight; call again defensively for
      // the pre-flight window (endFlight is idempotent).
      flightTween.kill()
    }
    endFlight()
  }

  function waitForImageLoad(img: HTMLImageElement): Promise<boolean> {
    if (img.complete && img.naturalWidth > 0) return Promise.resolve(true)
    return new Promise((resolve) => {
      let done = false
      const finish = (ok: boolean): void => {
        if (done) return
        done = true
        img.removeEventListener('load', onLoad)
        img.removeEventListener('error', onError)
        resolve(ok)
      }
      const onLoad = (): void => finish(img.naturalWidth > 0)
      const onError = (): void => finish(false)
      img.addEventListener('load', onLoad)
      img.addEventListener('error', onError)
      window.setTimeout(() => finish(img.complete && img.naturalWidth > 0), IMAGE_LOAD_TIMEOUT_MS)
    })
  }

  /** @returns whether the flight tween actually started. */
  function startFlight(morph: PendingFlipMorph, img: HTMLImageElement): boolean {
    const rect = img.getBoundingClientRect()
    if (rect.width === 0 || rect.height === 0) return false

    // Fixed-position clone at the stage img's settled rect (AppModal uses a
    // transform-free fade entrance while a morph is pending, so the rect
    // already is the landing position).
    const clone = img.cloneNode(false) as HTMLImageElement
    gsap.set(clone, {
      position: 'fixed',
      top: rect.top,
      left: rect.left,
      width: rect.width,
      height: rect.height,
      margin: 0,
      zIndex: FLIGHT_Z_INDEX,
      pointerEvents: 'none',
    })
    document.body.appendChild(clone)
    flightClone = clone

    // The real stage img keeps its layout box but hides while the clone flies.
    gsap.set(img, { autoAlpha: 0 })

    // The card art fades out fast while the clone fades in — the short
    // crossfade masks the letterbox-aspect difference between the card box
    // and the stage box (both use object-contain).
    hiddenSource = morph
    gsap.to(morph.sourceEl, { autoAlpha: 0, duration: 0.12, ease: 'power2.out', overwrite: 'auto' })
    gsap.fromTo(
      clone,
      { autoAlpha: 0.35 },
      { autoAlpha: 1, duration: 0.18, ease: 'power2.out', overwrite: 'auto' }
    )

    // scale: true → transform-only flight (motion law); pairing by the
    // cloned data-flip-id.
    flightTween = Flip.from(morph.state, {
      targets: clone,
      duration: 0.45,
      ease: EASE.out,
      scale: true,
      onComplete: endFlight,
      onInterrupt: endFlight,
    })
    return true
  }

  async function tryStartFlight(): Promise<void> {
    const id = options.flipId()
    if (!id || !pendingMorph || pendingMorph.id !== id || !isFresh(pendingMorph)) return
    const morph = pendingMorph
    flightActive = true
    let started = false
    try {
      if (reducedMotion.value) return
      await nextTick()
      const img = options.imgEl.value
      if (!img || !options.visible()) return
      // Vanilla/default renders use a different stage asset than the card —
      // a mismatched morph would visibly swap art mid-flight, so fall back.
      if ((img.currentSrc || img.src) !== morph.src) return
      if (!(await waitForImageLoad(img))) return
      if (!options.visible() || options.imgEl.value !== img) return
      started = startFlight(morph, img)
    } finally {
      // One consumer per capture — even on fallback the pending state is spent.
      if (pendingMorph === morph) pendingMorph = null
      if (!started) settle()
    }
  }

  watch(
    () => options.visible(),
    (open) => {
      if (!import.meta.client) return
      if (open) {
        void tryStartFlight()
      } else {
        abortFlight()
        restoreFlipMorphSource()
      }
    }
  )

  function whenSettled(): Promise<void> {
    if (!import.meta.client || !flightActive) return Promise.resolve()
    return new Promise<void>((resolve) => {
      waiters.push(resolve)
      // Failsafe — never hold the video-canvas swap hostage (double-resolve
      // is harmless).
      window.setTimeout(resolve, FLIP_MORPH_MAX_AGE_MS)
    })
  }

  tryOnScopeDispose(() => {
    abortFlight()
    restoreFlipMorphSource()
  })

  return { whenSettled }
}
