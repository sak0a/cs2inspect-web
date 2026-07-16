<script setup lang="ts">
/**
 * SitePreloader — Onyx branded intro (design spec §7/§8).
 *
 * Full-screen near-black overlay with the CS2INSPECT wordmark:
 *  1. letters clip-reveal (y offset + opacity, 30ms stagger, expo.out)
 *  2. a 1px accent hairline draws across (scaleX, origin left)
 *  3. the overlay lifts away (y -100%, expo.inOut), handing off to the page
 * Total run ≤ 1.6s; the element removes itself from the DOM afterwards.
 *
 * Plays once per session, gated by the `cs2inspect-intro-seen` sessionStorage
 * key. (The previous implementation read `preload-<NAME>` but wrote
 * `siteLoader`, so the gate never matched and the loader replayed on every
 * load — fixed by using one constant for both sides.)
 *
 * Under reduced motion / the E2E kill-switch the overlay is removed
 * immediately without animating. Purely decorative → `aria-hidden`.
 */
import { EASE } from '~/utils/motion'

/** One key, read AND written (the old code's read/write keys never matched). */
const INTRO_SEEN_KEY = 'cs2inspect-intro-seen'

const WORDMARK_LETTERS = 'CS2INSPECT'.split('')

const visible = ref(true)
const rootEl = ref<HTMLElement | null>(null)

const { gsap, ctx } = useGsap(rootEl)
const reducedMotion = useReducedMotion()

function hasSeenIntro(): boolean {
  try {
    return sessionStorage.getItem(INTRO_SEEN_KEY) === '1'
  } catch {
    // sessionStorage unavailable (privacy mode) — treat as seen, never block.
    return true
  }
}

function markIntroSeen(): void {
  try {
    sessionStorage.setItem(INTRO_SEEN_KEY, '1')
  } catch {
    /* non-fatal */
  }
}

onMounted(() => {
  if (hasSeenIntro() || reducedMotion.value) {
    // Skip entirely: instant removal, no animation, no interaction blocking.
    markIntroSeen()
    visible.value = false
    return
  }
  markIntroSeen()

  ctx(() => {
    const tl = gsap.timeline({
      defaults: { ease: EASE.out },
      onComplete: () => {
        visible.value = false
      },
    })

    tl
      // Wordmark clip-reveal: letters slide up into the overflow-hidden line.
      .set('.preloader-hairline', { scaleX: 0, transformOrigin: 'left center' })
      .from('.preloader-letter', {
        yPercent: 120,
        opacity: 0,
        duration: 0.6,
        stagger: 0.03,
      })
      // Accent hairline draws across beneath the wordmark.
      .to('.preloader-hairline', { scaleX: 1, duration: 0.5 }, 0.35)
      // Overlay lifts away, handing off to the page. Pointer-events drop the
      // moment the lift starts so the page is interactive during the exit.
      .to(
        rootEl.value,
        {
          yPercent: -100,
          duration: 0.5,
          ease: 'expo.inOut',
          onStart: () => {
            rootEl.value?.style.setProperty('pointer-events', 'none')
          },
        },
        1.0
      )
    // Timeline ends at 1.5s (≤ 1.6s budget); onComplete removes the node.
  })
})
</script>

<template>
  <!-- z-index preserved from the old preloader: above tutorial/modals/nav -->
  <div v-if="visible" ref="rootEl" class="site-preloader" aria-hidden="true">
    <div class="preloader-lockup">
      <div class="preloader-wordmark">
        <span v-for="(letter, i) in WORDMARK_LETTERS" :key="i" class="preloader-letter">{{
          letter
        }}</span>
      </div>
      <div class="preloader-hairline" />
    </div>
  </div>
</template>

<style scoped>
.site-preloader {
  position: fixed;
  inset: 0;
  z-index: 10000000;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #070708;
}

.preloader-lockup {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 14px;
}

/* Clip container for the letter reveal (letters slide up from below). */
.preloader-wordmark {
  display: flex;
  overflow: hidden;
  padding: 0.08em 0; /* keep ascenders/descenders inside the clip */
  font-family: var(--font-display, ui-sans-serif, system-ui, sans-serif);
  font-size: clamp(2rem, 5.5vw, 3.25rem);
  font-weight: 700;
  letter-spacing: -0.02em;
  line-height: 1;
  color: #f2f2f4;
}

.preloader-letter {
  display: inline-block;
  will-change: transform, opacity;
}

.preloader-hairline {
  height: 1px;
  background: var(--primary, #facc15);
}
</style>
