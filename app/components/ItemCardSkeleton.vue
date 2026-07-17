<script setup lang="ts">
/**
 * ItemCardSkeleton — loading placeholder mirroring the ItemCard layout
 * (art stage, name line, meta line) with the neutral Skeleton shimmer.
 *
 * Pass the same `stageClass` as the real cards so skeleton grids keep the
 * exact row height and the crossfade into real cards is seamless.
 */
import { Skeleton } from '@/components/ui/skeleton'

interface Props {
  /** Must match the `stageClass` of the ItemCards it stands in for. */
  stageClass?: string
}

withDefaults(defineProps<Props>(), {
  stageClass: 'h-32',
})
</script>

<template>
  <div
    class="relative overflow-hidden rounded-[var(--radius-card)] border border-border bg-card p-3.5"
    aria-hidden="true"
  >
    <!-- Art stage -->
    <Skeleton :class="['w-full', stageClass]" />
    <!-- Name line -->
    <Skeleton class="mt-2.5 h-3.5 w-3/4" />
    <!-- Meta line: rarity label + float readout -->
    <div class="mt-1.5 flex items-center justify-between gap-2">
      <Skeleton class="h-2.5 w-16" />
      <Skeleton class="h-2.5 w-10" />
    </div>
  </div>
</template>
