<script setup lang="ts">
/**
 * SelectedItemStage — Onyx preview stage panel for the item modals.
 *
 * A rounded `--surface-2` stage with a radial rarity ambience (`--rc` at
 * ~10%), a bottom overlay with the item name (display face) and a mono
 * float/pattern readout line (Killfeed touch), and slots for the media and
 * extra overlay controls.
 *
 * IMPORTANT: the stage does NOT size its media. The parent owns the media
 * element (video canvas / img — VideoCanvasManager math depends on its
 * dimensions), and any extra sizing/padding is applied via plain class
 * passthrough on this component. No fixed heights live inside.
 *
 * Slots:
 * - `media` — the preview content (canvas + img fallback, or plain img).
 * - `overlay` — extra absolutely-positioned controls (e.g. the visual
 *   customizer wand button). Rendered above the media, below the name bar.
 */

interface Props {
  /** Item display name shown in the overlay bar (font-display). */
  title?: string
  /**
   * Float/wear readout (already formatted by the parent, e.g. `0.123`).
   * Rendered mono/tabular-nums; hidden when undefined.
   */
  floatValue?: number | string
  /** Pattern seed readout. Rendered mono; hidden when undefined. */
  patternSeed?: number | string
  /** Wear-band tag (e.g. "Field-Tested"). Rendered as a small chip; hidden when undefined. */
  wearLabel?: string
  /** Runtime rarity hex driving the `--rc` ambience. Defaults to #B0C3D9. */
  rarityColor?: string
}

const props = withDefaults(defineProps<Props>(), {
  title: '',
  floatValue: undefined,
  patternSeed: undefined,
  wearLabel: undefined,
  rarityColor: '#B0C3D9',
})

const { t } = useI18n()

const rc = computed(() => props.rarityColor || '#B0C3D9')

const hasMeta = computed(
  () =>
    props.floatValue !== undefined ||
    props.patternSeed !== undefined ||
    props.wearLabel !== undefined
)
</script>

<template>
  <div
    class="selected-item-stage relative overflow-hidden rounded-[var(--radius-card)] border border-border bg-surface-2"
    :style="{ '--rc': rc }"
  >
    <!-- Radial rarity ambience (~10%) -->
    <span
      aria-hidden="true"
      class="selected-item-stage__ambience pointer-events-none absolute -inset-x-[10%] -inset-y-[14%]"
    />

    <!-- Media: parent-controlled dimensions (video canvas math depends on it) -->
    <div class="relative z-[1]">
      <slot name="media" />
    </div>

    <!-- Extra overlay controls (e.g. customizer wand button) -->
    <slot name="overlay" />

    <!-- Name + mono readout overlay -->
    <div
      v-if="title || hasMeta"
      class="pointer-events-none absolute inset-x-0 bottom-0 z-[2] flex flex-wrap items-end justify-between gap-x-4 gap-y-1 bg-linear-to-t from-black/70 via-black/25 to-transparent px-3.5 pb-2.5 pt-10"
    >
      <h3
        v-if="title"
        class="min-w-0 truncate font-display text-[15px] font-medium tracking-[-0.02em] text-foreground"
        :title="title"
      >
        {{ title }}
      </h3>

      <div
        v-if="hasMeta"
        class="flex items-center gap-3 font-mono text-[10.5px] uppercase tracking-[0.08em] text-text-tertiary tabular-nums"
      >
        <span
          v-if="wearLabel"
          class="rounded-full border border-border-strong bg-black/40 px-2 py-0.5 text-foreground/80"
        >
          {{ wearLabel }}
        </span>
        <span v-if="floatValue !== undefined">
          {{ t('modals.shared.stage.float') }} {{ floatValue }}
        </span>
        <span v-if="patternSeed !== undefined">
          {{ t('modals.shared.stage.pattern') }} {{ patternSeed }}
        </span>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Plain CSS (SFC @apply is unreliable in this setup) */
.selected-item-stage__ambience {
  background: radial-gradient(55% 62% at 50% 58%, var(--rc), transparent 70%);
  opacity: 0.1;
}
</style>
