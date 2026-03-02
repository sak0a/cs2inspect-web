<template>
  <div class="admin-activity-chart">
    <div class="flex justify-between items-center gap-4 mb-4">
      <h3 class="text-lg font-semibold text-white">Activity Over Time</h3>
      <div class="flex gap-2">
        <button
          v-for="range in timeRanges"
          :key="range.value"
          class="px-3 py-1 rounded-md text-sm transition-colors"
          :class="
            selectedRange === range.value
              ? 'bg-primary-500 text-white'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          "
          @click="selectRange(range.value)"
        >
          {{ range.label }}
        </button>
      </div>
    </div>

    <div class="chart-container glass-container p-4 relative">
      <!-- Loading state -->
      <div v-if="loading" class="flex items-center justify-center min-h-[300px]">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500" />
      </div>

      <!-- Chart -->
      <Line v-else-if="hasData" :data="chartData" :options="chartOptions" :height="300" />

      <!-- No data message -->
      <div v-else class="flex items-center justify-center min-h-[300px] text-gray-400">
        No activity data available
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
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
  type ChartOptions as ChartJSOptions,
} from 'chart.js'
import { Line } from 'vue-chartjs'

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
)

interface ActivityDataPoint {
  date: string
  newUsers: number
  activeUsers: number
  loadoutsCreated: number
  itemsSaved: number
}

interface Props {
  data: ActivityDataPoint[]
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
})

const emit = defineEmits<{
  (e: 'range-change', range: string): void
}>()

const timeRanges = [
  { label: '7D', value: '7d' },
  { label: '30D', value: '30d' },
  { label: '90D', value: '90d' },
]

const selectedRange = ref('7d')

const selectRange = (range: string) => {
  selectedRange.value = range
  emit('range-change', range)
}

const hasData = computed(() => {
  return props.data && props.data.length > 0
})

const chartData = computed(() => {
  if (!hasData.value) {
    return {
      labels: [],
      datasets: [],
    }
  }

  const labels = props.data.map((d) => {
    const date = new Date(d.date)
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' })
  })

  return {
    labels,
    datasets: [
      {
        label: 'New Users',
        data: props.data.map((d) => d.newUsers),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        pointBackgroundColor: 'rgb(59, 130, 246)',
        pointBorderColor: 'rgb(59, 130, 246)',
        pointRadius: 3,
        pointHoverRadius: 5,
        borderWidth: 2,
        fill: true,
        tension: 0.4,
      },
      {
        label: 'Active Users',
        data: props.data.map((d) => d.activeUsers),
        borderColor: 'rgb(16, 185, 129)',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        pointBackgroundColor: 'rgb(16, 185, 129)',
        pointBorderColor: 'rgb(16, 185, 129)',
        pointRadius: 3,
        pointHoverRadius: 5,
        borderWidth: 2,
        fill: true,
        tension: 0.4,
      },
      {
        label: 'Loadouts Created',
        data: props.data.map((d) => d.loadoutsCreated),
        borderColor: 'rgb(245, 158, 11)',
        backgroundColor: 'rgba(245, 158, 11, 0.1)',
        pointBackgroundColor: 'rgb(245, 158, 11)',
        pointBorderColor: 'rgb(245, 158, 11)',
        pointRadius: 3,
        pointHoverRadius: 5,
        borderWidth: 2,
        fill: true,
        tension: 0.4,
      },
      {
        label: 'Items Saved',
        data: props.data.map((d) => d.itemsSaved),
        borderColor: 'rgb(168, 85, 247)',
        backgroundColor: 'rgba(168, 85, 247, 0.1)',
        pointBackgroundColor: 'rgb(168, 85, 247)',
        pointBorderColor: 'rgb(168, 85, 247)',
        pointRadius: 3,
        pointHoverRadius: 5,
        borderWidth: 2,
        fill: true,
        tension: 0.4,
      },
    ],
  }
})

const chartOptions = computed<ChartJSOptions<'line'>>(() => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: true,
      position: 'top',
      labels: {
        color: 'rgba(255, 255, 255, 0.8)',
        usePointStyle: true,
        pointStyle: 'circle',
        padding: 20,
      },
    },
    tooltip: {
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      titleColor: 'rgba(255, 255, 255, 0.9)',
      bodyColor: 'rgba(255, 255, 255, 0.9)',
      borderColor: 'rgba(255, 255, 255, 0.1)',
      borderWidth: 1,
      padding: 12,
      displayColors: true,
      mode: 'index',
      intersect: false,
    },
  },
  scales: {
    x: {
      grid: {
        color: 'rgba(255, 255, 255, 0.05)',
        drawBorder: false,
      },
      ticks: {
        color: 'rgba(255, 255, 255, 0.5)',
        maxRotation: 0,
        autoSkipPadding: 20,
      },
    },
    y: {
      beginAtZero: true,
      grid: {
        color: 'rgba(255, 255, 255, 0.05)',
        drawBorder: false,
      },
      ticks: {
        color: 'rgba(255, 255, 255, 0.5)',
        precision: 0,
      },
    },
  },
  interaction: {
    intersect: false,
    mode: 'index',
  },
}))
</script>

<style scoped lang="sass">
.glass-container
  backdrop-filter: var(--glass-blur-light) var(--glass-saturation)
  -webkit-backdrop-filter: var(--glass-blur-light) var(--glass-saturation)
  background: var(--admin-glass-bg, rgba(0, 0, 0, 0.45))
  border: 1px solid var(--glass-border, rgba(255, 255, 255, 0.08))
  border-radius: 12px

.chart-container
  min-height: 300px

.bg-primary-500
  background-color: var(--primary-color)

.border-primary-500
  border-color: var(--primary-color)
</style>
