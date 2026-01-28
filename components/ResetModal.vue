<script setup lang="ts">
interface Props {
  visible: boolean
  loading?: boolean
}

const _props = defineProps<Props>()

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
      :title="String(t('modals.reset.title'))"
      :bordered="false"
      :mask-closable="!loading"
      :closable="!loading"
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
