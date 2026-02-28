<script setup lang="ts">
import {
    LucidePlug as PlugIcon,
    LucideSettings as GeneralIcon,
    LucideToggleLeft as FeaturesIcon,
    LucideShieldCheck as PermissionsIcon,
    LucideTerminal as CommandsIcon,
    LucideRefreshCw as SyncIcon,
    LucideFileText as LoggingIcon,
} from 'lucide-vue-next'
import { useAdminStore } from '~/stores/adminStore'
import type { PluginSettingCategory } from '~/types'

definePageMeta({
    middleware: 'admin',
    layout: 'admin',
})

const adminStore = useAdminStore()
const message = useMessage()
const dialog = useDialog()

const isLoading = ref(true)
const isSaving = ref(false)
const activeTab = ref<PluginSettingCategory>('features')

// Tab definitions
const tabs: Array<{ key: PluginSettingCategory; label: string; icon: typeof PlugIcon }> = [
    { key: 'general', label: 'General', icon: GeneralIcon },
    { key: 'features', label: 'Features', icon: FeaturesIcon },
    { key: 'permissions', label: 'Permissions', icon: PermissionsIcon },
    { key: 'commands', label: 'Commands', icon: CommandsIcon },
    { key: 'sync', label: 'Sync', icon: SyncIcon },
    { key: 'logging', label: 'Logging', icon: LoggingIcon },
]

const settingsByCategory = computed(() => adminStore.pluginSettingsByCategory)

// Fetch settings on mount
onMounted(async () => {
    try {
        await adminStore.fetchPluginSettings()
    } catch (error) {
        message.error('Failed to load plugin settings')
        console.error('Error loading plugin settings:', error)
    } finally {
        isLoading.value = false
    }
})

// Handle setting update
async function handleSaveSetting(payload: {
    key: string
    value: string | number | boolean | Record<string, unknown> | unknown[]
}) {
    isSaving.value = true
    try {
        await adminStore.updatePluginSetting(payload.key, payload.value)
        message.success(`Setting updated successfully`)
    } catch (error) {
        message.error(`Failed to update setting`)
        console.error('Error updating plugin setting:', error)
    } finally {
        isSaving.value = false
    }
}

// Refresh settings
async function handleRefresh() {
    isLoading.value = true
    try {
        await adminStore.fetchPluginSettings(true)
        message.success('Settings refreshed')
    } catch (error) {
        message.error('Failed to refresh settings')
        console.error('Error refreshing plugin settings:', error)
    } finally {
        isLoading.value = false
    }
}

// Reset to defaults
function handleReset() {
    dialog.warning({
        title: 'Reset Plugin Settings',
        content:
            'Are you sure you want to reset all plugin settings to their default values? This action cannot be undone.',
        positiveText: 'Reset All',
        negativeText: 'Cancel',
        onPositiveClick: async () => {
            try {
                await adminStore.resetPluginSettings()
                message.success('Plugin settings reset to defaults')
            } catch (error) {
                message.error('Failed to reset settings')
                console.error('Error resetting plugin settings:', error)
            }
        },
    })
}
</script>

<template>
    <div class="plugin-page">
        <!-- Header -->
        <div class="page-header">
            <div class="flex items-center gap-3">
                <div class="icon-container">
                    <NIcon :component="PlugIcon" :size="24" />
                </div>
                <div>
                    <h2 class="text-xl font-bold text-white">Plugin Configuration</h2>
                    <p class="text-sm text-gray-400">
                        Manage CS2 plugin settings from the web panel
                    </p>
                </div>
            </div>
            <div class="flex gap-2">
                <NButton secondary type="warning" :loading="isLoading" @click="handleReset">
                    Reset to Defaults
                </NButton>
                <NButton secondary type="primary" :loading="isLoading" @click="handleRefresh">
                    Refresh
                </NButton>
            </div>
        </div>

        <!-- Loading State -->
        <div v-if="isLoading" class="loading-container">
            <NSpin size="large" />
            <p class="text-gray-400 mt-4">Loading plugin settings...</p>
        </div>

        <!-- Settings Tabs -->
        <div v-else class="settings-container">
            <NTabs
                :value="activeTab"
                type="line"
                animated
                @update:value="(val: string) => (activeTab = val as PluginSettingCategory)"
            >
                <NTabPane v-for="tab in tabs" :key="tab.key" :name="tab.key" :tab="tab.label">
                    <template #tab>
                        <div class="flex items-center gap-2">
                            <NIcon :component="tab.icon" :size="16" />
                            <span>{{ tab.label }}</span>
                            <span
                                v-if="settingsByCategory[tab.key]?.length"
                                class="text-xs text-gray-500"
                            >
                                ({{ settingsByCategory[tab.key].length }})
                            </span>
                        </div>
                    </template>

                    <div v-if="settingsByCategory[tab.key]?.length" class="settings-list">
                        <AdminPluginSettingItem
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

        <!-- Saving Overlay -->
        <div v-if="isSaving" class="saving-overlay">
            <NSpin size="medium" />
            <span class="ml-3 text-gray-300">Saving...</span>
        </div>
    </div>
</template>

<style scoped lang="sass">
.plugin-page
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
