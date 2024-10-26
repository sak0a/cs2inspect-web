<template>
  <div class="countdown-timer">
    <div v-if="time.weeks > 0">{{ time.weeks }} weeks, </div>
    <div v-if="time.days > 0">{{ time.days }} days, </div>
    <div class="time">
      <span :class="animateClass">{{ time.hours.toString().padStart(2, '0') }}</span>:<span :class="animateClass">{{ time.minutes.toString().padStart(2, '0') }}</span>:<span :class="animateClass">{{ time.seconds.toString().padStart(2, '0') }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">

interface TimeLeft {
  weeks: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

// Props
const props = defineProps({
  targetDate: {
    type: Date,
    required: true
  },
  active: {
    type: Boolean,
    default: true
  },
  onFinish: {
    type: Function,
    default: null // Optional, function to be executed when countdown finishes
  }
})

// State for time left and animation class
const time = ref<TimeLeft>({
  weeks: 0,
  days: 0,
  hours: 0,
  minutes: 0,
  seconds: 0
})

const animateClass = ref('')

// Timer interval reference
let timerInterval: any = null

// Calculate the time difference
function calculateTimeLeft() {
  const now = new Date().getTime()
  const targetTime = new Date(props.targetDate).getTime()

  const difference = targetTime - now

  if (difference <= 0) {
    clearInterval(timerInterval)
    time.value = {
      weeks: 0,
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0
    }

    // Call the onFinish function if provided
    if (props.onFinish) {
      props.onFinish() // Execute the provided onFinish function
    }

    return
  }

  const weeks = Math.floor(difference / (1000 * 60 * 60 * 24 * 7))
  const days = Math.floor((difference % (1000 * 60 * 60 * 24 * 7)) / (1000 * 60 * 60 * 24))
  const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60))
  const seconds = Math.floor((difference % (1000 * 60)) / 1000)

  time.value = {
    weeks,
    days,
    hours,
    minutes,
    seconds
  }

  animateClass.value = 'animate' // Trigger animation class
}

// Start the countdown
function startCountdown() {
  if (!timerInterval) {
    timerInterval = setInterval(() => {
      calculateTimeLeft()
    }, 1000)
  }
}

// Stop the countdown
function stopCountdown() {
  clearInterval(timerInterval)
  timerInterval = null
}

// Watch the active prop to start/stop the countdown
watch(() => props.active, (newVal) => {
  if (newVal) {
    startCountdown()
  } else {
    stopCountdown()
  }
})

// Initialize the countdown
onMounted(() => {
  if (props.active) {
    startCountdown()
  }
})

onUnmounted(() => {
  stopCountdown()
})
</script>

<style scoped lang="sass">
.countdown-timer
  color: #fff
  display: flex
  align-items: center

.time
  display: flex

.time span
  display: inline-block
  transition: transform 0.3s ease-in-out, opacity 0.3s ease-in-out
  @apply px-2

.animate
  transform: scale(1.2)
  opacity: 0.7

.time span:not(.animate)
  transform: scale(1)
  opacity: 1
</style>