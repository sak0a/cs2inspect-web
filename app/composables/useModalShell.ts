// app/composables/useModalShell.ts
import type { Ref } from 'vue'

export interface ModalShellOptions {
  visible: Ref<boolean>
  onClose: () => void
  triggerRect?: Ref<DOMRect | null>
}

export function useModalShell(options: ModalShellOptions) {
  const modalRef = ref<HTMLElement | null>(null)
  const backdropRef = ref<HTMLElement | null>(null)
  const isAnimating = ref(false)

  // ── Scroll lock ──
  let savedOverflow = ''
  let savedPaddingRight = ''

  function lockScroll() {
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth
    savedOverflow = document.body.style.overflow
    savedPaddingRight = document.body.style.paddingRight
    document.body.style.overflow = 'hidden'
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`
    }
  }

  function unlockScroll() {
    document.body.style.overflow = savedOverflow
    document.body.style.paddingRight = savedPaddingRight
  }

  // ── Focus trap ──
  function trapFocus(e: KeyboardEvent) {
    if (e.key !== 'Tab' || !modalRef.value) return
    const focusable = modalRef.value.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    if (focusable.length === 0) return
    const first = focusable[0]
    const last = focusable[focusable.length - 1]
    if (!first || !last) return
    if (e.shiftKey) {
      if (document.activeElement === first) { last.focus(); e.preventDefault() }
    } else {
      if (document.activeElement === last) { first.focus(); e.preventDefault() }
    }
  }

  // ── Escape handler ──
  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      options.onClose()
      e.stopPropagation()
    }
    trapFocus(e)
  }

  // ── Backdrop click ──
  function handleBackdropClick(e: MouseEvent) {
    if (e.target === backdropRef.value) {
      options.onClose()
    }
  }

  // ── FLIP morph animation ──
  async function animateOpen() {
    isAnimating.value = true
    const trigger = options.triggerRect?.value
    const modalEl = modalRef.value
    if (!modalEl) { isAnimating.value = false; return }

    if (!trigger) {
      // Fallback: center scale+fade
      modalEl.style.transform = 'scale(0.95)'
      modalEl.style.opacity = '0'
      await nextTick()
      modalEl.style.transition = 'transform 300ms ease-out, opacity 300ms ease-out'
      modalEl.style.transform = 'scale(1)'
      modalEl.style.opacity = '1'
      setTimeout(() => {
        modalEl.style.transition = ''
        modalEl.style.transform = ''
        modalEl.style.opacity = ''
        isAnimating.value = false
      }, 300)
      return
    }

    // FLIP: get final position
    modalEl.style.visibility = 'hidden'
    await nextTick()
    const finalRect = modalEl.getBoundingClientRect()
    modalEl.style.visibility = ''

    // Set initial state (trigger rect)
    modalEl.style.position = 'fixed'
    modalEl.style.left = `${trigger.left}px`
    modalEl.style.top = `${trigger.top}px`
    modalEl.style.width = `${trigger.width}px`
    modalEl.style.height = `${trigger.height}px`
    modalEl.style.borderRadius = '12px'
    modalEl.style.overflow = 'hidden'
    modalEl.style.opacity = '0'
    await nextTick()

    // Animate to final
    modalEl.style.transition = 'all 400ms cubic-bezier(0.4, 0, 0.2, 1)'
    modalEl.style.opacity = '1'
    modalEl.style.left = `${finalRect.left}px`
    modalEl.style.top = `${finalRect.top}px`
    modalEl.style.width = `${finalRect.width}px`
    modalEl.style.height = `${finalRect.height}px`
    modalEl.style.borderRadius = '24px'

    setTimeout(() => {
      // Clean up inline styles
      modalEl.style.transition = ''
      modalEl.style.position = ''
      modalEl.style.left = ''
      modalEl.style.top = ''
      modalEl.style.width = ''
      modalEl.style.height = ''
      modalEl.style.overflow = ''
      modalEl.style.opacity = ''
      modalEl.style.borderRadius = ''
      isAnimating.value = false
    }, 400)
  }

  async function animateClose(): Promise<void> {
    isAnimating.value = true
    const trigger = options.triggerRect?.value
    const modalEl = modalRef.value

    if (!trigger || !modalEl) {
      if (modalEl) {
        modalEl.style.transition = 'transform 250ms ease-in, opacity 250ms ease-in'
        modalEl.style.transform = 'scale(0.95)'
        modalEl.style.opacity = '0'
      }
      return new Promise((resolve) => setTimeout(resolve, 250))
    }

    const currentRect = modalEl.getBoundingClientRect()
    modalEl.style.position = 'fixed'
    modalEl.style.left = `${currentRect.left}px`
    modalEl.style.top = `${currentRect.top}px`
    modalEl.style.width = `${currentRect.width}px`
    modalEl.style.height = `${currentRect.height}px`
    modalEl.style.overflow = 'hidden'
    await nextTick()

    modalEl.style.transition = 'all 350ms cubic-bezier(0.4, 0, 0.2, 1)'
    modalEl.style.left = `${trigger.left}px`
    modalEl.style.top = `${trigger.top}px`
    modalEl.style.width = `${trigger.width}px`
    modalEl.style.height = `${trigger.height}px`
    modalEl.style.borderRadius = '12px'
    modalEl.style.opacity = '0'

    return new Promise((resolve) => setTimeout(resolve, 350))
  }

  // ── Lifecycle ──
  watch(options.visible, async (show) => {
    if (show) {
      lockScroll()
      await nextTick()
      await animateOpen()
      document.addEventListener('keydown', handleKeydown)
    } else {
      await animateClose()
      document.removeEventListener('keydown', handleKeydown)
      unlockScroll()
      isAnimating.value = false
    }
  })

  onBeforeUnmount(() => {
    document.removeEventListener('keydown', handleKeydown)
    if (options.visible.value) unlockScroll()
  })

  return {
    modalRef,
    backdropRef,
    isAnimating,
    handleBackdropClick,
  }
}
