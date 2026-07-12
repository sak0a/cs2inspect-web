/**
 * Reusable infinite scroll composable using IntersectionObserver.
 * Attach the returned `sentinelRef` to a div at the bottom of your scroll container.
 * When visible within `rootMargin`, calls `onLoadMore`.
 */
export function useInfiniteScroll(options: {
  onLoadMore: () => void
  rootMargin?: string
  enabled?: Ref<boolean> | ComputedRef<boolean>
  /** Root element for IntersectionObserver. If inside a scrolling container (e.g. NModal),
   *  pass the scroll container ref so the observer triggers correctly. Defaults to viewport. */
  root?: Ref<HTMLElement | null>
}) {
  const sentinelRef = ref<HTMLElement | null>(null)
  const observer = ref<IntersectionObserver | null>(null)

  const rootMargin = options.rootMargin ?? '200px'
  const enabled = options.enabled ?? ref(true)

  const setupObserver = () => {
    if (observer.value) observer.value.disconnect()
    if (!sentinelRef.value) return

    observer.value = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && unref(enabled)) {
          options.onLoadMore()
        }
      },
      { rootMargin, root: options.root ? unref(options.root) : null }
    )
    observer.value.observe(sentinelRef.value)
  }

  watch(sentinelRef, setupObserver)
  watch(enabled, (val) => {
    if (val) setupObserver()
    else observer.value?.disconnect()
  })
  if (options.root) {
    watch(options.root, setupObserver)
  }

  onBeforeUnmount(() => observer.value?.disconnect())

  return { sentinelRef }
}
