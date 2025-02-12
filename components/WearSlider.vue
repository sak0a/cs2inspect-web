<!-- WearSlider.vue -->
<template>
  <div class="wear-control-container">
    <!-- Custom Number Input -->
    <div class="custom-number-input">
      <input
          type="text"
          :value="displayValue"
          @input="handleCustomInput"
          @blur="handleBlur"
          @keydown.enter="handleBlur"
      />
    </div>


    <div class="progress-container">
      <div class="progress-bar" ref="progressBar"
           @mouseenter="showTooltip"
           @mouseleave="startHideTooltip">
        <!-- Full gradient background -->
        <div class="progress-background"></div>

        <!-- Min-max range indicator -->
        <div class="valid-range"
             :style="{
               left: `${(props.min * 100)}%`,
               width: `${((props.max - props.min) * 100)}%`
             }">
        </div>

        <!-- Slider handle and tooltip -->
        <div
            class="slider-handle"
            :style="{ left: `${handlePosition}%` }"
            @mousedown="startDragging"
        >
          <div class="tooltip" :class="{ visible: isTooltipVisible }">
            {{ displayValue }} - {{ getCurrentWearLabel() }}
          </div>
        </div>

        <!-- Wear labels -->
        <div class="wear-labels">
          <div v-for="(label, value) in WEARS"
               :key="value"
               class="wear-label"
               :style="{ left: `${value * 100}%` }">
            <div class="wear-marker"></div>
          </div>
        </div>
      </div>
    </div>


  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import {EnhancedWeaponResponse} from "~/server/api/weapons/[type].js";

const WEARS = {
  0.00: 'Factory New',
  0.07: 'Minimal Wear',
  0.15: 'Field-Tested',
  0.38: 'Well-Worn',
  0.45: 'Battle-Scarred'
}

const emit = defineEmits<{
  (e: 'update:modelValue', value: number): void
}>()

const props = defineProps({
  modelValue: {
    type: Number,
    default: 0.01
  },
  min: {
    type: Number,
    default: 0.00
  },
  max: {
    type: Number,
    default: 1.00
  }
})

const progressBar = ref(null)
const isDragging = ref(false)
const localValue = ref(clampValue(props.modelValue))
const isTooltipVisible = ref(false)
const tooltipTimeout = ref(null)

// Format number to 3 decimal places for display
const displayValue = computed(() => {
  return localValue.value.toFixed(3)
})

// Computed for handle position as percentage
const handlePosition = computed(() => {
  return localValue.value * 100
})

function showTooltip() {
  if (tooltipTimeout.value) {
    clearTimeout(tooltipTimeout.value)
    tooltipTimeout.value = null
  }
  isTooltipVisible.value = true
}

function startHideTooltip() {
  if (!isDragging.value) {
    tooltipTimeout.value = setTimeout(() => {
      isTooltipVisible.value = false
    }, 300)
  }
}

function clampValue(val) {
  const numVal = Number(val)
  if (isNaN(numVal)) return props.min
  return Math.min(Math.max(numVal, props.min), props.max)
}

function handleCustomInput(event) {
  let value = event.target.value
  // Allow only numbers, single decimal point, and minus sign
  if (!/^-?\d*\.?\d*$/.test(value)) {
    event.target.value = displayValue.value
    return
  }
}

function handleBlur(event) {
  const newValue = parseFloat(event.target.value)
  if (!isNaN(newValue)) {
    localValue.value = clampValue(newValue)
    emit('update:modelValue', localValue.value)
  }
  event.target.value = displayValue.value
}

function getCurrentWearLabel() {
  const wearValues = Object.keys(WEARS).map(Number)
  for (let i = wearValues.length - 1; i >= 0; i--) {
    if (localValue.value >= wearValues[i]) {
      return WEARS[wearValues[i]]
    }
  }
  return WEARS[0]
}

function startDragging(event) {
  isDragging.value = true
  showTooltip()
  event.preventDefault()
}

function stopDragging() {
  isDragging.value = false
  startHideTooltip()
}

