<script setup lang="ts">
import {
  LucideChevronLeft as ChevronLeftIcon,
  LucideChevronRight as ChevronRightIcon,
} from '@lucide/vue'
import type { AdminUserSummary } from '~/types'

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

const totalPages = computed(() => Math.ceil(props.total / props.pageSize))
</script>

<template>
  <div class="admin-user-table">
    <!-- Data Table -->
    <div class="admin-table-surface">
      <Table :class="{ 'opacity-60 pointer-events-none': loading }">
        <TableHeader>
          <TableRow class="border-white/6 bg-white/2 hover:bg-transparent">
            <TableHead class="w-[280px] px-3 font-semibold text-white/55">User</TableHead>
            <TableHead class="w-[100px] px-3 text-center font-semibold text-white/55">
              Loadouts
            </TableHead>
            <TableHead class="w-[100px] px-3 text-center font-semibold text-white/55">
              Items
            </TableHead>
            <TableHead class="w-[180px] px-3 font-semibold text-white/55">Last Activity</TableHead>
            <TableHead class="w-[100px] px-3 text-center font-semibold text-white/55">
              Status
            </TableHead>
            <TableHead class="w-[200px] px-3 text-center font-semibold text-white/55">
              Actions
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow
            v-for="row in users"
            :key="row.steamId"
            class="border-white/4 hover:bg-[rgba(200,180,130,0.06)]"
          >
            <TableCell class="px-3 py-3">
              <div class="flex items-center gap-3">
                <img
                  v-if="row.avatarFull"
                  :src="row.avatarFull"
                  :alt="row.personaName || row.steamId"
                  loading="lazy"
                  class="w-8 h-8 rounded-lg object-cover shrink-0"
                />
                <div
                  v-else
                  class="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center shrink-0 text-xs font-bold opacity-50"
                >
                  {{ row.steamId.slice(-2).toUpperCase() }}
                </div>
                <div class="flex flex-col min-w-0">
                  <span v-if="row.personaName" class="text-sm text-white truncate">
                    {{ row.personaName }}
                  </span>
                  <span class="font-mono text-xs text-gray-400 truncate">{{ row.steamId }}</span>
                </div>
              </div>
            </TableCell>
            <TableCell class="px-3 py-3 text-center">{{ row.loadoutCount }}</TableCell>
            <TableCell class="px-3 py-3 text-center">{{ row.totalItems }}</TableCell>
            <TableCell class="px-3 py-3">
              <span class="text-sm text-gray-400">{{ formatDate(row.lastActivity) }}</span>
            </TableCell>
            <TableCell class="px-3 py-3 text-center">
              <span
                class="px-2 py-1 rounded-full text-xs font-medium"
                :class="
                  row.isBanned
                    ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                    : 'bg-green-500/20 text-green-400 border border-green-500/30'
                "
              >
                {{ row.isBanned ? 'Banned' : 'Active' }}
              </span>
            </TableCell>
            <TableCell class="px-3 py-3 text-center">
              <div class="flex gap-2 justify-center">
                <Button
                  size="sm"
                  variant="light"
                  intent="info"
                  rounded="md"
                  @click="emit('view', row.steamId)"
                >
                  View
                </Button>
                <Button
                  v-if="row.isBanned"
                  size="sm"
                  variant="light"
                  intent="success"
                  rounded="md"
                  @click="emit('unban', row.steamId)"
                >
                  Unban
                </Button>
                <Button
                  v-else
                  size="sm"
                  variant="light"
                  intent="error"
                  rounded="md"
                  @click="emit('ban', row.steamId)"
                >
                  Ban
                </Button>
              </div>
            </TableCell>
          </TableRow>
          <TableRow v-if="!loading && users.length === 0" class="border-white/4 hover:bg-transparent">
            <TableCell :colspan="6" class="px-3 py-8 text-center text-gray-500">
              No users found
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
      <div v-if="loading && users.length === 0" class="flex items-center justify-center py-6">
        <Spinner class="size-6 text-primary" />
      </div>
    </div>

    <!-- Pagination -->
    <div v-if="totalPages > 1" class="mt-4 flex justify-center">
      <Pagination
        :page="page"
        :total="total"
        :items-per-page="pageSize"
        :sibling-count="1"
        show-edges
        @update:page="handlePageChange"
      >
        <PaginationContent v-slot="{ items }">
          <PaginationPrevious>
            <ChevronLeftIcon />
          </PaginationPrevious>
          <template v-for="(item, index) in items" :key="index">
            <PaginationItem
              v-if="item.type === 'page'"
              :value="item.value"
              :is-active="item.value === page"
            >
              {{ item.value }}
            </PaginationItem>
            <PaginationEllipsis v-else />
          </template>
          <PaginationNext>
            <ChevronRightIcon />
          </PaginationNext>
        </PaginationContent>
      </Pagination>
    </div>

    <!-- Summary -->
    <div class="mt-4 text-sm text-gray-400 text-center">
      Showing {{ users.length }} of {{ total }} users
    </div>
  </div>
</template>

<style scoped lang="sass">
// Glass table surface (port of the old data-table deep overrides)
.admin-table-surface
  background: transparent
  border: 1px solid var(--admin-glass-border)
  backdrop-filter: var(--admin-glass-blur) saturate(160%)
  -webkit-backdrop-filter: var(--admin-glass-blur) saturate(160%)
  border-radius: 14px
  overflow: hidden
</style>
