<script setup lang="ts">
import {
  LucideTrash2 as DeleteIcon,
  LucidePencil as RenameIcon,
  LucideCopy as DuplicateIcon,
  LucideShare as ShareIcon,
  LucideStar as DefaultIcon,
  LucideEraser as ClearIcon,
  LucideEllipsisVertical as MenuIcon,
} from '@lucide/vue'
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
  <DropdownMenu>
    <DropdownMenuTrigger as-child>
      <Button variant="ghost" size="icon-sm">
        <template #icon-left>
          <MenuIcon />
        </template>
      </Button>
    </DropdownMenuTrigger>

    <DropdownMenuContent align="end" class="min-w-[180px]">
      <DropdownMenuItem @select="handleSelect('rename')">
        <RenameIcon />
        Rename
      </DropdownMenuItem>
      <DropdownMenuItem @select="handleSelect('duplicate')">
        <DuplicateIcon />
        Duplicate
      </DropdownMenuItem>
      <DropdownMenuItem @select="handleSelect('share')">
        <ShareIcon />
        Share Code
      </DropdownMenuItem>
      <DropdownMenuItem :disabled="isDefault" @select="handleSelect('default')">
        <DefaultIcon />
        {{ isDefault ? 'Default' : 'Set Default' }}
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem variant="destructive" @select="handleSelect('clear')">
        <ClearIcon />
        Clear Items
      </DropdownMenuItem>
      <DropdownMenuItem variant="destructive" @select="handleSelect('delete')">
        <DeleteIcon />
        Delete
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
</template>
