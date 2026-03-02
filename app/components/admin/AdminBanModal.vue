<script setup lang="ts">
interface Props {
  show: boolean
  steamId: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'update:show', value: boolean): void
  (e: 'confirm', payload: { reason: string; durationHours?: number }): void
  (e: 'cancel'): void
}>()

const reason = ref('')
const durationHours = ref<number | null>(null)
const reasonError = ref('')

const handleClose = () => {
  resetForm()
  emit('update:show', false)
  emit('cancel')
}

const resetForm = () => {
  reason.value = ''
  durationHours.value = null
  reasonError.value = ''
}

const handleConfirm = () => {
  // Validate reason
  if (!reason.value.trim()) {
    reasonError.value = 'Ban reason is required'
    return
  }

  if (reason.value.trim().length < 5) {
    reasonError.value = 'Ban reason must be at least 5 characters'
    return
  }

  reasonError.value = ''

  const payload: { reason: string; durationHours?: number } = {
    reason: reason.value.trim(),
  }

  if (durationHours.value && durationHours.value > 0) {
    payload.durationHours = durationHours.value
  }

  emit('confirm', payload)
  resetForm()
  emit('update:show', false)
}

// Reset form when modal opens
watch(
  () => props.show,
  (newValue) => {
    if (newValue) {
      resetForm()
    }
  }
)
</script>

<template>
  <NModal
    :show="show"
    preset="card"
    style="width: 500px"
    title="Ban User"
    :bordered="false"
    :auto-focus="false"
    :mask-closable="true"
    :closable="true"
    @update:show="
      (val) => {
        if (!val) handleClose()
      }
    "
  >
    <div class="space-y-4">
      <!-- User Info -->
      <div class="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
        <div class="flex items-center gap-3">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            class="text-red-400"
          >
            <circle cx="12" cy="12" r="10" />
            <path d="m4.9 4.9 14.2 14.2" />
          </svg>
          <div>
            <p class="text-sm text-gray-400">Banning user</p>
            <p class="font-mono text-white">{{ steamId }}</p>
          </div>
        </div>
      </div>

      <!-- Reason Input -->
      <div>
        <label class="block text-sm font-medium text-gray-300 mb-2">
          Ban Reason <span class="text-red-400">*</span>
        </label>
        <NInput
          v-model:value="reason"
          type="textarea"
          :rows="3"
          placeholder="Enter the reason for banning this user..."
          :status="reasonError ? 'error' : undefined"
        />
        <p v-if="reasonError" class="text-red-400 text-sm mt-1">{{ reasonError }}</p>
      </div>

      <!-- Duration Input -->
      <div>
        <label class="block text-sm font-medium text-gray-300 mb-2"> Duration (hours) </label>
        <NInputNumber
          v-model:value="durationHours"
          :min="1"
          placeholder="Leave empty for permanent ban"
          class="w-full"
        />
        <p class="text-gray-500 text-xs mt-1">
          Leave empty for a permanent ban. Enter hours for a temporary ban.
        </p>
      </div>

      <!-- Duration Preview -->
      <div v-if="durationHours && durationHours > 0" class="text-sm text-gray-400">
        Ban will expire in:
        <span class="text-white font-medium">
          {{ durationHours }} hour{{ durationHours > 1 ? 's' : '' }} ({{
            Math.floor(durationHours / 24)
          }}
          day{{ Math.floor(durationHours / 24) !== 1 ? 's' : '' }} {{ durationHours % 24 }} hour{{
            durationHours % 24 !== 1 ? 's' : ''
          }})
        </span>
      </div>
      <div v-else class="text-sm text-orange-400">This will be a permanent ban.</div>
    </div>

    <!-- Actions -->
    <div class="flex justify-end gap-3 mt-6">
      <NButton secondary type="default" @click="handleClose"> Cancel </NButton>
      <NButton secondary type="error" @click="handleConfirm"> Ban User </NButton>
    </div>
  </NModal>
</template>

<style scoped lang="sass">
:deep(.n-card)
  background: rgba(12, 12, 12, 0.7) !important
  border: 1px solid var(--admin-glass-border)
  backdrop-filter: var(--admin-glass-blur-strong) saturate(160%)
  -webkit-backdrop-filter: var(--admin-glass-blur-strong) saturate(160%)
</style>
