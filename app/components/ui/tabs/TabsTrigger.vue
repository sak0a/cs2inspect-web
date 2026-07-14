<script setup lang="ts">
import type { TabsTriggerProps } from "reka-ui"
import type { HTMLAttributes } from "vue"
import { reactiveOmit } from "@vueuse/core"
import { TabsTrigger, useForwardProps } from "reka-ui"
import { cn } from "@/lib/utils"

const props = defineProps<TabsTriggerProps & { class?: HTMLAttributes["class"] }>()

const delegatedProps = reactiveOmit(props, "class")

const forwardedProps = useForwardProps(delegatedProps)
</script>

<template>
  <TabsTrigger
    data-slot="tabs-trigger"
    :class="cn(
      'text-muted-foreground data-[state=active]:text-foreground relative isolate inline-flex h-[calc(100%-1px)] flex-1 items-center justify-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium whitespace-nowrap transition-colors duration-[var(--dur-fast)] [transition-timing-function:var(--ease-out)] focus-visible:border-ring focus-visible:ring-ring/40 focus-visible:ring-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 after:pointer-events-none after:absolute after:inset-0 after:-z-10 after:rounded-full after:bg-white/6 after:opacity-0 after:scale-90 after:transition-[opacity,scale] after:duration-[var(--dur-base)] after:[transition-timing-function:var(--ease-out)] data-[state=active]:after:opacity-100 data-[state=active]:after:scale-100 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*=\'size-\'])]:size-4',
      props.class,
    )"
    v-bind="forwardedProps"
  >
    <slot />
  </TabsTrigger>
</template>
