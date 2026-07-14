<script setup lang="ts">
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
  <AppModal
    :visible="_props.visible"
    size="md"
    :title="t('modals.inspectUrl.title') as string"
    :mask-closable="!_props.loading"
    :closable="!_props.loading"
    @update:visible="
      (show: boolean) => {
        if (!show) handleClose()
      }
    "
  >
    <div class="flex flex-col gap-2">
      <TooltipProvider :delay-duration="150">
        <div class="grid grid-cols-2 gap-4">
          <Tooltip>
            <TooltipTrigger as-child>
              <Button
                intent="info"
                size="md"
                variant="elevated"
                rounded="full"
                class="px-5 py-1.5"
                tinted
                >{{ t('modals.inspectUrl.maskedLinks') }}</Button
              >
            </TooltipTrigger>
            <TooltipContent
              class="max-w-xl border border-[var(--border-subtle)] bg-popover px-4 py-3 text-sm text-popover-foreground [&>svg]:bg-popover [&>svg]:fill-popover"
            >
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
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger as-child>
              <Button
                intent="info"
                size="md"
                variant="elevated"
                rounded="full"
                class="px-5 py-1.5"
                tinted
                >{{ t('modals.inspectUrl.unmaskedLinks') }}</Button
              >
            </TooltipTrigger>
            <TooltipContent
              class="max-w-xl border border-[var(--border-subtle)] bg-popover px-4 py-3 text-sm text-popover-foreground [&>svg]:bg-popover [&>svg]:fill-popover"
            >
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
            </TooltipContent>
          </Tooltip>
        </div>
      </TooltipProvider>
      <div>
        <Input
          v-model="inspectUrl"
          :disabled="_props.loading"
          type="text"
          :placeholder="t('modals.inspectUrl.inputPlaceholder') as string"
          class="w-full"
        />
        <p v-if="error" class="text-red-500 text-sm mt-1">{{ error }}</p>
      </div>

      <div class="flex justify-end gap-3">
        <Button
          variant="elevated"
          rounded="full"
          size="md"
          intent="error"
          :disabled="_props.loading"
          class="px-5 py-1.5"
          tinted
          @click="handleClose"
        >
          {{ t('modals.inspectUrl.cancel') }}
        </Button>
        <Button
          :disabled="inspectUrl.length <= 15"
          variant="elevated"
          rounded="full"
          size="md"
          intent="success"
          :loading="_props.loading"
          class="px-5 py-1.5"
          tinted
          @click="handleSubmit"
        >
          {{ t('modals.inspectUrl.confirm') }}
        </Button>
      </div>
    </div>
  </AppModal>
</template>
