<script setup lang="ts">
import { LucideUsers as UsersIcon } from 'lucide-vue-next'
import type { AdminUserSummary } from '~/types'

definePageMeta({
  middleware: 'admin',
  layout: 'admin'
})

// Store
const adminStore = useAdminStore()
const router = useRouter()

// State
const currentPage = ref(1)
const pageSize = ref(20)
const searchQuery = ref('')

// Fetch users on mount
onMounted(async () => {
  await fetchUsers()
})

// Fetch users with current params
async function fetchUsers() {
  await adminStore.fetchUsers({
    search: searchQuery.value || undefined,
    page: currentPage.value,
    limit: pageSize.value
  })
}

// Handle page change
function handlePageChange(page: number) {
  currentPage.value = page
  fetchUsers()
}

// Handle search
function handleSearch(query: string) {
  searchQuery.value = query
  currentPage.value = 1 // Reset to first page on search
  fetchUsers()
}

// Handle view user
function handleViewUser(steamId: string) {
  router.push(`/admin/users/${steamId}`)
}

// Handle ban user
async function handleBanUser(steamId: string) {
  // Navigate to user detail page where ban modal is available
  router.push(`/admin/users/${steamId}?action=ban`)
}

// Handle unban user
async function handleUnbanUser(steamId: string) {
  try {
    await adminStore.unbanUser(steamId)
  } catch (error) {
    console.error('Failed to unban user:', error)
  }
}
</script>

<template>
  <div class="space-y-6">
      <!-- Header Section -->
      <div class="glass-card p-6">
        <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 rounded-xl flex items-center justify-center admin-accent-chip">
              <NIcon :component="UsersIcon" :size="24" color="var(--admin-accent)" />
            </div>
            <div>
              <h2 class="text-xl font-semibold text-white">Users</h2>
              <p class="text-sm text-gray-400">
                {{ adminStore.usersTotal }} total users
              </p>
            </div>
          </div>

          <!-- Search Input -->
          <div class="w-full md:w-80">
            <NInput
              v-model:value="searchQuery"
              placeholder="Search by Steam ID or name..."
              clearable
              @update:value="handleSearch"
            >
              <template #prefix>
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
                  class="opacity-50"
                >
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.3-4.3" />
                </svg>
              </template>
            </NInput>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="adminStore.isLoadingUsers" class="glass-card p-6">
        <div class="flex items-center justify-between mb-6">
          <NSkeleton text style="width: 160px" />
          <NSkeleton text style="width: 120px" />
        </div>
        <div class="space-y-3">
          <div v-for="i in 6" :key="i" class="grid grid-cols-12 gap-3 items-center">
            <NSkeleton text class="col-span-6 md:col-span-4" />
            <NSkeleton text class="col-span-3 md:col-span-2" />
            <NSkeleton text class="col-span-3 md:col-span-2" />
            <NSkeleton text class="hidden md:block md:col-span-2" />
            <NSkeleton text class="hidden md:block md:col-span-2" />
          </div>
        </div>
      </div>

      <!-- Error State -->
      <div
        v-else-if="adminStore.error"
        class="glass-card p-6 text-center"
      >
        <p class="text-red-400">{{ adminStore.error }}</p>
        <NButton
          class="mt-4"
          secondary
          @click="fetchUsers"
        >
          Try Again
        </NButton>
      </div>

      <!-- Empty State -->
      <div
        v-else-if="(adminStore.users?.length ?? 0) === 0"
        class="glass-card p-12 text-center"
      >
        <NIcon :component="UsersIcon" :size="48" class="opacity-30 mb-4" />
        <p class="text-gray-400">
          {{ searchQuery ? 'No users found matching your search.' : 'No users found.' }}
        </p>
      </div>

      <!-- User Table -->
      <div v-else class="glass-card p-6">
        <AdminUserTable
          :users="adminStore.users"
          :loading="adminStore.isLoadingUsers"
          :total="adminStore.usersTotal"
          :page="currentPage"
          :page-size="pageSize"
          @page-change="handlePageChange"
          @search="handleSearch"
          @view="handleViewUser"
          @ban="handleBanUser"
          @unban="handleUnbanUser"
        />
      </div>
  </div>
</template>

<style scoped lang="sass">
.glass-card
  background: rgba(255, 255, 255, 0.05)
  backdrop-filter: blur(12px)
  border: 1px solid rgba(255, 255, 255, 0.1)
  border-radius: 12px

.admin-accent-chip
  background: linear-gradient(135deg, rgba(var(--admin-accent-rgb), 0.2), rgba(var(--admin-accent-rgb), 0.1))
  color: var(--admin-accent)
</style>
