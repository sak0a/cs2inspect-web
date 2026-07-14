<template>
  <div class="admin-heatmap-chart">
    <div class="flex justify-between items-center gap-4 mb-4">
      <h3 class="text-lg font-semibold text-white">Daily Activity</h3>
      <div class="flex items-center gap-2 text-xs text-gray-400">
        <span>Less</span>
        <div class="flex gap-1">
          <div
            v-for="level in colorLevels"
            :key="level"
            class="w-3 h-3 rounded-xs"
            :style="{ backgroundColor: getColorForLevel(level) }"
          />
        </div>
        <span>More</span>
      </div>
    </div>

    <div class="chart-container glass-container p-4 relative overflow-x-auto">
      <!-- Loading state -->
      <div v-if="loading" class="flex items-center justify-center min-h-[150px]">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500" />
      </div>

      <!-- Heatmap grid -->
      <div v-else-if="hasData" class="heatmap-wrapper">
        <!-- Month labels -->
        <div class="month-labels flex mb-2 pl-8">
          <div
            v-for="month in monthLabels"
            :key="month.label"
            class="month-label text-xs text-gray-400"
            :style="{ width: month.width + 'px', marginLeft: month.offset + 'px' }"
          >
            {{ month.label }}
          </div>
        </div>

        <!-- Grid with day labels -->
        <div class="flex">
          <!-- Day of week labels -->
          <div
            class="day-labels flex flex-col justify-around pr-2 text-xs text-gray-400"
            style="height: 98px"
          >
            <span>Mon</span>
            <span>Wed</span>
            <span>Fri</span>
          </div>

          <!-- Heatmap cells -->
          <div class="heatmap-grid">
            <div
              v-for="(week, weekIndex) in weeks"
              :key="weekIndex"
              class="week-column flex flex-col gap-1"
            >
              <div
                v-for="(day, dayIndex) in week"
                :key="dayIndex"
                class="heatmap-cell w-3 h-3 rounded-xs cursor-pointer transition-transform hover:scale-125"
                :style="{
                  backgroundColor: day ? getCellColor(day.value) : 'transparent',
                }"
                :title="day ? `${day.date}: ${day.value} activities` : ''"
                @mouseenter="showTooltip($event, day)"
                @mouseleave="hideTooltip"
              />
            </div>
          </div>
        </div>

        <!-- Tooltip -->
        <div
          v-if="tooltip.visible"
          class="heatmap-tooltip fixed z-50 px-3 py-2 rounded-lg text-sm pointer-events-none"
          :style="{ top: tooltip.y + 'px', left: tooltip.x + 'px' }"
        >
          <div class="font-medium">{{ tooltip.date }}</div>
          <div class="text-gray-300">{{ tooltip.value }} activities</div>
        </div>
      </div>

      <!-- No data message -->
      <div v-else class="flex items-center justify-center min-h-[150px] text-gray-400">
        No activity data available
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface HeatmapDataPoint {
  date: string
  value: number
}

interface Props {
  data: HeatmapDataPoint[]
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
})

const colorLevels = [0, 1, 2, 3, 4]

const tooltip = ref({
  visible: false,
  x: 0,
  y: 0,
  date: '',
  value: 0,
})

const hasData = computed(() => {
  return props.data && props.data.length > 0
})

// Create a map for quick lookup
const dataMap = computed(() => {
  const map = new Map<string, number>()
  if (props.data) {
    props.data.forEach((d) => {
      map.set(d.date, d.value)
    })
  }
  return map
})

// Calculate max value for color scaling
const maxValue = computed(() => {
  if (!props.data || props.data.length === 0) return 1
  return Math.max(...props.data.map((d) => d.value), 1)
})

