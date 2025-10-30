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

      <!-- Environment card shows total variable count -->
      <div v-if="check.name === 'environment' && check.metadata">
        <NSpace justify="space-between" class="mb-2">
          <span class="text-sm opacity-75">Environment Variables</span>
          <span class="font-mono font-bold">
            {{ check.metadata.present_vars_count }} / {{ check.metadata.total_env_vars }}
          </span>
        </NSpace>
        <NProgress
          type="line"
          :percentage="envVarPercentage"
          :show-indicator="false"
          :color="envVarColor"
          :rail-color="'rgba(255, 255, 255, 0.05)'"
          :height="8"
          :border-radius="4"
        />
      </div>

      <!-- Database card shows latency with uptime percentage in progress bar -->
      <div v-else-if="check.name === 'database' && check.latency_ms !== undefined">
        <NSpace justify="space-between" class="mb-2">
          <span class="text-sm opacity-75">Latency</span>
          <span class="font-mono font-bold">{{ check.latency_ms }}ms</span>
        </NSpace>
        <NProgress 
          type="line"
          :percentage="uptimePercentage"
          :color="uptimeColor"
          :show-indicator="false"
          :rail-color="'rgba(255, 255, 255, 0.05)'"
          :height="8"
          :border-radius="4"
        />
        <div class="flex justify-between text-xs opacity-60 mt-1">
          <span v-if="check.metadata && check.metadata.avg_latency_ms">Avg: {{ check.metadata.avg_latency_ms }}ms</span>
          <span>Uptime: {{ uptimePercentage.toFixed(2) }}%</span>
        </div>
      </div>

      <!-- Other cards show latency with uptime percentage -->
      <div v-else-if="check.latency_ms !== undefined">
        <NSpace justify="space-between" class="mb-2">
          <span class="text-sm opacity-75">Latency</span>
          <span class="font-mono font-bold">{{ check.latency_ms }}ms</span>
        </NSpace>
        <NProgress 
          type="line"
          :percentage="uptimePercentage"
          :color="uptimeColor"
          :show-indicator="false"
          :rail-color="'rgba(255, 255, 255, 0.05)'"
          :height="8"
          :border-radius="4"
        />
        <div class="text-xs opacity-60 mt-1 text-right">
          Uptime: {{ uptimePercentage.toFixed(2) }}%
        </div>
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
    metadata?: Record<string, unknown>;
  };
}

const props = defineProps<Props>();

// Display name mapping
const displayNameMap: Record<string, string> = {
  'database': 'Database',
  'steam_api': 'Steam API',
  'steam_client': 'Steam Client',
  'environment': 'Environment',
  'image_proxy': 'Image Proxy',
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

// Uptime percentage for progress bar (calculated from historical data in metadata)
const uptimePercentage = computed(() => {
  // Check if uptime_percentage is provided in metadata
  if (props.check.metadata && typeof props.check.metadata.uptime_percentage === 'number') {
    return Math.round(props.check.metadata.uptime_percentage * 100) / 100;
  }
  
  // Fallback: estimate from current status (100% if ok, 50% if degraded, 0% if fail)
  if (props.check.status === 'ok') return 100;
  if (props.check.status === 'degraded') return 50;
  return 0;
});

// Uptime color for progress bar
const uptimeColor = computed(() => {
  const percentage = uptimePercentage.value;
  if (percentage >= 99) return '#10b981'; // green
  if (percentage >= 90) return '#f59e0b'; // yellow
  return '#ef4444'; // red
});

// Environment variable percentage
const envVarPercentage = computed(() => {
  if (props.check.name !== 'environment' || !props.check.metadata) return 0;
  const present = Number(props.check.metadata.present_vars_count) || 0;
  const total = Number(props.check.metadata.total_env_vars) || 1;
  return Math.round((present / total) * 100 * 100) / 100;
});

// Environment variable color
const envVarColor = computed(() => {
  const percentage = envVarPercentage.value;
  if (percentage === 100) return '#10b981'; // green
  if (percentage >= 50) return '#f59e0b'; // yellow
  return '#ef4444'; // red
});
</script>

<style scoped lang="sass">
.health-card
  backdrop-filter: var(--glass-blur-medium) saturate(160%)
  background: var(--glass-bg-secondary) !important
  border: 1px solid var(--glass-border)
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.08)
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1)
  border-radius: 16px !important
  
  &:hover
    transform: translateY(-2px)
    box-shadow: 0 12px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.12)
  
  &.status-ok
    border-left: 4px solid #10b981
    background: linear-gradient(135deg, rgba(16, 185, 129, 0.08), var(--glass-bg-secondary)) !important
  
  &.status-degraded
    border-left: 4px solid #f59e0b
    background: linear-gradient(135deg, rgba(245, 158, 11, 0.08), var(--glass-bg-secondary)) !important
  
  &.status-fail
    border-left: 4px solid #ef4444
    background: linear-gradient(135deg, rgba(239, 68, 68, 0.08), var(--glass-bg-secondary)) !important
  
  &.status-unknown
    border-left: 4px solid #6b7280
    background: linear-gradient(135deg, rgba(107, 114, 128, 0.08), var(--glass-bg-secondary)) !important

.status-icon
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3))
</style>
