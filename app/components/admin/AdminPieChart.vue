<template>
    <div class="admin-pie-chart">
        <div class="flex justify-between items-center gap-4 mb-4">
            <h3 class="text-lg font-semibold text-white">Item Distribution</h3>
        </div>

        <div class="chart-container glass-container p-4 relative">
            <!-- Loading state -->
            <div v-if="loading" class="flex items-center justify-center min-h-[300px]">
                <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500" />
            </div>

            <!-- Chart -->
            <div
                v-else-if="hasData"
                class="flex flex-col md:flex-row items-center justify-center gap-8"
            >
                <div class="chart-wrapper">
                    <Doughnut :data="chartData" :options="chartOptions" />
                </div>

                <!-- Legend -->
                <div class="legend-container flex flex-col gap-3">
                    <div
                        v-for="(item, index) in legendItems"
                        :key="item.label"
                        class="legend-item flex items-center gap-3"
                    >
                        <div
                            class="w-4 h-4 rounded-sm"
                            :style="{ backgroundColor: colors[index] }"
                        />
                        <span class="text-gray-300">{{ item.label }}</span>
                        <span class="text-gray-500 ml-auto">{{ item.value.toLocaleString() }}</span>
                    </div>
                </div>
            </div>

            <!-- No data message -->
            <div v-else class="flex items-center justify-center min-h-[300px] text-gray-400">
                No item distribution data available
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { Chart as ChartJS, ArcElement, Tooltip, Legend, type TooltipItem } from 'chart.js'
import { Doughnut } from 'vue-chartjs'

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend)

interface ItemDistribution {
    weapons: number
    knives: number
    gloves: number
    agents: number
    musicKits: number
    pins: number
}

interface Props {
    data: ItemDistribution
    loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
    loading: false,
})

const colors = [
    'rgb(59, 130, 246)', // Blue - Weapons
    'rgb(239, 68, 68)', // Red - Knives
    'rgb(16, 185, 129)', // Green - Gloves
    'rgb(245, 158, 11)', // Orange - Agents
    'rgb(168, 85, 247)', // Purple - Music Kits
    'rgb(236, 72, 153)', // Pink - Pins
]

const labels = ['Weapons', 'Knives', 'Gloves', 'Agents', 'Music Kits', 'Pins']

const hasData = computed(() => {
    if (!props.data) return false
    const total =
        props.data.weapons +
        props.data.knives +
        props.data.gloves +
        props.data.agents +
        props.data.musicKits +
        props.data.pins
    return total > 0
})

const legendItems = computed(() => {
    if (!props.data) return []
    return [
        { label: 'Weapons', value: props.data.weapons },
        { label: 'Knives', value: props.data.knives },
        { label: 'Gloves', value: props.data.gloves },
        { label: 'Agents', value: props.data.agents },
        { label: 'Music Kits', value: props.data.musicKits },
        { label: 'Pins', value: props.data.pins },
    ]
})

const chartData = computed(() => {
    if (!props.data) {
        return {
            labels: [],
            datasets: [],
        }
    }

    return {
        labels,
        datasets: [
            {
                data: [
                    props.data.weapons,
                    props.data.knives,
                    props.data.gloves,
                    props.data.agents,
                    props.data.musicKits,
                    props.data.pins,
                ],
                backgroundColor: colors,
                borderColor: colors.map((c) => c.replace('rgb', 'rgba').replace(')', ', 0.8)')),
                borderWidth: 2,
                hoverOffset: 10,
            },
        ],
    }
})

const chartOptions = computed(() => ({
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
        legend: {
            display: false,
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
                label: (context: TooltipItem<'doughnut'>) => {
                    const value = typeof context.parsed === 'number' ? context.parsed : 0
                    const data = (context.dataset.data ?? []) as number[]
                    const total = data.reduce((a: number, b: number) => a + b, 0)
                    const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0'
                    return `${context.label}: ${value.toLocaleString()} (${percentage}%)`
                },
            },
        },
    },
    cutout: '60%',
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

.chart-wrapper
  width: 200px
  height: 200px

.legend-container
  min-width: 180px

.legend-item
  font-size: 0.875rem

.bg-primary-500
  background-color: var(--primary-color)

.border-primary-500
  border-color: var(--primary-color)
</style>
