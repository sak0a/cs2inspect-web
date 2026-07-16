<script lang="ts" setup>
import type { ToasterProps } from "vue-sonner"
import { CircleCheckIcon, InfoIcon, Loader2Icon, OctagonXIcon, TriangleAlertIcon, XIcon } from "@lucide/vue"
import { Toaster as Sonner } from "vue-sonner"
import { cn } from "@/lib/utils"
import "vue-sonner/style.css"

const props = defineProps<ToasterProps>()
</script>

<template>
  <Sonner
    :class="cn('toaster group', props.class)"
    :style="{
      '--normal-bg': 'var(--popover)',
      '--normal-text': 'var(--popover-foreground)',
      '--normal-border': 'var(--border)',
      '--border-radius': 'var(--radius-card)',
    }"
    v-bind="props"
  >
    <template #success-icon>
      <CircleCheckIcon class="size-4" />
    </template>
    <template #info-icon>
      <InfoIcon class="size-4" />
    </template>
    <template #warning-icon>
      <TriangleAlertIcon class="size-4" />
    </template>
    <template #error-icon>
      <OctagonXIcon class="size-4" />
    </template>
    <template #loading-icon>
      <div>
        <Loader2Icon class="size-4 animate-spin" />
      </div>
    </template>
    <template #close-icon>
      <XIcon class="size-4" />
    </template>
  </Sonner>
</template>

<style>
/*
 * Palette-consistent rich colors for typed toasts (Onyx). vue-sonner's
 * stylesheet is vendor code — override its CSS variables here instead of
 * editing it. Covers both the default path (--normal-*) and the
 * richColors path (--success-* / --error-* / --warning-*).
 * Backgrounds are ~12% tints mixed into the solid popover surface (kept
 * solid on purpose), borders are hairline color tints, text tints pass
 * AA on the dark surface.
 */
/* Onyx: default (untyped) toasts carry a subtle accent left edge so they
 * read as part of the brand without competing with the rich-color types. */
[data-sonner-toast]:not([data-type]),
[data-sonner-toast][data-type='default'] {
  border-left: 2px solid color-mix(in srgb, var(--primary) 55%, transparent);
}

[data-sonner-toast][data-type='success'] {
  --normal-bg: color-mix(in srgb, #22c55e 12%, var(--popover));
  --normal-border: rgba(34, 197, 94, 0.3);
  --normal-text: #86efac;
  --success-bg: color-mix(in srgb, #22c55e 12%, var(--popover));
  --success-border: rgba(34, 197, 94, 0.3);
  --success-text: #86efac;
}

[data-sonner-toast][data-type='error'] {
  --normal-bg: color-mix(in srgb, #ef4444 12%, var(--popover));
  --normal-border: rgba(239, 68, 68, 0.3);
  --normal-text: #ff7a7a;
  --error-bg: color-mix(in srgb, #ef4444 12%, var(--popover));
  --error-border: rgba(239, 68, 68, 0.3);
  --error-text: #ff7a7a;
}

[data-sonner-toast][data-type='warning'] {
  --normal-bg: color-mix(in srgb, #f59e0b 12%, var(--popover));
  --normal-border: rgba(245, 158, 11, 0.3);
  --normal-text: #fcd34d;
  --warning-bg: color-mix(in srgb, #f59e0b 12%, var(--popover));
  --warning-border: rgba(245, 158, 11, 0.3);
  --warning-text: #fcd34d;
}
</style>
