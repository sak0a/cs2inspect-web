<script setup lang="ts">
/**
 * AppModal — the app-wide modal shell (Onyx surface).
 *
 * Wraps the shadcn Dialog with the Onyx panel recipe: near-opaque `bg-card`
 * (#0e0e10), hairline border, `--radius-modal`, `--shadow-modal`. No panel
 * blur — only the Dialog overlay keeps its backdrop blur. The `admin`
 * variant renders a slightly darker panel (#0b0b0d) with a stronger shadow.
 */
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
// --shadow-modal token consumed by shadow-[var(--shadow-modal)] (twMerge
// cannot reconcile two arbitrary shadow utilities).
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
</script>

<template>
  <Dialog :open="visible" @update:open="onUpdateOpen">
    <DialogContent
      :show-close-button="false"
      :aria-describedby="undefined"
      :class="
        cn(
          'flex max-h-[90vh] flex-col gap-0 overflow-hidden rounded-[var(--radius-modal)] border p-0 text-foreground shadow-[var(--shadow-modal)]',
          variantClasses[variant],
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

      <!-- Header -->
      <div
        v-if="title || $slots.header || $slots['header-extra'] || closable"
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
