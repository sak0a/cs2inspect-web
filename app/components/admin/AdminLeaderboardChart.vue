<template>
    <div class="admin-leaderboard-chart">
        <div class="flex justify-between items-center gap-4 mb-4">
            <h3 class="text-lg font-semibold text-white">Top Users</h3>
        </div>

        <div class="chart-container glass-container p-4 relative">
            <!-- Loading state -->
            <div v-if="loading" class="flex items-center justify-center min-h-[400px]">
                <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500" />
            </div>

            <!-- Chart -->
            <Bar v-else-if="hasData" :data="chartData" :options="chartOptions" :height="400" />

            <!-- No data message -->
            <div v-else class="flex items-center justify-center min-h-[400px] text-gray-400">
                No leaderboard data available
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    type ChartOptions as ChartJSOptions,
} from 'chart.js'
import { Bar } from 'vue-chartjs'

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

interface LeaderboardEntry {
    steamId: string
    loadoutCount: number
    totalItems: number
}

interface Props {
    data: LeaderboardEntry[]
    loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
    loading: false,
})

// Rank colors from gold to bronze gradient
const rankColors = [
    'rgba(255, 215, 0, 0.9)', // Gold - 1st
    'rgba(230, 195, 0, 0.85)', // Gold lighter - 2nd
    'rgba(192, 192, 192, 0.85)', // Silver - 3rd
    'rgba(172, 172, 172, 0.8)', // Silver lighter - 4th
    'rgba(205, 127, 50, 0.8)', // Bronze - 5th
    'rgba(185, 115, 45, 0.75)', // Bronze lighter - 6th
    'rgba(59, 130, 246, 0.7)', // Blue - 7th
    'rgba(59, 130, 246, 0.6)', // Blue lighter - 8th
    'rgba(59, 130, 246, 0.5)', // Blue even lighter - 9th
    'rgba(59, 130, 246, 0.4)', // Blue lightest - 10th
]

const hasData = computed(() => {
    return props.data && props.data.length > 0
})

// Get top 10 users sorted by total items
const topUsers = computed(() => {
    if (!props.data) return []
    return [...props.data].sort((a, b) => b.totalItems - a.totalItems).slice(0, 10)
})

const chartData = computed(() => {
    if (!hasData.value) {
        return {
            labels: [],
            datasets: [],
        }
    }

    // Truncate steamId for display (show first and last 4 chars)
    const labels = topUsers.value.map((user, index) => {
        const steamId = user.steamId
        const truncated =
            steamId.length > 12 ? `${steamId.slice(0, 4)}...${steamId.slice(-4)}` : steamId
        return `#${index + 1} ${truncated}`
    })

    return {
        labels,
        datasets: [
            {
                label: 'Total Items',
                data: topUsers.value.map((u) => u.totalItems),
                backgroundColor: topUsers.value.map(
                    (_, i) =>
                        rankColors[i] ??
                        rankColors[rankColors.length - 1] ??
                        'rgba(59, 130, 246, 0.4)'
                ),
                borderColor: topUsers.value.map((_, i) => {
                    const color =
                        rankColors[i] ??
                        rankColors[rankColors.length - 1] ??
                        'rgba(59, 130, 246, 0.4)'
                    return color.replace(/[\d.]+\)$/, '1)')
                }),
                borderWidth: 1,
                borderRadius: 4,
                barThickness: 24,
            },
            {
                label: 'Loadouts',
                data: topUsers.value.map((u) => u.loadoutCount),
                backgroundColor: 'rgba(168, 85, 247, 0.6)',
                borderColor: 'rgba(168, 85, 247, 0.8)',
                borderWidth: 1,
                borderRadius: 4,
                barThickness: 24,
            },
        ],
    }
})

const chartOptions = computed<ChartJSOptions<'bar'>>(() => ({
    indexAxis: 'y',
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: {
            display: true,
            position: 'top',
            labels: {
                color: 'rgba(255, 255, 255, 0.8)',
                usePointStyle: true,
                pointStyle: 'rect',
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
            callbacks: {
                title: (context) => {
                    const firstContext = context[0]
                    if (!firstContext) return ''
                    const index = firstContext.dataIndex
                    const user = topUsers.value[index]
                    return user ? `Steam ID: ${user.steamId}` : ''
                },
                label: (context) => {
                    const xValue = context.parsed.x ?? 0
                    return `${context.dataset.label}: ${xValue.toLocaleString()}`
                },
            },
        },
    },
    scales: {
        x: {
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
        y: {
            grid: {
                display: false,
            },
            ticks: {
                color: 'rgba(255, 255, 255, 0.7)',
                font: {
                    family: 'monospace',
                    size: 11,
                },
            },
        },
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
  min-height: 400px

.bg-primary-500
  background-color: var(--primary-color)

.border-primary-500
  border-color: var(--primary-color)
</style>
