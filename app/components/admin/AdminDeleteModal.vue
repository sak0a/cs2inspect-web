<script setup lang="ts">
interface Props {
  show: boolean
  steamId: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'update:show', value: boolean): void
  (e: 'confirm' | 'cancel'): void
}>()

const confirmInput = ref('')

const isConfirmed = computed(() => {
  return confirmInput.value === props.steamId
})

const handleClose = () => {
  confirmInput.value = ''
  emit('update:show', false)
  emit('cancel')
}

const handleConfirm = () => {
  if (!isConfirmed.value) return

  emit('confirm')
  confirmInput.value = ''
  emit('update:show', false)
}

// Reset input when modal opens/closes
watch(
  () => props.show,
  (newValue) => {
    if (!newValue) {
      confirmInput.value = ''
    }
  }
)
</script>

<template>
  <AppModal
    :visible="show"
    title="Delete User Data"
    max-width="500px"
    @update:visible="
      (val) => {
        if (!val) handleClose()
      }
    "
  >
    <div class="admin-modal-glass-marker hidden" aria-hidden="true" />
    <div class="space-y-4">
      <!-- Warning Banner -->
      <div class="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
        <div class="flex gap-3">
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
            class="text-red-400 shrink-0 mt-0.5"
          >
            <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3" />
            <path d="M12 9v4" />
            <path d="M12 17h.01" />
          </svg>
          <div>
            <h4 class="font-medium text-red-400 mb-1">Permanent Deletion Warning</h4>
            <p class="text-sm text-gray-300">
              This action will permanently delete all data associated with user
              <span class="font-mono font-medium text-white">{{ steamId }}</span
              >.
            </p>
          </div>
        </div>
      </div>

      <!-- What Will Be Deleted -->
      <div class="bg-gray-800/50 rounded-lg p-4">
        <h4 class="text-sm font-medium text-gray-300 mb-2">The following data will be deleted:</h4>
        <ul class="text-sm text-gray-400 space-y-1 list-disc list-inside">
          <li>All loadouts and configurations</li>
          <li>All saved weapons, knives, and gloves</li>
          <li>All agents, music kits, and pins</li>
          <li>User preferences and settings</li>
          <li>Activity history and logs</li>
        </ul>
      </div>

      <!-- Confirmation Input -->
      <div>
        <label class="block text-sm font-medium text-gray-300 mb-2">
          Type the Steam ID to confirm deletion:
        </label>
        <Input
          :model-value="confirmInput"
          placeholder="Enter Steam ID..."
          :aria-invalid="confirmInput && !isConfirmed ? true : undefined"
          @update:model-value="(val) => (confirmInput = String(val))"
        />
        <div class="flex items-center gap-2 mt-2">
          <code class="text-xs bg-gray-800 px-2 py-1 rounded-sm text-gray-400">{{ steamId }}</code>
          <span v-if="isConfirmed" class="text-green-400 text-sm flex items-center gap-1">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <path d="m9 11 3 3L22 4" />
            </svg>
            Confirmed
          </span>
        </div>
      </div>

      <!-- This action cannot be undone -->
      <p class="text-center text-sm text-red-400 font-medium">This action cannot be undone.</p>
    </div>

    <!-- Actions -->
    <div class="flex justify-end gap-3 mt-6">
      <Button variant="light" rounded="md" @click="handleClose"> Cancel </Button>
      <Button
        variant="light"
        intent="error"
        rounded="md"
        :disabled="!isConfirmed"
        @click="handleConfirm"
      >
        Delete All Data
      </Button>
    </div>
  </AppModal>
</template>

<style lang="sass">
// Shared darker admin glass card (see AdminAddModal.vue).
[data-slot='dialog-content']:has(.admin-modal-glass-marker)
  background-color: rgba(12, 12, 12, 0.7) !important
  border: 1px solid var(--admin-glass-border) !important
  backdrop-filter: var(--admin-glass-blur-strong) saturate(160%) !important
  -webkit-backdrop-filter: var(--admin-glass-blur-strong) saturate(160%) !important
</style>
