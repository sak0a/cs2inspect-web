<script setup lang="ts">
/**
 * ItemCard — the unified Onyx item-card primitive.
 *
 * Replaces the six diverged card recipes in `app/components/tabs/*`
 * (weapon / knife / glove / agent / musickit / pin). See the design spec:
 * docs/superpowers/specs/2026-07-15-onyx-redesign-design.md, section 5.
 *
 * Visual language: near-black surface, hairline border, radial rarity glow
 * under the art. Rarity arrives as a runtime hex and is exposed to CSS as
 * `--rc` on the card root; all rarity-tinted treatments consume it via
 * `color-mix`.
 *
 * Attribute passthrough: single root element, so `class` (e.g. the tutorial's
 * `.weapon-card` hook), `data-tutorial`, `aria-label` and native listeners
 * (`@click`) fall through from the consumer. Enter/Space dispatch a native
 * click on the root so consumer `@click` handlers and the tutorial's
 * `.click()` behave identically to pointer input.
 *
 * Slots:
 *  - #actions — top-right quick-action content (e.g. dropdown trigger).
 *               Clicks inside are stopped so they don't select the card.
 *  - #badge   — custom corner chip content (replaces `badgeText`).
 *  - #meta    — overrides the default rarity-label / float meta row.
 *  - default  — extra content below the meta row.
 */
import { LucideCheck } from '@lucide/vue'
import { DUR, EASE } from '~/utils/motion'

type ItemCardState = 'normal' | 'unconfigured' | 'inactive'

interface Props {
  /** Primary name (weapon/agent/kit name). */
  name: string
  /** Secondary name rendered muted after a pipe, e.g. the skin name. */
  subName?: string
  /** Item art URL. Stage renders empty (glow only) when omitted. */
  imageUrl?: string
  /** Alt text for the art; falls back to `name`. */
  imageAlt?: string
  /** Runtime rarity hex from the API. Defaults to the stock-item gray. */
  rarityColor?: string
  /** Mono micro-label on the left of the meta row (e.g. rarity name). */
  rarityLabel?: string
  /** normal | unconfigured (dashed, dimmed) | inactive (configured, off). */
  state?: ItemCardState
  /** Accent ring + check badge. Feedback is instant (no transition). */
  selected?: boolean
  /** Shows the StatTrak™ chip in the top-left corner. */
  statTrak?: boolean
  /** Wear readout on the right of the meta row; hidden when absent. */
  floatValue?: number | string | null
  /** Corner chip text (e.g. "Vanilla", team label). Overridden by #badge. */
  badgeText?: string
  /** Height/layout classes for the fixed image stage (grid uniformity). */
  stageClass?: string
  /**
   * `data-flip-id` for the card→modal Flip morph (useFlipMorph.ts). The page
   * pairs it with the modal stage img (`weapon-art-<defindex>`). Omit to opt
   * out (e.g. unconfigured cards fall back to the plain modal entrance).
   */
  flipId?: string
}

const props = withDefaults(defineProps<Props>(), {
  subName: undefined,
  imageUrl: undefined,
  imageAlt: undefined,
  rarityColor: undefined,
  rarityLabel: undefined,
  state: 'normal',
  selected: false,
  statTrak: false,
  floatValue: undefined,
  badgeText: undefined,
  stageClass: 'h-32',
  flipId: undefined,
})

const { t } = useI18n()
const slots = useSlots()

/** Default rarity (stock/consumer gray) — keeps `--rc`-based recipes valid. */
const DEFAULT_RARITY_COLOR = '#B0C3D9'

const rarityHex = computed(() => props.rarityColor || DEFAULT_RARITY_COLOR)

/** Wear readout, normalized to the app-wide 3-decimal convention. */
const formattedFloat = computed<string | null>(() => {
  const raw = props.floatValue
  if (raw === undefined || raw === null || raw === '') return null
  const num = typeof raw === 'number' ? raw : Number(raw)
  if (Number.isNaN(num)) return String(raw)
  return num.toFixed(3)
})

