<script setup lang="ts">
import { ref } from 'vue'
import { NModal, NInput, NButton, NCard, NSpace } from 'naive-ui'

const props = defineProps<{
  visible: boolean
  loading?: boolean
}>()

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
  (e: 'submit', url: string): void
}>()

const inspectUrl = ref('')
const error = ref('')

const handleSubmit = async () => {
  if (!inspectUrl.value.trim()) {
    error.value = 'Please enter an inspect URL'
    return
  }

  try {
    error.value = ''
    emit('submit', inspectUrl.value)
    inspectUrl.value = ''
  } catch (e: any) {
    error.value = e.message || 'Failed to decode inspect URL'
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
      :show="visible"
      style="width: 600px"
      preset="card"
      title="Import from Inspect URL"
      :bordered="false"
      :mask-closable="!loading"
      :closable="!loading"
      @update:show="handleClose"
  >
    <NSpace vertical>
      <div class="grid grid-cols-2 gap-4">
        <NTooltip >
          <template #trigger>
            <NButton type="info" size="small" secondary>Masked Links (HEX Data)</NButton>
          </template>
          <h3 class="font-bold text-center">These Links are mostly generated from Websites or other Apps</h3>
          <div>{data} Example: 001809209209280138C0D9C0DF034001FCADACCE</div>
          <div>
            steam://rungame/730/76561202255233023/+csgo_econ_action_preview%20{data}
          </div>
          <div>
            csgo_econ_action_preview {data}
          </div>
          <div>
            +csgo_econ_action_preview {data}
          </div>
          <div>
            {data}
          </div>
        </NTooltip>
        <NTooltip >
          <template #trigger>
            <NButton type="info" size="small" secondary>Unmasked Links (Market / Inventory)</NButton>
          </template>
          <h3 class="font-bold text-center">These Links are used in the Steam Market and Player Inventories</h3>
          <div>{data} Examples: M123456789A123456D123456 - S123456789A123456D123456</div>
          <div>
            steam://rungame/730/76561202255233023/+csgo_econ_action_preview%20{data}
          </div>
          <div>
            csgo_econ_action_preview {data}
          </div>
          <div>
            +csgo_econ_action_preview {data}
          </div>
          <div>
            {data}
          </div>
        </NTooltip>
      </div>
      <div>
        <NInput
            :disabled="loading"
            v-model:value="inspectUrl"
            type="text"
            placeholder="Paste inspect URL here..."
            class="w-full"
        />
        <p v-if="error" class="text-red-500 text-sm mt-1">{{ error }}</p>
      </div>

      <div class="flex justify-end gap-4">
        <NButton @click="handleClose" secondary type="error" :disabled="loading">
          Cancel
        </NButton>
        <NButton :disabled="inspectUrl.length <= 15" secondary type="success" @click="handleSubmit" :loading="loading">
          Import
        </NButton>
      </div>
    </NSpace>
  </NModal>
</template>