<script setup lang="ts">
import { buttonColor } from '~/lib/buttonColors'
import {
  LucideSettings as SettingsIcon,
  LucideShield as GeneralIcon,
  LucideToggleLeft as FeaturesIcon,
  LucideBookOpen as TutorialsIcon,
  LucideGauge as LimitsIcon,
  LucideBox as OtherIcon,
} from 'lucide-vue-next'
import { useAdminStore } from '~/stores/adminStore'
import { APP_SETTING_CATEGORIES } from '~/utils/settingsCategories'
import type { AppSettingCategory } from '~/utils/settingsCategories'

definePageMeta({
  middleware: 'admin',
  layout: 'admin',
})

const adminStore = useAdminStore()
const message = useMessage()

const isLoading = ref(true)
const isSaving = ref(false)
const activeTab = ref<AppSettingCategory | 'other'>('general')

const categoryIcons: Record<string, typeof SettingsIcon> = {
  general: GeneralIcon,
  features: FeaturesIcon,
  tutorials: TutorialsIcon,
  limits: LimitsIcon,
  other: OtherIcon,
}

const settingsByCategory = computed(() => adminStore.settingsByCategory)

const tabs = computed(() => {
  const result: Array<{
    key: string
    label: string
    description: string
    icon: typeof SettingsIcon
  }> = []

  for (const cat of APP_SETTING_CATEGORIES) {
    if (settingsByCategory.value[cat.key]?.length) {
      result.push({
        key: cat.key,
        label: cat.label,
        description: cat.description,
        icon: categoryIcons[cat.key] || OtherIcon,
      })
    }
  }

  if (settingsByCategory.value['other']?.length) {
    result.push({
      key: 'other',
      label: 'Other',
      description: 'Uncategorized settings',
      icon: OtherIcon,
    })
  }

  return result
})

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
      <SButton
        variant="light"
        :color="buttonColor.primary"
        :loading="isLoading"
        @click="handleRefresh"
      >
        Refresh
      </SButton>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="loading-container">
      <NSpin size="large" />
      <p class="text-gray-400 mt-4">Loading settings...</p>
    </div>

    <!-- Settings Tabs -->
    <div v-else-if="tabs.length > 0" class="settings-container">
      <NTabs
        :value="activeTab"
        type="line"
        animated
        @update:value="(val: string) => (activeTab = val as AppSettingCategory | 'other')"
      >
        <NTabPane v-for="tab in tabs" :key="tab.key" :name="tab.key" :tab="tab.label">
          <template #tab>
            <div class="flex items-center gap-2">
              <NIcon :component="tab.icon" :size="16" />
              <span>{{ tab.label }}</span>
              <span v-if="settingsByCategory[tab.key]?.length" class="text-xs text-gray-500">
                ({{ settingsByCategory[tab.key]?.length }})
              </span>
            </div>
          </template>

          <p class="text-sm text-gray-500 mb-4">{{ tab.description }}</p>

          <div v-if="settingsByCategory[tab.key]?.length" class="settings-list">
            <AdminSettingItem
              v-for="setting in settingsByCategory[tab.key]"
              :key="setting.key"
              :setting="setting"
              @save="handleSaveSetting"
            />
          </div>

          <div v-else class="empty-tab">
            <p class="text-gray-500 text-sm">No settings in this category.</p>
          </div>
        </NTabPane>
      </NTabs>
    </div>

    <!-- Empty State -->
    <div v-else class="empty-state">
      <NIcon :component="SettingsIcon" :size="48" class="text-gray-600 mb-4" />
      <h3 class="text-lg font-semibold text-gray-400">No Settings Found</h3>
      <p class="text-sm text-gray-500 mt-2">There are no application settings configured yet.</p>
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
  background: var(--admin-glass-bg)
  backdrop-filter: var(--admin-glass-blur)
  -webkit-backdrop-filter: var(--admin-glass-blur)
  border: 1px solid var(--admin-glass-border)
  border-radius: 16px
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.15), var(--admin-glass-inset)

  @media (max-width: 640px)
    flex-direction: column
    gap: 16px
    align-items: stretch

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
  background: var(--admin-glass-bg)
  backdrop-filter: var(--admin-glass-blur)
  -webkit-backdrop-filter: var(--admin-glass-blur)
  border: 1px solid var(--admin-glass-border)
  border-radius: 16px

.settings-container
  background: var(--admin-glass-bg)
  backdrop-filter: var(--admin-glass-blur)
  -webkit-backdrop-filter: var(--admin-glass-blur)
  border: 1px solid var(--admin-glass-border)
  border-radius: 16px
  padding: 20px 24px
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.15), var(--admin-glass-inset)

.settings-list
  display: flex
  flex-direction: column
  gap: 12px
  padding-top: 16px

.empty-state
  display: flex
  flex-direction: column
  align-items: center
  justify-content: center
  padding: 64px 24px
  background: var(--admin-glass-bg)
  backdrop-filter: var(--admin-glass-blur)
  -webkit-backdrop-filter: var(--admin-glass-blur)
  border: 1px solid var(--admin-glass-border)
  border-radius: 16px
  text-align: center

.empty-tab
  display: flex
  align-items: center
  justify-content: center
  padding: 48px 24px

.saving-overlay
  position: fixed
  bottom: 24px
  right: 24px
  display: flex
  align-items: center
  padding: 12px 20px
  background: rgba(10, 10, 10, 0.85)
  backdrop-filter: var(--admin-glass-blur-strong)
  -webkit-backdrop-filter: var(--admin-glass-blur-strong)
  border: 1px solid var(--admin-glass-border)
  border-radius: 12px
  z-index: 100
</style>
