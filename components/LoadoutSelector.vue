<script setup lang="ts">

import { steamAuth } from '~/services/steamAuth'
import type { DBLoadout } from '~/types'
import {
  Trash as DeleteIcon,
  Edit as RenameIcon,
  Plus as NewIcon,
  Copy as DuplicateIcon,
  Share as ShareIcon,
  Star as DefaultIcon,
  Eraser as ClearIcon,
  Download as ImportIcon,
  DotsVertical as MenuIcon
} from '@vicons/tabler'
import { Star as DefaultFilledIcon } from '@vicons/ionicons5'
import { NIcon } from 'naive-ui'
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
  import: false
})

const formInputs = ref({
  newName: '',
  renameName: '',
  deleteConfirm: '',
  shareCode: '',
  clearConfirm: '',
  importCode: '',
  clearCategories: ['Knives', 'Gloves', 'Pistols', 'Rifles', 'SMGs', 'Heavys', 'Agents', 'Music', 'Pins']
})

const availableCategories = ['Knives', 'Gloves', 'Pistols', 'Rifles', 'SMGs', 'Heavys', 'Agents', 'Music', 'Pins']

const handleLoadoutAction = async (action: 'create' | 'rename' | 'delete' | 'duplicate' | 'share' | 'default' | 'clear' | 'import') => {
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
        await loadoutStore.updateLoadout(loadoutId!, toSteamId(user.steamId), formInputs.value.renameName)
        break
      case 'delete':
        await loadoutStore.deleteLoadout(toSteamId(user.steamId), loadoutId!)
        break
      case 'duplicate':
        await loadoutStore.duplicateLoadout(toSteamId(user.steamId), loadoutId!)
        message.success(t('modals.loadout.duplicate.success') as string, { duration: 2 })
        return
      case 'share': {
        const code = await loadoutStore.shareLoadout(toSteamId(user.steamId), loadoutId!)
        formInputs.value.shareCode = code
        showModal.value.share = true
        return
      }
      case 'default':
        await loadoutStore.setLoadoutAsDefault(toSteamId(user.steamId), loadoutId!)
        message.success(t('modals.loadout.default.success') as string, { duration: 2 })
        return
      case 'clear':
        await loadoutStore.clearLoadout(toSteamId(user.steamId), loadoutId!, formInputs.value.clearCategories)
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
             message.success(t(`modals.loadout.${action}.successMessage`) as string, { duration: 2 })
        }
    }

  } catch (error: unknown) {
    console.error(error)
    const errorMessage = error instanceof Error ? error.message : 'An error occurred'
    message.error(errorMessage, { duration: 3, closable: true })
  }
}

// Watch for loadout selection changes and activate the selected loadout
watch(() => loadoutStore.selectedLoadoutId, async (newLoadoutId, oldLoadoutId) => {
  if (!newLoadoutId || newLoadoutId === oldLoadoutId || newLoadoutId === previousLoadoutId.value) {
    return
  }

  const user = steamAuth.getSavedUser()
  if (!user) return

  const selectedLoadout = loadoutStore.loadouts.find((l: DBLoadout) => toLoadoutId(l.id) === newLoadoutId)
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
})

const copyToClipboard = () => {
    navigator.clipboard.writeText(formInputs.value.shareCode)
    message.success(t('general.copiedToClipboard') as string)
}

const dropdownOptions = computed(() => {
    // Check if current loadout is default
    const isDefault = loadoutStore.selectedLoadout?.is_default === 1 || loadoutStore.selectedLoadout?.is_default === true;
    
    return [
      { label: t('loadout.actions.rename'), key: 'rename', icon: () => h(NIcon, null, { default: () => h(RenameIcon) }) },
      { label: t('loadout.actions.duplicate'), key: 'duplicate', icon: () => h(NIcon, null, { default: () => h(DuplicateIcon) }) },
      { label: t('loadout.actions.share'), key: 'share', icon: () => h(NIcon, null, { default: () => h(ShareIcon) }) },
      { 
          label: t('loadout.actions.setDefault'), 
          key: 'default', 
          icon: () => h(NIcon, { color: '#f59e0b' }, { default: () => h(isDefault ? DefaultFilledIcon : DefaultIcon) }) 
      },
      { type: 'divider', key: 'd1' },
      { label: t('loadout.actions.clear'), key: 'clear', icon: () => h(NIcon, { color: '#ef4444' }, { default: () => h(ClearIcon) }) }, // Red
      { label: t('loadout.actions.delete'), key: 'delete', icon: () => h(NIcon, { color: '#ef4444' }, { default: () => h(DeleteIcon) }) } // Red
    ]
})

