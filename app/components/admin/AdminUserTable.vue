<script setup lang="ts">
import { h } from 'vue'
import type { AdminUserSummary } from '~/types'
import type { DataTableColumns } from 'naive-ui'
import SButton from '~/components/sui/SButton.vue'
import { buttonColor } from '~/lib/buttonColors'

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
  (e: 'view' | 'ban' | 'unban', value: string): void
}>()

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
    minute: '2-digit',
  })
}

const columns: DataTableColumns<AdminUserSummary> = [
  {
    title: 'User',
    key: 'steamId',
    width: 280,
    render(row) {
      const avatar = row.avatarFull
        ? h('img', {
            src: row.avatarFull,
            class: 'w-8 h-8 rounded-lg object-cover flex-shrink-0',
            alt: row.personaName || row.steamId,
            loading: 'lazy',
          })
        : h(
            'div',
            {
              class:
                'w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0 text-xs font-bold opacity-50',
            },
            row.steamId.slice(-2).toUpperCase()
          )

      const nameElements = []
      if (row.personaName) {
        nameElements.push(h('span', { class: 'text-sm text-white truncate' }, row.personaName))
      }
      nameElements.push(
        h('span', { class: 'font-mono text-xs text-gray-400 truncate' }, row.steamId)
      )

      return h('div', { class: 'flex items-center gap-3' }, [
        avatar,
        h('div', { class: 'flex flex-col min-w-0' }, nameElements),
      ])
    },
  },
  {
    title: 'Loadouts',
    key: 'loadoutCount',
    width: 100,
    align: 'center',
  },
  {
    title: 'Items',
    key: 'totalItems',
    width: 100,
    align: 'center',
  },
  {
    title: 'Last Activity',
    key: 'lastActivity',
    width: 180,
    render(row) {
      return h('span', { class: 'text-sm text-gray-400' }, formatDate(row.lastActivity))
    },
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
              : 'bg-green-500/20 text-green-400 border border-green-500/30',
          ],
        },
        row.isBanned ? 'Banned' : 'Active'
      )
    },
  },
  {
    title: 'Actions',
    key: 'actions',
    width: 200,
    align: 'center',
    render(row) {
      return h('div', { class: 'flex gap-2 justify-center' }, [
        h(
          SButton,
          {
            size: 'sm',
            variant: 'light',
            color: buttonColor.info,
            onClick: () => emit('view', row.steamId),
          },
          { default: () => 'View' }
        ),
        row.isBanned
          ? h(
              SButton,
              {
                size: 'sm',
                variant: 'light',
                color: buttonColor.success,
                onClick: () => emit('unban', row.steamId),
              },
              { default: () => 'Unban' }
            )
          : h(
              SButton,
              {
                size: 'sm',
                variant: 'light',
                color: buttonColor.error,
                onClick: () => emit('ban', row.steamId),
              },
              { default: () => 'Ban' }
            ),
      ])
    },
  },
]

const totalPages = computed(() => Math.ceil(props.total / props.pageSize))
</script>

<template>
  <div class="admin-user-table">
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
    --n-td-color: transparent
    --n-td-color-hover: rgba(200, 180, 130, 0.06)
    --n-td-color-striped: transparent
    --n-th-color: rgba(255, 255, 255, 0.02)
    --n-th-color-hover: rgba(200, 180, 130, 0.04)
    --n-merged-td-color: transparent
    --n-merged-td-color-hover: rgba(200, 180, 130, 0.06)
    background: transparent !important
    border: 1px solid var(--admin-glass-border)
    backdrop-filter: var(--admin-glass-blur) saturate(160%)
    -webkit-backdrop-filter: var(--admin-glass-blur) saturate(160%)
    border-radius: 14px
    overflow: hidden

    .n-data-table-wrapper
      background: transparent

    .n-data-table-table
      background: transparent

    .n-data-table-th
      border-bottom: 1px solid rgba(255, 255, 255, 0.06)
      color: rgba(255, 255, 255, 0.55)
      font-weight: 600

    .n-data-table-tr
      transition: background 0.2s ease

    .n-data-table-td
      border-bottom: 1px solid rgba(255, 255, 255, 0.04)
</style>
