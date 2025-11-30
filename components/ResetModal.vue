<script setup lang="ts">
import { NModal, NButton } from 'naive-ui'
import { skinModalThemeOverrides } from '~/server/utils/themeCustomization'

defineProps<{
  visible: boolean
  loading?: boolean
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
      style="width: 600px"
      preset="card"
      :title="t('modals.reset.title') as string"
      :bordered="false"
      :mask-closable="!loading"
      :closable="!loading"
      :theme-overrides="skinModalThemeOverrides"
      @update:show="(show) => { if (!show) handleClose() }">
    <p>{{ t('modals.reset.question') }}</p>
    <div class="flex justify-end mt-4 gap-2">
      <NButton
          secondary
          type="error"
          :loading="loading"
          @click="handleClose"
      >
        {{ t('modals.reset.cancel') }}
      </NButton>

      <NButton
          secondary
          type="success"
          :loading="loading"
          @click="handleConfirm"
      >
        {{ t('modals.reset.confirm') }}
      </NButton>
    </div>
  </NModal>
</template>
