<template>
  <div class="flex flex-col rounded-2xl bg-gray-900 border border-gray-800 p-6 gap-4">
    <!-- Header row -->
    <div class="flex items-center justify-between">
      <span class="text-sm font-medium text-gray-400">License #{{ license.id }}</span>
      <span
        :class="[
          'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold',
          license.status === 'active' ? 'bg-green-900/50 text-green-400 border border-green-700/40' :
          license.status === 'expired' ? 'bg-red-900/50 text-red-400 border border-red-700/40' :
          'bg-gray-800 text-gray-400 border border-gray-700',
        ]"
      >
        <span
          :class="[
            'w-1.5 h-1.5 rounded-full mr-1.5',
            license.status === 'active' ? 'bg-green-400' :
            license.status === 'expired' ? 'bg-red-400' :
            'bg-gray-500',
          ]"
        />
        {{ license.status.charAt(0).toUpperCase() + license.status.slice(1) }}
      </span>
    </div>

    <!-- License key -->
    <div>
      <div class="text-xs text-gray-500 uppercase tracking-wide mb-1">License Key</div>
      <div class="flex items-center gap-2">
        <code class="flex-1 font-mono text-sm text-blue-300 bg-gray-950 rounded-lg px-3 py-2 border border-gray-800 truncate">
          {{ license.licensekey }}
        </code>
        <button
          class="flex-shrink-0 p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
          title="Copy to clipboard"
          @click="copyKey"
        >
          <svg v-if="!copied" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          <svg v-else class="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </button>
      </div>
    </div>

    <!-- Server address -->
    <div>
      <div class="text-xs text-gray-500 uppercase tracking-wide mb-1">Server Address</div>
      <div class="text-sm">
        <span v-if="license.serveraddress" class="text-gray-200 font-mono">{{ license.serveraddress }}</span>
        <span v-else class="text-gray-600 italic">Not yet activated</span>
      </div>
    </div>

    <!-- Expiry -->
    <div>
      <div class="text-xs text-gray-500 uppercase tracking-wide mb-1">Expires</div>
      <div class="text-sm">
        <span class="text-gray-200">{{ formatDate(license.expiresat) }}</span>
        <span v-if="daysRemaining !== null" :class="['ml-2 text-xs font-medium', daysRemaining <= 7 ? 'text-red-400' : daysRemaining <= 30 ? 'text-yellow-400' : 'text-gray-500']">
          {{ daysRemaining > 0 ? `${daysRemaining} days remaining` : 'Expired' }}
        </span>
      </div>
    </div>

    <!-- Actions -->
    <div class="flex items-center gap-3 pt-1 mt-auto border-t border-gray-800">
      <button
        :disabled="rebindDisabled || rebinding"
        :title="rebindDisabledReason"
        class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-gray-700 text-gray-300 hover:text-white hover:border-gray-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        @click="rebindServer"
      >
        <svg v-if="rebinding" class="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        <svg v-else class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        Change Server
      </button>

      <NuxtLink
        :to="`/buy?license=${license.id}`"
        class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-blue-400 hover:text-blue-300 transition-colors"
      >
        <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
        Buy More Time
      </NuxtLink>
    </div>

    <p v-if="rebindError" class="text-red-400 text-xs -mt-2">{{ rebindError }}</p>
  </div>
</template>

<script setup lang="ts">
import type { License } from '~/server/database/schema/licenses'

const props = defineProps<{
  license: License
}>()

const emit = defineEmits<{
  rebound: []
}>()

const copied = ref(false)
const rebinding = ref(false)
const rebindError = ref<string | null>(null)

function formatDate(date: Date | string | null): string {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

const daysRemaining = computed(() => {
  if (!props.license.expiresat) return null
  const diff = new Date(props.license.expiresat).getTime() - Date.now()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
})

const rebindDisabled = computed(() => {
  if (!props.license.activatedat) return false
  const daysSinceActivation = (Date.now() - new Date(props.license.activatedat).getTime()) / (1000 * 60 * 60 * 24)
  return daysSinceActivation < 7
})

const rebindDisabledReason = computed(() => {
  if (!rebindDisabled.value) return undefined
  const activatedAt = new Date(props.license.activatedat!)
  const canRebindAt = new Date(activatedAt.getTime() + 7 * 24 * 60 * 60 * 1000)
  return `Server can be changed after ${formatDate(canRebindAt)}`
})

async function copyKey() {
  await navigator.clipboard.writeText(props.license.licensekey)
  copied.value = true
  setTimeout(() => { copied.value = false }, 2000)
}

async function rebindServer() {
  rebinding.value = true
  rebindError.value = null
  try {
    await $fetch(`/api/licenses/${props.license.id}.rebind`, { method: 'POST' })
    emit('rebound')
  }
  catch {
    rebindError.value = 'Failed to change server. Please try again.'
  }
  finally {
    rebinding.value = false
  }
}
</script>
