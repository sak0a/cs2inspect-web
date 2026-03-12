<script setup lang="ts">
import { buttonColor } from '~/lib/buttonColors'

interface Props {
  visible: boolean
  loading?: boolean
}

const _props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
  (e: 'submit', url: string): void
}>()

const { t } = useI18n()

const inspectUrl = ref('')
const error = ref('')

const handleSubmit = async () => {
  if (!inspectUrl.value.trim()) {
    error.value = t('modals.inspectUrl.noInspectUrl') as string
    return
  }

  try {
    error.value = ''
    emit('submit', inspectUrl.value)
    inspectUrl.value = ''
  } catch (e: unknown) {
    const errorMessage =
      e instanceof Error ? e.message : (t('modals.inspectUrl.defaultError') as string)
    error.value = errorMessage
  }
}

const handleClose = () => {
  inspectUrl.value = ''
  error.value = ''
  emit('update:visible', false)
}
</script>

<template>
  <NModal
    :show="_props.visible"
    style="width: 700px"
    preset="card"
    :title="t('modals.inspectUrl.title') as string"
    :bordered="false"
    :auto-focus="false"
    :mask-closable="!_props.loading"
    :closable="!_props.loading"
    @update:show="handleClose"
  >
    <NSpace vertical>
      <div class="grid grid-cols-2 gap-4">
        <NTooltip>
          <template #trigger>
            <SButton :color="buttonColor.info" size="sm" variant="light">{{
              t('modals.inspectUrl.maskedLinks')
            }}</SButton>
          </template>
          <h3 class="font-bold text-center">
            {{ t('modals.inspectUrl.maskedLinksDescription') }}
          </h3>
          <div>
            {data}
            {{ t('modals.inspectUrl.maskedLinksExample') }}
            001809209209280138C0D9C0DF034001FCADACCE
          </div>
          <div>steam://rungame/730/76561202255233023/+csgo_econ_action_preview%20{data}</div>
          <div>csgo_econ_action_preview {data}</div>
          <div>+csgo_econ_action_preview {data}</div>
          <div>{data}</div>
        </NTooltip>
        <NTooltip>
          <template #trigger>
            <SButton :color="buttonColor.info" size="sm" variant="light">{{
              t('modals.inspectUrl.unmaskedLinks')
            }}</SButton>
          </template>
          <h3 class="font-bold text-center">
            {{ t('modals.inspectUrl.unmaskedLinksDescription') }}
          </h3>
          <div>
            {data}
            {{ t('modals.inspectUrl.unmaskedLinksExample') }} M123456789A123456D123456 -
            S123456789A123456D123456
          </div>
          <div>steam://rungame/730/76561202255233023/+csgo_econ_action_preview%20{data}</div>
          <div>csgo_econ_action_preview {data}</div>
          <div>+csgo_econ_action_preview {data}</div>
          <div>{data}</div>
        </NTooltip>
      </div>
      <div>
        <NInput
          v-model:value="inspectUrl"
          :disabled="_props.loading"
          type="text"
          :placeholder="t('modals.inspectUrl.inputPlaceholder') as string"
          class="w-full"
        />
        <p v-if="error" class="text-red-500 text-sm mt-1">{{ error }}</p>
      </div>

      <div class="flex justify-end gap-4">
        <SButton
          variant="light"
          :color="buttonColor.error"
          :disabled="_props.loading"
          @click="handleClose"
        >
          {{ t('modals.inspectUrl.cancel') }}
        </SButton>
        <SButton
          :disabled="inspectUrl.length <= 15"
          variant="light"
          :color="buttonColor.success"
          :loading="_props.loading"
          @click="handleSubmit"
        >
          {{ t('modals.inspectUrl.confirm') }}
        </SButton>
      </div>
    </NSpace>
  </NModal>
</template>
