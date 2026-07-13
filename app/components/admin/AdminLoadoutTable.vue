<script setup lang="ts">
import { h } from 'vue'
import { buttonColor } from '~/lib/buttonColors'
import { LucideCopy as DuplicateIcon, LucideDownload as ImportIcon } from '@lucide/vue'
import { NTag, type DataTableColumns } from 'naive-ui'
import AdminLoadoutActions from '~/components/admin/AdminLoadoutActions.vue'
import type { DBLoadout } from '~/types'
import { api } from '~/utils/api'

interface Props {
  steamId: string
}

const props = defineProps<Props>()
const message = useMessage()

// State
const loadouts = ref<DBLoadout[]>([])
const isLoading = ref(false)
const selectedLoadout = ref<DBLoadout | null>(null)

// Modal states
const showModal = ref({
  rename: false,
  delete: false,
  share: false,
  clear: false,
  import: false,
})

// Form inputs
const formInputs = ref({
  renameName: '',
  deleteConfirm: '',
  shareCode: '',
  clearConfirm: '',
  importCode: '',
  clearCategories: [
    'Knives',
    'Gloves',
    'Pistols',
    'Rifles',
    'SMGs',
    'Heavys',
    'Agents',
    'Music',
    'Pins',
  ] as string[],
})

const availableCategories = [
  'Knives',
  'Gloves',
  'Pistols',
  'Rifles',
  'SMGs',
  'Heavys',
  'Agents',
  'Music',
  'Pins',
]

// Fetch loadouts
async function fetchLoadouts() {
  isLoading.value = true
  try {
    const response = await api.get<DBLoadout[]>('/api/loadouts', {
      steamId: props.steamId,
    })
    loadouts.value = response.data ?? []
  } catch (err) {
    console.error('Failed to fetch loadouts:', err)
    message.error('Failed to load loadouts')
  } finally {
    isLoading.value = false
  }
}

onMounted(fetchLoadouts)

