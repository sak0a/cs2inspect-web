<script setup lang="ts">
import { LucideCopy as DuplicateIcon, LucideDownload as ImportIcon } from '@lucide/vue'
import type { DBLoadout } from '~/types'
import { api } from '~/utils/api'

interface Props {
  steamId: string
}

const props = defineProps<Props>()
const message = useToast()

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

function isDefaultLoadout(row: DBLoadout): boolean {
  return row.is_default === 1 || row.is_default === true
}

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

function toggleClearCategory(category: string, checked: boolean) {
  if (checked) {
    if (!formInputs.value.clearCategories.includes(category)) {
      formInputs.value.clearCategories.push(category)
    }
  } else {
    formInputs.value.clearCategories = formInputs.value.clearCategories.filter(
      (c) => c !== category
    )
  }
}

// Replacement for the old modal after-leave reset hooks: reset the form value
// once the close transition has finished (guarded against quick re-opens).
function resetAfterClose(isOpen: () => boolean, reset: () => void) {
  setTimeout(() => {
    if (!isOpen()) reset()
  }, 250)
}

watch(
  () => showModal.value.rename,
  (open) => {
    if (!open)
      resetAfterClose(
        () => showModal.value.rename,
        () => {
          formInputs.value.renameName = ''
        }
      )
  }
)

watch(
  () => showModal.value.delete,
  (open) => {
    if (!open)
      resetAfterClose(
        () => showModal.value.delete,
        () => {
          formInputs.value.deleteConfirm = ''
        }
      )
  }
)

watch(
  () => showModal.value.clear,
  (open) => {
    if (!open)
      resetAfterClose(
        () => showModal.value.clear,
        () => {
          formInputs.value.clearConfirm = ''
        }
      )
  }
)

watch(
  () => showModal.value.import,
  (open) => {
    if (!open)
      resetAfterClose(
        () => showModal.value.import,
        () => {
          formInputs.value.importCode = ''
        }
      )
  }
)
</script>

