<script setup lang="ts">
/**
 * AppModal — the app-wide modal shell (Onyx surface).
 *
 * Structure: the reka `DialogContent` is used directly (instead of the ui-kit
 * wrapper) as a transform-free positioning shell — fixed centering, size caps
 * and the CSS *exit* animation live on it, while an inner "panel" div carries
 * the visual recipe (near-opaque `bg-card` #0e0e10, hairline border,
 * `--radius-modal`, `--shadow-modal`) and all GSAP motion.
 *
 * Motion choreography (design spec §6/§8):
 *  - Open (GSAP, panel): scale 0.97 / y 12 / opacity 0 → identity over 0.4s
 *    expo.out; header/body/footer sections follow with y 8 / opacity 0 and a
 *    50ms stagger. When a card→modal Flip morph is pending
 *    (`hasPendingFlipMorph()`), the entrance is a transform-free 0.3s fade so
 *    the stage art's landing rect stays stable while the art is in flight.
 *  - Close (CSS, content shell): fade + zoom-out-97 + 12px slide-down over
 *    220ms ease-in. Keeping the exit as a CSS `data-[state=closed]` animation
 *    is the robust path: reka's presence waits for it before unmounting, so
 *    no forceMount/manual-visibility bookkeeping is needed and a force-close
 *    mid-entrance simply fades out from the current state (the GSAP timeline
 *    is killed; CSS animations override its inline styles).
 *    IMPORTANT: total close duration must stay ≤ 250ms — WeaponSkinModal
 *    resets its state 300ms after close and the weapons page clears
 *    `selectedWeapon` after 500ms; both constants rely on this.
 *  - The overlay keeps its CSS fade (ui DialogOverlay, untouched).
 *  - Reduced motion / E2E kill-switch: GSAP skipped entirely (markup is
 *    never CSS-hidden, so content is simply visible); the global
 *    reduced-motion block collapses the CSS exit to 1ms.
 *
 * Sub-modal stacking: every AppModal provides a registration fn under
 * `modalStackKey` and registers with its nearest ancestor AppModal while
 * visible (sticker/keychain/reset/… all render inside the parent modal's
 * slot, so injection reaches them). While any descendant is open the parent
 * panel scales to 0.985 / opacity 0.8 (0.3s expo.out) and restores on close.
 *
 * The `admin` variant renders a slightly darker panel (#0b0b0d) with a
 * stronger shadow.
 */
import { computed, inject, nextTick, provide, ref, watch } from 'vue'
import { tryOnScopeDispose } from '@vueuse/core'
import { X } from '@lucide/vue'
import { DialogContent as RekaDialogContent, DialogPortal } from 'reka-ui'
import { Dialog, DialogOverlay, DialogTitle, DialogClose } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { DUR, EASE } from '~/utils/motion'

interface Props {
  /** v-model:visible */
  visible?: boolean
  /** Header title (ignored when the #header slot is used) */
  title?: string
  /** sm 600px / md 700px / lg 900px / huge 1200px (all capped at 95vw) */
  size?: 'sm' | 'md' | 'lg' | 'huge'
  /** Overrides the size map, e.g. "1800px" (WeaponSkinModal) */
  maxWidth?: string
  /** Close on overlay click + ESC (gated by `loading`) */
  maskClosable?: boolean
  /** Show the X close button (gated by `loading`) */
  closable?: boolean
  /** While true, the modal cannot be closed (mask, ESC or X) */
  loading?: boolean
  /** admin = slightly darker panel with a stronger shadow */
  variant?: 'default' | 'admin'
}

const props = withDefaults(defineProps<Props>(), {
  visible: false,
  title: undefined,
  size: 'md',
  maxWidth: undefined,
  maskClosable: true,
  closable: true,
  loading: false,
  variant: 'default',
})

const emit = defineEmits<{
  'update:visible': [value: boolean]
}>()

const sizeClasses: Record<NonNullable<Props['size']>, string> = {
  sm: 'w-[95vw] max-w-[600px] sm:max-w-[600px]',
  md: 'w-[95vw] max-w-[700px] sm:max-w-[700px]',
  lg: 'w-[95vw] max-w-[900px] sm:max-w-[900px]',
  huge: 'w-[95vw] max-w-[1200px] sm:max-w-[1200px]',
}

const variantClasses: Record<NonNullable<Props['variant']>, string> = {
  default: 'bg-card',
  admin: 'bg-[#0b0b0d]',
}

