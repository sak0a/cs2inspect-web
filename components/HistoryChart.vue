<template>
  <NCard :bordered="false" class="history-chart-card">
    <template #header>
      <div class="flex justify-between items-center gap-4 cursor-pointer" @click="toggleCollapsed">
        <h3 class="text-xl font-semibold capitalize flex-shrink-0">
          {{ displayName }}
        </h3>
        
        <!-- Mini sparkline in header when collapsed -->
        <div v-if="collapsed" class="flex-1 min-w-0 px-4" @click.stop>
          <div class="mini-chart-inline">
            <Line 
              v-if="hasData" 
              :data="miniChartData" 
              :options="miniChartOptions" 
              :height="32"
            />
          </div>
        </div>
        
        <NButton text :class="{ 'rotate-180': !collapsed }" class="transition-transform duration-300 flex-shrink-0">
          <NIcon :component="ChevronDownIcon" :size="20" />
        </NButton>
      </div>
    </template>
    
    <!-- Full chart view when expanded -->
    <div v-show="!collapsed" class="chart-container glass-container p-4 relative">
      <!-- Chart.js chart -->
      <Line 
        v-if="hasData" 
        :data="chartData" 
        :options="chartOptions" 
        :height="200"
      />
      
      <!-- No data message -->
      <div v-else class="flex items-center justify-center" style="color: var(--text-tertiary); min-height: 200px;">
        No data available for this period
      </div>
    </div>
  </NCard>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { NCard, NButton, NIcon, NCollapseTransition } from 'naive-ui';
import { ChevronDown as ChevronDownIcon } from '@vicons/tabler';
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

// Collapsible state
const collapsed = ref(false);

function toggleCollapsed() {
  collapsed.value = !collapsed.value;
}

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

// Mini chart data (same as full chart but simplified)
const miniChartData = computed(() => {
  if (!hasData.value) {
    return {
      labels: [],
      datasets: []
    };
  }

  const points = props.data.data_points;
  
  // Sample data points for sparkline (show every nth point to keep it simple)
  const sampleRate = Math.max(1, Math.floor(points.length / 50));
  const sampledPoints = points.filter((_, index) => index % sampleRate === 0);
  
  // Labels (empty for mini view)
  const labels = sampledPoints.map(() => '');

  // Latency data
  const latencyData = sampledPoints.map(p => p.latency_ms || 0);
  
  // Point colors based on status
  const pointColors = sampledPoints.map(p => {
    if (p.status === 'ok') return 'rgb(16, 185, 129)'; // green
    if (p.status === 'degraded') return 'rgb(245, 158, 11)'; // yellow
    return 'rgb(239, 68, 68)'; // red
  });

  return {
    labels,
    datasets: [
      {
        label: 'Latency',
        data: latencyData,
        borderColor: 'rgba(96, 165, 250, 0.6)',
        backgroundColor: 'rgba(96, 165, 250, 0.05)',
        pointBackgroundColor: pointColors,
        pointBorderColor: pointColors,
        pointRadius: 2,
        pointHoverRadius: 3,
        borderWidth: 1.5,
        fill: true,
        tension: 0.4,
      }
    ]
  };
});

// Mini chart options (simplified, no axes labels)
const miniChartOptions = computed<ChartJSOptions<'line'>>(() => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: false
    },
    tooltip: {
      enabled: true,
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      titleColor: 'rgba(255, 255, 255, 0.9)',
      bodyColor: 'rgba(255, 255, 255, 0.9)',
      borderColor: 'rgba(255, 255, 255, 0.1)',
      borderWidth: 1,
      padding: 8,
      displayColors: false,
      callbacks: {
        title: () => '',
        label: (context) => {
          const value = context.parsed.y;
          return `${value}ms`;
        }
      }
    }
  },
  scales: {
    x: {
      display: false,
      grid: {
        display: false
      }
    },
    y: {
      display: false,
      beginAtZero: true,
      grid: {
        display: false
      }
    }
  },
  interaction: {
    intersect: false,
    mode: 'nearest'
  }
}));
</script>

<style scoped lang="sass">
.history-chart-card
  backdrop-filter: var(--glass-blur-medium) saturate(160%)
  background: var(--glass-bg-secondary) !important
  border: 1px solid var(--glass-border)
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.08)
  border-radius: 16px !important

.glass-container
  backdrop-filter: var(--glass-blur-light)
  background: rgba(0, 0, 0, 0.5) !important
  border: 1px solid rgba(255, 255, 255, 0.05)
  border-radius: 12px

.chart-container
  min-height: 200px

.mini-chart-inline
  height: 32px
  background: rgba(0, 0, 0, 0.2)
  border-radius: 8px
  padding: 4px 8px
  border: 1px solid rgba(255, 255, 255, 0.05)

.rotate-180
  transform: rotate(180deg)
</style>
