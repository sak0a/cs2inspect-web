<!--
  SaveStatusIndicator.vue

  A minimal status indicator for auto-save functionality.
  Shows saving spinner, success checkmark, or error with retry button.

  Props:
  - status: Current save status ('idle' | 'saving' | 'saved' | 'error')
  - showRetry: Show retry button on error
  - fixed: Position fixed at top-center (like toast messages)
-->
<template>
  <Teleport to="body" :disabled="!fixed">
    <Transition :name="fixed ? 'status-slide' : 'status-fade'">
      <div
        v-if="status !== 'idle'"
        class="save-status-indicator"
        :class="[statusClass, { 'save-status-indicator--fixed': fixed }]"
      >
        <!-- Saving state -->
        <template v-if="status === 'saving'">
          <div class="status-spinner" />
          <span class="status-text">{{ t('autoSave.saving') }}</span>
        </template>

        <!-- Saved state -->
        <template v-else-if="status === 'saved'">
          <svg
            class="status-icon status-icon--success"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
          <span class="status-text">{{ t('autoSave.saved') }}</span>
        </template>

        <!-- Error state -->
        <template v-else-if="status === 'error'">
          <svg
            class="status-icon status-icon--error"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <span class="status-text">{{ t('autoSave.failed') }}</span>
          <Button v-if="showRetry" variant="link" size="xs" @click="$emit('retry')">
            {{ t('autoSave.retry') }}
          </Button>
        </template>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import type { SaveStatus } from '~/composables/useAutoSave'
import { Button } from '@/components/ui/button'

interface Props {
  status: SaveStatus
  showRetry?: boolean
  fixed?: boolean
}

const props = defineProps<Props>()

defineEmits<{
  (e: 'retry'): void
}>()

const { t } = useI18n()

const statusClass = computed(() => {
  return {
    'save-status-indicator--saving': props.status === 'saving',
    'save-status-indicator--saved': props.status === 'saved',
    'save-status-indicator--error': props.status === 'error',
  }
})
</script>

<style scoped>
/* Onyx pill: near-opaque elevated surface, hairline border, mono micro-text */
.save-status-indicator {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: 999px;
  border: 1px solid var(--border);
  background: var(--surface-2);
  font-family: var(--font-mono, ui-monospace, monospace);
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 0.02em;
  transition:
    color 0.2s var(--ease-out),
    border-color 0.2s var(--ease-out);
}

.save-status-indicator--saving {
  color: var(--muted-foreground);
}

.save-status-indicator--saved {
  color: #34d399;
  border-color: rgba(52, 211, 153, 0.3);
}

.save-status-indicator--error {
  color: #f87171;
  border-color: rgba(239, 68, 68, 0.35);
}

.save-status-indicator--fixed {
  position: fixed;
  top: 24px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 9999;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
  padding: 5px 20px;
  font-size: 12px;
  gap: 8px;
}

.save-status-indicator--fixed .status-spinner {
  width: 18px;
  height: 18px;
}

.save-status-indicator--fixed .status-icon {
  width: 18px;
  height: 18px;
}

.status-spinner {
  width: 14px;
  height: 14px;
  border: 2px solid transparent;
  border-top-color: currentColor;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.status-icon {
  width: 14px;
  height: 14px;
}

.status-icon--success,
.status-icon--error {
  color: currentColor;
}

.status-text {
  white-space: nowrap;
}

/* Transition animations - inline mode */
.status-fade-enter-active,
.status-fade-leave-active {
  transition:
    opacity 0.2s ease,
    transform 0.2s ease;
}

.status-fade-enter-from,
.status-fade-leave-to {
  opacity: 0;
  transform: translateX(10px);
}

/* Transition animations - fixed mode (slide down from top) */
.status-slide-enter-active,
.status-slide-leave-active {
  transition:
    opacity 0.25s ease,
    transform 0.25s ease;
}

.status-slide-enter-from,
.status-slide-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(-20px);
}

.status-slide-enter-to,
.status-slide-leave-from {
  transform: translateX(-50%) translateY(0);
}
</style>
