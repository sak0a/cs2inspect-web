<script setup lang="ts">
import { ref } from 'vue'
import { useLoadoutStore } from '~/stores/loadoutStore'
import { NButton, useMessage} from 'naive-ui'
import { steamAuth } from '~/services/steamAuth'
import { Trash as DeleteIcon, Edit as RenameIcon, Plus as NewIcon } from '@vicons/tabler'

const loadoutStore = useLoadoutStore()
const { t } = useI18n()
const message = useMessage()

const showModal = ref({
  create: false,
  rename: false,
  delete: false
})

const formInputs = ref({
  newName: '',
  renameName: ''
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
      case 'rename':
        await loadoutStore.updateLoadout(loadoutStore.selectedLoadoutId, user.steamId, formInputs.value.renameName)
            .catch((error) => {
              throw error
            })
        break
      case 'delete':
        await loadoutStore.deleteLoadout(user.steamId, loadoutStore.selectedLoadoutId)
            .catch((error) => {
              throw error
            })
        break
    }
    formInputs.value.newName = ''
    formInputs.value.renameName = ''
    showModal.value[action] = false
    message.success(t('modals.loadout.successMessage', { action: action }) as string, { duration: 2 })
  } catch (error: any) {
    console.log(error)
    message.error(error.message, { duration: 3, closable: true })
  }
}

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
        <NButton strong circle type="default" secondary @click="showModal.rename = true" :loading="loadoutStore.isLoading">
          <template #icon><NIcon><RenameIcon /></NIcon></template>
        </NButton>
        <NButton strong circle type="error" secondary @click="showModal.delete = true">
          <template #icon><NIcon><DeleteIcon /></NIcon></template>
        </NButton>
      </template>

      <NButton size="medium" :circle="loadoutStore.hasLoadouts" type="primary" :secondary="loadoutStore.hasLoadouts" @click="showModal.create = true" :loading="loadoutStore.isLoading">
        <template #icon v-if="loadoutStore.hasLoadouts">
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
      preset="dialog"
      :title="t('modals.loadout.create.title') as string"
      :positive-text="t('modals.loadout.create.confirm') as string"
      :negative-text="t('modals.loadout.create.cancel') as string"
      :positive-button-props="{
        type: 'success',
        secondary: true,
        disabled: formInputs.newName === '' || formInputs.newName.length > 20
      }"
      @positive-click="handleLoadoutAction('create')"
      @negative-click="() => { showModal.create = false; formInputs.newName = '' }"
  >
    <NInput
        v-model:value="formInputs.newName"
        :placeholder="t('modals.loadout.create.formPlaceholder') as string"
    />
  </NModal>

  <!-- Rename Modal -->
  <NModal
      v-model:show="showModal.rename"
      :bordered="false"
      preset="card"
      style="width: 500px"
      :title="t('modals.loadout.rename.title') as string"
      @afterLeave = "formInputs.renameName = ''"
  >
    <NInput
        :minlength="1"
        v-model:value="formInputs.renameName"
        :placeholder="t('modals.loadout.rename.formPlaceholder') as string"
    />
    <template #footer>
      <div class="flex justify-end gap-4">
        <NButton @click="() => { showModal.rename = false; formInputs.renameName = '' }" type="error" secondary>
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
      preset="dialog"
      :title="t('modals.loadout.delete.title') as string"
      :positive-text="t('modals.loadout.delete.confirm') as string"
      :negative-text="t('modals.loadout.delete.cancel') as string"
      :positive-button-props="{
        type: 'error',
        secondary: true
      }"
      @positive-click="handleLoadoutAction('delete')"
      @negative-click="() => showModal.delete = false"
  >
    <p>{{ t('modals.loadout.delete.question') }}</p>
    <p class="font-bold">{{ t('modals.loadout.delete.warning') }}</p>
  </NModal>
</template>
<style lang="sass" scoped>

</style>