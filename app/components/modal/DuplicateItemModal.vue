<script setup lang="ts">
import { buttonColor } from '~/lib/buttonColors'

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
  <NModal
    :show="visible"
    style="width: 700px"
    :bordered="false"
    :auto-focus="false"
    :title="String(t('modals.duplicateItem.header', { itemType: _props.itemType }))"
    :mask-closable="!_props.loading"
    :closable="!_props.loading"
    preset="card"
  >
    <NSpace vertical>
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
        <SButton
          :disabled="_props.loading"
          :color="buttonColor.error"
          variant="elevated"
          rounded="full"
          size="md"
          tinted
          class="px-5 py-1.5"
          @click="handleClose"
        >
          {{ t('modals.duplicateItem.cancel') }}
        </SButton>
        <SButton
          :loading="_props.loading"
          :color="buttonColor.success"
          variant="elevated"
          rounded="full"
          size="md"
          tinted
          class="px-5 py-1.5"
          @click="handleConfirm"
        >
          {{ t('modals.duplicateItem.confirm') }}
        </SButton>
      </div>
    </NSpace>
  </NModal>
</template>
