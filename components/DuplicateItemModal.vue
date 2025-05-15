<script setup lang="ts">
import { NModal, NCard, NButton } from 'naive-ui'

const props = defineProps<{
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
      :title="t('modals.duplicateItem.header', { itemType: itemType }) as string"
      :mask-closable="!loading"
      :closable="!loading"
      preset="card">
    <NSpace vertical>
      <div class="py-2">
        <p v-if="otherTeamHasSkin" class="text-warning mb-4">
          {{ t('modals.duplicateItem.warning', { itemType: itemType.toLowerCase() }) }}
        </p>
        <p>{{ t('modals.duplicateItem.question', { itemType: itemType.toLowerCase() }) }}</p>
      </div>
      <div class="flex justify-end gap-4">
        <NButton
            @click="handleClose"
            :disabled="loading"
            type="error"
            secondary>
          {{ t('modals.duplicateItem.cancel') }}
        </NButton>
        <NButton
            @click="handleConfirm"
            :loading="loading"
            type="success"
            secondary>
          {{ t('modals.duplicateItem.confirm') }}
        </NButton>
      </div>
    </NSpace>
  </NModal>
</template>