<template>
  <div class="status-page min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-8">
    <div class="max-w-7xl mx-auto">
      <!-- Back to Home Link -->
      <div class="mb-4">
        <a href="/" class="text-blue-400 hover:text-blue-300 transition-colors">
          ← Back to Home
        </a>
      </div>
      <!-- Header -->
      <div class="mb-8">
        <h1 class="text-4xl font-bold text-white mb-2">System Status</h1>
        <p class="text-gray-400">Real-time health monitoring for CS2 Inspect services</p>
      </div>

      <!-- Overall Status Banner -->
      <div 
        class="rounded-lg p-6 mb-8 shadow-xl"
        :class="overallStatusClass"
      >
        <div class="flex items-center justify-between">
          <div class="flex items-center space-x-4">
            <div class="text-4xl">{{ overallStatusIcon }}</div>
            <div>
              <h2 class="text-2xl font-bold">{{ overallStatusText }}</h2>
              <p class="text-sm opacity-90">Last updated: {{ formatTime(lastUpdate) }}</p>
            </div>
          </div>
          <button 
            class="px-4 py-2 bg-white bg-opacity-20 rounded-lg hover:bg-opacity-30 transition-all"
            :disabled="loading"
            @click="refreshStatus"
          >
            <span v-if="loading">Refreshing...</span>
            <span v-else>↻ Refresh</span>
          </button>
        </div>
      </div>

      <!-- Health Check Cards -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <HealthCard
          v-for="check in healthChecks"
          :key="check.name"
          :check="check"
        />
      </div>

      <!-- Historical Charts -->
      <div class="bg-gray-800 rounded-lg p-6 shadow-xl">
        <div class="flex justify-between items-center mb-6">
          <h2 class="text-2xl font-bold text-white">Performance History</h2>
          <select 
            v-model="timeRange"
            class="px-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:border-blue-500"
            @change="loadHistory"
          >
            <option value="1h">Last Hour</option>
            <option value="6h">Last 6 Hours</option>
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
          </select>
        </div>

        <div v-if="loadingHistory" class="text-center py-12 text-gray-400">
          Loading historical data...
        </div>

        <div v-else-if="historicalData.length === 0" class="text-center py-12 text-gray-400">
          No historical data available yet. Check back in a few minutes.
        </div>

        <div v-else class="space-y-8">
          <HistoryChart
            v-for="data in historicalData"
            :key="data.check_name"
            :data="data"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';

// Use a simple layout without authentication
definePageMeta({
  layout: false,
});

interface HealthCheck {
  name: string;
  status: 'ok' | 'degraded' | 'fail';
  latency_ms?: number;
  message?: string;
  checked_at: Date;
}

interface HistoricalData {
  check_name: string;
  data_points: Array<{
    timestamp: Date;
    status: 'ok' | 'degraded' | 'fail';
    latency_ms?: number;
  }>;
}

const healthChecks = ref<HealthCheck[]>([]);
const historicalData = ref<HistoricalData[]>([]);
const loading = ref(false);
const loadingHistory = ref(false);
const lastUpdate = ref(new Date());
const timeRange = ref('24h');
let refreshInterval: NodeJS.Timeout | null = null;

// Overall status computed properties
const overallStatus = computed(() => {
  if (healthChecks.value.length === 0) return 'unknown';
  if (healthChecks.value.some(c => c.status === 'fail')) return 'fail';
  if (healthChecks.value.some(c => c.status === 'degraded')) return 'degraded';
  return 'ok';
});

const overallStatusClass = computed(() => {
  const status = overallStatus.value;
  if (status === 'ok') return 'bg-gradient-to-r from-green-600 to-green-700 text-white';
  if (status === 'degraded') return 'bg-gradient-to-r from-yellow-600 to-yellow-700 text-white';
  if (status === 'fail') return 'bg-gradient-to-r from-red-600 to-red-700 text-white';
  return 'bg-gradient-to-r from-gray-600 to-gray-700 text-white';
});

const overallStatusIcon = computed(() => {
  const status = overallStatus.value;
  if (status === 'ok') return '✓';
  if (status === 'degraded') return '⚠';
  if (status === 'fail') return '✗';
  return '?';
});

const overallStatusText = computed(() => {
  const status = overallStatus.value;
  if (status === 'ok') return 'All Systems Operational';
  if (status === 'degraded') return 'Partial System Outage';
  if (status === 'fail') return 'System Outage';
  return 'Status Unknown';
});

// Load current status
async function loadStatus() {
  loading.value = true;
  try {
    const response = await fetch('/api/health/details');
    const data = await response.json();
    healthChecks.value = data.checks || [];
    lastUpdate.value = new Date();
  } catch (error) {
    console.error('Failed to load health status:', error);
  } finally {
    loading.value = false;
  }
}

// Load historical data
async function loadHistory() {
  loadingHistory.value = true;
  try {
    // Calculate start time based on time range
    const now = new Date();
    let startTime = new Date();
    
    switch (timeRange.value) {
      case '1h':
        startTime = new Date(now.getTime() - 60 * 60 * 1000);
        break;
      case '6h':
        startTime = new Date(now.getTime() - 6 * 60 * 60 * 1000);
        break;
      case '24h':
        startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        startTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
    }

    const response = await fetch(`/api/health/history?start_time=${startTime.toISOString()}&limit=500`);
    const data = await response.json();
    historicalData.value = data || [];
  } catch (error) {
    console.error('Failed to load health history:', error);
  } finally {
    loadingHistory.value = false;
  }
}

// Refresh both status and history
async function refreshStatus() {
  await Promise.all([loadStatus(), loadHistory()]);
}

// Format time helper
function formatTime(date: Date): string {
  return date.toLocaleTimeString();
}

// Lifecycle hooks
onMounted(() => {
  // Load initial data
  refreshStatus();
  
  // Auto-refresh every 30 seconds
  refreshInterval = setInterval(() => {
    loadStatus();
  }, 30000);
});

onUnmounted(() => {
  if (refreshInterval) {
    clearInterval(refreshInterval);
  }
});
</script>

<style scoped>
.status-page {
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
}
</style>