// Stronger drop for the darker admin panel; applied by overriding the
// --shadow-modal token consumed by shadow-[var(--shadow-modal)] on the panel
// (custom properties inherit from the content shell).
const ADMIN_SHADOW =
  '0 40px 100px -16px rgba(0, 0, 0, 0.95), 0 0 0 1px rgba(255, 255, 255, 0.03), inset 0 1px 0 rgba(255, 255, 255, 0.05)'

// maxWidth escape hatch must stay inline (arbitrary runtime value)
const contentStyle = computed(() => ({
  ...(props.maxWidth ? { maxWidth: props.maxWidth } : {}),
  ...(props.variant === 'admin' ? { '--shadow-modal': ADMIN_SHADOW } : {}),
}))

const canDismiss = computed(() => props.maskClosable && !props.loading)

function onUpdateOpen(open: boolean) {
  emit('update:visible', open)
}

function onInteractOutside(event: Event) {
  if (!canDismiss.value) event.preventDefault()
}

function onEscapeKeyDown(event: KeyboardEvent) {
  if (!canDismiss.value) event.preventDefault()
}

/* ── Open/close choreography ─────────────────────────────────────────────── */

const panelEl = ref<HTMLElement | null>(null)
const headerEl = ref<HTMLElement | null>(null)
const bodyEl = ref<HTMLElement | null>(null)
const footerEl = ref<HTMLElement | null>(null)

const { gsap, ctx } = useGsap(panelEl)
const reducedMotion = useReducedMotion()

let enterTl: gsap.core.Timeline | null = null

function killEnter(): void {
  enterTl?.kill()
  enterTl = null
}

function sectionEls(): HTMLElement[] {
  return [headerEl.value, bodyEl.value, footerEl.value].filter(
    (el): el is HTMLElement => el instanceof HTMLElement
  )
}

function runEnterChoreography(): void {
  const panel = panelEl.value
  if (!panel) return
  const sections = sectionEls()
  killEnter()

  if (reducedMotion.value) {
    // Natural CSS state is fully visible; just clear residue from a
    // previously interrupted run.
    gsap.set([panel, ...sections], { clearProps: 'opacity,transform' })
    return
  }

  // Flip-morph open (weapons card → stage): transform-free fade so the
  // in-flight art has a stable landing rect (see useFlipMorph.ts).
  const morphOpen = hasPendingFlipMorph()

  ctx(() => {
    enterTl = gsap.timeline({
      onComplete: () => {
        // Hand styling back to CSS — but never clobber an active sub-modal dim.
        if (openDescendants.value === 0) {
          gsap.set([panel, ...sections], { clearProps: 'opacity,transform' })
        }
        enterTl = null
      },
    })
    if (morphOpen) {
      enterTl.fromTo(panel, { opacity: 0 }, { opacity: 1, duration: 0.3, ease: EASE.out })
    } else {
      enterTl.fromTo(
        panel,
        { opacity: 0, scale: 0.97, y: 12 },
        { opacity: 1, scale: 1, y: 0, duration: DUR.slow, ease: EASE.out },
        0
      )
      if (sections.length > 0) {
        enterTl.fromTo(
          sections,
          { opacity: 0, y: 8 },
          { opacity: 1, y: 0, duration: DUR.slow, ease: EASE.out, stagger: 0.05 },
          0.05
        )
      }
    }
  })
}

watch(
  () => props.visible,
  (open) => {
    if (!import.meta.client) return
    if (open) {
      // Content mounts via reka's portal this tick — animate right after.
      nextTick(() => {
        if (props.visible) runEnterChoreography()
      })
    } else {
      // CSS `data-[state=closed]` exit takes over; inline mid-entrance
      // values (if any) fade out with it and are re-seeded on next open.
      killEnter()
    }
  },
  { immediate: true }
)

/* ── Sub-modal stacking (provide/inject descendant counter) ──────────────── */

const openDescendants = ref(0)

const registerOpenDescendant: ModalStackRegister = () => {
  openDescendants.value++
  let released = false
  return () => {
    if (released) return
    released = true
    openDescendants.value = Math.max(0, openDescendants.value - 1)
  }
}

// Order matters conceptually, not in code: inject() only ever sees ancestor
// providers, so a nested AppModal registers with its parent, not itself.
const registerWithParent = inject(modalStackKey, null)
provide(modalStackKey, registerOpenDescendant)

