<script setup lang="ts">
import type { HTMLAttributes } from "vue"
import { cn } from "@/lib/utils"

interface SkeletonProps {
  class?: HTMLAttributes["class"]
}

const props = defineProps<SkeletonProps>()
</script>

<template>
  <div
    data-slot="skeleton"
    :class="cn('skeleton-shimmer relative overflow-hidden rounded-md bg-white/[0.04]', props.class)"
  />
</template>

<style scoped>
/* Neutral shimmer sweep (replaces the yellow bg-primary/10 pulse) */
.skeleton-shimmer::after {
  content: '';
  position: absolute;
  inset: 0;
  transform: translateX(-100%);
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.05),
    transparent
  );
  animation: skeleton-sweep 1.8s var(--ease-out) infinite;
}

@keyframes skeleton-sweep {
  100% {
    transform: translateX(100%);
  }
}
</style>
