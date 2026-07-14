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
      <Button variant="ghost" size="sm" icon-only rounded="full">
        <template #icon-left>
          <MenuIcon />
        </template>
      </Button>
    </DropdownMenuTrigger>

    <DropdownMenuContent
      align="end"
      class="min-w-[180px] rounded-xl border-border/50 bg-background/80 shadow-2xl backdrop-blur-xl"
    >
      <DropdownMenuItem class="rounded-lg" @select="handleSelect('rename')">
        <RenameIcon />
        Rename
      </DropdownMenuItem>
      <DropdownMenuItem class="rounded-lg" @select="handleSelect('duplicate')">
        <DuplicateIcon />
        Duplicate
      </DropdownMenuItem>
      <DropdownMenuItem class="rounded-lg" @select="handleSelect('share')">
        <ShareIcon />
        Share Code
      </DropdownMenuItem>
      <DropdownMenuItem class="rounded-lg" :disabled="isDefault" @select="handleSelect('default')">
        <DefaultIcon class="text-amber-500" />
        {{ isDefault ? 'Default' : 'Set Default' }}
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem class="rounded-lg" @select="handleSelect('clear')">
        <ClearIcon class="text-red-500" />
        Clear Items
      </DropdownMenuItem>
      <DropdownMenuItem class="rounded-lg" @select="handleSelect('delete')">
        <DeleteIcon class="text-red-500" />
        Delete
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
</template>