let releaseParent: (() => void) | null = null

watch(
  () => props.visible,
  (open) => {
    if (open && !releaseParent && registerWithParent) {
      releaseParent = registerWithParent()
    } else if (!open && releaseParent) {
      releaseParent()
      releaseParent = null
    }
  },
  { immediate: true }
)

watch(
  () => openDescendants.value > 0,
  (dimmed) => {
    const panel = panelEl.value
    if (!panel || !props.visible || !import.meta.client) return
    if (reducedMotion.value) {
      if (dimmed) gsap.set(panel, { scale: 0.985, opacity: 0.8 })
      else gsap.set(panel, { clearProps: 'opacity,transform' })
      return
    }
    ctx(() => {
      if (dimmed) {
        gsap.to(panel, { scale: 0.985, opacity: 0.8, duration: 0.3, ease: EASE.out, overwrite: 'auto' })
      } else {
        gsap.to(panel, {
          scale: 1,
          opacity: 1,
          duration: 0.3,
          ease: EASE.out,
          overwrite: 'auto',
          clearProps: 'opacity,transform',
        })
      }
    })
  }
)

tryOnScopeDispose(() => {
  killEnter()
  releaseParent?.()
  releaseParent = null
})
</script>

<template>
  <Dialog :open="visible" @update:open="onUpdateOpen">
    <DialogPortal>
      <!-- Overlay keeps its CSS fade (enter + exit) -->
      <DialogOverlay />

      <!--
        Positioning shell: transform-free (GSAP never touches it) so the
        centering `translate` stays intact; carries the CSS exit animation
        that reka's presence waits on (220ms ≤ the 300/500ms reset timers).
      -->
      <RekaDialogContent
        data-slot="dialog-content"
        :aria-describedby="undefined"
        :class="
          cn(
            'fixed top-[50%] left-[50%] z-50 flex max-h-[90vh] translate-x-[-50%] translate-y-[-50%] flex-col outline-none',
            'data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-97 data-[state=closed]:slide-out-to-bottom-3 data-[state=closed]:duration-[220ms] data-[state=closed]:ease-in',
            sizeClasses[size]
          )
        "
        :style="contentStyle"
        @interact-outside="onInteractOutside"
        @pointer-down-outside="onInteractOutside"
        @escape-key-down="onEscapeKeyDown"
      >
        <!-- Panel: visual recipe + all GSAP motion (entrance, sub-modal dim) -->
        <div
          ref="panelEl"
          :class="
            cn(
              'relative flex min-h-0 w-full flex-col overflow-hidden rounded-[var(--radius-modal)] border text-foreground shadow-[var(--shadow-modal)]',
              variantClasses[variant]
            )
          "
        >
          <!-- Accessible title fallback when no visible title is rendered -->
          <DialogTitle v-if="!title" class="sr-only">Dialog</DialogTitle>

          <!-- Header -->
          <div
            v-if="title || $slots.header || $slots['header-extra'] || closable"
            ref="headerEl"
            class="flex shrink-0 items-center gap-3 border-b border-border px-6 py-4"
          >
            <div class="min-w-0 flex-1">
              <slot name="header">
                <DialogTitle
                  v-if="title"
                  class="truncate font-display text-lg font-semibold tracking-[-0.01em] text-foreground"
                >
                  {{ title }}
                </DialogTitle>
              </slot>
            </div>
            <div v-if="$slots['header-extra']" class="flex shrink-0 items-center gap-2">
              <slot name="header-extra" />
            </div>
            <DialogClose
              v-if="closable"
              :disabled="loading"
              class="shrink-0 rounded-md p-1.5 text-muted-foreground transition-colors duration-[var(--dur-fast)] [transition-timing-function:var(--ease-out)] hover:bg-white/5 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 disabled:cursor-not-allowed disabled:opacity-50"
              :aria-label="'Close'"
            >
              <X class="size-5" />
            </DialogClose>
          </div>

          <!-- Body -->
          <div ref="bodyEl" class="min-h-0 grow overflow-y-auto px-6 py-5">
            <slot />
          </div>

          <!-- Footer -->
          <div v-if="$slots.footer" ref="footerEl" class="shrink-0 px-6 pt-1 pb-5">
            <slot name="footer" />
          </div>
        </div>
      </RekaDialogContent>
    </DialogPortal>
  </Dialog>
</template>
