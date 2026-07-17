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
  <AppModal
    :visible="visible"
    size="sm"
    :title="String(t('modals.reset.title'))"
    :mask-closable="!loading"
    :closable="!loading"
    @update:visible="
      (show: boolean) => {
        if (!show) handleClose()
      }
    "
  >
    <p>{{ t('modals.reset.question') }}</p>
    <div class="flex justify-end mt-4 gap-3">
      <Button variant="outline" size="default" :loading="loading" @click="handleClose">
        {{ t('modals.reset.cancel') }}
      </Button>

      <Button variant="destructive" size="default" :loading="loading" @click="handleConfirm">
        {{ t('modals.reset.confirm') }}
      </Button>
    </div>
  </AppModal>
</template>
