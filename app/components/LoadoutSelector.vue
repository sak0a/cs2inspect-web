<script setup lang="ts">
import { buttonColor } from '~/lib/buttonColors'
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
} from 'lucide-vue-next'
import { toSteamId, toLoadoutId } from '~/types/core/branded'
import type { LoadoutId } from '~/types/core/branded'

const loadoutStore = useLoadoutStore()
const { t } = useI18n()
const message = useMessage()

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
    <SDropdown
      v-if="loadoutStore.hasLoadouts"
      trigger="hover"
      variant="glass"
      data-tutorial="loadout-selector"
      @select="(key: string) => (loadoutStore.selectedLoadoutId = toLoadoutId(Number(key)))"
    >
      <template #trigger>
        <SButton
          rounded="full"
          variant="elevated"
          size="md"
          class="min-w-[140px] h-10 pl-4 pr-3 justify-between"
        >
          {{
            loadoutStore.selectedLoadout
              ? loadoutStore.selectedLoadout.name +
                (loadoutStore.selectedLoadout.is_default ? ' (Default)' : '')
              : t('loadout.select')
          }}
          <template #icon-right>
            <span class="mdi mdi-chevron-down text-xs" />
          </template>
        </SButton>
      </template>

      <SDropdownItem
        v-for="loadout in loadoutStore.loadouts"
        :key="loadout.id"
        :item-key="String(loadout.id)"
        :label="loadout.name + (loadout.is_default ? ' (Default)' : '')"
        :class="{
          '!border !border-primary !text-primary':
            toLoadoutId(loadout.id) === loadoutStore.selectedLoadoutId,
        }"
      >
        <template v-if="toLoadoutId(loadout.id) === loadoutStore.selectedLoadoutId" #trailing>
          <CheckIcon :size="14" class="text-primary" />
        </template>
      </SDropdownItem>
    </SDropdown>

    <SDropdown trigger="hover" variant="glass" @select="handleDropdownSelect">
      <template #trigger>
        <SButton
          icon-only
          rounded="full"
          variant="elevated"
          data-tutorial="loadout-create"
          :aria-label="t('loadout.manage') as string"
        >
          <template #icon-left>
            <MenuIcon :size="16" />
          </template>
        </SButton>
      </template>

      <SDropdownItem
        item-key="create"
        :label="String(t('loadout.create'))"
        :icon="NewIcon"
        icon-color="#22c55e"
      />
      <SDropdownItem
        item-key="import"
        :label="String(t('loadout.import'))"
        :icon="ImportIcon"
        icon-color="#3b82f6"
      />

      <template v-if="hasSelection">
        <SDropdownDivider class="bg-gray-500/20" />
        <SDropdownItem
          item-key="rename"
          :label="String(t('loadout.actions.rename'))"
          :icon="RenameIcon"
        />
        <SDropdownItem
          item-key="duplicate"
          :label="String(t('loadout.actions.duplicate'))"
          :icon="DuplicateIcon"
        />
        <SDropdownItem
          item-key="share"
          :label="String(t('loadout.actions.share'))"
          :icon="ShareIcon"
        />
        <SDropdownItem
          item-key="default"
          :label="
            String(
              isSelectedDefault ? t('loadout.actions.isDefault') : t('loadout.actions.setDefault')
            )
          "
          :icon="isSelectedDefault ? DefaultIconFilled : DefaultIcon"
          icon-color="#f59e0b"
          :disabled="isSelectedDefault"
        />
        <SDropdownDivider class="bg-gray-500/20" />
        <SDropdownItem
          item-key="clear"
          :label="String(t('loadout.actions.clear'))"
          :icon="ClearIcon"
          icon-color="#ef4444"
        />
        <SDropdownItem
          item-key="delete"
          :label="String(t('loadout.actions.delete'))"
          :icon="DeleteIcon"
          icon-color="#ef4444"
        />
      </template>
    </SDropdown>
  </div>

  <!-- Create Modal (Existing) -->
  <NModal
    v-model:show="showModal.create"
    preset="card"
    :bordered="false"
    :auto-focus="false"
    style="width: 500px"
    :title="t('modals.loadout.create.title') as string"
    @after-leave="formInputs.newName = ''"
  >
    <NInput
      v-model:value="formInputs.newName"
      :minlength="1"
      :placeholder="t('modals.loadout.create.formPlaceholder') as string"
      data-tutorial="loadout-name-input"
    />
    <template #footer>
      <div class="flex justify-end gap-3">
        <SButton
          :color="buttonColor.error"
          variant="elevated"
          rounded="full"
          size="md"
          tinted
          class="px-5 py-1.5"
          @click="
            () => {
              showModal.create = false
              formInputs.newName = ''
            }
          "
        >
          {{ t('modals.loadout.create.cancel') }}
        </SButton>
        <SButton
          :color="buttonColor.success"
          variant="elevated"
          rounded="full"
          size="md"
          tinted
          class="px-5 py-1.5"
          :disabled="formInputs.newName === '' || formInputs.newName.length > 20"
          @click="handleLoadoutAction('create')"
        >
          {{ t('modals.loadout.create.confirm') }}
        </SButton>
      </div>
    </template>
  </NModal>

  <!-- Rename Modal (Existing) -->
  <NModal
    v-model:show="showModal.rename"
    :bordered="false"
    :auto-focus="false"
    preset="card"
    style="width: 500px"
    :title="
      t('modals.loadout.rename.title', {
        name: loadoutStore.selectedLoadout?.name || '',
      }) as string
    "
    @after-leave="formInputs.renameName = ''"
  >
    <NInput
      v-model:value="formInputs.renameName"
      :minlength="1"
      :placeholder="t('modals.loadout.rename.formPlaceholder') as string"
    />
    <template #footer>
      <div class="flex justify-end gap-3">
        <SButton
          :color="buttonColor.error"
          variant="elevated"
          rounded="full"
          size="md"
          tinted
          class="px-5 py-1.5"
          @click="
            () => {
              showModal.rename = false
              formInputs.renameName = ''
            }
          "
        >
          {{ t('modals.loadout.rename.cancel') }}
        </SButton>
        <SButton
          :color="buttonColor.success"
          variant="elevated"
          rounded="full"
          size="md"
          tinted
          class="px-5 py-1.5"
          :disabled="formInputs.renameName === '' || formInputs.renameName.length > 20"
          @click="handleLoadoutAction('rename')"
        >
          {{ t('modals.loadout.rename.confirm') }}
        </SButton>
      </div>
    </template>
  </NModal>

  <!-- Delete Modal (Existing) -->
  <NModal
    v-model:show="showModal.delete"
    preset="card"
    :bordered="false"
    :auto-focus="false"
    style="width: 500px"
    :title="
      t('modals.loadout.delete.title', {
        name: loadoutStore.selectedLoadout?.name || '',
      }) as string
    "
    @after-leave="formInputs.deleteConfirm = ''"
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
      <NInput
        v-model:value="formInputs.deleteConfirm"
        :minlength="1"
        :placeholder="t('modals.loadout.delete.confirmPlaceholder') as string"
      />
    </div>
    <template #footer>
      <div class="flex justify-end gap-3">
        <SButton
          :color="buttonColor.error"
          variant="elevated"
          rounded="full"
          size="md"
          tinted
          class="px-5 py-1.5"
          @click="
            () => {
              showModal.delete = false
              formInputs.deleteConfirm = ''
            }
          "
        >
          {{ t('modals.loadout.delete.cancel') }}
        </SButton>
        <SButton
          :color="buttonColor.error"
          variant="elevated"
          rounded="full"
          size="md"
          tinted
          class="px-5 py-1.5"
          :disabled="formInputs.deleteConfirm !== loadoutStore.selectedLoadout?.name"
          @click="handleLoadoutAction('delete')"
        >
          {{ t('modals.loadout.delete.confirm') }}
        </SButton>
      </div>
    </template>
  </NModal>

  <!-- Clear Modal (Updated) -->
  <NModal
    v-model:show="showModal.clear"
    preset="card"
    :bordered="false"
    :auto-focus="false"
    style="width: 500px"
    :title="
      t('modals.loadout.clear.title', {
        name: loadoutStore.selectedLoadout?.name || '',
      }) as string
    "
    @after-leave="formInputs.clearConfirm = ''"
  >
    <p>{{ t('modals.loadout.clear.question') }}</p>

    <div class="my-4">
      <p class="mb-2 font-bold">{{ t('modals.loadout.clear.selectCategories') }}</p>
      <NCheckboxGroup v-model:value="formInputs.clearCategories">
        <NSpace item-style="display: flex;">
          <NCheckbox v-for="cat in availableCategories" :key="cat" :value="cat" :label="cat" />
        </NSpace>
      </NCheckboxGroup>
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
      <NInput
        v-model:value="formInputs.clearConfirm"
        :placeholder="t('modals.loadout.clear.confirmPlaceholder') as string"
      />
    </div>
    <template #footer>
      <div class="flex justify-end gap-3">
        <SButton
          variant="elevated"
          rounded="full"
          size="md"
          class="px-5 py-1.5"
          @click="showModal.clear = false"
        >
          {{ t('modals.loadout.clear.cancel') }}
        </SButton>
        <SButton
          :color="buttonColor.error"
          variant="elevated"
          rounded="full"
          size="md"
          tinted
          class="px-5 py-1.5"
          :disabled="
            formInputs.clearConfirm !== loadoutStore.selectedLoadout?.name ||
            formInputs.clearCategories.length === 0
          "
          @click="handleLoadoutAction('clear')"
        >
          {{ t('modals.loadout.clear.confirm') }}
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
    style="width: 500px"
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
        <NInputGroup>
          <NInput v-model:value="formInputs.shareCode" readonly />
          <SButton
            :color="buttonColor.primary"
            variant="elevated"
            tinted
            rounded="full"
            @click="copyToClipboard"
          >
            <template #icon-left>
              <DuplicateIcon :size="16" />
            </template>
          </SButton>
        </NInputGroup>
        <div class="flex gap-2 justify-center">
          <SButton
            :color="buttonColor.warning"
            variant="elevated"
            rounded="full"
            size="md"
            tinted
            class="px-5 py-1.5"
            @click="handleGenerateShareCode"
          >
            <template #icon-left>
              <RefreshIcon :size="16" />
            </template>
            {{ t('modals.loadout.share.regenerateButton') }}
          </SButton>
          <SButton
            :color="buttonColor.error"
            variant="elevated"
            rounded="full"
            size="md"
            tinted
            class="px-5 py-1.5"
            @click="handleDeleteShareCode"
          >
            <template #icon-left>
              <DeleteIcon :size="16" />
            </template>
            {{ t('modals.loadout.share.deleteButton') }}
          </SButton>
        </div>
      </template>

      <!-- State: No share code -->
      <template v-else>
        <p>{{ t('modals.loadout.share.noCode') }}</p>
        <SButton
          :color="buttonColor.primary"
          variant="elevated"
          rounded="full"
          size="md"
          tinted
          class="px-5 py-1.5"
          @click="handleGenerateShareCode"
        >
          <template #icon-left>
            <ShareIcon :size="16" />
          </template>
          {{ t('modals.loadout.share.generateButton') }}
        </SButton>
      </template>
    </div>
  </NModal>

  <!-- Import Modal (New) -->
  <NModal
    v-model:show="showModal.import"
    preset="card"
    :bordered="false"
    :auto-focus="false"
    style="width: 500px"
    :title="t('modals.loadout.import.title') as string"
    @after-leave="formInputs.importCode = ''"
  >
    <div class="flex flex-col gap-4">
      <p>{{ t('modals.loadout.import.description') }}</p>
      <NInput
        v-model:value="formInputs.importCode"
        :placeholder="t('modals.loadout.import.placeholder') as string"
      />
    </div>
    <template #footer>
      <div class="flex justify-end gap-3">
        <SButton
          variant="elevated"
          rounded="full"
          size="md"
          class="px-5 py-1.5"
          @click="showModal.import = false"
        >
          {{ t('modals.loadout.import.cancel') }}
        </SButton>
        <SButton
          :color="buttonColor.success"
          variant="elevated"
          rounded="full"
          size="md"
          tinted
          class="px-5 py-1.5"
          :disabled="formInputs.importCode.length < 13"
          @click="handleLoadoutAction('import')"
        >
          {{ t('modals.loadout.import.confirm') }}
        </SButton>
      </div>
    </template>
  </NModal>
</template>
<!-- glassmorphism-dropdown CSS removed — SDropdown variant="glass" handles this -->
