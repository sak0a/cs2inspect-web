<script setup lang="ts">
/**
 * TeamToggle — Onyx refined pill: a single rounded-full container on
 * surface-2 with an animated thumb that translates between the two halves,
 * tinted with the reserved team hues (CT #5d8cff / T #ff8a3d). Visible
 * labels are the mono CT / T abbreviations; full team names stay on the
 * buttons as aria-labels.
 */
const { teamSide, setTeam } = useTeamToggle()
const { t } = useI18n()
</script>

<template>
  <div class="team-toggle" role="group" :aria-label="String(t('teams.selectTeam'))">
    <span
      class="team-toggle-thumb"
      :class="teamSide === 'ct' ? 'team-toggle-thumb--ct' : 'team-toggle-thumb--t'"
      aria-hidden="true"
    />
    <button
      type="button"
      class="team-toggle-option"
      :class="{ 'team-toggle-option--ct': teamSide === 'ct' }"
      :aria-label="String(t('teams.counterTerrorists'))"
      :aria-pressed="teamSide === 'ct'"
      @click="setTeam('ct')"
    >
      {{ t('teams.counterTerroristsShort') }}
    </button>
    <button
      type="button"
      class="team-toggle-option"
      :class="{ 'team-toggle-option--t': teamSide === 't' }"
      :aria-label="String(t('teams.terrorists'))"
      :aria-pressed="teamSide === 't'"
      @click="setTeam('t')"
    >
      {{ t('teams.terroristsShort') }}
    </button>
  </div>
</template>

<style scoped>
.team-toggle {
  position: relative;
  display: inline-flex;
  align-items: center;
  flex-shrink: 0;
  height: 32px;
  padding: 3px;
  border-radius: 9999px;
  border: 1px solid var(--border);
  background: var(--surface-2);
}

.team-toggle-thumb {
  position: absolute;
  top: 3px;
  bottom: 3px;
  left: 3px;
  width: calc(50% - 3px);
  border-radius: 9999px;
  border: 1px solid transparent;
  transition:
    transform var(--dur-base) var(--ease-out),
    background-color var(--dur-base) var(--ease-out),
    border-color var(--dur-base) var(--ease-out);
}

.team-toggle-thumb--ct {
  transform: translateX(0);
  background: rgba(93, 140, 255, 0.16);
  border-color: rgba(93, 140, 255, 0.3);
}

.team-toggle-thumb--t {
  transform: translateX(100%);
  background: rgba(255, 138, 61, 0.15);
  border-color: rgba(255, 138, 61, 0.3);
}

.team-toggle-option {
  position: relative;
  z-index: 1;
  width: 42px;
  padding: 0;
  border: none;
  background: transparent;
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.1em;
  line-height: 24px;
  text-align: center;
  text-transform: uppercase;
  color: var(--text-tertiary);
  cursor: pointer;
  border-radius: 9999px;
  outline: none;
  transition: color var(--dur-fast) var(--ease-out);
}

.team-toggle-option:hover {
  color: var(--muted-foreground);
}

.team-toggle-option:focus-visible {
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--ring) 40%, transparent);
}

/* Active labels take a readable tint of the reserved team hues */
.team-toggle-option--ct {
  color: color-mix(in srgb, var(--team-ct) 55%, white);
}

.team-toggle-option--ct:hover {
  color: color-mix(in srgb, var(--team-ct) 55%, white);
}

.team-toggle-option--t {
  color: color-mix(in srgb, var(--team-t) 55%, white);
}

.team-toggle-option--t:hover {
  color: color-mix(in srgb, var(--team-t) 55%, white);
}

@media (prefers-reduced-motion: reduce) {
  .team-toggle-thumb,
  .team-toggle-option {
    transition: none;
  }
}
</style>
