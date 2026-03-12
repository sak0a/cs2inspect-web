<script setup lang="ts">
const { teamSide, setTeam } = useTeamToggle()
const { t } = useI18n()
</script>

<template>
  <div class="flex items-center gap-0.5">
    <button
      class="team-toggle-btn rounded-l-full"
      :class="teamSide === 'ct' ? 'team-toggle-ct-active' : 'team-toggle-inactive'"
      @click="setTeam('ct')"
    >
      {{ t('teams.counterTerrorists') }}
    </button>
    <button
      class="team-toggle-btn rounded-r-full"
      :class="teamSide === 't' ? 'team-toggle-t-active' : 'team-toggle-inactive'"
      @click="setTeam('t')"
    >
      {{ t('teams.terrorists') }}
    </button>
  </div>
</template>

<style scoped>
.team-toggle-btn {
  padding: 3px 12px;
  font-size: 12px;
  font-weight: 600;
  line-height: 1.4;
  border: 1px solid transparent;
  cursor: pointer;
  transition: all 0.15s ease;
  white-space: nowrap;
}

.team-toggle-ct-active {
  border-color: rgb(59 130 246 / 0.3);
  background: rgb(59 130 246 / 0.15);
  color: rgb(147 197 253); /* text-blue-300 */
}

.team-toggle-t-active {
  border-color: rgb(249 115 22 / 0.3);
  background: rgb(249 115 22 / 0.15);
  color: rgb(253 186 116); /* text-orange-300 */
}

.team-toggle-inactive {
  border-color: rgb(255 255 255 / 0.08);
  background: transparent;
  color: rgb(163 163 163); /* text-neutral-400 */
}

.team-toggle-inactive:hover {
  border-color: rgb(255 255 255 / 0.15);
  background: rgb(255 255 255 / 0.05);
  color: rgb(212 212 212);
}
</style>
