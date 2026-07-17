import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { Flip } from 'gsap/Flip'

/**
 * GSAP bootstrap (client-only).
 *
 * Registers core plugins (ScrollTrigger, Flip) exactly once and exposes the
 * gsap singleton as `$gsap` / `useNuxtApp().$gsap`. Composables may equally
 * `import { gsap } from 'gsap'` directly — it is the same singleton.
 *
 * ScrollTrigger defaults are intentionally NOT configured here: the app's
 * scroll container is the layout root div (html/body are overflow hidden) and
 * it does not exist at plugin time. Consumers pass `scroller` per-trigger, or
 * call `ScrollTrigger.defaults({ scroller })` lazily once the layout mounts.
 */
export default defineNuxtPlugin((nuxtApp) => {
  gsap.registerPlugin(ScrollTrigger, Flip)
  nuxtApp.provide('gsap', gsap)
})

declare module '#app' {
  interface NuxtApp {
    $gsap: typeof gsap
  }
}

declare module 'vue' {
  interface ComponentCustomProperties {
    $gsap: typeof gsap
  }
}
