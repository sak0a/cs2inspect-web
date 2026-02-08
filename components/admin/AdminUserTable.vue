<script setup lang="ts">
import { h } from 'vue'
import { useDebounceFn } from '@vueuse/core'
import type { AdminUserSummary } from '~/types'
import type { DataTableColumns } from 'naive-ui'

interface Props {
  users: AdminUserSummary[]
  loading: boolean
  total: number
  page: number
  pageSize: number
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'page-change', page: number): void
  (e: 'search' | 'view' | 'ban' | 'unban', value: string): void
}>()

const searchQuery = ref('')
const debouncedSearch = useDebounceFn((query: string) => {
  emit('search', query)
}, 300)

watch(searchQuery, (newValue) => {
  debouncedSearch(newValue)
})

const handlePageChange = (page: number) => {
  emit('page-change', page)
}

const formatDate = (dateStr: string | null) => {
  if (!dateStr) return 'Never'
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const columns: DataTableColumns<AdminUserSummary> = [
  {
    title: 'Steam ID',
    key: 'steamId',
    width: 200,
    render(row) {
      return h('span', { class: 'font-mono text-sm' }, row.steamId)
    }
  },
  {
    title: 'Loadouts',
    key: 'loadoutCount',
    width: 100,
    align: 'center'
  },
  {
    title: 'Items',
    key: 'totalItems',
    width: 100,
    align: 'center'
  },
  {
    title: 'Last Activity',
    key: 'lastActivity',
    width: 180,
    render(row) {
      return h('span', { class: 'text-sm text-gray-400' }, formatDate(row.lastActivity))
    }
  },
  {
    title: 'Status',
    key: 'isBanned',
    width: 100,
    align: 'center',
    render(row) {
      return h(
        'span',
        {
          class: [
            'px-2 py-1 rounded-full text-xs font-medium',
            row.isBanned
              ? 'bg-red-500/20 text-red-400 border border-red-500/30'
              : 'bg-green-500/20 text-green-400 border border-green-500/30'
          ]
        },
        row.isBanned ? 'Banned' : 'Active'
      )
    }
  },
  {
    title: 'Actions',
    key: 'actions',
    width: 200,
    align: 'center',
    render(row) {
      return h('div', { class: 'flex gap-2 justify-center' }, [
        h(
          NButton,
          {
            size: 'small',
            secondary: true,
            type: 'info',
            onClick: () => emit('view', row.steamId)
          },
          { default: () => 'View' }
        ),
        row.isBanned
          ? h(
              NButton,
              {
                size: 'small',
                secondary: true,
                type: 'success',
                onClick: () => emit('unban', row.steamId)
              },
              { default: () => 'Unban' }
            )
          : h(
              NButton,
              {
                size: 'small',
                secondary: true,
                type: 'error',
                onClick: () => emit('ban', row.steamId)
              },
              { default: () => 'Ban' }
            )
      ])
    }
  }
]

const totalPages = computed(() => Math.ceil(props.total / props.pageSize))
</script>

<template>
  <div class="admin-user-table">
    <!-- Search Header -->
    <div class="mb-4">
      <NInput
        v-model:value="searchQuery"
        placeholder="Search by Steam ID..."
        clearable
        class="max-w-md"
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

    <!-- Data Table -->
    <NDataTable
      :columns="columns"
      :data="users"
      :loading="loading"
      :bordered="false"
      :single-line="false"
      class="rounded-lg overflow-hidden"
    />

    <!-- Pagination -->
    <div v-if="totalPages > 1" class="mt-4 flex justify-center">
      <NPagination
        :page="page"
        :page-count="totalPages"
        :page-slot="7"
        @update:page="handlePageChange"
      />
    </div>

    <!-- Summary -->
    <div class="mt-4 text-sm text-gray-400 text-center">
      Showing {{ users.length }} of {{ total }} users
    </div>
  </div>
</template>

<style scoped lang="sass">
.admin-user-table
  :deep(.n-data-table)
    background: var(--glass-bg-secondary) !important
    border: 1px solid var(--glass-border)
    backdrop-filter: var(--glass-blur-medium) saturate(160%)
    border-radius: 12px

    .n-data-table-thead
      background: rgba(255, 255, 255, 0.03)

    .n-data-table-tr
      transition: background 0.2s ease

      &:hover
        background: rgba(255, 255, 255, 0.05)

    .n-data-table-td
      border-bottom: 1px solid var(--glass-border)
</style>
