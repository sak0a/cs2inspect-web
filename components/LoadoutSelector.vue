<script setup lang="ts">
import { useLoadoutStore } from '~/stores/loadoutStore'
import { useMessage} from 'naive-ui'
import { steamAuth } from '~/services/steamAuth'
import { Trash as DeleteIcon, Edit as RenameIcon, Plus as NewIcon } from '@vicons/tabler'
import { skinModalThemeOverrides } from '~/server/utils/themeCustomization'


const loadoutStore = useLoadoutStore()
const { t } = useI18n()
const message = useMessage()

// Track the previous loadout ID to avoid activating on initial load
const previousLoadoutId = ref<string | null>(null)

const showModal = ref({
  create: false,
  rename: false,
  delete: false
})

const formInputs = ref({
  newName: '',
  renameName: '',
  deleteConfirm: ''
})


const handleLoadoutAction = async (action: 'create' | 'rename' | 'delete') => {
  const user = steamAuth.getSavedUser()

  if (!user) {
    message.error(t('auth.rejectAction') as string, { duration: 2 })
    return
  }

  try {
    switch (action) {
      case 'create':
        await loadoutStore.createLoadout(user.steamId, formInputs.value.newName)
            .catch((error) => {
              throw error
            })
        break
      case 'rename': {
        const loadoutId = loadoutStore.selectedLoadoutId
        if (!loadoutId) {
          throw new Error('No loadout selected')
        }
        await loadoutStore.updateLoadout(loadoutId, user.steamId, formInputs.value.renameName)
            .catch((error) => {
              throw error
            })
        break
      }
      case 'delete': {
        const loadoutId = loadoutStore.selectedLoadoutId
        if (!loadoutId) {
          throw new Error('No loadout selected')
        }
        await loadoutStore.deleteLoadout(user.steamId, loadoutId)
            .catch((error) => {
              throw error
            })
        break
      }
    }
    formInputs.value.newName = ''
    formInputs.value.renameName = ''
    formInputs.value.deleteConfirm = ''
    showModal.value[action] = false
    message.success(t('modals.loadout.successMessage', { action: action }) as string, { duration: 2 })
  } catch (error: unknown) {
    console.log(error)
    const errorMessage = error instanceof Error ? error.message : 'An error occurred'
    message.error(errorMessage, { duration: 3, closable: true })
  }
}

// Watch for loadout selection changes and activate the selected loadout
watch(() => loadoutStore.selectedLoadoutId, async (newLoadoutId, oldLoadoutId) => {
  // Skip if this is the initial load (oldLoadoutId is null) or if the ID hasn't actually changed
  if (!newLoadoutId || newLoadoutId === oldLoadoutId || newLoadoutId === previousLoadoutId.value) {
    return
  }

  const user = steamAuth.getSavedUser()
  if (!user) {
    return
  }

  // Check if the selected loadout is already active
  const selectedLoadout = loadoutStore.loadouts.find(l => l.id === newLoadoutId)
  if (selectedLoadout && (selectedLoadout.active === true || selectedLoadout.active === 1)) {
    previousLoadoutId.value = newLoadoutId
    return
  }

  try {
    await loadoutStore.activateLoadout(newLoadoutId, user.steamId)
    previousLoadoutId.value = newLoadoutId
  } catch (error: unknown) {
    console.error('Failed to activate loadout:', error)
    // Revert to previous loadout on error
    if (oldLoadoutId) {
      loadoutStore.selectedLoadoutId = oldLoadoutId
    }
    const errorMessage = error instanceof Error ? error.message : 'Failed to activate loadout'
    message.error(errorMessage, { duration: 3, closable: true })
  }
})

</script>

<template>
  <!-- Main Loadout Selector -->
  <NSpace vertical>
    <NSpace align="center">
      <NSelect
          v-if="loadoutStore.hasLoadouts"
          v-model:value="loadoutStore.selectedLoadoutId"
          :options="loadoutStore.loadouts.map(loadout => ({
            label: loadout.name,
            value: loadout.id
          }))"
          :placeholder="t('loadout.select') as string"
          :loading="loadoutStore.isLoading"
          class="min-w-[180px]"
      />

      <template v-if="loadoutStore.hasLoadouts && loadoutStore.selectedLoadoutId">
        <NButton strong circle type="default" secondary :loading="loadoutStore.isLoading" @click="showModal.rename = true">
          <template #icon><NIcon><RenameIcon /></NIcon></template>
        </NButton>
        <NButton strong circle type="error" secondary @click="showModal.delete = true">
          <template #icon><NIcon><DeleteIcon /></NIcon></template>
        </NButton>
      </template>

      <NButton size="medium" :circle="loadoutStore.hasLoadouts" type="success" :secondary="loadoutStore.hasLoadouts" :loading="loadoutStore.isLoading" @click="showModal.create = true">
        <template v-if="loadoutStore.hasLoadouts" #icon>
          <NIcon><NewIcon /></NIcon>
        </template>
        <template v-if="!loadoutStore.hasLoadouts">
          {{ t('loadout.create') }}
        </template>
      </NButton>
    </NSpace>
  </NSpace>

  <!-- Create Modal -->
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

  <!-- Rename Modal -->
  <NModal
      v-model:show="showModal.rename"
      :bordered="false"
      preset="card"
      style="width: 500px"
      :title="t('modals.loadout.rename.title') as string"
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

  <!-- Delete Modal -->
  <NModal
      v-model:show="showModal.delete"
      preset="card"
      :bordered="false"
      style="width: 500px"
      :title="t('modals.loadout.delete.title') as string"
      :theme-overrides="skinModalThemeOverrides"
      @after-leave="formInputs.deleteConfirm = ''"
  >
    <p>{{ t('modals.loadout.delete.question') }}</p>
    <p class="font-bold">{{ t('modals.loadout.delete.warning') }}</p>
    <div class="mt-4">
      <p class="mb-2">{{ t('modals.loadout.delete.confirmText', { name: loadoutStore.selectedLoadout?.name }) }}</p>
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
</template>
<style lang="sass" scoped>

</style>