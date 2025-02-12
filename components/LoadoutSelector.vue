<script setup lang="ts">
import { ref } from 'vue'
import { useLoadoutStore } from '~/stores/loadoutStore'
import { useMessage } from 'naive-ui'
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
        await loadoutStore.updateLoadout(loadoutStore.selectedLoadoutId, user.steamId, formInputs.value.renameName)
        break
      case 'delete':
        await loadoutStore.deleteLoadout(user.steamId, loadoutStore.selectedLoadoutId)
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
  <div class="mb-6">
    <NSpace vertical>
      <NAlert v-if="loadoutStore.error" type="error" :title="loadoutStore.error" closable class="z-10" />

      <NSpace align="center">
        <NSelect
            v-if="loadoutStore.hasLoadouts"
            v-model:value="loadoutStore.selectedLoadoutId"
            :options="loadoutStore.loadouts.map(l => ({
              label: l.name,
              value: l.id
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

    <!-- Modals -->
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

    <NModal
        v-model:show="showModal.rename"
        preset="dialog"
        title="Rename Loadout"
        positive-text="Rename"
        negative-text="Cancel"
        @positive-click="handleLoadoutAction('rename')"
        :positive-button-props="{
          type: 'success',
          secondary: true,
          disabled: formInputs.renameName === '' || formInputs.renameName.length > 20
        }"
        @negative-click="() => { showModal.rename = false; formInputs.renameName = '' }"
        @afterLeave = "formInputs.renameName = ''"
    >
      <NInput
          :minlength="1"
          v-model:value="formInputs.renameName"
          placeholder="Enter loadout name"
      />
    </NModal>

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
    </NModal>
  </div>
</template>