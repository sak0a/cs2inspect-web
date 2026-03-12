<script setup lang="ts">
import { buttonColor } from '~/lib/buttonColors'
import {
  LucideShield as ShieldIcon,
  LucideShieldAlert as ShieldAlertIcon,
  LucideUserPlus as UserPlusIcon,
  LucideTrash2 as TrashIcon,
} from 'lucide-vue-next'
import { useAdminStore } from '~/stores/adminStore'
import { useAdminAuth } from '~/composables/useAdminAuth'
import type { AdminInfo } from '~/types'

definePageMeta({
  middleware: 'admin',
  layout: 'admin',
})

const adminStore = useAdminStore()
const { isSuperAdmin } = useAdminAuth()
const message = useMessage()
const dialog = useDialog()

// Local state
const isLoading = ref(true)
const showAddModal = ref(false)
const removingAdminId = ref<string | null>(null)

// Computed
const adminUsers = computed(() => adminStore.adminUsers)

// Fetch admin users on mount
onMounted(async () => {
  if (!isSuperAdmin.value) {
    message.error('Superadmin access required')
    return
  }

  try {
    await adminStore.fetchAdminUsers(true)
  } catch (error) {
    message.error('Failed to load admin users')
    console.error('Error loading admin users:', error)
  } finally {
    isLoading.value = false
  }
})

// Handle add admin
async function handleAddAdmin(payload: { steamId: string; role: 'admin' | 'superadmin' }) {
  try {
    await adminStore.addAdmin(payload.steamId, payload.role)
    message.success(`Admin "${payload.steamId}" added successfully`)
    showAddModal.value = false
  } catch (error) {
    message.error('Failed to add admin')
    console.error('Error adding admin:', error)
  }
}

// Handle remove admin with confirmation
function handleRemoveAdmin(admin: AdminInfo) {
  dialog.warning({
    title: 'Remove Admin',
    content: `Are you sure you want to remove "${admin.steamId}" as an admin? This action cannot be undone.`,
    positiveText: 'Remove',
    negativeText: 'Cancel',
    onPositiveClick: async () => {
      removingAdminId.value = admin.steamId
      try {
        await adminStore.removeAdmin(admin.steamId)
        message.success(`Admin "${admin.steamId}" removed successfully`)
      } catch (error) {
        message.error('Failed to remove admin')
        console.error('Error removing admin:', error)
      } finally {
        removingAdminId.value = null
      }
    },
  })
}

// Handle refresh
async function handleRefresh() {
  isLoading.value = true
  try {
    await adminStore.fetchAdminUsers()
    message.success('Admin list refreshed')
  } catch (error) {
    message.error('Failed to refresh admin list')
    console.error('Error refreshing admin list:', error)
  } finally {
    isLoading.value = false
  }
}

// Format date
function formatDate(dateStr: string) {
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}
</script>

