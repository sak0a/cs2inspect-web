<template>
  <NCard 
    :bordered="false"
    class="health-card"
    :class="cardClass"
  >
    <NSpace vertical :size="12">
      <NSpace align="center" :size="12">
        <div class="status-icon text-3xl">{{ statusIcon }}</div>
        <NSpace vertical :size="2">
          <h3 class="text-lg font-semibold capitalize">{{ displayName }}</h3>
          <NBadge :type="badgeType" :value="statusText" />
        </NSpace>
      </NSpace>

      <div v-if="check.latency_ms !== undefined">
        <NSpace justify="space-between" class="mb-2">
          <span class="text-sm opacity-75">Latency</span>
          <span class="font-mono font-bold">{{ check.latency_ms }}ms</span>
        </NSpace>
        <NProgress 
          type="line"
          :percentage="latencyPercentage"
          :color="latencyColor"
          :rail-color="'rgba(255, 255, 255, 0.05)'"
          :height="8"
          :border-radius="4"
        />
      </div>

      <div v-if="check.message" class="text-sm opacity-80 mt-2">
        {{ check.message }}
      </div>
    </NSpace>
  </NCard>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { NCard, NSpace, NBadge, NProgress } from 'naive-ui';

interface Props {
  check: {
    name: string;
    status: 'ok' | 'degraded' | 'fail';
    latency_ms?: number;
    message?: string;
  };
}

const props = defineProps<Props>();

// Display name mapping
const displayNameMap: Record<string, string> = {
  'database': 'Database',
  'steam_api': 'Steam API',
  'steam_client': 'Steam Client',
  'environment': 'Environment',
};

const displayName = computed(() => {
  return displayNameMap[props.check.name] || props.check.name;
});

// Status icon
const statusIcon = computed(() => {
  if (props.check.status === 'ok') return '✓';
  if (props.check.status === 'degraded') return '⚠';
  if (props.check.status === 'fail') return '✗';
  return '?';
});

// Status text
const statusText = computed(() => {
  if (props.check.status === 'ok') return 'Operational';
  if (props.check.status === 'degraded') return 'Degraded';
  if (props.check.status === 'fail') return 'Failed';
  return 'Unknown';
});

// Badge type for NaiveUI
const badgeType = computed(() => {
  if (props.check.status === 'ok') return 'success';
  if (props.check.status === 'degraded') return 'warning';
  if (props.check.status === 'fail') return 'error';
  return 'default';
});

// Card class with glassmorphism
const cardClass = computed(() => {
  if (props.check.status === 'ok') return 'status-ok';
  if (props.check.status === 'degraded') return 'status-degraded';
  if (props.check.status === 'fail') return 'status-fail';
  return 'status-unknown';
});

// Latency color for progress bar
const latencyColor = computed(() => {
  const latency = props.check.latency_ms || 0;
  if (latency < 50) return '#10b981'; // green
  if (latency < 200) return '#f59e0b'; // yellow
  return '#ef4444'; // red
});

// Latency percentage for progress bar
const latencyPercentage = computed(() => {
  const latency = props.check.latency_ms || 0;
  // Max latency for bar is 1000ms
  return Math.min((latency / 1000) * 100, 100);
});
</script>

<style scoped lang="sass">
.health-card
  backdrop-filter: var(--glass-blur-medium) saturate(160%)
  background: var(--glass-bg-secondary) !important
  border: 1px solid var(--glass-border)
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.08)
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1)
  
  &:hover
    transform: translateY(-2px)
    box-shadow: 0 12px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.12)
  
  &.status-ok
    border-left: 3px solid #10b981
    background: linear-gradient(135deg, rgba(16, 185, 129, 0.08), var(--glass-bg-secondary)) !important
  
  &.status-degraded
    border-left: 3px solid #f59e0b
    background: linear-gradient(135deg, rgba(245, 158, 11, 0.08), var(--glass-bg-secondary)) !important
  
  &.status-fail
    border-left: 3px solid #ef4444
    background: linear-gradient(135deg, rgba(239, 68, 68, 0.08), var(--glass-bg-secondary)) !important
  
  &.status-unknown
    border-left: 3px solid #6b7280
    background: linear-gradient(135deg, rgba(107, 114, 128, 0.08), var(--glass-bg-secondary)) !important

.status-icon
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3))
</style>

