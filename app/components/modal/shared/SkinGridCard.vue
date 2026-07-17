<script setup lang="ts">
/**
 * SkinGridCard — small Onyx browser card used as a grid cell inside the
 * item-selection modals (skins, stickers, keychains).
 *
 * Onyx language at reduced intensity relative to the hero ItemCard:
 * `--surface-2` ground, hairline border, radial rarity glow driven by the
 * runtime rarity hex (set as `--rc` inline), mono name line, and an
 * instant (<50ms) selected treatment: accent inset ring + check badge with
 * no transition on the ring itself.
 *
 * Pure presentational: no emits of its own — attach `@click` on the
 * component (falls through to the root button).
 */
import { Check } from '@lucide/vue'

interface Props {
  /** Display name (already stripped of any "Sticker |" / "Charm |" prefix by the parent). */
  name: string
  /** Item art URL. Rendered `object-contain` with a deep drop-shadow. */
  imageUrl?: string
  /**
   * Runtime rarity hex from the API (e.g. "#EB4B4B"). Feeds the glow,
   * hover border tint. Defaults to the standard fallback #B0C3D9.
   */
  rarityColor?: string
  /** Selected state: accent inset ring + 20px check badge, instant feedback. */
  selected?: boolean
  /** Art height: 'md' = h-32 (weapon/knife/glove skins), 'sm' = h-24 (stickers/keychains). */
  imageHeight?: 'sm' | 'md'
}

const props = withDefaults(defineProps<Props>(), {
  imageUrl: '',
  rarityColor: '#B0C3D9',
  selected: false,
  imageHeight: 'md',
})

const rc = computed(() => props.rarityColor || '#B0C3D9')
</script>

<template>
  <button
    type="button"
    class="skin-grid-card group relative flex w-full cursor-pointer flex-col overflow-hidden rounded-[var(--radius-card)] border border-border bg-surface-2 p-3 text-left outline-none hover:-translate-y-0.5 hover:shadow-[var(--shadow-card)] active:scale-[0.985] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
    :class="{ 'skin-grid-card--selected': selected }"
    :style="{ '--rc': rc }"
    :aria-pressed="selected"
  >
    <!-- Rarity glow (lower intensity than the hero card) -->
    <span
      aria-hidden="true"
      class="skin-grid-card__glow pointer-events-none absolute -inset-x-[10%] -inset-y-[14%]"
    />

    <!-- Art -->
    <img
      v-if="imageUrl"
      :src="imageUrl"
      :alt="name"
      loading="lazy"
      class="skin-grid-card__art relative z-[1] w-full object-contain"
      :class="imageHeight === 'sm' ? 'h-24' : 'h-32'"
    />
    <div
      v-else
      aria-hidden="true"
      class="relative z-[1] w-full"
      :class="imageHeight === 'sm' ? 'h-24' : 'h-32'"
    />

    <!-- Mono name line -->
    <p
      class="relative z-[1] mt-2 w-full truncate font-mono text-[11px] leading-snug text-muted-foreground"
      :title="name"
    >
      {{ name }}
    </p>

    <!-- Selected treatment: instant, no transition on the ring itself -->
    <span
      v-if="selected"
      aria-hidden="true"
      class="pointer-events-none absolute inset-0 z-[2] rounded-[inherit] ring-2 ring-inset ring-primary/80"
    />
    <span
      v-if="selected"
      aria-hidden="true"
      class="absolute right-2.5 top-2.5 z-[3] flex size-5 items-center justify-center rounded-full bg-primary text-black"
    >
      <Check class="size-3.5" :stroke-width="3" />
    </span>
  </button>
</template>

<style scoped>
/* Plain CSS (SFC @apply is unreliable in this setup) */
.skin-grid-card {
  transition:
    border-color var(--dur-base) var(--ease-out),
    transform var(--dur-base) var(--ease-out),
    box-shadow var(--dur-base) var(--ease-out);
}

.skin-grid-card:hover {
  border-color: color-mix(in srgb, var(--rc) 36%, transparent);
}

.skin-grid-card--selected {
  border-color: color-mix(in srgb, var(--primary) 55%, transparent);
}

.skin-grid-card__glow {
  background: radial-gradient(55% 62% at 50% 58%, var(--rc), transparent 70%);
  opacity: 0.1;
  transition: opacity var(--dur-base) var(--ease-out);
}

.skin-grid-card:hover .skin-grid-card__glow {
  opacity: 0.22;
}

.skin-grid-card__art {
  filter: drop-shadow(0 10px 14px rgba(0, 0, 0, 0.55));
  transition: transform var(--dur-slow) var(--ease-out);
}

.skin-grid-card:hover .skin-grid-card__art {
  transform: translateY(-3px) scale(1.03);
}

@media (prefers-reduced-motion: reduce) {
  .skin-grid-card,
  .skin-grid-card__glow,
  .skin-grid-card__art {
    transition: none;
  }

  .skin-grid-card:hover,
  .skin-grid-card:hover .skin-grid-card__art {
    transform: none;
  }
}
</style>
