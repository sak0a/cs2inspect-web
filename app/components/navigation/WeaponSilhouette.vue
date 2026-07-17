<script lang="ts">
/**
 * WeaponSilhouette — weapon silhouette rendering with two modes:
 *
 * 1. `name` mode (nav categories): inlines the trusted category SVGs from
 *    app/assets/svg (static import map below) so paths can be normalized to
 *    `currentColor` and per-asset corrections applied. Replaces the former
 *    `app/utils/menuIcons.ts` innerHTML vnodes.
 *
 *      <WeaponSilhouette name="rifles" :size="28" />
 *
 * 2. `src` mode (empty states, illustrations): renders any silhouette SVG
 *    asset URL as a CSS mask filled with `currentColor`, sized via classes.
 *
 *      import knifeSvg from '~/assets/svg/weapon_knife.svg'
 *      <WeaponSilhouette :src="knifeSvg" class="h-14 w-44 text-text-tertiary" />
 *
 * SAFETY: the `?raw` imports below are static, trusted local assets from
 * app/assets/svg, inlined at build time (never user input or remote
 * content), so rendering them with v-html is safe. If silhouettes are ever
 * loaded dynamically, refactor to sanitized rendering.
 */
import riflesRaw from '~/assets/svg/weapon_ak47.svg?raw'
import smgsRaw from '~/assets/svg/weapon_mp9.svg?raw'
import pistolsRaw from '~/assets/svg/weapon_deagle.svg?raw'
import heavysRaw from '~/assets/svg/weapon_nova.svg?raw'
import knivesRaw from '~/assets/svg/weapon_knife_butterfly.svg?raw'
import glovesRaw from '~/assets/svg/gloves.svg?raw'
import agentsRaw from '~/assets/svg/agent.svg?raw'

export type WeaponSilhouetteName =
  | 'rifles'
  | 'smgs'
  | 'pistols'
  | 'heavys'
  | 'knives'
  | 'gloves'
  | 'agents'

/** Strip the XML prolog / DOCTYPE so only the `<svg>` element is injected. */
function toSvgMarkup(raw: string): string {
  return raw.slice(raw.indexOf('<svg'))
}

const silhouettes: Record<WeaponSilhouetteName, string> = {
  rifles: toSvgMarkup(riflesRaw),
  smgs: toSvgMarkup(smgsRaw),
  pistols: toSvgMarkup(pistolsRaw),
  heavys: toSvgMarkup(heavysRaw),
  knives: toSvgMarkup(knivesRaw),
  gloves: toSvgMarkup(glovesRaw),
  agents: toSvgMarkup(agentsRaw),
}
</script>

<script setup lang="ts">
interface Props {
  /** Nav category silhouette (renders the inline SVG from the map above). */
  name?: WeaponSilhouetteName
  /** Rendered square box size in px for `name` mode (silhouettes scale to fit). */
  size?: number
  /** Asset URL of a silhouette SVG (plain Vite asset import) — mask mode. */
  src?: string
}

const props = withDefaults(defineProps<Props>(), {
  name: undefined,
  size: 30,
  src: undefined,
})

const markup = computed(() => (props.name ? silhouettes[props.name] : ''))

const maskStyle = computed(() => {
  const url = `url("${props.src}")`
  return {
    'mask-image': url,
    'mask-repeat': 'no-repeat',
    'mask-position': 'center',
    'mask-size': 'contain',
    '-webkit-mask-image': url,
    '-webkit-mask-repeat': 'no-repeat',
    '-webkit-mask-position': 'center',
    '-webkit-mask-size': 'contain',
  }
})
</script>

<template>
  <!-- Decorative icon: consumers provide the accessible label.
       eslint: markup comes from the trusted static import map above. -->
  <!-- eslint-disable vue/no-v-html -->
  <span
    v-if="props.name"
    class="weapon-silhouette"
    :class="`weapon-silhouette--${props.name}`"
    :style="{ width: `${props.size}px`, height: `${props.size}px` }"
    aria-hidden="true"
    v-html="markup"
  />
  <!-- eslint-enable vue/no-v-html -->
  <div v-else aria-hidden="true" class="bg-current" :style="maskStyle" />
</template>

<style scoped>
.weapon-silhouette {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: inherit;
}

.weapon-silhouette :deep(svg) {
  display: block;
  width: 100%;
  height: 100%;
}

/* The Adobe-exported assets hardcode fill (#000000) or rely on the default
   black fill; normalize every path to currentColor so the silhouettes follow
   the surrounding text color. Slice <rect fill="none"> helpers are unaffected. */
.weapon-silhouette :deep(path) {
  fill: currentColor;
}

/* Per-asset visual corrections carried over from menuIcons.ts */
.weapon-silhouette--knives :deep(svg) {
  transform: rotate(-15deg);
}

.weapon-silhouette--gloves :deep(svg) {
  transform: scale(0.85);
}

.weapon-silhouette--agents :deep(svg) {
  transform: scale(1.4);
}
</style>
