<template>
  <NCard :bordered="false" class="history-chart-card">
    <template #header>
      <div class="flex justify-between items-center gap-4 chart-header">
        <h3 class="text-lg font-semibold capitalize flex-shrink-0">
          {{ displayName }}
        </h3>
      </div>
    </template>
    
    <!-- Full chart view (always visible, not collapsible) -->
    <div class="chart-container glass-container p-4 relative">
      <!-- Chart.js chart -->
      <Line 
        v-if="hasData" 
        :data="chartData" 
        :options="chartOptions" 
        :height="100"
      />
      
      <!-- No data message -->
      <div v-else class="flex items-center justify-center" style="color: var(--text-tertiary); min-height: 100px;">
        No data available for this period
      </div>
    </div>
  </NCard>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { NCard } from 'naive-ui';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  type ChartOptions as ChartJSOptions
} from 'chart.js';
import { Line } from 'vue-chartjs';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface DataPoint {
  timestamp: Date;
  status: 'ok' | 'degraded' | 'fail';
  latency_ms?: number;
}

interface Props {
  data: {
    check_name: string;
    data_points: DataPoint[];
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
  return displayNameMap[props.data.check_name] || props.data.check_name;
});

const hasData = computed(() => {
  return props.data.data_points && props.data.data_points.length > 0;
});

// Prepare chart data
const chartData = computed(() => {
  if (!hasData.value) {
    return {
      labels: [],
      datasets: []
    };
  }

  const points = props.data.data_points;
  
  // Labels (timestamps)
  const labels = points.map(p => {
    const date = new Date(p.timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  });

  // Latency data
  const latencyData = points.map(p => p.latency_ms || 0);
  
  // Get dominant status color
  const okCount = points.filter(p => p.status === 'ok').length;
  const degradedCount = points.filter(p => p.status === 'degraded').length;
  const failCount = points.filter(p => p.status === 'fail').length;
  
  let dominantColor = 'rgba(16, 185, 129, 0.3)'; // green
  let dominantBorder = 'rgb(16, 185, 129)';
  if (failCount > okCount && failCount > degradedCount) {
    dominantColor = 'rgba(239, 68, 68, 0.3)'; // red
    dominantBorder = 'rgb(239, 68, 68)';
  } else if (degradedCount > okCount) {
    dominantColor = 'rgba(245, 158, 11, 0.3)'; // yellow/orange
    dominantBorder = 'rgb(245, 158, 11)';
  }
  
  // Point colors based on status
  const pointColors = points.map(p => {
    if (p.status === 'ok') return 'rgb(16, 185, 129)'; // green
    if (p.status === 'degraded') return 'rgb(245, 158, 11)'; // yellow
    return 'rgb(239, 68, 68)'; // red
  });

  return {
    labels,
    datasets: [
      {
        label: 'Latency (ms)',
        data: latencyData,
        borderColor: dominantBorder,
        backgroundColor: dominantColor,
        pointBackgroundColor: pointColors,
        pointBorderColor: pointColors,
        pointRadius: 2,
        pointHoverRadius: 4,
        borderWidth: 2,
        fill: true,
        tension: 0.4,
      }
    ]
  };
});

// Chart options
const chartOptions = computed<ChartJSOptions<'line'>>(() => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: false
    },
    tooltip: {
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      titleColor: 'rgba(255, 255, 255, 0.9)',
      bodyColor: 'rgba(255, 255, 255, 0.9)',
      borderColor: 'rgba(255, 255, 255, 0.1)',
      borderWidth: 1,
      padding: 12,
      displayColors: true,
      callbacks: {
        label: (context) => {
          const value = context.parsed.y;
          const point = props.data.data_points[context.dataIndex];
          return [
            `Latency: ${value}ms`,
            `Status: ${point.status.toUpperCase()}`
          ];
        }
      }
    }
  },
  scales: {
    x: {
      grid: {
        color: 'rgba(255, 255, 255, 0.05)',
        drawBorder: false
      },
      ticks: {
        color: 'rgba(255, 255, 255, 0.5)',
        maxRotation: 0,
        autoSkipPadding: 20
      }
    },
    y: {
      beginAtZero: true,
      grid: {
        color: 'rgba(255, 255, 255, 0.05)',
        drawBorder: false
      },
      ticks: {
        color: 'rgba(255, 255, 255, 0.5)',
        callback: (value) => `${value}ms`
      }
    }
  },
  interaction: {
    intersect: false,
    mode: 'index'
  }
}));
</script>

<style scoped lang="sass">
.history-chart-card
  backdrop-filter: var(--glass-blur-medium) saturate(160%)
  background: rgba(10, 10, 10, 0.7) !important
  border: 1px solid var(--glass-border)
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.08)
  border-radius: 16px !important

.chart-header
  padding: 0
  min-height: 32px

.glass-container
  backdrop-filter: var(--glass-blur-light)
  background: rgba(0, 0, 0, 0.6) !important
  border: 1px solid rgba(255, 255, 255, 0.05)
  border-radius: 12px

.chart-container
  min-height: 100px
</style>
