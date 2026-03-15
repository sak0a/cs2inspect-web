<script setup lang="ts">
import { buttonColor } from '~/lib/buttonColors'

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
    :auto-focus="false"
    :mask-closable="!loading"
    :closable="!loading"
    @update:show="
      (show) => {
        if (!show) handleClose()
      }
    "
  >
    <p>{{ t('modals.reset.question') }}</p>
    <div class="flex justify-end mt-4 gap-3">
      <SButton
        variant="elevated"
        rounded="full"
        size="md"
        :color="buttonColor.error"
        :loading="loading"
        class="px-5 py-1.5"
        tinted
        @click="handleClose"
      >
        {{ t('modals.reset.cancel') }}
      </SButton>

      <SButton
        variant="elevated"
        rounded="full"
        size="md"
        :color="buttonColor.success"
        :loading="loading"
        class="px-5 py-1.5"
        tinted
        @click="handleConfirm"
      >
        {{ t('modals.reset.confirm') }}
      </SButton>
    </div>
  </NModal>
</template>
