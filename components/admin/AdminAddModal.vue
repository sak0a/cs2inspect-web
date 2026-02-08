<script setup lang="ts">
import type { SelectOption } from 'naive-ui'

interface Props {
  show: boolean
}

const _props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'update:show', value: boolean): void
  (e: 'confirm', payload: { steamId: string; role: 'admin' | 'superadmin' }): void
  (e: 'cancel'): void
}>()

const steamId = ref('')
const role = ref<'admin' | 'superadmin'>('admin')
const errors = ref({
  steamId: ''
})

const roleOptions: SelectOption[] = [
  { label: 'Admin', value: 'admin' },
  { label: 'Super Admin', value: 'superadmin' }
]

const handleClose = () => {
  resetForm()
  emit('update:show', false)
  emit('cancel')
}

const resetForm = () => {
  steamId.value = ''
  role.value = 'admin'
  errors.value = { steamId: '' }
}

const validateSteamId = (value: string): boolean => {
  // Steam ID 64 format validation (17 digit number starting with 7656)
  const steamId64Regex = /^7656[0-9]{13}$/
  return steamId64Regex.test(value)
}

const handleConfirm = () => {
  // Reset errors
  errors.value = { steamId: '' }

  // Validate Steam ID
  const trimmedSteamId = steamId.value.trim()

  if (!trimmedSteamId) {
    errors.value.steamId = 'Steam ID is required'
    return
  }

  if (!validateSteamId(trimmedSteamId)) {
    errors.value.steamId = 'Invalid Steam ID format. Must be a 17-digit Steam ID64 starting with 7656'
    return
  }

  emit('confirm', {
    steamId: trimmedSteamId,
    role: role.value
  })

  resetForm()
  emit('update:show', false)
}

// Reset form when modal opens
watch(() => _props.show, (newValue) => {
  if (newValue) {
    resetForm()
  }
})
</script>

<template>
  <NModal
    :show="show"
    preset="card"
    style="width: 500px"
    title="Add New Admin"
    :bordered="false"
    :auto-focus="false"
    :mask-closable="true"
    :closable="true"
    @update:show="(val) => { if (!val) handleClose() }"
  >
    <div class="space-y-4">
      <!-- Info Banner -->
      <div class="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
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
            class="text-blue-400 flex-shrink-0"
          >
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
          <div>
            <h4 class="font-medium text-blue-400 mb-1">Adding Administrator</h4>
            <p class="text-sm text-gray-300">
              Grant admin privileges to a user. This action requires superadmin permissions.
            </p>
          </div>
        </div>
      </div>

      <!-- Steam ID Input -->
      <div>
        <label class="block text-sm font-medium text-gray-300 mb-2">
          Steam ID <span class="text-red-400">*</span>
        </label>
        <NInput
          v-model:value="steamId"
          placeholder="e.g., 76561198012345678"
          :status="errors.steamId ? 'error' : undefined"
        />
        <p v-if="errors.steamId" class="text-red-400 text-sm mt-1">{{ errors.steamId }}</p>
        <p v-else class="text-gray-500 text-xs mt-1">
          Enter the Steam ID64 of the user to grant admin access.
        </p>
      </div>

      <!-- Role Selection -->
      <div>
        <label class="block text-sm font-medium text-gray-300 mb-2">
          Role <span class="text-red-400">*</span>
        </label>
        <NSelect
          v-model:value="role"
          :options="roleOptions"
          placeholder="Select role"
        />
        <div class="mt-2 space-y-2">
          <div class="text-xs text-gray-400">
            <span class="font-medium text-gray-300">Admin:</span>
            Can view stats, manage users, and modify settings.
          </div>
          <div class="text-xs text-gray-400">
            <span class="font-medium text-orange-400">Super Admin:</span>
            Full access including adding/removing other admins.
          </div>
        </div>
      </div>

      <!-- Warning for superadmin -->
      <div v-if="role === 'superadmin'" class="bg-orange-500/10 border border-orange-500/30 rounded-lg p-3">
        <div class="flex items-center gap-2">
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
            class="text-orange-400"
          >
            <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3" />
            <path d="M12 9v4" />
            <path d="M12 17h.01" />
          </svg>
          <p class="text-sm text-orange-400">
            Super admins have unrestricted access. Grant this role carefully.
          </p>
        </div>
      </div>
    </div>

    <!-- Actions -->
    <div class="flex justify-end gap-3 mt-6">
      <NButton
        secondary
        type="default"
        @click="handleClose"
      >
        Cancel
      </NButton>
      <NButton
        secondary
        type="primary"
        @click="handleConfirm"
      >
        Add Admin
      </NButton>
    </div>
  </NModal>
</template>

<style scoped lang="sass">
:deep(.n-card)
  background: var(--glass-bg-secondary) !important
  border: 1px solid var(--glass-border)
  backdrop-filter: var(--glass-blur-medium) saturate(160%)
</style>
