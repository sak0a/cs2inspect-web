<template>
  <div class="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-900/60 to-blue-700/40 border border-blue-600/40 p-6 md:p-8">
    <!-- Background glow -->
    <div class="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-transparent pointer-events-none" />

    <div class="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div>
        <div class="flex items-center gap-2 mb-2">
          <svg class="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span class="text-blue-300 text-sm font-semibold uppercase tracking-wide">Free Trial Available</span>
        </div>
        <h3 class="text-xl font-bold text-white mb-1">Your 3-day trial is ready</h3>
        <p class="text-gray-300 text-sm max-w-lg">
          Activate your trial to get a license key and start testing the plugin on your server. No payment required.
        </p>
      </div>

      <div class="flex items-center gap-3 flex-shrink-0">
        <NuxtLink
          to="/setup"
          class="text-sm text-blue-300 hover:text-blue-200 transition-colors whitespace-nowrap"
        >
          View Setup Guide
        </NuxtLink>
        <button
          :disabled="loading"
          class="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-semibold transition-colors whitespace-nowrap"
          @click="startTrial"
        >
          <svg v-if="loading" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          {{ loading ? 'Activating…' : 'Start Trial' }}
        </button>
      </div>
    </div>

    <p v-if="error" class="relative mt-3 text-red-400 text-sm">{{ error }}</p>
  </div>
</template>

<script setup lang="ts">
const emit = defineEmits<{
  started: []
}>()

const loading = ref(false)
const error = ref<string | null>(null)

async function startTrial() {
  loading.value = true
  error.value = null
  try {
    await $fetch('/api/licenses/trial', { method: 'POST' })
    emit('started')
  }
  catch (err: unknown) {
    const fetchError = err as { statusCode?: number; statusMessage?: string }
    if (fetchError?.statusCode === 409) {
      error.value = 'Trial has already been used on this account.'
    }
    else {
      error.value = 'Failed to activate trial. Please try again.'
    }
  }
  finally {
    loading.value = false
  }
}
</script>
