<script setup lang="ts">
import type { PluginSetting } from '~/types'

interface Props {
    setting: PluginSetting
}

const props = defineProps<Props>()

const emit = defineEmits<{
    (
        e: 'save',
        payload: {
            key: string
            value: string | number | boolean | Record<string, unknown> | unknown[]
        }
    ): void
}>()

const isEditing = ref(false)
const editValue = ref<string | number | boolean>('')
const jsonError = ref<string | null>(null)

const startEditing = () => {
    jsonError.value = null
    switch (props.setting.type) {
        case 'boolean':
            editValue.value = props.setting.value === 'true'
            break
        case 'number':
            editValue.value = Number(props.setting.value) || 0
            break
        case 'json':
            // Pretty-print JSON for editing
            try {
                editValue.value = JSON.stringify(JSON.parse(props.setting.value), null, 2)
            } catch {
                editValue.value = props.setting.value
            }
            break
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
    jsonError.value = null
}

const handleSave = () => {
    jsonError.value = null

    if (props.setting.type === 'json') {
        try {
            const parsed = JSON.parse(String(editValue.value))
            emit('save', { key: props.setting.key, value: parsed })
        } catch (e) {
            jsonError.value = e instanceof Error ? e.message : 'Invalid JSON'
            return
        }
    } else {
        emit('save', { key: props.setting.key, value: editValue.value })
    }

    isEditing.value = false
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

const displayValue = computed(() => {
    if (props.setting.type === 'json') {
        try {
            return JSON.stringify(JSON.parse(props.setting.value), null, 2)
        } catch {
            return props.setting.value
        }
    }
    return props.setting.value
})
</script>

<template>
    <div class="plugin-setting-item">
        <div class="flex flex-col gap-3 p-4">
            <!-- Header: Label, key, badges -->
            <div class="flex items-start justify-between gap-3">
                <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2 mb-1 flex-wrap">
                        <span class="text-sm font-semibold text-white">
                            {{ setting.label || setting.key }}
                        </span>
                        <span
                            class="px-2 py-0.5 rounded-full text-xs font-medium border"
                            :class="typeBadgeClass"
                        >
                            {{ typeLabel }}
                        </span>
                        <span
                            v-if="setting.reloadBehavior === 'restart'"
                            class="px-2 py-0.5 rounded-full text-xs font-medium border bg-amber-500/20 text-amber-400 border-amber-500/30"
                        >
                            Requires Restart
                        </span>
                        <span
                            v-else
                            class="px-2 py-0.5 rounded-full text-xs font-medium border bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                        >
                            Live
                        </span>
                    </div>
                    <p v-if="setting.label" class="font-mono text-xs text-gray-500 mb-1">
                        {{ setting.key }}
                    </p>
                    <p v-if="setting.description" class="text-sm text-gray-400">
                        {{ setting.description }}
                    </p>
                    <p class="text-xs text-gray-500 mt-1">
                        Last updated: {{ formatDate(setting.updatedAt) }}
                        <span v-if="setting.updatedBy"> by {{ setting.updatedBy }}</span>
                    </p>
                </div>

                <!-- Edit button (when not editing) -->
                <NButton
                    v-if="!isEditing"
                    size="small"
                    secondary
                    type="primary"
                    @click="startEditing"
                >
                    Edit
                </NButton>
            </div>

            <!-- Value Display (when not editing) -->
            <div v-if="!isEditing" class="value-display">
                <template v-if="setting.type === 'boolean'">
                    <span
                        class="px-2 py-1 rounded text-sm"
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
                    <pre
                        class="text-xs bg-gray-800/50 px-3 py-2 rounded-lg text-gray-300 overflow-x-auto max-h-32"
                        >{{ displayValue }}</pre
                    >
                </template>
                <template v-else>
                    <span class="text-sm text-gray-300">{{ setting.value }}</span>
                </template>
            </div>

            <!-- Edit Mode -->
            <div v-else class="edit-area">
                <template v-if="setting.type === 'boolean'">
                    <NSwitch
                        :value="editValue === true || editValue === 'true'"
                        @update:value="(val: boolean) => (editValue = val)"
                    />
                </template>
                <template v-else-if="setting.type === 'number'">
                    <NInputNumber
                        :value="typeof editValue === 'number' ? editValue : Number(editValue) || 0"
                        class="w-full"
                        size="small"
                        @update:value="(val: number | null) => (editValue = val ?? 0)"
                    />
                </template>
                <template v-else-if="setting.type === 'json'">
                    <NInput
                        :value="String(editValue)"
                        type="textarea"
                        :rows="8"
                        class="w-full font-mono"
                        size="small"
                        :status="jsonError ? 'error' : undefined"
                        @update:value="
                            (val: string) => {
                                editValue = val
                                jsonError = null
                            }
                        "
                    />
                    <p v-if="jsonError" class="text-xs text-red-400 mt-1">
                        {{ jsonError }}
                    </p>
                </template>
                <template v-else>
                    <NInput
                        :value="String(editValue)"
                        class="w-full"
                        size="small"
                        @update:value="(val: string) => (editValue = val)"
                    />
                </template>

                <div class="flex gap-2 mt-2">
                    <NButton size="small" secondary type="success" @click="handleSave">
                        Save
                    </NButton>
                    <NButton size="small" secondary type="error" @click="cancelEditing">
                        Cancel
                    </NButton>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped lang="sass">
.plugin-setting-item
  background: rgba(255, 255, 255, 0.02)
  border: 1px solid rgba(255, 255, 255, 0.05)
  backdrop-filter: var(--admin-glass-blur-light) saturate(160%)
  -webkit-backdrop-filter: var(--admin-glass-blur-light) saturate(160%)
  border-radius: 12px
  transition: all 0.2s ease

  &:hover
    border-color: var(--admin-glass-border-hover)
    background: rgba(255, 255, 255, 0.04)

.value-display
  padding-left: 2px

.edit-area
  padding-left: 2px

pre
  font-family: 'SF Mono', 'Fira Code', 'Fira Mono', monospace
  white-space: pre-wrap
  word-break: break-word

:deep(.n-input--textarea .n-input__textarea-el)
  font-family: 'SF Mono', 'Fira Code', 'Fira Mono', monospace !important
  font-size: 12px !important
</style>
