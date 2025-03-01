<script setup lang="ts">
import { NModal, NCard, NButton } from 'naive-ui'

const props = defineProps<{
  visible: boolean
  loading: boolean
  itemType: string // e.g., 'weapon', 'knife', 'glove'
  otherTeamHasSkin: boolean
}>()

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
  (e: 'confirm'): void
}>()

const handleClose = () => {
  emit('update:visible', false)
}
const handleConfirm = () => {
  emit('confirm')
}
</script>

<template>
  <NModal :show="visible"
      :closable="!loading"
      :mask-closable="!loading"
  >
    <NCard
        style="width: 600px"
        :bordered="true"
        size="medium"
        role="dialog"
        aria-modal="true"
    >
      <template #header>
        <div class="text-lg font-semibold">Duplicate {{ itemType }}</div>
      </template>

      <div class="py-2">
        <p v-if="otherTeamHasSkin" class="text-warning mb-4">
          Warning: The other team already has a skin configured for this {{ itemType.toLowerCase() }}.
          This action will overwrite it.
        </p>
        <p>Are you sure you want to duplicate this {{ itemType.toLowerCase() }} configuration to the other team?</p>
      </div>

      <template #footer>
        <div class="flex justify-end gap-4">
          <NButton
              @click="handleClose"
              :disabled="loading"
              type="error"
              secondary
          >
            Cancel
          </NButton>
          <NButton
              type="success"
              secondary
              :loading="loading"
              @click="handleConfirm"
          >
            Confirm Duplicate
          </NButton>
        </div>
      </template>
    </NCard>
  </NModal>
</template>