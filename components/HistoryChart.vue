<template>
  <div class="history-chart">
    <div class="flex justify-between items-center gap-4 chart-header">
      <h3 class="text-lg font-semibold capitalize flex-shrink-0">
        {{ displayName }}
      </h3>
    </div>

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
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
// Removed NCard import since we're no longer wrapping with a card
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
  'image_proxy': 'Image Proxy'
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
// Removed .history-chart-card since we no longer use a card wrapper
.chart-header
  padding: 0
  min-height: 32px
  margin-bottom: 0.25rem

.glass-container
  backdrop-filter: var(--glass-blur-light)
  background: rgba(0, 0, 0, 0.6) !important
  border: 1px solid rgba(255, 255, 255, 0.05)
  border-radius: 12px

.chart-container
  min-height: 100px
</style>