// Generate weeks array (GitHub-style: columns are weeks, rows are days)
const weeks = computed(() => {
  if (!hasData.value) return []

  // Get date range from data
  const dates = props.data.map((d) => new Date(d.date)).sort((a, b) => a.getTime() - b.getTime())
  const startDate = dates[0]
  const endDate = dates[dates.length - 1]

  // Safety check: if no valid dates, return empty
  if (!startDate || !endDate) return []

  // Adjust start to previous Sunday
  const adjustedStart = new Date(startDate)
  adjustedStart.setDate(adjustedStart.getDate() - adjustedStart.getDay())

  // Adjust end to next Saturday
  const adjustedEnd = new Date(endDate)
  adjustedEnd.setDate(adjustedEnd.getDate() + (6 - adjustedEnd.getDay()))

  const weeksArray: (HeatmapDataPoint | null)[][] = []
  const currentDate = new Date(adjustedStart)

  while (currentDate <= adjustedEnd) {
    const week: (HeatmapDataPoint | null)[] = []

    for (let i = 0; i < 7; i++) {
      const dateStr = currentDate.toISOString().split('T')[0] ?? ''
      const value = dataMap.value.get(dateStr)

      if (currentDate >= startDate && currentDate <= endDate) {
        week.push({
          date: dateStr,
          value: value || 0,
        })
      } else {
        week.push(null)
      }

      currentDate.setDate(currentDate.getDate() + 1)
    }

    weeksArray.push(week)
  }

  return weeksArray
})

// Generate month labels
const monthLabels = computed(() => {
  if (weeks.value.length === 0) return []

  const labels: { label: string; width: number; offset: number }[] = []
  let currentMonth = -1
  let weekCount = 0
  let startWeek = 0

  weeks.value.forEach((week, index) => {
    const firstValidDay = week.find((d) => d !== null)
    if (firstValidDay) {
      const month = new Date(firstValidDay.date).getMonth()
      if (month !== currentMonth) {
        if (currentMonth !== -1) {
          labels.push({
            label: new Date(2024, currentMonth).toLocaleDateString('en-US', {
              month: 'short',
            }),
            width: weekCount * 16,
            offset: startWeek === 0 ? 0 : 0,
          })
        }
        currentMonth = month
        weekCount = 1
        startWeek = index
      } else {
        weekCount++
      }
    }
  })

  // Add last month
  if (currentMonth !== -1) {
    labels.push({
      label: new Date(2024, currentMonth).toLocaleDateString('en-US', { month: 'short' }),
      width: weekCount * 16,
      offset: 0,
    })
  }

  return labels
})

const getColorForLevel = (level: number): string => {
  const colors = [
    'rgba(255, 255, 255, 0.05)',
    'rgba(var(--admin-accent-rgb), 0.3)',
    'rgba(var(--admin-accent-rgb), 0.5)',
    'rgba(var(--admin-accent-rgb), 0.7)',
    'rgba(var(--admin-accent-rgb), 0.9)',
  ] as const
  return colors[level] ?? colors[0]
}

const getCellColor = (value: number): string => {
  if (value === 0) return 'rgba(255, 255, 255, 0.05)'

  const ratio = value / maxValue.value

  if (ratio <= 0.25) return 'rgba(var(--admin-accent-rgb), 0.3)'
  if (ratio <= 0.5) return 'rgba(var(--admin-accent-rgb), 0.5)'
  if (ratio <= 0.75) return 'rgba(var(--admin-accent-rgb), 0.7)'
  return 'rgba(var(--admin-accent-rgb), 0.9)'
}

const showTooltip = (event: MouseEvent, day: HeatmapDataPoint | null) => {
  if (!day) return

  const rect = (event.target as HTMLElement).getBoundingClientRect()
  tooltip.value = {
    visible: true,
    x: rect.left + rect.width / 2,
    y: rect.top - 60,
    date: new Date(day.date).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }),
    value: day.value,
  }
}

const hideTooltip = () => {
  tooltip.value.visible = false
}
</script>

<style scoped lang="sass">
.glass-container
  backdrop-filter: var(--glass-blur-light) var(--glass-saturation)
  -webkit-backdrop-filter: var(--glass-blur-light) var(--glass-saturation)
  background: var(--admin-glass-bg, rgba(0, 0, 0, 0.45))
  border: 1px solid var(--glass-border, rgba(255, 255, 255, 0.08))
  border-radius: 12px

.chart-container
  min-height: 150px

.heatmap-grid
  display: flex
  gap: 4px

.heatmap-tooltip
  background: rgba(0, 0, 0, 0.9)
  border: 1px solid rgba(255, 255, 255, 0.1)
  transform: translateX(-50%)

.bg-primary-500
  background-color: var(--primary-color)

.border-primary-500
  border-color: var(--primary-color)

.day-labels
  width: 24px
  font-size: 10px
</style>
