<script setup lang="ts">
interface Props {
  visible: boolean
  loading: boolean
  itemType: string
  otherTeamHasSkin: boolean
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
    size="md"
    :title="String(t('modals.duplicateItem.header', { itemType: _props.itemType }))"
    :mask-closable="!_props.loading"
    :closable="!_props.loading"
    @update:visible="
      (show: boolean) => {
        if (!show) handleClose()
      }
    "
  >
    <div class="flex flex-col gap-2">
      <div class="py-2">
        <p v-if="_props.otherTeamHasSkin" class="text-warning mb-4">
          {{
            t('modals.duplicateItem.warning', {
              itemType: _props.itemType.toLowerCase(),
            })
          }}
        </p>
        <p>
          {{
            t('modals.duplicateItem.question', {
              itemType: _props.itemType.toLowerCase(),
            })
          }}
        </p>
      </div>
      <div class="flex justify-end gap-3">
        <Button
          :disabled="_props.loading"
          intent="error"
          variant="elevated"
          rounded="full"
          size="md"
          tinted
          class="px-5 py-1.5"
          @click="handleClose"
        >
          {{ t('modals.duplicateItem.cancel') }}
        </Button>
        <Button
          :loading="_props.loading"
          intent="success"
          variant="elevated"
          rounded="full"
          size="md"
          tinted
          class="px-5 py-1.5"
          @click="handleConfirm"
        >
          {{ t('modals.duplicateItem.confirm') }}
        </Button>
      </div>
    </div>
  </AppModal>
</template>
