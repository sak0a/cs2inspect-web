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

const handleDurationUpdate = (val: number | undefined) => {
  durationHours.value = val == null || Number.isNaN(val) ? null : val
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
  <AppModal
    :visible="show"
    title="Ban User"
    max-width="500px"
    @update:visible="
      (val) => {
        if (!val) handleClose()
      }
    "
  >
    <div class="admin-modal-glass-marker hidden" aria-hidden="true" />
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
        <Textarea
          :model-value="reason"
          :rows="3"
          class="min-h-[78px]"
          placeholder="Enter the reason for banning this user..."
          :aria-invalid="reasonError ? true : undefined"
          @update:model-value="(val) => (reason = String(val))"
        />
        <p v-if="reasonError" class="text-red-400 text-sm mt-1">{{ reasonError }}</p>
      </div>

      <!-- Duration Input -->
      <div>
        <label class="block text-sm font-medium text-gray-300 mb-2"> Duration (hours) </label>
        <!-- Plain number input instead of NumberField: reka restores the last value
             when cleared, which would make "empty = permanent ban" unreachable -->
        <Input
          :model-value="durationHours ?? ''"
          type="number"
          min="1"
          placeholder="Leave empty for permanent ban"
          class="w-full"
          @update:model-value="
            (v) => handleDurationUpdate(v === '' || v == null ? undefined : Number(v))
          "
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
      <Button variant="secondary" @click="handleClose"> Cancel </Button>
      <Button variant="destructive" @click="handleConfirm"> Ban User </Button>
    </div>
  </AppModal>
</template>

<style lang="sass">
// Shared darker admin glass card (see AdminAddModal.vue) — duplicated rule is
// identical and harmless; kept local so each modal stays self-contained.
[data-slot='dialog-content']:has(.admin-modal-glass-marker)
  background-color: rgba(12, 12, 12, 0.7) !important
  border: 1px solid var(--admin-glass-border) !important
  backdrop-filter: var(--admin-glass-blur-strong) saturate(160%) !important
  -webkit-backdrop-filter: var(--admin-glass-blur-strong) saturate(160%) !important
</style>
