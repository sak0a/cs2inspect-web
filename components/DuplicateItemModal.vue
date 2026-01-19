<script setup lang="ts">
const _props = defineProps<{
  visible: boolean
  loading: boolean
  itemType: string
  otherTeamHasSkin: boolean
}>()

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
  (e: 'confirm'): void
}>()

const { t } = useI18n()

const handleClose = () => {
  emit('update:visible', false)
}
const handleConfirm = () => {
  emit('confirm')
}
</script>

<template>
  <NModal
      :show="visible"
      style="width: 700px;"
      :bordered="false"
      :title="String(t('modals.duplicateItem.header', { itemType: _props.itemType }))"
      :mask-closable="!_props.loading"
      :closable="!_props.loading"
      preset="card"
      :theme-overrides="skinModalThemeOverrides">
    <NSpace vertical>
      <div class="py-2">
        <p v-if="_props.otherTeamHasSkin" class="text-warning mb-4">
          {{ t('modals.duplicateItem.warning', { itemType: _props.itemType.toLowerCase() }) }}
        </p>
        <p>{{ t('modals.duplicateItem.question', { itemType: _props.itemType.toLowerCase() }) }}</p>
      </div>
      <div class="flex justify-end gap-4">
        <NButton
            :disabled="_props.loading"
            type="error"
            secondary
            @click="handleClose">
          {{ t('modals.duplicateItem.cancel') }}
        </NButton>
        <NButton
            :loading="_props.loading"
            type="success"
            secondary
            @click="handleConfirm">
          {{ t('modals.duplicateItem.confirm') }}
        </NButton>
      </div>
    </NSpace>
  </NModal>
</template>