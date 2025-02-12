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
  } catch (err: any) {
    error.value = err.message || 'Failed to decode inspect URL'
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
      @update:show="handleClose"
  >
    <NSpace vertical>
      <div>
        <NInput
            v-model:value="inspectUrl"
            type="text"
            placeholder="Paste inspect URL here..."
            class="w-full"
        />
        <p v-if="error" class="text-red-500 text-sm mt-1">{{ error }}</p>
      </div>

      <div class="flex justify-end gap-4">
        <NButton
            @click="handleClose"
            :disabled="loading"
        >
          Cancel
        </NButton>
        <NButton
            type="primary"
            @click="handleSubmit"
            :loading="loading"
        >
          Import
        </NButton>
      </div>
    </NSpace>
  </NModal>
</template>