<template>
  <div class="glass-card p-6">
    <!-- Header -->
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-lg font-semibold text-white">Manage Loadouts</h3>
      <Button variant="secondary" size="sm" @click="showModal.import = true">
        <template #icon-left>
          <ImportIcon />
        </template>
        Import
      </Button>
    </div>

    <!-- Table -->
    <div class="admin-loadout-table">
      <Table :class="{ 'opacity-60 pointer-events-none': isLoading }">
        <TableHeader>
          <TableRow class="border-white/6 bg-white/2 hover:bg-transparent">
            <TableHead class="px-3 font-semibold text-white/55">Name</TableHead>
            <TableHead class="w-[160px] px-3 font-semibold text-white/55">Status</TableHead>
            <TableHead class="w-[180px] px-3 font-semibold text-white/55">Created</TableHead>
            <TableHead class="w-[180px] px-3 font-semibold text-white/55">Updated</TableHead>
            <TableHead class="w-[60px] px-3 text-center font-semibold text-white/55" />
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow
            v-for="row in loadouts"
            :key="row.id"
            class="border-white/4 hover:bg-[rgba(200,180,130,0.06)]"
          >
            <TableCell class="px-3 py-3">
              <span class="font-medium text-white">{{ row.name }}</span>
            </TableCell>
            <TableCell class="px-3 py-3">
              <div v-if="row.active || isDefaultLoadout(row)" class="flex gap-1">
                <Badge
                  v-if="row.active"
                  variant="outline"
                  class="border-emerald-500/30 bg-emerald-500/15 text-emerald-400"
                >
                  Active
                </Badge>
                <Badge
                  v-if="isDefaultLoadout(row)"
                  variant="outline"
                  class="border-amber-500/30 bg-amber-500/15 text-amber-400"
                >
                  Default
                </Badge>
              </div>
              <span v-else class="text-gray-500 text-sm">-</span>
            </TableCell>
            <TableCell class="px-3 py-3">
              <span class="text-sm text-gray-400">{{ formatDate(row.created_at) }}</span>
            </TableCell>
            <TableCell class="px-3 py-3">
              <span class="text-sm text-gray-400">{{ formatDate(row.updated_at) }}</span>
            </TableCell>
            <TableCell class="px-3 py-3 text-center">
              <div class="flex justify-center">
                <AdminLoadoutActions :row="row" @action="(key) => handleAction(key, row)" />
              </div>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
      <div v-if="isLoading && loadouts.length === 0" class="flex items-center justify-center py-6">
        <Spinner class="size-6 text-primary" />
      </div>
    </div>

    <!-- Empty state -->
    <div v-if="!isLoading && loadouts.length === 0" class="py-6 text-center">
      <p class="text-gray-500">No loadouts found for this user.</p>
    </div>
  </div>

  <!-- Rename Modal -->
  <AppModal v-model:visible="showModal.rename" title="Rename Loadout" max-width="500px">
    <Input
      :model-value="formInputs.renameName"
      placeholder="New loadout name"
      :maxlength="25"
      @update:model-value="(val) => (formInputs.renameName = String(val))"
    />
    <div class="mt-1 text-right text-xs text-gray-500">{{ formInputs.renameName.length }}/25</div>
    <template #footer>
      <div class="flex justify-end gap-3">
        <Button variant="secondary" @click="showModal.rename = false"> Cancel </Button>
        <Button
          variant="default"
          :disabled="formInputs.renameName.length === 0 || formInputs.renameName.length > 25"
          @click="handleRenameConfirm"
        >
          Rename
        </Button>
      </div>
    </template>
  </AppModal>

  <!-- Delete Modal -->
  <AppModal v-model:visible="showModal.delete" title="Delete Loadout" max-width="500px">
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
        <Input
          :model-value="formInputs.deleteConfirm"
          placeholder="Type loadout name to confirm"
          @update:model-value="(val) => (formInputs.deleteConfirm = String(val))"
        />
      </div>
    </div>
    <template #footer>
      <div class="flex justify-end gap-3">
        <Button variant="secondary" @click="showModal.delete = false"> Cancel </Button>
        <Button
          variant="destructive"
          :disabled="formInputs.deleteConfirm !== selectedLoadout?.name"
          @click="handleDeleteConfirm"
        >
          Delete
        </Button>
      </div>
    </template>
  </AppModal>

  <!-- Clear Modal -->
  <AppModal v-model:visible="showModal.clear" title="Clear Loadout Items" max-width="500px">
    <div class="space-y-4">
      <p>Select the item categories to clear from this loadout.</p>

      <div class="flex flex-wrap gap-x-4 gap-y-2">
        <label
          v-for="cat in availableCategories"
          :key="cat"
          class="flex cursor-pointer select-none items-center gap-2 text-sm"
        >
          <Checkbox
            :model-value="formInputs.clearCategories.includes(cat)"
            @update:model-value="(checked) => toggleClearCategory(cat, checked === true)"
          />
          {{ cat }}
        </label>
      </div>

      <p class="font-bold text-red-400">This action cannot be undone.</p>
      <div>
        <p class="mb-2 text-sm text-gray-400">
          Type <span class="font-mono text-white">{{ selectedLoadout?.name }}</span> to confirm:
        </p>
        <Input
          :model-value="formInputs.clearConfirm"
          placeholder="Type loadout name to confirm"
          @update:model-value="(val) => (formInputs.clearConfirm = String(val))"
        />
      </div>
    </div>
    <template #footer>
      <div class="flex justify-end gap-3">
        <Button variant="secondary" @click="showModal.clear = false"> Cancel </Button>
        <Button
          variant="destructive"
          :disabled="
            formInputs.clearConfirm !== selectedLoadout?.name ||
            formInputs.clearCategories.length === 0
          "
          @click="handleClearConfirm"
        >
          Clear Items
        </Button>
      </div>
    </template>
  </AppModal>

  <!-- Share Modal -->
  <AppModal v-model:visible="showModal.share" title="Share Code" max-width="400px">
    <div class="space-y-3">
      <p class="text-sm text-gray-400">Share this code to let others import this loadout.</p>
      <div class="flex items-center gap-2">
        <Input :model-value="formInputs.shareCode" readonly class="flex-1" />
        <Button variant="outline" size="icon" @click="copyToClipboard">
          <template #icon-left>
            <DuplicateIcon />
          </template>
        </Button>
      </div>
    </div>
  </AppModal>

  <!-- Import Modal -->
  <AppModal v-model:visible="showModal.import" title="Import Loadout" max-width="500px">
    <div class="space-y-3">
      <p class="text-sm text-gray-400">Enter a share code to import a loadout for this user.</p>
      <Input
        :model-value="formInputs.importCode"
        placeholder="e.g. LO-ABCDEFGHIJ"
        @update:model-value="(val) => (formInputs.importCode = String(val))"
      />
    </div>
    <template #footer>
      <div class="flex justify-end gap-3">
        <Button variant="secondary" @click="showModal.import = false"> Cancel </Button>
        <Button
          variant="default"
          :disabled="formInputs.importCode.length < 13"
          @click="handleImportConfirm"
        >
          Import
        </Button>
      </div>
    </template>
  </AppModal>
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

// Table surface (port of the old data-table deep overrides)
.admin-loadout-table
  background: transparent
  border: 1px solid rgba(255, 255, 255, 0.05)
  border-radius: 12px
  overflow: hidden
</style>