const menuProps = () => ({ class: 'glassmorphism-dropdown' })

const handleDropdownSelect = (key: any) => {
    if (key === 'rename') showModal.value.rename = true
    else if (key === 'delete') showModal.value.delete = true
    else if (key === 'clear') showModal.value.clear = true
    else handleLoadoutAction(key as any)
}

onMounted(async () => {
    const user = steamAuth.getSavedUser()
    if (user?.steamId) {
        await loadoutStore.fetchLoadouts(toSteamId(user.steamId))
    }
})
</script>

<template>
  <NSpace vertical>
    <NSpace align="center">
      <NSelect
          v-if="loadoutStore.hasLoadouts"
          v-model:value="loadoutStore.selectedLoadoutId"
          :options="loadoutStore.loadouts.map((loadout: DBLoadout) => ({
            label: loadout.name + (loadout.is_default ? ' (Default)' : ''),
            value: loadout.id
          }))"
          :placeholder="t('loadout.select') as string"
          :loading="loadoutStore.isLoading"
          class="min-w-[180px]"
      />

      <template v-if="loadoutStore.hasLoadouts && loadoutStore.selectedLoadoutId">
          <NDropdown 
              trigger="hover" 
              :options="dropdownOptions" 
              @select="handleDropdownSelect"
              :menu-props="menuProps"
          >
              <NButton circle strong secondary>
                  <template #icon><NIcon><MenuIcon /></NIcon></template>
              </NButton>
          </NDropdown>
      </template>

      <NButton size="medium" :circle="loadoutStore.hasLoadouts" type="success" :secondary="loadoutStore.hasLoadouts" :loading="loadoutStore.isLoading" @click="showModal.create = true">
        <template v-if="loadoutStore.hasLoadouts" #icon>
          <NIcon><NewIcon /></NIcon>
        </template>
        <template v-if="!loadoutStore.hasLoadouts">
          {{ t('loadout.create') }}
        </template>
      </NButton>

      <NButton size="medium" circle strong secondary type="info" @click="showModal.import = true" :title="t('loadout.import')">
          <template #icon><NIcon><ImportIcon /></NIcon></template>
      </NButton>
    </NSpace>
  </NSpace>

  <!-- Create Modal (Existing) -->
  <NModal
      v-model:show="showModal.create"
      preset="card"
      :bordered="false"
      style="width: 500px"
      :title="t('modals.loadout.create.title') as string"
      :theme-overrides="skinModalThemeOverrides"
      @after-leave="formInputs.newName = ''"
  >
    <NInput
        v-model:value="formInputs.newName"
        :minlength="1"
        :placeholder="t('modals.loadout.create.formPlaceholder') as string"
    />
    <template #footer>
      <div class="flex justify-end gap-4">
        <NButton type="error" secondary @click="() => { showModal.create = false; formInputs.newName = '' }">
          {{ t('modals.loadout.create.cancel') }}
        </NButton>
        <NButton type="success" secondary :disabled="formInputs.newName === '' || formInputs.newName.length > 20" @click="handleLoadoutAction('create')">
          {{ t('modals.loadout.create.confirm') }}
        </NButton>
      </div>
    </template>
  </NModal>

  <!-- Rename Modal (Existing) -->
  <NModal
      v-model:show="showModal.rename"
      :bordered="false"
      preset="card"
      style="width: 500px"
      :title="t('modals.loadout.rename.title', { name: loadoutStore.selectedLoadout?.name || '' }) as string"
      :theme-overrides="skinModalThemeOverrides"
      @after-leave = "formInputs.renameName = ''"
  >
    <NInput
        v-model:value="formInputs.renameName"
        :minlength="1"
        :placeholder="t('modals.loadout.rename.formPlaceholder') as string"
    />
    <template #footer>
      <div class="flex justify-end gap-4">
        <NButton type="error" secondary @click="() => { showModal.rename = false; formInputs.renameName = '' }">
          {{ t('modals.loadout.rename.cancel') }}
        </NButton>
        <NButton type="success" secondary :disabled="formInputs.renameName === '' || formInputs.renameName.length > 20" @click="handleLoadoutAction('rename')">
          {{ t('modals.loadout.rename.confirm') }}
        </NButton>
      </div>
    </template>
  </NModal>

  <!-- Delete Modal (Existing) -->
  <NModal
      v-model:show="showModal.delete"
      preset="card"
      :bordered="false"
      style="width: 500px"
      :title="t('modals.loadout.delete.title', { name: loadoutStore.selectedLoadout?.name || '' }) as string"
      :theme-overrides="skinModalThemeOverrides"
      @after-leave="formInputs.deleteConfirm = ''"
  >
    <p>{{ t('modals.loadout.delete.question') }}</p>
    <p class="font-bold">{{ t('modals.loadout.delete.warning') }}</p>
    <div class="mt-4">
      <p class="mb-2">{{ t('modals.loadout.delete.confirmText', { name: loadoutStore.selectedLoadout?.name || '' }) }}</p>
      <NInput
          v-model:value="formInputs.deleteConfirm"
          :minlength="1"
          :placeholder="t('modals.loadout.delete.confirmPlaceholder') as string"
      />
    </div>
    <template #footer>
      <div class="flex justify-end gap-4">
        <NButton type="error" secondary @click="() => { showModal.delete = false; formInputs.deleteConfirm = '' }">
          {{ t('modals.loadout.delete.cancel') }}
        </NButton>
        <NButton
            type="error"
            secondary
            :disabled="formInputs.deleteConfirm !== loadoutStore.selectedLoadout?.name"
            @click="handleLoadoutAction('delete')"
        >
          {{ t('modals.loadout.delete.confirm') }}
        </NButton>
      </div>
    </template>
  </NModal>

  <!-- Clear Modal (Updated) -->
  <NModal
      v-model:show="showModal.clear"
      preset="card"
      :bordered="false"
      style="width: 500px"
      :title="t('modals.loadout.clear.title', { name: loadoutStore.selectedLoadout?.name || '' }) as string"
      :theme-overrides="skinModalThemeOverrides"
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
        <p class="mb-2">{{ t('modals.loadout.clear.confirmText', { name: loadoutStore.selectedLoadout?.name || '' }) }}</p>
        <NInput
            v-model:value="formInputs.clearConfirm"
            :placeholder="t('modals.loadout.clear.confirmPlaceholder') as string"
        />
    </div>
    <template #footer>
      <div class="flex justify-end gap-4">
        <NButton type="default" secondary @click="showModal.clear = false">
          {{ t('modals.loadout.clear.cancel') }}
        </NButton>
        <NButton
            type="error"
            secondary
            :disabled="formInputs.clearConfirm !== loadoutStore.selectedLoadout?.name || formInputs.clearCategories.length === 0"
            @click="handleLoadoutAction('clear')"
        >
          {{ t('modals.loadout.clear.confirm') }}
        </NButton>
      </div>
    </template>
  </NModal>

  <!-- Share Modal (Existing) -->
  <NModal
      v-model:show="showModal.share"
      preset="card"
      :bordered="false"
      style="width: 400px"
      :title="t('modals.loadout.share.title', { name: loadoutStore.selectedLoadout?.name || '' }) as string"
      :theme-overrides="skinModalThemeOverrides"
  >
      <div class="flex flex-col gap-4">
          <p>{{ t('modals.loadout.share.description') }}</p>
          <NInputGroup>
              <NInput v-model:value="formInputs.shareCode" readonly />
              <NButton type="primary" ghost @click="copyToClipboard">
                  <template #icon><NIcon><DuplicateIcon /></NIcon></template>
              </NButton>
          </NInputGroup>
      </div>
  </NModal>

  <!-- Import Modal (New) -->
  <NModal
      v-model:show="showModal.import"
      preset="card"
      :bordered="false"
      style="width: 500px"
      :title="t('modals.loadout.import.title') as string"
      :theme-overrides="skinModalThemeOverrides"
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
          <div class="flex justify-end gap-4">
              <NButton type="default" secondary @click="showModal.import = false">
                  {{ t('modals.loadout.import.cancel') }}
              </NButton>
              <NButton type="success" secondary :disabled="formInputs.importCode.length < 13" @click="handleLoadoutAction('import')">
                  {{ t('modals.loadout.import.confirm') }}
              </NButton>
          </div>
      </template>
  </NModal>
</template>
<style>
.glassmorphism-dropdown {
    background-color: var(--glass-bg-primary, rgba(16, 16, 16, 0.6)) !important;
    backdrop-filter: blur(16px) !important;
    -webkit-backdrop-filter: blur(16px) !important;
    border: 1px solid var(--glass-border, rgba(255, 255, 255, 0.08)) !important;
    border-radius: 12px !important;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5) !important;
}
.glassmorphism-dropdown .n-dropdown-option {
    color: white !important;
    border-radius: 8px !important;
    margin: 2px 4px !important;
}
.glassmorphism-dropdown .n-dropdown-option .n-dropdown-option-body::before {
    background-color: transparent !important;
}
.glassmorphism-dropdown .n-dropdown-option:hover {
    background-color: rgba(255, 255, 255, 0.1) !important;
}
</style>
<style lang="sass" scoped>

</style>