<script setup lang="ts">
import { LucideActivity as ActivityIcon } from '@lucide/vue'
import { useAdminStore } from '~/stores/adminStore'
import type { AdminActivityLogEntry } from '~/types'

definePageMeta({
  middleware: 'admin',
  layout: 'admin',
})

const adminStore = useAdminStore()
const message = useToast()

// Local state
const isLoading = ref(true)
const currentPage = ref(1)
const pageSize = ref(20)
const actionFilter = ref<string | undefined>(undefined)

// Computed
const activityLog = computed(() => adminStore.activityLog)
const totalItems = computed(() => adminStore.activityLogTotal)
const totalPages = computed(() => Math.ceil(totalItems.value / pageSize.value))

// Action type options for filter
interface ActionTypeOption {
  label: string
  value: string
}

const ALL_ACTIONS = '__all__'

const actionTypeOptions: ActionTypeOption[] = [
  { label: 'Ban User', value: 'ban_user' },
  { label: 'Unban User', value: 'unban_user' },
  { label: 'Delete User Data', value: 'delete_user_data' },
  { label: 'Update Setting', value: 'update_setting' },
  { label: 'Add Admin', value: 'add_admin' },
  { label: 'Remove Admin', value: 'remove_admin' },
]

// Action badge coloring (ported from the old table render cells)
const actionColors: Record<string, string> = {
  ban_user: 'bg-red-500/20 text-red-400 border-red-500/30',
  unban_user: 'bg-green-500/20 text-green-400 border-green-500/30',
  delete_user_data: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  update_setting: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  add_admin: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  remove_admin: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
}

function actionBadgeClass(action: AdminActivityLogEntry['action']): string {
  const actionKey = typeof action === 'string' ? action : ''
  return actionColors[actionKey] || 'bg-gray-500/20 text-gray-400 border-gray-500/30'
}

function formatActionLabel(action: AdminActivityLogEntry['action']): string {
  const actionKey = typeof action === 'string' ? action : ''
  return actionKey ? actionKey.replace(/_/g, ' ') : 'unknown'
}

function hasDetails(row: AdminActivityLogEntry): boolean {
  return !(
    !row.details ||
    (typeof row.details === 'object' && Object.keys(row.details).length === 0)
  )
}

function formatDetails(row: AdminActivityLogEntry): string {
  try {
    return JSON.stringify(row.details)
  } catch {
    return String(row.details)
  }
}

function formatTimestamp(createdAt: AdminActivityLogEntry['createdAt']): string {
  return new Date(createdAt).toLocaleString()
}

// Fetch activity log
async function fetchActivityLog(force = false) {
  isLoading.value = true
  try {
    await adminStore.fetchActivityLog({
      page: currentPage.value,
      limit: pageSize.value,
      action: actionFilter.value || undefined,
      force,
    })
  } catch (error) {
    message.error('Failed to load activity log')
    console.error('Error loading activity log:', error)
  } finally {
    isLoading.value = false
  }
}

// Handle page change
function handlePageChange(page: number) {
  currentPage.value = page
  fetchActivityLog()
}

// Handle filter change
function handleFilterChange(value: string | undefined) {
  actionFilter.value = value
  currentPage.value = 1
  fetchActivityLog()
}

// Handle filter selection from the Select (maps the "all" sentinel to undefined)
function onFilterSelect(value: unknown) {
  handleFilterChange(value === ALL_ACTIONS ? undefined : (value as string))
}

// Quick page jumper (ported from naive pagination's show-quick-jumper)
const jumpToPageInput = ref<number | null>(null)

function handleJumpToPage() {
  const target = Math.trunc(Number(jumpToPageInput.value))
  if (!Number.isFinite(target) || target < 1) return
  const page = Math.min(target, Math.max(totalPages.value, 1))
  jumpToPageInput.value = null
  if (page !== currentPage.value) {
    handlePageChange(page)
  }
}

// Handle refresh
async function handleRefresh() {
  await fetchActivityLog(true)
  message.success('Activity log refreshed')
}

// Fetch on mount
onMounted(() => {
  fetchActivityLog()
})
</script>