// Format date
function formatDate(dateStr: string | null): string {
  if (!dateStr) return 'N/A'
  const date = new Date(dateStr)
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

// Commented out — replaced by AdminLoadoutActions component with SDropdown
// function getDropdownOptions(row: DBLoadout) { ... }

// Handle dropdown action selection
async function handleAction(key: string, row: DBLoadout) {
  selectedLoadout.value = row

  switch (key) {
    case 'rename':
      formInputs.value.renameName = row.name
      showModal.value.rename = true
      break
    case 'duplicate':
      await handleDuplicate(row)
      break
    case 'share':
      await handleShare(row)
      break
    case 'default':
      await handleSetDefault(row)
      break
    case 'clear':
      formInputs.value.clearCategories = [...availableCategories]
      formInputs.value.clearConfirm = ''
      showModal.value.clear = true
      break
    case 'delete':
      formInputs.value.deleteConfirm = ''
      showModal.value.delete = true
      break
  }
}

// Direct actions (no modal needed)
async function handleDuplicate(row: DBLoadout) {
  try {
    await api.post('/api/loadouts/duplicate', {
      steamId: props.steamId,
      loadoutId: String(row.id),
    })
    message.success('Loadout duplicated')
    await fetchLoadouts()
  } catch (err) {
    console.error('Failed to duplicate loadout:', err)
    message.error('Failed to duplicate loadout')
  }
}

async function handleShare(row: DBLoadout) {
  try {
    const response = await api.post<{ shareCode: string }>('/api/loadouts/share', {
      steamId: props.steamId,
      loadoutId: String(row.id),
    })
    formInputs.value.shareCode = response.data?.shareCode || ''
    showModal.value.share = true
  } catch (err) {
    console.error('Failed to generate share code:', err)
    message.error('Failed to generate share code')
  }
}

async function handleSetDefault(row: DBLoadout) {
  try {
    await api.post('/api/loadouts/default', {
      steamId: props.steamId,
      loadoutId: String(row.id),
    })
    message.success('Default loadout updated')
    await fetchLoadouts()
  } catch (err) {
    console.error('Failed to set default:', err)
    message.error('Failed to set default loadout')
  }
}

// Modal confirmation actions
async function handleRenameConfirm() {
  if (!selectedLoadout.value) return
  try {
    await api.put(`/api/loadouts/${selectedLoadout.value.id}`, {
      steamId: props.steamId,
      name: formInputs.value.renameName,
    })
    message.success('Loadout renamed')
    showModal.value.rename = false
    formInputs.value.renameName = ''
    await fetchLoadouts()
  } catch (err) {
    console.error('Failed to rename loadout:', err)
    message.error('Failed to rename loadout')
  }
}

async function handleDeleteConfirm() {
  if (!selectedLoadout.value) return
  try {
    await api.delete(`/api/loadouts/${selectedLoadout.value.id}`, {
      steamId: props.steamId,
    })
    message.success('Loadout deleted')
    showModal.value.delete = false
    formInputs.value.deleteConfirm = ''
    await fetchLoadouts()
  } catch (err) {
    console.error('Failed to delete loadout:', err)
    message.error('Failed to delete loadout')
  }
}

async function handleClearConfirm() {
  if (!selectedLoadout.value) return
  try {
    await api.post('/api/loadouts/clear', {
      steamId: props.steamId,
      loadoutId: String(selectedLoadout.value.id),
      categories: formInputs.value.clearCategories,
    })
    message.success('Loadout items cleared')
    showModal.value.clear = false
    formInputs.value.clearConfirm = ''
    formInputs.value.clearCategories = [...availableCategories]
    await fetchLoadouts()
  } catch (err) {
    console.error('Failed to clear loadout:', err)
    message.error('Failed to clear loadout items')
  }
}

async function handleImportConfirm() {
  try {
    await api.post('/api/loadouts/import', {
      steamId: props.steamId,
      shareCode: formInputs.value.importCode,
    })
    message.success('Loadout imported')
    showModal.value.import = false
    formInputs.value.importCode = ''
    await fetchLoadouts()
  } catch (err) {
    console.error('Failed to import loadout:', err)
    message.error('Failed to import loadout')
  }
}

function copyToClipboard() {
  navigator.clipboard.writeText(formInputs.value.shareCode)
  message.success('Copied to clipboard')
}

// Table columns
const columns: DataTableColumns<DBLoadout> = [
  {
    title: 'Name',
    key: 'name',
    render(row) {
      return h('span', { class: 'font-medium text-white' }, row.name)
    },
  },
  {
    title: 'Status',
    key: 'status',
    width: 160,
    render(row) {
      const tags = []
      if (row.active) {
        tags.push(
          h(NTag, { type: 'success', size: 'small', round: true }, { default: () => 'Active' })
        )
      }
      if (row.is_default === 1 || row.is_default === true) {
        tags.push(
          h(NTag, { type: 'warning', size: 'small', round: true }, { default: () => 'Default' })
        )
      }
      return tags.length > 0
        ? h('div', { class: 'flex gap-1' }, tags)
        : h('span', { class: 'text-gray-500 text-sm' }, '-')
    },
  },
  {
    title: 'Created',
    key: 'created_at',
    width: 180,
    render(row) {
      return h('span', { class: 'text-sm text-gray-400' }, formatDate(row.created_at as string))
    },
  },
  {
    title: 'Updated',
    key: 'updated_at',
    width: 180,
    render(row) {
      return h('span', { class: 'text-sm text-gray-400' }, formatDate(row.updated_at as string))
    },
  },
  {
    title: '',
    key: 'actions',
    width: 60,
    align: 'center',
    render(row) {
      return h(AdminLoadoutActions, {
        row,
        onAction: (key: string) => handleAction(key, row),
      })
    },
  },
]
</script>

<template>
  <div class="glass-card p-6">
    <!-- Header -->
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-lg font-semibold text-white">Manage Loadouts</h3>
      <SButton variant="light" size="sm" @click="showModal.import = true">
        <template #icon-left>
          <ImportIcon />
        </template>
        Import
      </SButton>
    </div>

    <!-- Table -->
    <div class="admin-loadout-table">
      <NDataTable
        :columns="columns"
        :data="loadouts"
        :loading="isLoading"
        :bordered="false"
        :single-line="false"
        class="rounded-lg overflow-hidden"
      />
    </div>

    <!-- Empty state -->
    <div v-if="!isLoading && loadouts.length === 0" class="py-6 text-center">
      <p class="text-gray-500">No loadouts found for this user.</p>
    </div>
  </div>

  <!-- Rename Modal -->
  <NModal
    v-model:show="showModal.rename"
    preset="card"
    :bordered="false"
    :auto-focus="false"
    style="width: 500px"
    title="Rename Loadout"
    @after-leave="formInputs.renameName = ''"
  >
    <NInput
      v-model:value="formInputs.renameName"
      placeholder="New loadout name"
      :maxlength="25"
      show-count
    />
    <template #footer>
      <div class="flex justify-end gap-3">
        <SButton variant="light" @click="showModal.rename = false"> Cancel </SButton>
        <SButton
          :color="buttonColor.success"
          variant="light"
          :disabled="formInputs.renameName.length === 0 || formInputs.renameName.length > 25"
          @click="handleRenameConfirm"
        >
          Rename
        </SButton>
      </div>
    </template>
  </NModal>

  <!-- Delete Modal -->
  <NModal
    v-model:show="showModal.delete"
    preset="card"
    :bordered="false"
    :auto-focus="false"
    style="width: 500px"
    title="Delete Loadout"
    @after-leave="formInputs.deleteConfirm = ''"
  >
    <div class="space-y-3">
      <p>
        Are you sure you want to delete this loadout? This will remove the loadout and all its
        items.
      </p>
      <p class="font-bold text-red-400">This action cannot be undone.</p>
      <div>
        <p class="mb-2 text-sm text-gray-400">
          Type <span class="font-mono text-white">{{ selectedLoadout?.name }}</span> to confirm:
        </p>
        <NInput
          v-model:value="formInputs.deleteConfirm"
          placeholder="Type loadout name to confirm"
        />
      </div>
    </div>
    <template #footer>
      <div class="flex justify-end gap-3">
        <SButton variant="light" @click="showModal.delete = false"> Cancel </SButton>
        <SButton
          :color="buttonColor.error"
          variant="light"
          :disabled="formInputs.deleteConfirm !== selectedLoadout?.name"
          @click="handleDeleteConfirm"
        >
          Delete
        </SButton>
      </div>
    </template>
  </NModal>

  <!-- Clear Modal -->
  <NModal
    v-model:show="showModal.clear"
    preset="card"
    :bordered="false"
    :auto-focus="false"
    style="width: 500px"
    title="Clear Loadout Items"
    @after-leave="formInputs.clearConfirm = ''"
  >
    <div class="space-y-4">
      <p>Select the item categories to clear from this loadout.</p>

      <NCheckboxGroup v-model:value="formInputs.clearCategories">
        <NSpace item-style="display: flex;">
          <NCheckbox v-for="cat in availableCategories" :key="cat" :value="cat" :label="cat" />
        </NSpace>
      </NCheckboxGroup>

      <p class="font-bold text-red-400">This action cannot be undone.</p>
      <div>
        <p class="mb-2 text-sm text-gray-400">
          Type <span class="font-mono text-white">{{ selectedLoadout?.name }}</span> to confirm:
        </p>
        <NInput
          v-model:value="formInputs.clearConfirm"
          placeholder="Type loadout name to confirm"
        />
      </div>
    </div>
    <template #footer>
      <div class="flex justify-end gap-3">
        <SButton variant="light" @click="showModal.clear = false"> Cancel </SButton>
        <SButton
          :color="buttonColor.error"
          variant="light"
          :disabled="
            formInputs.clearConfirm !== selectedLoadout?.name ||
            formInputs.clearCategories.length === 0
          "
          @click="handleClearConfirm"
        >
          Clear Items
        </SButton>
      </div>
    </template>
  </NModal>

  <!-- Share Modal -->
  <NModal
    v-model:show="showModal.share"
    preset="card"
    :bordered="false"
    :auto-focus="false"
    style="width: 400px"
    title="Share Code"
  >
    <div class="space-y-3">
      <p class="text-sm text-gray-400">Share this code to let others import this loadout.</p>
      <NInputGroup>
        <NInput v-model:value="formInputs.shareCode" readonly />
        <SButton :color="buttonColor.primary" variant="outlined" icon-only @click="copyToClipboard">
          <template #icon-left>
            <DuplicateIcon />
          </template>
        </SButton>
      </NInputGroup>
    </div>
  </NModal>

  <!-- Import Modal -->
  <NModal
    v-model:show="showModal.import"
    preset="card"
    :bordered="false"
    :auto-focus="false"
    style="width: 500px"
    title="Import Loadout"
    @after-leave="formInputs.importCode = ''"
  >
    <div class="space-y-3">
      <p class="text-sm text-gray-400">Enter a share code to import a loadout for this user.</p>
      <NInput v-model:value="formInputs.importCode" placeholder="e.g. LO-ABCDEFGHIJ" />
    </div>
    <template #footer>
      <div class="flex justify-end gap-3">
        <SButton variant="light" @click="showModal.import = false"> Cancel </SButton>
        <SButton
          :color="buttonColor.success"
          variant="light"
          :disabled="formInputs.importCode.length < 13"
          @click="handleImportConfirm"
        >
          Import
        </SButton>
      </div>
    </template>
  </NModal>
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

.admin-loadout-table
  :deep(.n-data-table)
    --n-td-color: transparent
    --n-td-color-hover: rgba(200, 180, 130, 0.06)
    --n-td-color-striped: transparent
    --n-th-color: rgba(255, 255, 255, 0.02)
    --n-th-color-hover: rgba(200, 180, 130, 0.04)
    --n-merged-td-color: transparent
    --n-merged-td-color-hover: rgba(200, 180, 130, 0.06)
    background: transparent !important
    border: 1px solid rgba(255, 255, 255, 0.05)
    border-radius: 12px
    overflow: hidden

    .n-data-table-wrapper
      background: transparent

    .n-data-table-table
      background: transparent

    .n-data-table-th
      border-bottom: 1px solid rgba(255, 255, 255, 0.06)
      color: rgba(255, 255, 255, 0.55)
      font-weight: 600

    .n-data-table-td
      border-bottom: 1px solid rgba(255, 255, 255, 0.04)

    .n-data-table-tr
      transition: background 0.2s ease
</style>
