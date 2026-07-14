<script setup lang="ts">
/**
 * Renders the app-wide confirmation dialog driven by useConfirm().
 * Mounted once in app.vue. Styled with the "lighter glass" small-modal
 * recipe (ported from utils/themeCustomization.ts + glassmorphism.css).
 */
import { computed } from 'vue'
import { CircleCheckIcon, InfoIcon, OctagonXIcon, TriangleAlertIcon } from '@lucide/vue'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { useConfirmState } from '@/composables/useConfirm'

const state = useConfirmState()

const typeConfig = {
  warning: { icon: TriangleAlertIcon, iconClass: 'text-amber-500', intent: 'warning' },
  error: { icon: OctagonXIcon, iconClass: 'text-destructive', intent: 'error' },
  success: { icon: CircleCheckIcon, iconClass: 'text-emerald-500', intent: 'success' },
  info: { icon: InfoIcon, iconClass: 'text-blue-500', intent: 'info' },
} as const

const current = computed(() => typeConfig[state.type])

// Lighter glass recipe (weaponAttachmentModalThemeOverrides port)
const contentStyle = {
  backgroundColor: 'rgba(16, 16, 16, 0.9)',
  border: '1px solid var(--glass-border-light)',
  borderRadius: '20px',
  boxShadow: [
    '0 24px 48px rgba(0, 0, 0, 0.8)',
    '0 12px 24px rgba(0, 0, 0, 0.6)',
    '0 0 0 1px var(--glass-border-light)',
    'inset 0 1px 0 var(--glass-border-light)',
  ].join(', '),
  backdropFilter: 'var(--glass-blur-medium) saturate(160%)',
  WebkitBackdropFilter: 'var(--glass-blur-medium) saturate(160%)',
}

function onUpdateOpen(open: boolean) {
  if (!open && state.pending) return
  state.open = open
}

async function onPositive() {
  const callback = state.options.onPositiveClick
  if (!callback) {
    state.open = false
    return
  }
  state.pending = true
  try {
    const result = await callback()
    // naive-ui semantics: returning `false` keeps the dialog open
    if (result !== false) state.open = false
  } finally {
    state.pending = false
  }
}

function onNegative() {
  if (state.pending) return
  state.options.onNegativeClick?.()
  state.open = false
}

function onEscapeKeyDown(event: KeyboardEvent) {
  if (state.pending) event.preventDefault()
}
</script>

<template>
  <AlertDialog :open="state.open" @update:open="onUpdateOpen">
    <AlertDialogContent
      class="max-w-[420px] text-white sm:max-w-[420px]"
      :style="contentStyle"
      @escape-key-down="onEscapeKeyDown"
    >
      <AlertDialogHeader>
        <AlertDialogTitle class="flex items-center gap-2.5">
          <component :is="current.icon" class="size-5 shrink-0" :class="current.iconClass" />
          {{ state.options.title }}
        </AlertDialogTitle>
        <AlertDialogDescription v-if="state.options.content">
          {{ state.options.content }}
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <Button
          v-if="state.options.negativeText"
          variant="elevated"
          :disabled="state.pending"
          class="px-5 py-1.5"
          @click="onNegative"
        >
          {{ state.options.negativeText }}
        </Button>
        <Button
          v-if="state.options.positiveText"
          variant="elevated"
          tinted
          :intent="current.intent"
          :loading="state.pending"
          class="px-5 py-1.5"
          @click="onPositive"
        >
          {{ state.options.positiveText }}
        </Button>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
</template>
