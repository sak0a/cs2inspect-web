<template>
  <button
    :class="[
      'relative flex flex-col rounded-2xl p-6 border transition-all text-left w-full',
      selected || popular
        ? 'bg-blue-950/30 border-blue-500/60 shadow-lg shadow-blue-500/10'
        : 'bg-gray-900 border-gray-800 hover:border-gray-600',
    ]"
    @click="emit('select')"
  >
    <!-- Popular badge -->
    <div
      v-if="popular"
      class="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap bg-blue-500 text-white"
    >
      Popular
    </div>

    <!-- Selected indicator -->
    <div
      v-if="selected"
      class="absolute top-4 right-4 w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center"
    >
      <svg class="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
        <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
      </svg>
    </div>

    <div class="mb-4">
      <h3 class="text-base font-semibold text-gray-200 mb-3">{{ label }}</h3>
      <div class="flex items-baseline gap-1">
        <span class="text-3xl font-bold text-white">€{{ (price / 100).toFixed(0) }}</span>
      </div>
      <div class="text-sm text-gray-400 mt-1">{{ perMonth }}/mo equivalent</div>
      <div v-if="savings" class="mt-1.5 text-xs font-medium text-green-400">{{ savings }}</div>
    </div>
  </button>
</template>

<script setup lang="ts">
defineProps<{
  plan: string
  price: number
  label: string
  perMonth: string
  savings?: string
  popular?: boolean
  selected?: boolean
}>()

const emit = defineEmits<{
  select: []
}>()
</script>
