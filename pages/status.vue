<template>
  <div class="status-page">
    <NSpace vertical :size="24" class="max-w-7xl mx-auto p-8">
      <!-- Header -->
      <NSpace vertical :size="8">
        <NButton 
          secondary 
          tag="a" 
          href="/" 
          class="back-to-home-button"
          size="large"
          round
        >
          <template #icon>
            <NIcon :component="ArrowLeftIcon" />
          </template>
          {{ t('navigation.backToHome') }}
        </NButton>
        <h1 class="text-4xl font-bold" style="color: var(--text-primary)">{{ t('title') }}</h1>
        <p style="color: var(--text-secondary)">{{ t('description') }}</p>
      </NSpace>

      <!-- Overall Status Banner -->
      <NCard 
        :bordered="false"
        class="glass-card status-banner"
        :class="overallStatusClass"
      >
        <div class="flex items-center justify-between">
          <NSpace align="center" :size="16">
            <div class="status-icon text-5xl">{{ overallStatusIcon }}</div>
            <NSpace vertical :size="4">
              <h2 class="text-2xl font-bold">{{ overallStatusText }}</h2>
              <p class="text-sm opacity-80">{{ t('lastUpdated') }}: {{ formatTime(lastUpdate) }}</p>
            </NSpace>
          </NSpace>
          <NButton
            secondary
            :loading="loading"
            :disabled="loading"
            @click="refreshStatus"
          >
            <template #icon>
              <NIcon :component="RefreshIcon" />
            </template>
            {{ loading ? t('refreshing') : t('refresh') }}
          </NButton>
        </div>
      </NCard>

      <!-- Health Check Cards -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <HealthCard
          v-for="check in healthChecks"
          :key="check.name"
          :check="check"
        />
      </div>

      <!-- Historical Charts -->
      <div class="chart-outer-container">
        <NCard :bordered="false" class="glass-card-dark">
          <template #header>
            <div class="flex justify-between items-center">
              <h2 class="text-2xl font-bold">{{ t('performanceHistory') }}</h2>
              <NSelect
                v-model:value="timeRange"
                :options="timeRangeOptions"
                style="width: 200px"
                @update:value="loadHistory"
              />
            </div>
          </template>

          <NSpin :show="loadingHistory">
            <div v-if="filteredHistoricalData.length === 0" class="text-center py-12" style="color: var(--text-tertiary)">
              {{ t('noHistoricalData') }}
            </div>

            <!-- Full-width charts - one per row -->
            <div v-else class="grid grid-cols-1 gap-6">
              <HistoryChart
                v-for="data in filteredHistoricalData"
                :key="data.check_name"
                :data="data"
              />
            </div>
          </NSpin>
        </NCard>
      </div>
    </NSpace>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { NSpace, NCard, NButton, NIcon, NSelect, NSpin } from 'naive-ui';
import { ArrowLeft as ArrowLeftIcon, Refresh as RefreshIcon } from '@vicons/tabler';

// Use a simple layout without authentication
definePageMeta({
  layout: false,
});

const { t } = useI18n();

interface HealthCheck {
  name: string;
  status: 'ok' | 'degraded' | 'fail';
  latency_ms?: number;
  message?: string;
  checked_at: Date;
  metadata?: Record<string, unknown>;
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

// Time range options for NSelect
const timeRangeOptions = [
  { label: 'Last Hour', value: '1h' },
  { label: 'Last 6 Hours', value: '6h' },
  { label: 'Last 24 Hours', value: '24h' },
  { label: 'Last 7 Days', value: '7d' },
];

// Filter out environment from historical data (no graph needed)
const filteredHistoricalData = computed(() => {
  return historicalData.value.filter(data => data.check_name !== 'environment');
});

// Overall status computed properties
const overallStatus = computed(() => {
  if (healthChecks.value.length === 0) return 'unknown';
  if (healthChecks.value.some(c => c.status === 'fail')) return 'fail';
  if (healthChecks.value.some(c => c.status === 'degraded')) return 'degraded';
  return 'ok';
});

const overallStatusClass = computed(() => {
  const status = overallStatus.value;
  if (status === 'ok') return 'status-ok';
  if (status === 'degraded') return 'status-degraded';
  if (status === 'fail') return 'status-fail';
  return 'status-unknown';
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
  if (status === 'ok') return t('status.allOperational');
  if (status === 'degraded') return t('status.partialOutage');
  if (status === 'fail') return t('status.systemOutage');
  return t('status.unknown');
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

<style scoped lang="sass">
.status-page
  min-height: 100vh
  height: 100vh
  background: #0a0a0a
  font-family: 'Inter', system-ui, -apple-system, sans-serif
  overflow-y: auto !important
  overflow-x: hidden

.glass-card
  backdrop-filter: var(--glass-blur-medium) saturate(160%)
  background: var(--glass-bg-secondary) !important
  border: 1px solid var(--glass-border)
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.08)
  border-radius: 16px !important

.chart-outer-container
  backdrop-filter: var(--glass-blur-medium)
  background: rgba(0, 0, 0, 0.6) !important
  border-radius: 20px
  padding: 8px

.glass-card-dark
  backdrop-filter: var(--glass-blur-medium) saturate(160%)
  background: rgba(15, 15, 15, 0.8) !important
  border: 1px solid var(--glass-border)
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.08)
  border-radius: 16px !important

.status-banner
  border-radius: 16px !important
  
  &.status-ok
    border-left: 4px solid #10b981
    background: linear-gradient(135deg, rgba(16, 185, 129, 0.1), var(--glass-bg-secondary)) !important
  
  &.status-degraded
    border-left: 4px solid #f59e0b
    background: linear-gradient(135deg, rgba(245, 158, 11, 0.1), var(--glass-bg-secondary)) !important
  
  &.status-fail
    border-left: 4px solid #ef4444
    background: linear-gradient(135deg, rgba(239, 68, 68, 0.1), var(--glass-bg-secondary)) !important
  
  &.status-unknown
    border-left: 4px solid #6b7280
    background: linear-gradient(135deg, rgba(107, 114, 128, 0.1), var(--glass-bg-secondary)) !important

.status-icon
  filter: drop-shadow(0 2px 8px rgba(0, 0, 0, 0.3))
</style>
