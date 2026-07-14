<script setup lang="ts">
/**
 * AppModal — replacement for `NModal preset="card"`.
 *
 * Wraps the shadcn Dialog with the app's glass-card styling, ported 1:1 from
 * ThemeProvider.vue myThemeOverrides (Modal.peers.Card) + glassmorphism.css
 * (.n-modal > .n-card): var(--glass-bg-primary) background, 24px radius,
 * var(--glass-border) border, layered depth shadows, strong blur/saturation.
 */
import type { CSSProperties } from 'vue'
import { computed } from 'vue'
import { X } from '@lucide/vue'
import { Dialog, DialogContent, DialogTitle, DialogClose } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

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
}

const props = withDefaults(defineProps<Props>(), {
  visible: false,
  title: undefined,
  size: 'md',
  maxWidth: undefined,
  maskClosable: true,
  closable: true,
  loading: false,
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

// Glass card recipe (exact port of the naive Modal peers.Card overrides)
const contentStyle = computed<CSSProperties>(() => ({
  backgroundColor: 'var(--glass-bg-primary)',
  border: '1px solid var(--glass-border)',
  borderRadius: '24px',
  boxShadow: [
    '0 32px 64px rgba(0, 0, 0, 0.9)',
    '0 16px 32px rgba(0, 0, 0, 0.7)',
    '0 8px 16px rgba(0, 0, 0, 0.5)',
    '0 0 0 1px var(--glass-border)',
    'inset 0 1px 0 var(--glass-border)',
  ].join(', '),
  backdropFilter: 'var(--glass-blur-strong) var(--glass-saturation)',
  WebkitBackdropFilter: 'var(--glass-blur-strong) var(--glass-saturation)',
  ...(props.maxWidth ? { maxWidth: props.maxWidth } : {}),
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
</script>

<template>
  <Dialog :open="visible" @update:open="onUpdateOpen">
    <DialogContent
      :show-close-button="false"
      :aria-describedby="undefined"
      :class="
        cn(
          'flex max-h-[90vh] flex-col gap-0 overflow-hidden p-0 text-white',
          sizeClasses[size]
        )
      "
      :style="contentStyle"
      @interact-outside="onInteractOutside"
      @pointer-down-outside="onInteractOutside"
      @escape-key-down="onEscapeKeyDown"
    >
      <!-- Accessible title fallback when no visible title is rendered -->
      <DialogTitle v-if="!title" class="sr-only">Dialog</DialogTitle>

      <!-- Header (ported from glassmorphism.css .n-card-header treatment) -->
      <div
        v-if="title || $slots.header || $slots['header-extra'] || closable"
        class="flex shrink-0 items-center gap-3 border-b border-white/8 bg-white/2 px-6 py-4 backdrop-blur-[10px]"
      >
        <div class="min-w-0 flex-1">
          <slot name="header">
            <DialogTitle v-if="title" class="truncate text-lg font-semibold text-white">
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
          class="shrink-0 rounded-full p-1.5 text-white transition-colors hover:bg-[#333333] active:bg-[#444444] focus:outline-hidden focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
          :aria-label="'Close'"
        >
          <X class="size-5" />
        </DialogClose>
      </div>

      <!-- Body -->
      <div class="min-h-0 grow overflow-y-auto px-6 py-5">
        <slot />
      </div>

      <!-- Footer -->
      <div v-if="$slots.footer" class="shrink-0 px-6 pt-1 pb-5">
        <slot name="footer" />
      </div>
    </DialogContent>
  </Dialog>
</template>
