<script setup lang="ts">
import { useModalShell } from '~/composables/useModalShell'

interface Props {
  visible: boolean
  triggerRect?: DOMRect | null
}

const props = withDefaults(defineProps<Props>(), {
  triggerRect: null,
})

const emit = defineEmits<{
  'update:visible': [value: boolean]
}>()

const visibleRef = computed(() => props.visible)
const triggerRectRef = computed(() => props.triggerRect ?? null)

const { modalRef, backdropRef, isAnimating, handleBackdropClick } = useModalShell({
  visible: visibleRef,
  onClose: () => emit('update:visible', false),
  triggerRect: triggerRectRef,
})
</script>

<template>
  <Teleport to="body">
    <Transition name="modal-backdrop">
      <div
        v-if="visible"
        ref="backdropRef"
        class="fixed inset-0 z-[2000] flex items-center justify-center"
        style="background: rgba(0, 0, 0, 0.5); backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px);"
        @click="handleBackdropClick"
      >
        <div
          ref="modalRef"
          class="modal-shell relative flex flex-col"
          style="max-width: 1800px; width: 95vw; max-height: 96vh"
          :class="{ 'pointer-events-none': isAnimating }"
          @click.stop
        >
          <div class="flex items-center gap-2 px-5 py-3 border-b border-white/5">
            <slot name="header" />
            <div class="flex-1" />
            <slot name="header-extra" />
            <button
              class="w-7 h-7 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
              @click="emit('update:visible', false)"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6L6 18"/><path d="M6 6l12 12"/></svg>
            </button>
          </div>
          <div class="flex-1 overflow-hidden flex flex-col">
            <slot />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.modal-shell {
  background: var(--glass-bg-primary, rgba(18, 18, 18, 0.95));
  border-radius: 24px;
  box-shadow:
    0 32px 64px rgba(0, 0, 0, 0.9),
    0 0 0 1px rgba(255, 255, 255, 0.05),
    inset 0 1px 0 rgba(255, 255, 255, 0.05);
  color: #fff;
}
.modal-backdrop-enter-active { transition: opacity 300ms ease-out; }
.modal-backdrop-leave-active { transition: opacity 250ms ease-in; }
.modal-backdrop-enter-from,
.modal-backdrop-leave-to { opacity: 0; }
</style>
