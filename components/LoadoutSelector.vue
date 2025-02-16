<script setup lang="ts">
import { ref } from 'vue'
import { useLoadoutStore } from '~/stores/loadoutStore'
import {NButton, useMessage} from 'naive-ui'
import { steamAuth } from '~/services/steamAuth'
import { Trash as DeleteIcon, Edit as RenameIcon, Plus as NewIcon } from '@vicons/tabler'

const loadoutStore = useLoadoutStore()
const message = useMessage()

const showModal = ref({ create: false, rename: false, delete: false })
const formInputs = ref({ newName: '', renameName: '' })


const handleLoadoutAction = async (action: 'create' | 'rename' | 'delete') => {
  const user = steamAuth.getSavedUser()
  if (!user?.steamId) {
    message.error('Please login first')
    return
  }

  try {
    switch (action) {
      case 'create':
        await loadoutStore.createLoadout(user.steamId, formInputs.value.newName)
        break
      case 'rename':
        await loadoutStore.updateLoadout(loadoutStore.selectedLoadoutId || "0", user.steamId, formInputs.value.renameName)
        break
      case 'delete':
        await loadoutStore.deleteLoadout(user.steamId, loadoutStore.selectedLoadoutId || "0")
        break
    }
    if (!loadoutStore.error) {
      showModal.value[action] = false
      message.success(`Loadout ${action}d successfully`)
      formInputs.value.newName = ''
      formInputs.value.renameName = ''
    }
  } catch (error) {
    message.error(error.message, { duration: 3, closable: true })
  }
}
</script>

<template>
  <!-- Main Loadout Selector -->
  <NSpace vertical>
    <NAlert v-if="loadoutStore.error" type="error" :title="loadoutStore.error" closable class="z-10" />
    <NSpace align="center">
      <NSelect
          v-if="loadoutStore.hasLoadouts"
          v-model:value="loadoutStore.selectedLoadoutId"
          :options="loadoutStore.loadouts.map(loadout => ({
            label: loadout.name,
            value: loadout.id
          }))"
          placeholder="Select a loadout"
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
          Create Loadout
        </template>
      </NButton>
    </NSpace>
  </NSpace>

  <!-- Create Modal -->
  <NModal
      v-model:show="showModal.create"
      preset="dialog"
      title="Create New Loadout"
      positive-text="Create"
      negative-text="Cancel"
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
        placeholder="Enter loadout name"
    />
  </NModal>

  <!-- Rename Modal -->
  <NModal
      v-model:show="showModal.rename"
      :bordered="false"
      preset="card"
      style="width: 500px"
      title="Rename Loadout"
      @afterLeave = "formInputs.renameName = ''"
  >
    <NInput
        :minlength="1"
        v-model:value="formInputs.renameName"
        placeholder="Enter loadout name"
    />
    <template #footer>
      <div class="flex justify-end gap-4">
        <NButton
            @click="() => { showModal.rename = false; formInputs.renameName = '' }"
            type="error"
            secondary
        >
          Cancel
        </NButton>
        <NButton
            type="success"
            secondary
            :disabled="formInputs.renameName === '' || formInputs.renameName.length > 20"
            @click="handleLoadoutAction('rename')"
        >
          Confirm Rename
        </NButton>
      </div>
    </template>
  </NModal>

  <!-- Delete Modal -->
  <NModal
      v-model:show="showModal.delete"
      preset="dialog"
      title="Delete Loadout"
      positive-text="Delete"
      negative-text="Cancel"
      :positive-button-props="{
        type: 'error',
        secondary: true
      }"
      @positive-click="handleLoadoutAction('delete')"
      @negative-click="() => showModal.delete = false"
  >
    <p>Are you sure you want to delete this loadout?</p>
    <p class="font-bold">All Skins from this Loadout will be deleted and can't be restored</p>
  </NModal>
</template>
<style lang="sass" scoped>

</style>