<template>
  <div class="admins-page">
    <!-- Access Warning Banner -->
    <div class="warning-banner">
      <div class="flex items-center gap-3">
        <NIcon :component="ShieldAlertIcon" :size="24" class="text-orange-400" />
        <div>
          <h3 class="font-semibold text-orange-400">Superadmin Access Only</h3>
          <p class="text-sm text-gray-400">
            This page is restricted to superadmins. You can manage who has administrative access to
            the system.
          </p>
        </div>
      </div>
    </div>

    <!-- Not Superadmin State -->
    <div v-if="!isSuperAdmin" class="access-denied">
      <NIcon :component="ShieldAlertIcon" :size="64" class="text-red-500 mb-4" />
      <h2 class="text-2xl font-bold text-white mb-2">Access Denied</h2>
      <p class="text-gray-400">
        You do not have permission to access this page. Only superadmins can manage administrators.
      </p>
      <SButton variant="light" :color="buttonColor.primary" class="mt-6" tag="a" href="/admin">
        Back to Dashboard
      </SButton>
    </div>

    <!-- Main Content (Superadmin only) -->
    <template v-else>
      <!-- Header -->
      <div class="page-header">
        <div class="flex items-center gap-3">
          <div class="icon-container">
            <NIcon :component="ShieldIcon" :size="24" />
          </div>
          <div>
            <h2 class="text-xl font-bold text-white">Admin Management</h2>
            <p class="text-sm text-gray-400">Manage administrator accounts and permissions</p>
          </div>
        </div>
        <div class="flex items-center gap-3">
          <SButton variant="light" :loading="isLoading" @click="handleRefresh"> Refresh </SButton>
          <SButton variant="filled" :color="buttonColor.primary" @click="showAddModal = true">
            <template #icon-left>
              <UserPlusIcon :size="16" />
            </template>
            Add Admin
          </SButton>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="isLoading" class="loading-container">
        <NSpin size="large" />
        <p class="text-gray-400 mt-4">Loading administrators...</p>
      </div>

      <!-- Admin List -->
      <div v-else-if="adminUsers.length > 0" class="admin-list">
        <div v-for="admin in adminUsers" :key="admin.id" class="admin-card">
          <div class="flex items-center gap-4">
            <!-- Avatar/Icon -->
            <div
              class="avatar"
              :class="admin.role === 'superadmin' ? 'avatar--superadmin' : 'avatar--admin'"
            >
              <NIcon :component="ShieldIcon" :size="24" />
            </div>

            <!-- Info -->
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 mb-1">
                <span class="font-mono text-sm font-medium text-white">{{ admin.steamId }}</span>
                <span
                  class="px-2 py-0.5 rounded-full text-xs font-medium border"
                  :class="
                    admin.role === 'superadmin'
                      ? 'bg-orange-500/20 text-orange-400 border-orange-500/30'
                      : 'bg-yellow-400/20 text-yellow-300 border-yellow-400/30'
                  "
                >
                  {{ admin.role === 'superadmin' ? 'Super Admin' : 'Admin' }}
                </span>
              </div>
              <div class="text-xs text-gray-500">
                Added {{ formatDate(admin.createdAt) }}
                <span v-if="admin.createdBy"> by {{ admin.createdBy }}</span>
              </div>
              <div v-if="admin.permissions.length > 0" class="mt-2 flex flex-wrap gap-1">
                <span
                  v-for="permission in admin.permissions"
                  :key="permission"
                  class="px-2 py-0.5 bg-gray-700/50 text-gray-400 text-xs rounded"
                >
                  {{ permission }}
                </span>
              </div>
            </div>

            <!-- Actions -->
            <div class="flex items-center gap-2">
              <SButton
                variant="light"
                :color="buttonColor.error"
                size="sm"
                :loading="removingAdminId === admin.steamId"
                :disabled="admin.role === 'superadmin'"
                @click="handleRemoveAdmin(admin)"
              >
                <template #icon-left>
                  <TrashIcon :size="16" />
                </template>
                Remove
              </SButton>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-else class="empty-state">
        <NIcon :component="ShieldIcon" :size="48" class="text-gray-600 mb-4" />
        <h3 class="text-lg font-semibold text-gray-400">No Administrators Found</h3>
        <p class="text-sm text-gray-500 mt-2">
          There are no administrators configured yet. Add your first admin to get started.
        </p>
        <SButton
          variant="filled"
          :color="buttonColor.primary"
          class="mt-4"
          @click="showAddModal = true"
        >
          <template #icon-left>
            <UserPlusIcon :size="16" />
          </template>
          Add First Admin
        </SButton>
      </div>
    </template>

    <!-- Add Admin Modal -->
    <AdminAddModal
      v-model:show="showAddModal"
      @confirm="handleAddAdmin"
      @cancel="showAddModal = false"
    />
  </div>
</template>

<style scoped lang="sass">
.admins-page
  display: flex
  flex-direction: column
  gap: 24px

.warning-banner
  padding: 16px 20px
  background: rgba(251, 146, 60, 0.06)
  backdrop-filter: var(--admin-glass-blur)
  -webkit-backdrop-filter: var(--admin-glass-blur)
  border: 1px solid rgba(251, 146, 60, 0.15)
  border-radius: 12px

.access-denied
  display: flex
  flex-direction: column
  align-items: center
  justify-content: center
  padding: 80px 24px
  background: var(--admin-glass-bg)
  backdrop-filter: var(--admin-glass-blur)
  -webkit-backdrop-filter: var(--admin-glass-blur)
  border: 1px solid var(--admin-glass-border)
  border-radius: 16px
  text-align: center

.page-header
  display: flex
  justify-content: space-between
  align-items: center
  flex-wrap: wrap
  gap: 16px
  padding: 20px 24px
  background: var(--admin-glass-bg)
  backdrop-filter: var(--admin-glass-blur)
  -webkit-backdrop-filter: var(--admin-glass-blur)
  border: 1px solid var(--admin-glass-border)
  border-radius: 16px
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.15), var(--admin-glass-inset)

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

.admin-list
  display: flex
  flex-direction: column
  gap: 12px

.admin-card
  padding: 20px 24px
  background: var(--admin-glass-bg)
  backdrop-filter: var(--admin-glass-blur)
  -webkit-backdrop-filter: var(--admin-glass-blur)
  border: 1px solid var(--admin-glass-border)
  border-radius: 14px
  transition: all 0.2s ease
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.15), var(--admin-glass-inset)

  &:hover
    background: var(--admin-glass-bg-hover)
    border-color: var(--admin-glass-border-hover)

.avatar
  display: flex
  align-items: center
  justify-content: center
  width: 48px
  height: 48px
  border-radius: 12px

  &--admin
    background: linear-gradient(135deg, rgba(var(--admin-accent-rgb), 0.2), rgba(var(--admin-accent-rgb), 0.1))
    color: var(--admin-accent)

  &--superadmin
    background: linear-gradient(135deg, rgba(251, 146, 60, 0.2), rgba(251, 146, 60, 0.1))
    color: #fb923c

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
</style>