<template>
  <div class="activity-page">
    <!-- Header -->
    <div class="page-header">
      <div class="flex items-center gap-3">
        <div class="icon-container">
          <ActivityIcon :size="24" />
        </div>
        <div>
          <h2 class="text-xl font-bold text-white">Activity Log</h2>
          <p class="text-sm text-gray-400">Track admin actions and changes</p>
        </div>
      </div>
      <div class="flex items-center gap-3">
        <Select :model-value="actionFilter ?? ALL_ACTIONS" @update:model-value="onFilterSelect">
          <SelectTrigger class="w-[200px]">
            <SelectValue placeholder="Filter by action" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem :value="ALL_ACTIONS">All Actions</SelectItem>
            <SelectItem
              v-for="option in actionTypeOptions"
              :key="option.value"
              :value="option.value"
            >
              {{ option.label }}
            </SelectItem>
          </SelectContent>
        </Select>
        <Button variant="secondary" :loading="isLoading" @click="handleRefresh"> Refresh </Button>
      </div>
    </div>

    <!-- Table Container -->
    <div class="table-container">
      <div class="relative">
        <Table v-if="activityLog.length > 0">
          <TableHeader class="bg-white/2">
            <TableRow class="border-white/6 hover:bg-transparent">
              <TableHead class="w-[180px] px-4 py-3 font-semibold text-white/55">Admin</TableHead>
              <TableHead class="w-[150px] px-4 py-3 font-semibold text-white/55">Action</TableHead>
              <TableHead class="w-[180px] px-4 py-3 font-semibold text-white/55">
                Target User
              </TableHead>
              <TableHead class="px-4 py-3 font-semibold text-white/55">Details</TableHead>
              <TableHead class="w-[180px] px-4 py-3 font-semibold text-white/55">
                Timestamp
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow
              v-for="entry in activityLog"
              :key="entry.id"
              class="border-white/4 hover:bg-white/3"
            >
              <TableCell class="px-4 py-3">
                <div class="flex items-center gap-2">
                  <span class="font-mono text-sm text-gray-300">
                    {{ entry.adminSteamId || '-' }}
                  </span>
                </div>
              </TableCell>
              <TableCell class="px-4 py-3">
                <span
                  class="px-2 py-1 rounded-sm text-xs font-medium border"
                  :class="actionBadgeClass(entry.action)"
                >
                  {{ formatActionLabel(entry.action) }}
                </span>
              </TableCell>
              <TableCell class="px-4 py-3">
                <span v-if="entry.targetSteamId" class="font-mono text-sm text-gray-300">
                  {{ entry.targetSteamId }}
                </span>
                <span v-else class="text-gray-500">-</span>
              </TableCell>
              <TableCell class="px-4 py-3">
                <code
                  v-if="hasDetails(entry)"
                  class="text-xs bg-gray-800 px-2 py-1 rounded-sm text-gray-300 block truncate max-w-xs"
                >
                  {{ formatDetails(entry) }}
                </code>
                <span v-else class="text-gray-500">-</span>
              </TableCell>
              <TableCell class="px-4 py-3">
                <span class="text-sm text-gray-400">{{ formatTimestamp(entry.createdAt) }}</span>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>

        <!-- Refresh overlay (rows still visible) -->
        <div
          v-if="isLoading && activityLog.length > 0"
          class="absolute inset-0 z-10 flex items-center justify-center bg-black/30"
        >
          <Spinner class="size-7 text-primary" />
        </div>
      </div>

      <!-- Initial loading state -->
      <div v-if="isLoading && activityLog.length === 0" class="loading-state">
        <Spinner class="size-8 text-primary" />
      </div>

      <!-- Empty State -->
      <div v-if="!isLoading && activityLog.length === 0" class="empty-state">
        <ActivityIcon :size="48" class="text-gray-600 mb-4" />
        <h3 class="text-lg font-semibold text-gray-400">No Activity Found</h3>
        <p class="text-sm text-gray-500 mt-2">
          {{
            actionFilter
              ? 'No activity matches the selected filter.'
              : 'No admin activity has been recorded yet.'
          }}
        </p>
      </div>
    </div>

    <!-- Pagination -->
    <div v-if="totalItems > 0" class="pagination-container">
      <div class="text-sm text-gray-400">
        Showing {{ (currentPage - 1) * pageSize + 1 }} -
        {{ Math.min(currentPage * pageSize, totalItems) }} of {{ totalItems }} entries
      </div>
      <div class="flex flex-wrap items-center gap-3">
        <Pagination
          v-slot="{ page }"
          :page="currentPage"
          :total="totalItems"
          :items-per-page="pageSize"
          :sibling-count="1"
          show-edges
          class="mx-0 w-auto"
          @update:page="handlePageChange"
        >
          <PaginationContent v-slot="{ items }">
            <PaginationPrevious />
            <template v-for="(item, index) in items" :key="index">
              <PaginationItem
                v-if="item.type === 'page'"
                :value="item.value"
                :is-active="item.value === page"
              >
                {{ item.value }}
              </PaginationItem>
              <PaginationEllipsis v-else :index="index" />
            </template>
            <PaginationNext />
          </PaginationContent>
        </Pagination>
        <div class="flex items-center gap-2 text-sm text-gray-400">
          <span>Go to</span>
          <input
            v-model.number="jumpToPageInput"
            type="number"
            :min="1"
            :max="Math.max(totalPages, 1)"
            class="jump-input"
            aria-label="Jump to page"
            @keydown.enter="handleJumpToPage"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="sass">
.activity-page
  display: flex
  flex-direction: column
  gap: 24px

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

.table-container
  background: var(--admin-glass-bg)
  backdrop-filter: var(--admin-glass-blur)
  -webkit-backdrop-filter: var(--admin-glass-blur)
  border: 1px solid var(--admin-glass-border)
  border-radius: 16px
  overflow: hidden
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.15), var(--admin-glass-inset)

.loading-state
  display: flex
  align-items: center
  justify-content: center
  padding: 64px 24px

.empty-state
  display: flex
  flex-direction: column
  align-items: center
  justify-content: center
  padding: 64px 24px
  text-align: center

.pagination-container
  display: flex
  justify-content: space-between
  align-items: center
  flex-wrap: wrap
  gap: 16px
  padding: 16px 24px
  background: var(--admin-glass-bg)
  backdrop-filter: var(--admin-glass-blur)
  -webkit-backdrop-filter: var(--admin-glass-blur)
  border: 1px solid var(--admin-glass-border)
  border-radius: 16px
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.15), var(--admin-glass-inset)

.jump-input
  width: 64px
  padding: 4px 10px
  border-radius: 8px
  background: rgba(255, 255, 255, 0.04)
  border: 1px solid rgba(255, 255, 255, 0.1)
  color: rgba(255, 255, 255, 0.85)
  font-size: 13px
  text-align: center
  outline: none
  transition: border-color 0.2s ease
  appearance: textfield
  -moz-appearance: textfield

  &:focus
    border-color: var(--admin-accent)

  &::-webkit-outer-spin-button,
  &::-webkit-inner-spin-button
    -webkit-appearance: none
    margin: 0
</style>