const showMetaRow = computed(
  () =>
    !!slots.meta ||
    props.state === 'unconfigured' ||
    !!props.rarityLabel ||
    formattedFloat.value !== null
)

/** Enter/Space → native click, so consumer @click + tutorial hooks fire. */
const triggerClick = (event: KeyboardEvent): void => {
  ;(event.currentTarget as HTMLElement | null)?.click()
}

/* ── Pointer parallax (Phase 3, spec §8) ──────────────────────────────────
 * The art leans toward the pointer (±8px x / ±6px y, ±2.4deg) while the
 * rarity glow drifts the opposite way for depth. Driven by gsap.quickTo —
 * no reactive state per move, one retargeted tween per property. While
 * active, the `.item-card--parallax` class hands the art's transform over
 * to GSAP (CSS hover transform + transition are gated off, see <style>).
 *
 * Gates: fine pointer only, skipped under reduced motion / the E2E
 * kill-switch (useReducedMotion), and skipped for unconfigured cards.
 * Everything runs inside the useGsap context → auto-reverted on unmount.
 */
const cardEl = ref<HTMLElement | null>(null)
const artEl = ref<HTMLImageElement | null>(null)
const glowEl = ref<HTMLElement | null>(null)

const { gsap, ctx } = useGsap(cardEl)
const reducedMotion = useReducedMotion()

/** false during SSR/hydration → CSS hover stays authoritative until mount. */
const hasFinePointer = ref(false)
onMounted(() => {
  hasFinePointer.value = window.matchMedia('(pointer: fine)').matches
})

const parallaxOn = computed(
  () => hasFinePointer.value && !reducedMotion.value && props.state !== 'unconfigured'
)

/** Max travel: px for x/y, deg for rot. Glow moves opposite (depth). */
const PARALLAX = { artX: 8, artY: 6, artRot: 2.4, glowX: 6, glowY: 5 } as const

type QuickTo = ReturnType<typeof gsap.quickTo>
interface ParallaxSetters {
  artX: QuickTo
  artY: QuickTo
  artRot: QuickTo
  glowX?: QuickTo
  glowY?: QuickTo
}

let parallax: ParallaxSetters | null = null
let cardRect: DOMRect | null = null

const onParallaxEnter = (event: PointerEvent): void => {
  if (!parallaxOn.value) return
  const art = artEl.value
  if (!art) return
  // Rect cached per hover — no layout reads inside the move handler.
  cardRect = (event.currentTarget as HTMLElement).getBoundingClientRect()
  ctx(() => {
    const opts = { duration: 0.35, ease: EASE.reveal }
    parallax = {
      artX: gsap.quickTo(art, 'x', opts),
      artY: gsap.quickTo(art, 'y', opts),
      artRot: gsap.quickTo(art, 'rotation', opts),
    }
    const glow = glowEl.value
    if (glow) {
      parallax.glowX = gsap.quickTo(glow, 'x', opts)
      parallax.glowY = gsap.quickTo(glow, 'y', opts)
    }
    // Hover pop — replaces the gated-off CSS :hover art transform.
    gsap.to(art, { scale: 1.045, duration: DUR.slow, ease: EASE.out, overwrite: 'auto' })
  })
}

const onParallaxMove = (event: PointerEvent): void => {
  if (!parallax || !cardRect || cardRect.width === 0 || cardRect.height === 0) return
  const nx = Math.min(1, Math.max(-1, ((event.clientX - cardRect.left) / cardRect.width) * 2 - 1))
  const ny = Math.min(1, Math.max(-1, ((event.clientY - cardRect.top) / cardRect.height) * 2 - 1))
  parallax.artX(nx * PARALLAX.artX)
  parallax.artY(ny * PARALLAX.artY)
  parallax.artRot(nx * PARALLAX.artRot)
  parallax.glowX?.(-nx * PARALLAX.glowX)
  parallax.glowY?.(-ny * PARALLAX.glowY)
}

