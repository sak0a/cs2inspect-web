<script setup lang="ts">
import { LucideUsers as UsersIcon, LucideX as ClearIcon } from '@lucide/vue'
import { Button } from '@/components/ui/button'

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
            <UsersIcon :size="24" color="var(--admin-accent)" />
          </div>
          <div>
            <h2 class="text-xl font-semibold text-white">Users</h2>
            <p class="text-sm text-gray-400">{{ adminStore.usersTotal }} total users</p>
          </div>
        </div>

        <!-- Search Input -->
        <div class="relative w-full md:w-80">
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
            class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 opacity-50"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <Input
            :model-value="searchQuery"
            placeholder="Search by Steam ID or name..."
            class="pl-9 pr-8"
            @update:model-value="(v) => handleSearch(String(v))"
          />
          <Button
            v-if="searchQuery"
            type="button"
            variant="ghost"
            size="icon-xs"
            class="absolute right-2 top-1/2 -translate-y-1/2"
            aria-label="Clear search"
            @click="handleSearch('')"
          >
            <ClearIcon :size="14" />
          </Button>
        </div>
      </div>
    </div>

    <!-- Sort & Filter Controls (always visible) -->
    <div class="glass-card p-6">
      <div class="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div class="flex items-center gap-2">
          <span class="text-sm text-gray-400">Sort by</span>
          <Select :model-value="sortBy" @update:model-value="(v) => (sortBy = String(v))">
            <SelectTrigger size="sm" class="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem v-for="option in sortOptions" :key="option.value" :value="option.value">
                {{ option.label }}
              </SelectItem>
            </SelectContent>
          </Select>
          <Button size="sm" variant="secondary" @click="toggleSortDir">
            {{ sortDir === 'asc' ? '\u2191 Asc' : '\u2193 Desc' }}
          </Button>
        </div>
        <div class="flex items-center gap-2">
          <span class="text-sm text-gray-400">Status</span>
          <Button
            size="sm"
            :variant="statusFilter === 'all' ? 'default' : 'secondary'"
            @click="statusFilter = 'all'"
          >
            All
          </Button>
          <Button
            size="sm"
            :variant="statusFilter === 'active' ? 'default' : 'secondary'"
            @click="statusFilter = 'active'"
          >
            Active
          </Button>
          <Button
            size="sm"
            :variant="statusFilter === 'banned' ? 'default' : 'secondary'"
            @click="statusFilter = 'banned'"
          >
            Banned
          </Button>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="adminStore.isLoadingUsers">
        <div class="space-y-3">
          <div v-for="i in 6" :key="i" class="grid grid-cols-12 gap-3 items-center">
            <Skeleton class="h-4 col-span-6 md:col-span-4" />
            <Skeleton class="h-4 col-span-3 md:col-span-2" />
            <Skeleton class="h-4 col-span-3 md:col-span-2" />
            <Skeleton class="h-4 hidden md:block md:col-span-2" />
            <Skeleton class="h-4 hidden md:block md:col-span-2" />
          </div>
        </div>
      </div>

      <!-- Error State -->
      <div v-else-if="adminStore.error" class="py-6 text-center">
        <p class="text-red-400">{{ adminStore.error }}</p>
        <Button class="mt-4" variant="secondary" @click="fetchUsers"> Try Again </Button>
      </div>

      <!-- Empty State -->
      <div v-else-if="(adminStore.users?.length ?? 0) === 0" class="py-8 text-center">
        <UsersIcon :size="48" class="opacity-30 mb-4 inline-block" />
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
