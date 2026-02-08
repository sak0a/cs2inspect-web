<script setup lang="ts">
import { LucideSettings as SettingsIcon } from 'lucide-vue-next'
import { useAdminStore } from '~/stores/adminStore'
import type { AdminSetting } from '~/types'

definePageMeta({
  middleware: 'admin',
  layout: 'admin'
})

const adminStore = useAdminStore()
const message = useMessage()

// Local state
const isLoading = ref(true)
const isSaving = ref(false)

// Computed
const settings = computed(() => adminStore.settings)

// Fetch settings on mount
onMounted(async () => {
  try {
    await adminStore.fetchSettings()
  } catch (error) {
    message.error('Failed to load settings')
    console.error('Error loading settings:', error)
  } finally {
    isLoading.value = false
  }
})

// Handle setting update
async function handleSaveSetting(payload: { key: string; value: string | number | boolean }) {
  isSaving.value = true
  try {
    await adminStore.updateSetting(payload.key, payload.value)
    message.success(`Setting "${payload.key}" updated successfully`)
  } catch (error) {
    message.error(`Failed to update setting "${payload.key}"`)
    console.error('Error updating setting:', error)
  } finally {
    isSaving.value = false
  }
}

// Refresh settings
async function handleRefresh() {
  isLoading.value = true
  try {
    await adminStore.fetchSettings(true)
    message.success('Settings refreshed')
  } catch (error) {
    message.error('Failed to refresh settings')
    console.error('Error refreshing settings:', error)
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="settings-page">
      <!-- Header -->
      <div class="page-header">
        <div class="flex items-center gap-3">
          <div class="icon-container">
            <NIcon :component="SettingsIcon" :size="24" />
          </div>
          <div>
            <h2 class="text-xl font-bold text-white">Application Settings</h2>
            <p class="text-sm text-gray-400">Manage application configuration and preferences</p>
          </div>
        </div>
        <NButton
          secondary
          type="primary"
          :loading="isLoading"
          @click="handleRefresh"
        >
          Refresh
        </NButton>
      </div>

      <!-- Loading State -->
      <div v-if="isLoading" class="loading-container">
        <NSpin size="large" />
        <p class="text-gray-400 mt-4">Loading settings...</p>
      </div>

      <!-- Settings List -->
      <div v-else-if="settings.length > 0" class="settings-list">
        <AdminSettingItem
          v-for="setting in settings"
          :key="setting.key"
          :setting="setting"
          @save="handleSaveSetting"
        />
      </div>

      <!-- Empty State -->
      <div v-else class="empty-state">
        <NIcon :component="SettingsIcon" :size="48" class="text-gray-600 mb-4" />
        <h3 class="text-lg font-semibold text-gray-400">No Settings Found</h3>
        <p class="text-sm text-gray-500 mt-2">
          There are no application settings configured yet.
        </p>
      </div>

      <!-- Saving Overlay -->
      <div v-if="isSaving" class="saving-overlay">
        <NSpin size="medium" />
        <span class="ml-3 text-gray-300">Saving...</span>
      </div>
  </div>
</template>

<style scoped lang="sass">
.settings-page
  display: flex
  flex-direction: column
  gap: 24px

.page-header
  display: flex
  justify-content: space-between
  align-items: center
  padding: 20px 24px
  background: rgba(255, 255, 255, 0.05)
  backdrop-filter: blur(12px)
  border: 1px solid rgba(255, 255, 255, 0.1)
  border-radius: 16px

.icon-container
  display: flex
  align-items: center
  justify-content: center
  width: 48px
  height: 48px
  background: linear-gradient(135deg, rgba(var(--admin-accent-rgb), 0.2), rgba(var(--admin-accent-rgb), 0.1))
  border-radius: 12px
  color: var(--admin-accent)

.loading-container
  display: flex
  flex-direction: column
  align-items: center
  justify-content: center
  padding: 64px 24px
  background: rgba(255, 255, 255, 0.05)
  backdrop-filter: blur(12px)
  border: 1px solid rgba(255, 255, 255, 0.1)
  border-radius: 16px

.settings-list
  display: flex
  flex-direction: column
  gap: 12px

.empty-state
  display: flex
  flex-direction: column
  align-items: center
  justify-content: center
  padding: 64px 24px
  background: rgba(255, 255, 255, 0.05)
  backdrop-filter: blur(12px)
  border: 1px solid rgba(255, 255, 255, 0.1)
  border-radius: 16px
  text-align: center

.saving-overlay
  position: fixed
  bottom: 24px
  right: 24px
  display: flex
  align-items: center
  padding: 12px 20px
  background: rgba(15, 15, 15, 0.95)
  backdrop-filter: blur(12px)
  border: 1px solid rgba(255, 255, 255, 0.1)
  border-radius: 12px
  z-index: 100
</style>
