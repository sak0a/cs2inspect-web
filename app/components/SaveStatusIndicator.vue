<!--
  SaveStatusIndicator.vue

  A minimal status indicator for auto-save functionality.
  Shows saving spinner, success checkmark, or error with retry button.

  Props:
  - status: Current save status ('idle' | 'saving' | 'saved' | 'error')
  - showRetry: Show retry button on error
  - fixed: Position fixed at top-center (like NaiveUI messages)
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
                    <button v-if="showRetry" class="retry-button" @click="$emit('retry')">
                        {{ t('autoSave.retry') }}
                    </button>
                </template>
            </div>
        </Transition>
    </Teleport>
</template>

<script setup lang="ts">
import type { SaveStatus } from '~/composables/useAutoSave'

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
.save-status-indicator {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 4px 10px;
    border-radius: 16px;
    font-size: 12px;
    font-weight: 500;
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    transition: all 0.2s ease;
}

.save-status-indicator--saving {
    background: rgba(100, 100, 100, 0.3);
    color: rgba(255, 255, 255, 0.8);
}

.save-status-indicator--saved {
    background: rgba(34, 197, 94, 0.2);
    color: rgb(134, 239, 172);
}

.save-status-indicator--error {
    background: rgba(239, 68, 68, 0.2);
    color: rgb(252, 165, 165);
}

.save-status-indicator--fixed {
    position: fixed;
    top: 24px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 9999;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    padding: 4px 24px;
    font-size: 14px;
    border-radius: 20px;
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

.status-icon--success {
    color: rgb(134, 239, 172);
}

.status-icon--error {
    color: rgb(252, 165, 165);
}

.status-text {
    white-space: nowrap;
}

.retry-button {
    margin-left: 4px;
    padding: 2px 8px;
    border: 1px solid rgba(252, 165, 165, 0.4);
    border-radius: 12px;
    background: rgba(239, 68, 68, 0.2);
    color: rgb(252, 165, 165);
    font-size: 11px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.15s ease;
}

.retry-button:hover {
    background: rgba(239, 68, 68, 0.3);
    border-color: rgba(252, 165, 165, 0.6);
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
