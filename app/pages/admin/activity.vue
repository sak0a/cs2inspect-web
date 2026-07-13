<script setup lang="ts">
import { h } from 'vue'
import { buttonColor } from '~/lib/buttonColors'
import { LucideActivity as ActivityIcon } from '@lucide/vue'
import type { DataTableColumns, SelectOption } from 'naive-ui'
import { useAdminStore } from '~/stores/adminStore'
import type { AdminActivityLogEntry } from '~/types'

definePageMeta({
  middleware: 'admin',
  layout: 'admin',
})

const adminStore = useAdminStore()
const message = useMessage()

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
const actionTypeOptions: SelectOption[] = [
  { label: 'Ban User', value: 'ban_user' },
  { label: 'Unban User', value: 'unban_user' },
  { label: 'Delete User Data', value: 'delete_user_data' },
  { label: 'Update Setting', value: 'update_setting' },
  { label: 'Add Admin', value: 'add_admin' },
  { label: 'Remove Admin', value: 'remove_admin' },
]

// Table columns definition
const columns: DataTableColumns<AdminActivityLogEntry> = [
  {
    title: 'Admin',
    key: 'adminSteamId',
    width: 180,
    render(row) {
      const adminId = row.adminSteamId || '-'
      return h('div', { class: 'flex items-center gap-2' }, [
        h('span', { class: 'font-mono text-sm text-gray-300' }, adminId),
      ])
    },
  },
  {
    title: 'Action',
    key: 'action',
    width: 150,
    render(row) {
      const actionColors: Record<string, string> = {
        ban_user: 'bg-red-500/20 text-red-400 border-red-500/30',
        unban_user: 'bg-green-500/20 text-green-400 border-green-500/30',
        delete_user_data: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
        update_setting: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
        add_admin: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
        remove_admin: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      }
      const actionKey = typeof row.action === 'string' ? row.action : ''
      const colorClass =
        actionColors[actionKey] || 'bg-gray-500/20 text-gray-400 border-gray-500/30'
      const actionLabel = actionKey ? actionKey.replace(/_/g, ' ') : 'unknown'
      return h(
        'span',
        {
          class: `px-2 py-1 rounded text-xs font-medium border ${colorClass}`,
        },
        actionLabel
      )
    },
  },
  {
    title: 'Target User',
    key: 'targetSteamId',
    width: 180,
    render(row) {
      if (!row.targetSteamId) {
        return h('span', { class: 'text-gray-500' }, '-')
      }
      return h('span', { class: 'font-mono text-sm text-gray-300' }, row.targetSteamId)
    },
  },
  {
    title: 'Details',
    key: 'details',
    render(row) {
      if (
        !row.details ||
        (typeof row.details === 'object' && Object.keys(row.details).length === 0)
      ) {
        return h('span', { class: 'text-gray-500' }, '-')
      }
      let detailsText = ''
      try {
        detailsText = JSON.stringify(row.details)
      } catch {
        detailsText = String(row.details)
      }
      return h(
        'code',
        {
          class: 'text-xs bg-gray-800 px-2 py-1 rounded text-gray-300 block truncate max-w-xs',
        },
        detailsText
      )
    },
  },
  {
    title: 'Timestamp',
    key: 'createdAt',
    width: 180,
    render(row) {
      const date = new Date(row.createdAt)
      return h('span', { class: 'text-sm text-gray-400' }, date.toLocaleString())
    },
  },
]

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
          <NIcon :component="ActivityIcon" :size="24" />
        </div>
        <div>
          <h2 class="text-xl font-bold text-white">Activity Log</h2>
          <p class="text-sm text-gray-400">Track admin actions and changes</p>
        </div>
      </div>
      <div class="flex items-center gap-3">
        <NSelect
          :value="actionFilter"
          :options="actionTypeOptions"
          placeholder="Filter by action"
          clearable
          style="width: 200px"
          @update:value="handleFilterChange"
        />
        <SButton
          variant="light"
          :color="buttonColor.primary"
          :loading="isLoading"
          @click="handleRefresh"
        >
          Refresh
        </SButton>
      </div>
    </div>

    <!-- Table Container -->
    <div class="table-container">
      <NDataTable
        :columns="columns"
        :data="activityLog"
        :loading="isLoading"
        :bordered="false"
        :single-line="false"
        :row-class-name="() => 'activity-row'"
        class="activity-table"
      />

      <!-- Empty State -->
      <div v-if="!isLoading && activityLog.length === 0" class="empty-state">
        <NIcon :component="ActivityIcon" :size="48" class="text-gray-600 mb-4" />
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
      <NPagination
        v-model:page="currentPage"
        :page-count="totalPages"
        :page-size="pageSize"
        show-quick-jumper
        @update:page="handlePageChange"
      />
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

.activity-table
  :deep(.n-data-table-wrapper)
    background: transparent

  :deep(.n-data-table-thead)
    background: rgba(255, 255, 255, 0.02)

  :deep(.n-data-table-th)
    background: transparent
    border-bottom: 1px solid rgba(255, 255, 255, 0.06)
    color: rgba(255, 255, 255, 0.55)
    font-weight: 600

  :deep(.n-data-table-td)
    background: transparent
    border-bottom: 1px solid rgba(255, 255, 255, 0.04)

  :deep(.n-data-table-tr:hover .n-data-table-td)
    background: rgba(255, 255, 255, 0.03)

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
</style>