/** Return art + glow to rest; quickTo instances are recreated per hover. */
const parallaxRest = (animate: boolean): void => {
  parallax = null
  cardRect = null
  const targets = [artEl.value, glowEl.value].filter(
    (el): el is HTMLElement => el instanceof HTMLElement
  )
  if (targets.length === 0) return
  ctx(() => {
    if (!animate) {
      gsap.set(targets, { clearProps: 'transform' })
      return
    }
    gsap.to(targets, {
      x: 0,
      y: 0,
      rotation: 0,
      scale: 1,
      duration: DUR.slow,
      ease: EASE.out,
      overwrite: 'auto',
      // Leaves no inline transform behind → CSS owns the resting state.
      clearProps: 'transform',
    })
  })
}

const onParallaxLeave = (): void => {
  if (!parallax) return
  parallaxRest(!reducedMotion.value)
}

// Gate flips off mid-hover (reduced motion toggled live, card becomes
// unconfigured, grid data replaced) → snap straight to the resting state.
watch(parallaxOn, (on) => {
  if (!on && parallax) parallaxRest(false)
})
</script>

<template>
  <div
    ref="cardEl"
    class="item-card relative cursor-pointer overflow-hidden border border-border bg-card p-3.5"
    :class="{
      'item-card--unconfigured': state === 'unconfigured',
      'item-card--inactive': state === 'inactive',
      'item-card--selected': selected,
      'item-card--parallax': parallaxOn,
    }"
    :style="{ '--rc': rarityHex }"
    role="button"
    tabindex="0"
    @keydown.enter.prevent="triggerClick"
    @keydown.space.prevent="triggerClick"
    @pointerenter="onParallaxEnter"
    @pointermove="onParallaxMove"
    @pointerleave="onParallaxLeave"
  >
    <!-- Rarity glow — the light the item casts on the surface -->
    <div ref="glowEl" class="item-card__glow" aria-hidden="true" />

    <!-- Fixed-height art stage (uniform grid rows) -->
    <div class="relative z-[1] flex w-full items-center justify-center" :class="stageClass">
      <img
        v-if="imageUrl"
        ref="artEl"
        :src="imageUrl"
        :alt="imageAlt || name"
        :data-flip-id="flipId"
        class="item-card__art h-full w-full object-contain"
        loading="lazy"
        draggable="false"
      />
    </div>

    <!-- Selection ring overlay: mounted/unmounted with no transition so
         selection feedback is instant (<50ms) in both directions -->
    <div
      v-if="selected"
      class="item-card__selection pointer-events-none absolute inset-0 z-[2] rounded-[inherit]"
      aria-hidden="true"
    />

    <!-- StatTrak chip -->
    <span
      v-if="statTrak"
      class="absolute left-2.5 top-2.5 z-[3] rounded-full border border-[rgba(255,140,50,0.28)] bg-[rgba(255,140,50,0.12)] px-2 py-0.5 font-mono text-[9px] uppercase leading-tight tracking-[0.08em] text-[#ffb26b]"
    >
      {{ t('itemCard.statTrak') }}
    </span>

    <!-- Top-right corner stack: check badge > quick actions > badge chip -->
    <div class="absolute right-2.5 top-2.5 z-[3] flex flex-col items-end gap-1.5">
      <span
        v-if="selected"
        class="flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground"
        aria-hidden="true"
      >
        <LucideCheck :size="12" :stroke-width="3" />
      </span>
      <div v-if="$slots.actions" @click.stop @keydown.stop>
        <slot name="actions" />
      </div>
      <slot name="badge">
        <span
          v-if="badgeText"
          class="rounded-full border border-border-strong bg-white/[0.06] px-2 py-0.5 font-mono text-[10px] uppercase leading-tight tracking-[0.08em] text-muted-foreground"
        >
          {{ badgeText }}
        </span>
      </slot>
    </div>

    <!-- Name row -->
    <p
      class="relative z-[1] mt-2.5 truncate font-display text-[13.5px] font-medium leading-snug"
      :class="state === 'unconfigured' ? 'text-text-tertiary' : 'text-foreground'"
    >
      {{ name }}<span v-if="subName" class="text-muted-foreground"> | {{ subName }}</span>
    </p>

    <!-- Meta row: mono rarity label (left) + float readout (right) -->
    <div v-if="showMetaRow" class="relative z-[1] mt-1 flex items-baseline justify-between gap-2">
      <slot name="meta">
        <span
          v-if="state === 'unconfigured'"
          class="font-mono text-[10px] uppercase tracking-[0.08em] text-text-tertiary"
        >
          {{ t('itemCard.notConfigured') }}
        </span>
        <span
          v-else-if="rarityLabel"
          class="truncate font-mono text-[10px] uppercase tracking-[0.08em]"
          :style="{ color: 'var(--rc)' }"
        >
          {{ rarityLabel }}
        </span>
        <span v-else aria-hidden="true" />
        <span
          v-if="formattedFloat !== null && state !== 'unconfigured'"
          class="shrink-0 font-mono text-[10.5px] tabular-nums text-text-tertiary"
        >
          {{ formattedFloat }}
        </span>
      </slot>
    </div>

    <!-- Extra content (descriptions, custom rows) -->
    <div v-if="$slots.default" class="relative z-[1]">
      <slot />
    </div>
  </div>
