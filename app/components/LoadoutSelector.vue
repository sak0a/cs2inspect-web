<script setup lang="ts">
import { steamAuth } from '~/services/steamAuth'
import type { DBLoadout } from '~/types'
import {
  LucideTrash2 as DeleteIcon,
  LucidePencil as RenameIcon,
  LucidePlus as NewIcon,
  LucideCopy as DuplicateIcon,
  LucideShare as ShareIcon,
  LucideStar as DefaultIcon,
  LucideEraser as ClearIcon,
  LucideDownload as ImportIcon,
  LucideEllipsisVertical as MenuIcon,
  LucideRefreshCw as RefreshIcon,
  LucideCheck as CheckIcon,
  LucideChevronDown as ChevronDownIcon,
} from '@lucide/vue'
import { toSteamId, toLoadoutId } from '~/types/core/branded'
import type { LoadoutId } from '~/types/core/branded'

const loadoutStore = useLoadoutStore()
const { t } = useI18n()
const message = useToast()

// Track the previous loadout ID to avoid activating on initial load
const previousLoadoutId = ref<LoadoutId | null>(null)

const showModal = ref({
  create: false,
  rename: false,
  delete: false,
  share: false,
  clear: false,
  import: false,
})

const formInputs = ref({
  newName: '',
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
  ],
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

// Form-reset fields per modal (former NModal @after-leave handlers)
const modalResetField = {
  create: 'newName',
  rename: 'renameName',
  delete: 'deleteConfirm',
  clear: 'clearConfirm',
  import: 'importCode',
} as const

function setModalVisible(modal: keyof typeof modalResetField, visible: boolean) {
  showModal.value[modal] = visible
  if (!visible) {
    formInputs.value[modalResetField[modal]] = ''
  }
}

function toggleClearCategory(cat: string, checked: boolean) {
  const next = new Set(formInputs.value.clearCategories)
  if (checked) {
    next.add(cat)
  } else {
    next.delete(cat)
  }
  formInputs.value.clearCategories = availableCategories.filter((c) => next.has(c))
}

// Tutorial integration: open/close create modal when tutorial requests it
const tutorialStore = useTutorialStore()
watch(
  () => tutorialStore.pendingAction,
  (action) => {
    if (action === 'open-loadout-create') {
      tutorialStore.clearAction()
      showModal.value.create = true
    } else if (action === 'close-loadout-create') {
      tutorialStore.clearAction()
      showModal.value.create = false
      formInputs.value.newName = ''
    }
  }
)

const handleLoadoutAction = async (
  action: 'create' | 'rename' | 'delete' | 'duplicate' | 'share' | 'default' | 'clear' | 'import'
) => {
  const user = steamAuth.getSavedUser()

  if (!user) {
    message.error(t('auth.rejectAction') as string, { duration: 2 })
    return
  }

  const loadoutId = loadoutStore.selectedLoadoutId
  // Import and Create don't need a selected loadout
  if (!['create', 'import'].includes(action) && !loadoutId) {
    message.error(t('common.pleaseSelectLoadout') as string, { duration: 2 })
    return
  }

  try {
    switch (action) {
      case 'create':
        await loadoutStore.createLoadout(toSteamId(user.steamId), formInputs.value.newName)
        break
      case 'import':
        await loadoutStore.importLoadout(toSteamId(user.steamId), formInputs.value.importCode)
        message.success(t('modals.loadout.import.success') as string, { duration: 2 })
        break
      case 'rename':
        await loadoutStore.updateLoadout(
          loadoutId!,
          toSteamId(user.steamId),
          formInputs.value.renameName
        )
        break
      case 'delete':
        await loadoutStore.deleteLoadout(toSteamId(user.steamId), loadoutId!)
        break
      case 'duplicate':
        await loadoutStore.duplicateLoadout(toSteamId(user.steamId), loadoutId!)
        message.success(t('modals.loadout.duplicate.success') as string, { duration: 2 })
        return
      case 'share': {
        formInputs.value.shareCode = loadoutStore.selectedLoadout?.share_code || ''
        showModal.value.share = true
        return
      }
      case 'default':
        await loadoutStore.setLoadoutAsDefault(toSteamId(user.steamId), loadoutId!)
        message.success(t('modals.loadout.default.success') as string, { duration: 2 })
        return
      case 'clear':
        await loadoutStore.clearLoadout(
          toSteamId(user.steamId),
          loadoutId!,
          formInputs.value.clearCategories
        )
        break
    }

    // Reset forms and close modals
    if (['create', 'rename', 'delete', 'clear', 'import'].includes(action)) {
      formInputs.value.newName = ''
      formInputs.value.renameName = ''
      formInputs.value.deleteConfirm = ''
      formInputs.value.clearConfirm = ''
      formInputs.value.importCode = ''
      // Reset categories to all checked by default for next time
      formInputs.value.clearCategories = [...availableCategories]

      showModal.value[action] = false

      // Success message for non-import/duplicate/share/default (handled above or existing logic)
      if (!['duplicate', 'share', 'default', 'import'].includes(action)) {
        message.success(t(`modals.loadout.${action}.successMessage`) as string, {
          duration: 2,
        })
      }
    }
  } catch (error: unknown) {
    console.error(error)
    const errorMessage = error instanceof Error ? error.message : 'An error occurred'
    message.error(errorMessage, { duration: 3, closable: true })
  }
}

// Watch for loadout selection changes and activate the selected loadout
watch(
  () => loadoutStore.selectedLoadoutId,
  async (newLoadoutId, oldLoadoutId) => {
    if (
      !newLoadoutId ||
      newLoadoutId === oldLoadoutId ||
      newLoadoutId === previousLoadoutId.value
    ) {
      return
    }

    const user = steamAuth.getSavedUser()
    if (!user) return

    const selectedLoadout = loadoutStore.loadouts.find(
      (l: DBLoadout) => toLoadoutId(l.id) === newLoadoutId
    )
    if (selectedLoadout && selectedLoadout.active) {
      previousLoadoutId.value = newLoadoutId
      return
    }

    try {
      await loadoutStore.activateLoadout(newLoadoutId, toSteamId(user.steamId))
      previousLoadoutId.value = newLoadoutId
    } catch (error: unknown) {
      console.error('Failed to activate loadout:', error)
      if (oldLoadoutId) {
        loadoutStore.selectedLoadoutId = oldLoadoutId
      }
      const errorMessage = error instanceof Error ? error.message : 'Failed to activate loadout'
      message.error(errorMessage, { duration: 3, closable: true })
    }
  }
)

const copyToClipboard = () => {
  navigator.clipboard.writeText(formInputs.value.shareCode)
  message.success(t('general.copiedToClipboard') as string)
}

const handleDeleteShareCode = async () => {
  const user = steamAuth.getSavedUser()
  if (!user || !loadoutStore.selectedLoadoutId) return
  try {
    await loadoutStore.deleteShareCode(toSteamId(user.steamId), loadoutStore.selectedLoadoutId)
    formInputs.value.shareCode = ''
    if (loadoutStore.selectedLoadout) {
      loadoutStore.selectedLoadout.share_code = null
    }
    message.success(t('modals.loadout.share.deleted') as string, { duration: 2 })
  } catch {
    message.error(t('modals.loadout.share.deleteError') as string, { duration: 2 })
  }
}

const handleGenerateShareCode = async () => {
  const user = steamAuth.getSavedUser()
  if (!user || !loadoutStore.selectedLoadoutId) return
  try {
    // If a share code already exists, delete it first so the API generates a new one
    if (formInputs.value.shareCode) {
      await loadoutStore.deleteShareCode(toSteamId(user.steamId), loadoutStore.selectedLoadoutId)
    }
    const code = await loadoutStore.shareLoadout(
      toSteamId(user.steamId),
      loadoutStore.selectedLoadoutId
    )
    formInputs.value.shareCode = code
    if (loadoutStore.selectedLoadout) {
      loadoutStore.selectedLoadout.share_code = code
    }
  } catch {
    message.error(t('modals.loadout.share.generateError') as string, { duration: 2 })
  }
}

const hasSelection = computed(() => loadoutStore.hasLoadouts && loadoutStore.selectedLoadoutId)
const isSelectedDefault = computed(() => !!loadoutStore.selectedLoadout?.is_default)

// Loadout display label with a localized "(Default)" tag
const loadoutLabel = (loadout: DBLoadout) =>
  loadout.name + (loadout.is_default ? ` (${t('loadout.defaultTag')})` : '')

// Filled star icon for "is default" state
const DefaultIconFilled = markRaw(
  defineComponent({
    inheritAttrs: false,
    setup(_, { attrs }) {
      return () => h(DefaultIcon, { ...attrs, fill: 'currentColor' })
    },
  })
)

const handleDropdownSelect = (key: string) => {
  if (key === 'create') showModal.value.create = true
  else if (key === 'import') showModal.value.import = true
  else if (key === 'rename') showModal.value.rename = true
  else if (key === 'delete') showModal.value.delete = true
  else if (key === 'clear') showModal.value.clear = true
  else handleLoadoutAction(key as 'duplicate' | 'share' | 'default')
}

onMounted(async () => {
  const user = steamAuth.getSavedUser()
  if (user?.steamId) {
    await loadoutStore.fetchLoadouts(toSteamId(user.steamId))
  }
})
</script>

<template>
  <div class="flex items-center gap-2">
    <!-- Loadout picker -->
    <DropdownMenu v-if="loadoutStore.hasLoadouts">
      <DropdownMenuTrigger as-child>
        <Button
          variant="ghost"
          size="default"
          data-tutorial="loadout-selector"
          class="min-w-[140px] max-w-[240px] justify-between gap-2 border border-border hover:border-border-strong"
        >
          <span class="min-w-0 truncate font-mono text-xs">
            {{
              loadoutStore.selectedLoadout
                ? loadoutLabel(loadoutStore.selectedLoadout)
                : t('loadout.select')
            }}
          </span>
          <ChevronDownIcon class="size-3 shrink-0 text-[var(--text-tertiary)]" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start" class="min-w-[180px]">
        <DropdownMenuItem
          v-for="loadout in loadoutStore.loadouts"
          :key="loadout.id"
          @select="loadoutStore.selectedLoadoutId = toLoadoutId(loadout.id)"
        >
          <span class="min-w-0 flex-1 truncate">
            {{ loadoutLabel(loadout) }}
          </span>
          <CheckIcon
            v-if="toLoadoutId(loadout.id) === loadoutStore.selectedLoadoutId"
            class="ml-auto size-3.5 text-primary"
          />
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>

    <!-- Loadout actions menu -->
    <DropdownMenu>
      <DropdownMenuTrigger as-child>
        <Button
          variant="ghost"
          size="icon"
          data-tutorial="loadout-create"
          class="border border-border hover:border-border-strong"
          :aria-label="t('loadout.manage') as string"
        >
          <template #icon-left>
            <MenuIcon :size="16" />
          </template>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start" class="min-w-[180px]">
        <DropdownMenuItem @select="handleDropdownSelect('create')">
          <NewIcon class="size-4" />
          <span>{{ String(t('loadout.create')) }}</span>
        </DropdownMenuItem>
        <DropdownMenuItem @select="handleDropdownSelect('import')">
          <ImportIcon class="size-4" />
          <span>{{ String(t('loadout.import')) }}</span>
        </DropdownMenuItem>

        <template v-if="hasSelection">
          <DropdownMenuSeparator />
          <DropdownMenuItem @select="handleDropdownSelect('rename')">
            <RenameIcon class="size-4" />
            <span>{{ String(t('loadout.actions.rename')) }}</span>
          </DropdownMenuItem>
          <DropdownMenuItem @select="handleDropdownSelect('duplicate')">
            <DuplicateIcon class="size-4" />
            <span>{{ String(t('loadout.actions.duplicate')) }}</span>
          </DropdownMenuItem>
          <DropdownMenuItem @select="handleDropdownSelect('share')">
            <ShareIcon class="size-4" />
            <span>{{ String(t('loadout.actions.share')) }}</span>
          </DropdownMenuItem>
          <DropdownMenuItem :disabled="isSelectedDefault" @select="handleDropdownSelect('default')">
            <component :is="isSelectedDefault ? DefaultIconFilled : DefaultIcon" class="size-4" />
            <span>
              {{
                String(
                  isSelectedDefault
                    ? t('loadout.actions.isDefault')
                    : t('loadout.actions.setDefault')
                )
              }}
            </span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" @select="handleDropdownSelect('clear')">
            <ClearIcon class="size-4" />
            <span>{{ String(t('loadout.actions.clear')) }}</span>
          </DropdownMenuItem>
          <DropdownMenuItem variant="destructive" @select="handleDropdownSelect('delete')">
            <DeleteIcon class="size-4" />
            <span>{{ String(t('loadout.actions.delete')) }}</span>
          </DropdownMenuItem>
        </template>
      </DropdownMenuContent>
    </DropdownMenu>
  </div>

  <!-- Create Modal -->
  <AppModal
    :visible="showModal.create"
    :closable="false"
    max-width="500px"
    :title="t('modals.loadout.create.title') as string"
    @update:visible="(v: boolean) => setModalVisible('create', v)"
  >
    <Input
      v-model="formInputs.newName"
      :minlength="1"
      :placeholder="t('modals.loadout.create.formPlaceholder') as string"
      data-tutorial="loadout-name-input"
    />
    <template #footer>
      <div class="flex justify-end gap-3">
        <Button
          variant="outline"
          size="default"
          @click="
            () => {
              showModal.create = false
              formInputs.newName = ''
            }
          "
        >
          {{ t('modals.loadout.create.cancel') }}
        </Button>
        <Button
          variant="default"
          size="default"
          :disabled="formInputs.newName === '' || formInputs.newName.length > 20"
          @click="handleLoadoutAction('create')"
        >
          {{ t('modals.loadout.create.confirm') }}
        </Button>
      </div>
    </template>
  </AppModal>

  <!-- Rename Modal -->
  <AppModal
    :visible="showModal.rename"
    :closable="false"
    max-width="500px"
    :title="
      t('modals.loadout.rename.title', {
        name: loadoutStore.selectedLoadout?.name || '',
      }) as string
    "
    @update:visible="(v: boolean) => setModalVisible('rename', v)"
  >
    <Input
      v-model="formInputs.renameName"
      :minlength="1"
      :placeholder="t('modals.loadout.rename.formPlaceholder') as string"
    />
    <template #footer>
      <div class="flex justify-end gap-3">
        <Button
          variant="outline"
          size="default"
          @click="
            () => {
              showModal.rename = false
              formInputs.renameName = ''
            }
          "
        >
          {{ t('modals.loadout.rename.cancel') }}
        </Button>
        <Button
          variant="default"
          size="default"
          :disabled="formInputs.renameName === '' || formInputs.renameName.length > 20"
          @click="handleLoadoutAction('rename')"
        >
          {{ t('modals.loadout.rename.confirm') }}
        </Button>
      </div>
    </template>
  </AppModal>

  <!-- Delete Modal -->
  <AppModal
    :visible="showModal.delete"
    :closable="false"
    max-width="500px"
    :title="
      t('modals.loadout.delete.title', {
        name: loadoutStore.selectedLoadout?.name || '',
      }) as string
    "
    @update:visible="(v: boolean) => setModalVisible('delete', v)"
  >
    <p>{{ t('modals.loadout.delete.question') }}</p>
    <p class="font-bold">{{ t('modals.loadout.delete.warning') }}</p>
    <div class="mt-4">
      <p class="mb-2">
        {{
          t('modals.loadout.delete.confirmText', {
            name: loadoutStore.selectedLoadout?.name || '',
          })
        }}
      </p>
      <Input
        v-model="formInputs.deleteConfirm"
        :minlength="1"
        :placeholder="t('modals.loadout.delete.confirmPlaceholder') as string"
      />
    </div>
    <template #footer>
      <div class="flex justify-end gap-3">
        <Button
          variant="outline"
          size="default"
          @click="
            () => {
              showModal.delete = false
              formInputs.deleteConfirm = ''
            }
          "
        >
          {{ t('modals.loadout.delete.cancel') }}
        </Button>
        <Button
          variant="destructive"
          size="default"
          :disabled="formInputs.deleteConfirm !== loadoutStore.selectedLoadout?.name"
          @click="handleLoadoutAction('delete')"
        >
          {{ t('modals.loadout.delete.confirm') }}
        </Button>
      </div>
    </template>
  </AppModal>

  <!-- Clear Modal -->
  <AppModal
    :visible="showModal.clear"
    :closable="false"
    max-width="500px"
    :title="
      t('modals.loadout.clear.title', {
        name: loadoutStore.selectedLoadout?.name || '',
      }) as string
    "
    @update:visible="(v: boolean) => setModalVisible('clear', v)"
  >
    <p>{{ t('modals.loadout.clear.question') }}</p>

    <div class="my-4">
      <p class="mb-2 font-bold">{{ t('modals.loadout.clear.selectCategories') }}</p>
      <div class="flex flex-wrap items-center gap-x-3 gap-y-2">
        <label
          v-for="cat in availableCategories"
          :key="cat"
          class="flex cursor-pointer select-none items-center gap-1.5 text-sm"
        >
          <Checkbox
            :model-value="formInputs.clearCategories.includes(cat)"
            @update:model-value="(checked) => toggleClearCategory(cat, checked === true)"
          />
          {{ cat }}
        </label>
      </div>
    </div>

    <p class="font-bold text-red-500">{{ t('modals.loadout.clear.warning') }}</p>
    <div class="mt-4">
      <p class="mb-2">
        {{
          t('modals.loadout.clear.confirmText', {
            name: loadoutStore.selectedLoadout?.name || '',
          })
        }}
      </p>
      <Input
        v-model="formInputs.clearConfirm"
        :placeholder="t('modals.loadout.clear.confirmPlaceholder') as string"
      />
    </div>
    <template #footer>
      <div class="flex justify-end gap-3">
        <Button variant="outline" size="default" @click="showModal.clear = false">
          {{ t('modals.loadout.clear.cancel') }}
        </Button>
        <Button
          variant="destructive"
          size="default"
          :disabled="
            formInputs.clearConfirm !== loadoutStore.selectedLoadout?.name ||
            formInputs.clearCategories.length === 0
          "
          @click="handleLoadoutAction('clear')"
        >
          {{ t('modals.loadout.clear.confirm') }}
        </Button>
      </div>
    </template>
  </AppModal>

  <!-- Share Modal -->
  <AppModal
    v-model:visible="showModal.share"
    :closable="false"
    max-width="500px"
    :title="
      t('modals.loadout.share.title', {
        name: loadoutStore.selectedLoadout?.name || '',
      }) as string
    "
  >
    <div class="flex flex-col gap-4">
      <!-- State: Has share code -->
      <template v-if="formInputs.shareCode">
        <p>{{ t('modals.loadout.share.description') }}</p>
        <div class="flex items-center gap-2">
          <Input v-model="formInputs.shareCode" readonly class="min-w-0 flex-1" />
          <Button variant="outline" class="shrink-0" @click="copyToClipboard">
            <template #icon-left>
              <DuplicateIcon :size="16" />
            </template>
          </Button>
        </div>
        <div class="flex gap-2 justify-center">
          <Button variant="outline" size="default" @click="handleGenerateShareCode">
            <template #icon-left>
              <RefreshIcon :size="16" />
            </template>
            {{ t('modals.loadout.share.regenerateButton') }}
          </Button>
          <Button variant="destructive" size="default" @click="handleDeleteShareCode">
            <template #icon-left>
              <DeleteIcon :size="16" />
            </template>
            {{ t('modals.loadout.share.deleteButton') }}
          </Button>
        </div>
      </template>

      <!-- State: No share code -->
      <template v-else>
        <p>{{ t('modals.loadout.share.noCode') }}</p>
        <Button variant="outline" size="default" @click="handleGenerateShareCode">
          <template #icon-left>
            <ShareIcon :size="16" />
          </template>
          {{ t('modals.loadout.share.generateButton') }}
        </Button>
      </template>
    </div>
  </AppModal>

  <!-- Import Modal -->
  <AppModal
    :visible="showModal.import"
    :closable="false"
    max-width="500px"
    :title="t('modals.loadout.import.title') as string"
    @update:visible="(v: boolean) => setModalVisible('import', v)"
  >
    <div class="flex flex-col gap-4">
      <p>{{ t('modals.loadout.import.description') }}</p>
      <Input
        v-model="formInputs.importCode"
        :placeholder="t('modals.loadout.import.placeholder') as string"
      />
    </div>
    <template #footer>
      <div class="flex justify-end gap-3">
        <Button variant="outline" size="default" @click="showModal.import = false">
          {{ t('modals.loadout.import.cancel') }}
        </Button>
        <Button
          variant="default"
          size="default"
          :disabled="formInputs.importCode.length < 13"
          @click="handleLoadoutAction('import')"
        >
          {{ t('modals.loadout.import.confirm') }}
        </Button>
      </div>
    </template>
  </AppModal>
</template>
