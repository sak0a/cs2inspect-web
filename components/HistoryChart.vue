<template>
  <div class="history-chart">
    <h3 class="text-xl font-semibold text-white mb-4 capitalize">
      {{ displayName }}
    </h3>
    
    <div class="chart-container bg-gray-900 rounded-lg p-4 relative overflow-hidden">
      <!-- Canvas for drawing chart -->
      <canvas ref="canvasRef" class="w-full" :height="chartHeight" />
      
      <!-- No data message -->
      <div v-if="!hasData" class="absolute inset-0 flex items-center justify-center text-gray-500">
        No data available for this period
      </div>
    </div>

    <!-- Legend -->
    <div class="flex items-center justify-center space-x-6 mt-3 text-sm">
      <div class="flex items-center space-x-2">
        <div class="w-3 h-3 rounded-full bg-green-500" />
        <span class="text-gray-400">OK</span>
      </div>
      <div class="flex items-center space-x-2">
        <div class="w-3 h-3 rounded-full bg-yellow-500" />
        <span class="text-gray-400">Degraded</span>
      </div>
      <div class="flex items-center space-x-2">
        <div class="w-3 h-3 rounded-full bg-red-500" />
        <span class="text-gray-400">Failed</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick } from 'vue';

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

const canvasRef = ref<HTMLCanvasElement | null>(null);
const chartHeight = 200;

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

// Draw the chart
function drawChart() {
  if (!canvasRef.value || !hasData.value) return;

  const canvas = canvasRef.value;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // Set canvas dimensions
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width;
  canvas.height = chartHeight;

  const width = canvas.width;
  const height = canvas.height;
  const padding = { top: 20, right: 20, bottom: 40, left: 50 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  // Clear canvas
  ctx.clearRect(0, 0, width, height);

  const points = props.data.data_points;
  if (points.length === 0) return;

  // Find max latency for scaling
  const maxLatency = Math.max(...points.map(p => p.latency_ms || 0), 100);
  
  // Draw grid lines
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
  ctx.lineWidth = 1;
  
  for (let i = 0; i <= 4; i++) {
    const y = padding.top + (chartHeight / 4) * i;
    ctx.beginPath();
    ctx.moveTo(padding.left, y);
    ctx.lineTo(padding.left + chartWidth, y);
    ctx.stroke();
    
    // Draw y-axis labels
    const latencyValue = Math.round(maxLatency - (maxLatency / 4) * i);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.font = '12px monospace';
    ctx.textAlign = 'right';
    ctx.fillText(`${latencyValue}ms`, padding.left - 10, y + 4);
  }

  // Draw latency line
  if (points.length > 1) {
    ctx.beginPath();
    ctx.strokeStyle = 'rgba(59, 130, 246, 0.8)'; // Blue
    ctx.lineWidth = 2;

    points.forEach((point, index) => {
      const x = padding.left + (chartWidth / (points.length - 1)) * index;
      const latency = point.latency_ms || 0;
      const y = padding.top + chartHeight - (latency / maxLatency) * chartHeight;

      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });

    ctx.stroke();
  }

  // Draw status indicators
  points.forEach((point, index) => {
    const x = padding.left + (chartWidth / (points.length - 1)) * index;
    const latency = point.latency_ms || 0;
    const y = padding.top + chartHeight - (latency / maxLatency) * chartHeight;

    // Status color
    let color = 'rgb(34, 197, 94)'; // green
    if (point.status === 'degraded') color = 'rgb(234, 179, 8)'; // yellow
    if (point.status === 'fail') color = 'rgb(239, 68, 68)'; // red

    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, 4, 0, Math.PI * 2);
    ctx.fill();

    // Draw border
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 1;
    ctx.stroke();
  });

  // Draw x-axis labels (time)
  ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
  ctx.font = '12px sans-serif';
  ctx.textAlign = 'center';

  // Show first, middle, and last timestamps
  const indicesToShow = [0, Math.floor(points.length / 2), points.length - 1];
  
  indicesToShow.forEach(index => {
    if (index >= points.length) return;
    
    const point = points[index];
    const x = padding.left + (chartWidth / (points.length - 1)) * index;
    const y = height - padding.bottom + 20;
    
    const time = new Date(point.timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
    
    ctx.fillText(time, x, y);
  });
}

// Watch for data changes and redraw
watch(() => props.data, () => {
  nextTick(() => {
    drawChart();
  });
}, { deep: true });

// Initial draw
onMounted(() => {
  nextTick(() => {
    drawChart();
  });
  
  // Redraw on window resize
  window.addEventListener('resize', drawChart);
});
</script>

<style scoped>
.chart-container {
  min-height: 200px;
}
</style>
