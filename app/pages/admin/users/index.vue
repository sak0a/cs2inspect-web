<script setup lang="ts">
import { buttonColor } from '~/lib/buttonColors'
import { LucideUsers as UsersIcon } from '@lucide/vue'

definePageMeta({
  middleware: 'admin',
  layout: 'admin',
})

// Store
const adminStore = useAdminStore()
const router = useRouter()

// State
const currentPage = ref(1)
const pageSize = ref(20)
const searchQuery = ref('')
const sortBy = ref<string>('lastActivity')
const sortDir = ref<'asc' | 'desc'>('desc')
const statusFilter = ref<'all' | 'active' | 'banned'>('all')

const sortOptions = [
  { label: 'Name', value: 'name' },
  { label: 'Loadouts', value: 'loadouts' },
  { label: 'Items', value: 'items' },
  { label: 'Last Activity', value: 'lastActivity' },
]

// Fetch users on mount
onMounted(async () => {
  await fetchUsers()
})

// Fetch users with current params
async function fetchUsers() {
  await adminStore.fetchUsers({
    search: searchQuery.value || undefined,
    page: currentPage.value,
    limit: pageSize.value,
    sortBy: sortBy.value,
    sortDir: sortDir.value,
    bannedOnly: statusFilter.value === 'banned' || undefined,
    activeOnly: statusFilter.value === 'active' || undefined,
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
  currentPage.value = 1
  fetchUsers()
}

// Toggle sort direction
function toggleSortDir() {
  sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc'
  currentPage.value = 1
  fetchUsers()
}

// Watch sort and filter changes
watch(sortBy, () => {
  currentPage.value = 1
  fetchUsers()
})

watch(statusFilter, () => {
  currentPage.value = 1
  fetchUsers()
})

// Handle view user
function handleViewUser(steamId: string) {
  router.push(`/admin/users/${steamId}`)
}

// Handle ban user
async function handleBanUser(steamId: string) {
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
            <p class="text-sm text-gray-400">{{ adminStore.usersTotal }} total users</p>
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

    <!-- Sort & Filter Controls (always visible) -->
    <div class="glass-card p-6">
      <div class="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div class="flex items-center gap-2">
          <span class="text-sm text-gray-400">Sort by</span>
          <NSelect v-model:value="sortBy" size="small" class="w-40" :options="sortOptions" />
          <SButton size="sm" variant="light" @click="toggleSortDir">
            {{ sortDir === 'asc' ? '\u2191 Asc' : '\u2193 Desc' }}
          </SButton>
        </div>
        <div class="flex items-center gap-2">
          <span class="text-sm text-gray-400">Status</span>
          <SButton
            size="sm"
            :color="statusFilter === 'all' ? buttonColor.primary : buttonColor.default"
            variant="light"
            @click="statusFilter = 'all'"
          >
            All
          </SButton>
          <SButton
            size="sm"
            :color="statusFilter === 'active' ? buttonColor.primary : buttonColor.default"
            variant="light"
            @click="statusFilter = 'active'"
          >
            Active
          </SButton>
          <SButton
            size="sm"
            :color="statusFilter === 'banned' ? buttonColor.primary : buttonColor.default"
            variant="light"
            @click="statusFilter = 'banned'"
          >
            Banned
          </SButton>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="adminStore.isLoadingUsers">
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
      <div v-else-if="adminStore.error" class="py-6 text-center">
        <p class="text-red-400">{{ adminStore.error }}</p>
        <SButton class="mt-4" variant="light" @click="fetchUsers"> Try Again </SButton>
      </div>

      <!-- Empty State -->
      <div v-else-if="(adminStore.users?.length ?? 0) === 0" class="py-8 text-center">
        <NIcon :component="UsersIcon" :size="48" class="opacity-30 mb-4" />
        <p class="text-gray-400">
          {{ searchQuery ? 'No users found matching your search.' : 'No users found.' }}
        </p>
      </div>

      <!-- User Table -->
      <AdminUserTable
        v-else
        :users="adminStore.users"
        :loading="adminStore.isLoadingUsers"
        :total="adminStore.usersTotal"
        :page="currentPage"
        :page-size="pageSize"
        @page-change="handlePageChange"
        @view="handleViewUser"
        @ban="handleBanUser"
        @unban="handleUnbanUser"
      />
    </div>
  </div>
</template>

<style scoped lang="sass">
.glass-card
  background: var(--admin-glass-bg)
  backdrop-filter: var(--admin-glass-blur)
  -webkit-backdrop-filter: var(--admin-glass-blur)
  border: 1px solid var(--admin-glass-border)
  border-radius: 14px
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.15), var(--admin-glass-inset)
  transition: border-color 0.3s ease

  &:hover
    border-color: var(--admin-glass-border-hover)

.admin-accent-chip
  background: linear-gradient(135deg, rgba(var(--admin-accent-rgb), 0.2), rgba(var(--admin-accent-rgb), 0.1))
  color: var(--admin-accent)
</style>