function onDrag(event: MouseEvent) {
  if (!isDragging.value || !progressBar.value) return

  const rect = progressBar.value.getBoundingClientRect()
  let percentage = (event.clientX - rect.left) / rect.width


  const newValue = Math.round(percentage * 1000) / 1000
  localValue.value = clampValue(newValue)

  // Ensure we emit the update
  emit('update:modelValue', newValue)
}


// Watch for external value changes
watch(() => props.modelValue, (newValue) => {
  if (newValue !== localValue.value) {
    localValue.value = clampValue(newValue)
  }
}, { immediate: true })

// Watch for min/max changes
watch([() => props.min, () => props.max], () => {
  localValue.value = clampValue(localValue.value)
})

onMounted(() => {
  document.addEventListener('mousemove', onDrag)
  document.addEventListener('mouseup', stopDragging)
})

onBeforeUnmount(() => {
  document.removeEventListener('mousemove', onDrag)
  document.removeEventListener('mouseup', stopDragging)
  if (tooltipTimeout.value) {
    clearTimeout(tooltipTimeout.value)
  }
})
</script>

<style scoped>
.wear-control-container {
  display: flex;
  align-items: center;
  gap: 16px;
}

.progress-container {
  flex: 1;
  padding: 20px;
}

.progress-bar {
  position: relative;
  height: 8px;
  border-radius: 4px;
  cursor: pointer;
  overflow: visible;
}

.progress-background {
  position: absolute;
  width: 100%;
  height: 100%;
  background: linear-gradient(
      to right,
      #4CAF50 0%,    /* Green - Factory New */
      #4CAF50 7%,    /* Green - Factory New End */
      #8BC34A 7%,    /* Light Green - Minimal Wear Start */
      #8BC34A 15%,   /* Light Green - Minimal Wear End */
      #FFEB3B 15%,   /* Yellow - Field Tested Start */
      #FFEB3B 38%,   /* Yellow - Field Tested End */
      #FF9800 38%,   /* Orange - Well Worn Start */
      #FF9800 45%,   /* Orange - Well Worn End */
      #F44336 45%    /* Red - Battle Scarred */
  );
  border-radius: 4px;
}

.valid-range {
  position: absolute;
  height: 100%;
  background: rgba(255, 255, 255, 0.15);
  border-radius: 4px;
  pointer-events: none;
}

.slider-handle {
  position: absolute;
  top: 50%;
  width: 20px;
  height: 20px;
  background: white;
  border-radius: 50%;
  transform: translate(-50%, -50%);
  cursor: grab;
  z-index: 2;
}

.slider-handle:active {
  cursor: grabbing;
}

.tooltip {
  position: absolute;
  top: -35px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(70, 70, 70, 0.9);
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 14px;
  white-space: nowrap;
  min-width: max-content;
  opacity: 0;
  visibility: hidden;
  transition: opacity 0.2s, visibility 0.2s;
}

.tooltip.visible {
  opacity: 1;
  visibility: visible;
}

.tooltip:after {
  content: '';
  position: absolute;
  bottom: -5px;
  left: 50%;
  transform: translateX(-50%);
  border-left: 5px solid transparent;
  border-right: 5px solid transparent;
  border-top: 5px solid rgba(70, 70, 70, 0.9);
}

.wear-labels {
  position: absolute;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.wear-label {
  position: absolute;
  transform: translateX(-50%);
}

.wear-marker {
  width: 2px;
  height: 16px;
  position: absolute;
  top: -4px;
}

.custom-number-input {
  position: relative;
}

.custom-number-input input {
  width: 80px;
  caret-color: #80E6C4;
  padding: 5px 8px;
  border: 1px solid transparent;
  border-radius: 4px;
  font-size: 14px;
  text-align: center;
  background: #313131;
  color: white;
  transition: all 0.15s ease-in-out;
}

.custom-number-input input:hover {
  border-color: #80E6C4;
}

.custom-number-input input:focus {
  outline: none;
  background: #232E2A;
  border-color: #80E6C4;
}
</style>