</template>

<style scoped>
.item-card {
  border-radius: var(--radius-card);
  transition:
    transform var(--dur-base) var(--ease-out),
    border-color var(--dur-base) var(--ease-out),
    box-shadow var(--dur-base) var(--ease-out),
    opacity var(--dur-base) var(--ease-out);
}

.item-card:hover {
  transform: translateY(-4px);
  border-color: color-mix(in srgb, var(--rc) 36%, transparent);
  box-shadow: var(--shadow-card);
}

.item-card:active {
  transform: scale(0.985);
}

.item-card:focus-visible {
  outline: 2px solid var(--primary);
  outline-offset: 2px;
}

/* Rarity glow layer — idle 13%, blooms to 30% on hover */
.item-card__glow {
  position: absolute;
  inset: -10% -14%;
  background: radial-gradient(55% 62% at 50% 58%, var(--rc), transparent 70%);
  opacity: 0.13;
  transition: opacity var(--dur-base) var(--ease-out);
  pointer-events: none;
}

.item-card:hover .item-card__glow {
  opacity: 0.3;
}

/* Art: deep drop-shadow, lifts on hover. On fine-pointer devices the JS
 * pointer parallax owns the transform instead (`.item-card--parallax` gates
 * the CSS hover motion + transition off so GSAP never fights a transition). */
.item-card__art {
  filter: drop-shadow(0 14px 20px rgba(0, 0, 0, 0.55));
  transition: transform var(--dur-slow) var(--ease-out);
}

.item-card:not(.item-card--parallax):hover .item-card__art {
  transform: translateY(-5px) scale(1.045) rotate(-1.2deg);
}

.item-card--parallax .item-card__art {
  transition: none;
}

/* Selected: accent-tinted border + inset ring (overlay element — untransitioned) */
.item-card__selection {
  border: 1px solid color-mix(in srgb, var(--primary) 55%, transparent);
  box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--primary) 30%, transparent);
}

/* Unconfigured: dashed hairline, transparent ground, dimmed desaturated art */
.item-card.item-card--unconfigured {
  border-style: dashed;
  border-color: var(--border-strong);
  background: transparent;
}

.item-card.item-card--unconfigured:hover {
  border-color: var(--text-tertiary);
}

.item-card.item-card--unconfigured .item-card__glow {
  opacity: 0.05;
}

.item-card.item-card--unconfigured:hover .item-card__glow {
  opacity: 0.1;
}

.item-card.item-card--unconfigured .item-card__art {
  opacity: 0.32;
  filter: grayscale(0.85) drop-shadow(0 14px 20px rgba(0, 0, 0, 0.4));
}

/* Inactive: configured but not in the loadout — dashed rarity-tinted border */
.item-card.item-card--inactive {
  opacity: 0.65;
  border-style: dashed;
  border-color: color-mix(in srgb, var(--rc) 30%, transparent);
}

.item-card.item-card--inactive:hover {
  opacity: 0.9;
}
</style>
