<script setup lang="ts">
import type { AdminSetting } from '~/types'

interface Props {
  setting: AdminSetting
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'save', payload: { key: string; value: string | number | boolean }): void
}>()

const isEditing = ref(false)
const editValue = ref<string | number | boolean>('')

const startEditing = () => {
  // Initialize edit value based on type
  switch (props.setting.type) {
    case 'boolean':
      editValue.value = props.setting.value === 'true'
      break
    case 'number':
      editValue.value = Number(props.setting.value) || 0
      break
    case 'json':
    case 'string':
    default:
      editValue.value = props.setting.value
      break
  }
  isEditing.value = true
}

const cancelEditing = () => {
  isEditing.value = false
  editValue.value = ''
}

const handleSave = () => {
  emit('save', {
    key: props.setting.key,
    value: editValue.value,
  })
  isEditing.value = false
}

const handleNumberUpdate = (val: number | undefined) => {
  editValue.value = val == null || Number.isNaN(val) ? 0 : val
}

const formatDate = (dateStr: string | null) => {
  if (!dateStr) return 'Never'
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const typeLabel = computed(() => {
  const labels: Record<string, string> = {
    string: 'Text',
    number: 'Number',
    boolean: 'Toggle',
    json: 'JSON',
  }
  return labels[props.setting.type] || props.setting.type
})

const typeBadgeClass = computed(() => {
  const classes: Record<string, string> = {
    string: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    number: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    boolean: 'bg-green-500/20 text-green-400 border-green-500/30',
    json: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  }
  return classes[props.setting.type] || 'bg-gray-500/20 text-gray-400 border-gray-500/30'
})
</script>

<template>
  <div class="admin-setting-item">
    <div class="flex flex-col lg:flex-row lg:items-center gap-4 p-4">
      <!-- Key and Description -->
      <div class="flex-1 min-w-0">
        <div class="flex items-center gap-2 mb-1">
          <span class="font-mono text-sm font-medium text-white">{{ setting.key }}</span>
          <span class="px-2 py-0.5 rounded-full text-xs font-medium border" :class="typeBadgeClass">
            {{ typeLabel }}
          </span>
        </div>
        <p v-if="setting.description" class="text-sm text-gray-400 truncate">
          {{ setting.description }}
        </p>
        <p class="text-xs text-gray-500 mt-1">
          Last updated: {{ formatDate(setting.updatedAt) }}
          <span v-if="setting.updatedBy"> by {{ setting.updatedBy }}</span>
        </p>
      </div>

      <!-- Value Display / Edit -->
      <div class="flex items-center gap-3 lg:w-80">
        <template v-if="!isEditing">
          <!-- Display Mode -->
          <div class="flex-1 min-w-0">
            <template v-if="setting.type === 'boolean'">
              <span
                class="px-2 py-1 rounded-sm text-sm"
                :class="
                  setting.value === 'true'
                    ? 'bg-green-500/20 text-green-400'
                    : 'bg-red-500/20 text-red-400'
                "
              >
                {{ setting.value === 'true' ? 'Enabled' : 'Disabled' }}
              </span>
            </template>
            <template v-else-if="setting.type === 'json'">
              <code class="text-xs bg-gray-800 px-2 py-1 rounded-sm text-gray-300 block truncate">
                {{ setting.value }}
              </code>
            </template>
            <template v-else>
              <span class="text-sm text-gray-300 truncate block">{{ setting.value }}</span>
            </template>
          </div>
          <Button size="sm" variant="light" intent="primary" rounded="md" @click="startEditing">
            Edit
          </Button>
        </template>

        <template v-else>
          <!-- Edit Mode -->
          <div class="flex-1 min-w-0">
            <template v-if="setting.type === 'boolean'">
              <Switch
                :model-value="editValue === true || editValue === 'true'"
                @update:model-value="(val: boolean) => (editValue = val)"
              />
            </template>
            <template v-else-if="setting.type === 'number'">
              <NumberField
                :model-value="typeof editValue === 'number' ? editValue : Number(editValue) || 0"
                class="w-full"
                @update:model-value="handleNumberUpdate"
              >
                <NumberFieldContent>
                  <NumberFieldDecrement />
                  <NumberFieldInput class="h-8 text-sm" />
                  <NumberFieldIncrement />
                </NumberFieldContent>
              </NumberField>
            </template>
            <template v-else-if="setting.type === 'json'">
              <Textarea
                :model-value="String(editValue)"
                :rows="3"
                class="w-full min-h-[78px] text-sm"
                @update:model-value="(val) => (editValue = String(val))"
              />
            </template>
            <template v-else>
              <Input
                :model-value="String(editValue)"
                class="w-full h-8 text-sm"
                @update:model-value="(val) => (editValue = String(val))"
              />
            </template>
          </div>
          <div class="flex gap-2">
            <Button size="sm" variant="light" intent="success" rounded="md" @click="handleSave">
              Save
            </Button>
            <Button size="sm" variant="light" intent="error" rounded="md" @click="cancelEditing">
              Cancel
            </Button>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<style scoped lang="sass">
.admin-setting-item
  background: rgba(255, 255, 255, 0.02)
  border: 1px solid rgba(255, 255, 255, 0.05)
  backdrop-filter: var(--admin-glass-blur-light) saturate(160%)
  -webkit-backdrop-filter: var(--admin-glass-blur-light) saturate(160%)
  border-radius: 12px
  transition: all 0.2s ease

  &:hover
    border-color: var(--admin-glass-border-hover)
    background: rgba(255, 255, 255, 0.04)
</style>
