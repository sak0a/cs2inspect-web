<script setup lang="ts">
import {
  LucideTrash2 as DeleteIcon,
  LucidePencil as RenameIcon,
  LucideCopy as DuplicateIcon,
  LucideShare as ShareIcon,
  LucideStar as DefaultIcon,
  LucideEraser as ClearIcon,
  LucideEllipsisVertical as MenuIcon,
} from 'lucide-vue-next'
import type { DBLoadout } from '~/types'

interface Props {
  row: DBLoadout
}

const props = defineProps<Props>()

const emit = defineEmits<{
  action: [key: string]
}>()

const isDefault = computed(() => props.row.is_default === 1 || props.row.is_default === true)

const handleSelect = (key: string) => {
  emit('action', key)
}
</script>

<template>
  <SDropdown trigger="click" variant="glass" @select="handleSelect">
    <template #trigger>
      <SButton variant="ghost" size="sm" icon-only rounded="full">
        <template #icon-left>
          <MenuIcon />
        </template>
      </SButton>
    </template>

    <SDropdownItem item-key="rename" label="Rename" :icon="RenameIcon" />
    <SDropdownItem item-key="duplicate" label="Duplicate" :icon="DuplicateIcon" />
    <SDropdownItem item-key="share" label="Share Code" :icon="ShareIcon" />
    <SDropdownItem
      item-key="default"
      :label="isDefault ? 'Default' : 'Set Default'"
      :icon="DefaultIcon"
      :disabled="isDefault"
      icon-color="#f59e0b"
    />
    <SDropdownDivider />
    <SDropdownItem item-key="clear" label="Clear Items" :icon="ClearIcon" icon-color="#ef4444" />
    <SDropdownItem item-key="delete" label="Delete" :icon="DeleteIcon" icon-color="#ef4444" />
  </SDropdown>
</template>
