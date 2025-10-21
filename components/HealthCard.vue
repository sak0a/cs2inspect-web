<template>
  <div 
    class="health-card rounded-lg p-6 shadow-xl transition-all hover:shadow-2xl"
    :class="cardClass"
  >
    <div class="flex items-start justify-between mb-4">
      <div class="flex items-center space-x-3">
        <div class="text-3xl">{{ statusIcon }}</div>
        <div>
          <h3 class="text-lg font-semibold text-white capitalize">{{ displayName }}</h3>
          <p class="text-sm opacity-90">{{ statusText }}</p>
        </div>
      </div>
    </div>

    <div v-if="check.latency_ms !== undefined" class="mb-3">
      <div class="flex justify-between items-center mb-1">
        <span class="text-sm opacity-75">Latency</span>
        <span class="font-mono font-bold">{{ check.latency_ms }}ms</span>
      </div>
      <div class="w-full bg-gray-900 bg-opacity-30 rounded-full h-2 overflow-hidden">
        <div 
          class="h-full transition-all duration-300"
          :class="latencyBarClass"
          :style="{ width: latencyBarWidth }"
        />
      </div>
    </div>

    <div v-if="check.message" class="text-sm opacity-80 mt-2">
      {{ check.message }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

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

// Card background class
const cardClass = computed(() => {
  if (props.check.status === 'ok') {
    return 'bg-gradient-to-br from-green-600 to-green-700 text-white';
  }
  if (props.check.status === 'degraded') {
    return 'bg-gradient-to-br from-yellow-600 to-yellow-700 text-white';
  }
  if (props.check.status === 'fail') {
    return 'bg-gradient-to-br from-red-600 to-red-700 text-white';
  }
  return 'bg-gradient-to-br from-gray-600 to-gray-700 text-white';
});

// Latency bar
const latencyBarClass = computed(() => {
  const latency = props.check.latency_ms || 0;
  if (latency < 50) return 'bg-green-400';
  if (latency < 200) return 'bg-yellow-400';
  return 'bg-red-400';
});

const latencyBarWidth = computed(() => {
  const latency = props.check.latency_ms || 0;
  // Max latency for bar is 1000ms
  const percentage = Math.min((latency / 1000) * 100, 100);
  return `${percentage}%`;
});
</script>

<style scoped>
.health-card {
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
}
</style>
