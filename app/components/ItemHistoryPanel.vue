<script setup lang="ts">
/**
 * ItemHistoryPanel - Shows version history for an item
 *
 * Displays a timeline of changes and allows restoring previous versions.
 */

import type { HistoryItemType, HistoryItemCategory } from '#shared/types/history'
import type { ItemHistoryRecord } from '~/server/database/schema/itemHistory'

interface Props {
    visible: boolean
    itemType: HistoryItemType
    category?: HistoryItemCategory
    defindex: number
    team: number
    steamId: string
    loadoutId: number
}

const props = defineProps<Props>()

const emit = defineEmits<{
    (e: 'update:visible', value: boolean): void
    (e: 'restore', record: ItemHistoryRecord): void
}>()

const { t } = useI18n()
const message = useMessage()

const state = ref({
    records: [] as ItemHistoryRecord[],
    isLoading: false,
    isRestoring: false,
    selectedRecord: null as ItemHistoryRecord | null,
    showRestoreConfirm: false,
    pagination: {
        currentPage: 1,
        limit: 10,
        hasNext: false,
    },
})

/**
 * Fetch history records for the item
 */
const fetchHistory = async () => {
    if (!props.steamId || !props.loadoutId || !props.defindex) return

    state.value.isLoading = true
    try {
        const offset = (state.value.pagination.currentPage - 1) * state.value.pagination.limit
        const params = new URLSearchParams({
            steamId: props.steamId,
            loadoutId: String(props.loadoutId),
            defindex: String(props.defindex),
            team: String(props.team),
            limit: String(state.value.pagination.limit),
            offset: String(offset),
        })

        if (props.category) {
            params.append('category', props.category)
        }

        const response = await $fetch<{
            success: boolean
            data: ItemHistoryRecord[]
            pagination: {
                currentPage: number
                totalPages: number
                totalItems: number
                limit: number
                count: number
                hasNext: boolean
                hasPrevious: boolean
            }
        }>(`/api/items/history/${props.itemType}?${params.toString()}`)

        if (response.success) {
            state.value.records = response.data
            state.value.pagination.currentPage = response.pagination.currentPage
            state.value.pagination.hasNext = response.pagination.hasNext
        }
    } catch (error) {
        console.error('Failed to fetch history:', error)
        message.error(t('history.fetchError') as string)
    } finally {
        state.value.isLoading = false
    }
}

/**
 * Handle restore confirmation
 */
const handleRestoreClick = (record: ItemHistoryRecord) => {
    state.value.selectedRecord = record
    state.value.showRestoreConfirm = true
}

/**
 * Perform restore
 */
const handleRestore = async () => {
    if (!state.value.selectedRecord) return

    state.value.isRestoring = true
    try {
        const response = await $fetch<{ success: boolean; message: string }>(
            '/api/items/history/restore',
            {
                method: 'POST',
                body: {
                    historyId: state.value.selectedRecord.id,
                    steamId: props.steamId,
                },
            }
        )

        if (response.success) {
            message.success(t('history.restoreSuccess') as string)
            emit('restore', state.value.selectedRecord)
            handleClose()
        }
    } catch (error) {
        console.error('Failed to restore:', error)
        message.error(t('history.restoreError') as string)
    } finally {
        state.value.isRestoring = false
        state.value.showRestoreConfirm = false
        state.value.selectedRecord = null
    }
}

/**
 * Format the change type for display
 */
const formatChangeType = (changeType: string): string => {
    const typeMap: Record<string, string> = {
        sticker_added: t('history.changeTypes.stickerAdded') as string,
        sticker_removed: t('history.changeTypes.stickerRemoved') as string,
        sticker_modified: t('history.changeTypes.stickerModified') as string,
        keychain_added: t('history.changeTypes.keychainAdded') as string,
        keychain_removed: t('history.changeTypes.keychainRemoved') as string,
        keychain_modified: t('history.changeTypes.keychainModified') as string,
        wear_changed: t('history.changeTypes.wearChanged') as string,
        pattern_changed: t('history.changeTypes.patternChanged') as string,
        paint_changed: t('history.changeTypes.paintChanged') as string,
        nametag_changed: t('history.changeTypes.nametagChanged') as string,
        stattrak_toggled: t('history.changeTypes.stattrakToggled') as string,
        stattrak_count_changed: t('history.changeTypes.stattrakCountChanged') as string,
        active_toggled: t('history.changeTypes.activeToggled') as string,
        multiple_changes: t('history.changeTypes.multipleChanges') as string,
        initial_save: t('history.changeTypes.initialSave') as string,
        reset: t('history.changeTypes.reset') as string,
    }
    return typeMap[changeType] || changeType
}

/**
 * Format date for display
 */
const formatDate = (date: Date | string): string => {
    const d = new Date(date)
    return d.toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    })
}

/**
 * Get icon for change type
 */
const getChangeIcon = (changeType: string): string => {
    const iconMap: Record<string, string> = {
        sticker_added: '🏷️',
        sticker_removed: '🗑️',
        sticker_modified: '✏️',
        keychain_added: '🔗',
        keychain_removed: '🗑️',
        keychain_modified: '✏️',
        wear_changed: '💎',
        pattern_changed: '🎨',
        paint_changed: '🎨',
        nametag_changed: '📝',
        stattrak_toggled: '📊',
        stattrak_count_changed: '📊',
        active_toggled: '⚡',
        multiple_changes: '📦',
        initial_save: '✨',
        reset: '🔄',
    }
    return iconMap[changeType] || '📝'
}

/**
 * Parse change description and return up to 3 changes
 */
const getDisplayChanges = (description: string | null | undefined): string[] => {
    if (!description) return []
    // Split by ", " and take first 3
    const changes = description.split(', ').slice(0, 3)
    return changes
}

/**
 * Check if there are more changes than displayed
 */
const hasMoreChanges = (description: string | null | undefined): boolean => {
    if (!description) return false
    const changes = description.split(', ')
    return changes.length > 3
}

/**
 * Load more records
 */
const loadMore = () => {
    state.value.pagination.currentPage++
    fetchHistory()
}

/**
 * Close panel
 */
const handleClose = () => {
    emit('update:visible', false)
}

// Fetch history when visible
watch(
    () => props.visible,
    (isVisible) => {
        if (isVisible) {
            state.value.pagination.currentPage = 1
            fetchHistory()
        }
    },
    { immediate: true }
)
</script>

<template>
    <NDrawer
        :show="visible"
        :width="360"
        placement="right"
        class="history-drawer"
        :on-update:show="(val: boolean) => emit('update:visible', val)"
    >
        <NDrawerContent :title="String(t('history.title'))" closable class="history-drawer-content">
            <div class="history-panel">
                <!-- Loading State -->
                <div
                    v-if="state.isLoading && state.records.length === 0"
                    class="flex justify-center items-center py-8"
                >
                    <NSpin size="large" />
                </div>

                <!-- Empty State -->
                <NEmpty
                    v-else-if="state.records.length === 0"
                    :description="String(t('history.empty'))"
                    class="py-8"
                />

                <!-- History Timeline -->
                <div v-else class="space-y-2">
                    <div
                        v-for="record in state.records"
                        :key="record.id"
                        class="history-item group"
                    >
                        <div class="flex items-start gap-3">
                            <!-- Icon -->
                            <div
                                class="flex-shrink-0 w-8 h-8 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center"
                            >
                                <span class="text-sm scale-125">{{
                                    getChangeIcon(record.change_type)
                                }}</span>
                            </div>

                            <!-- Content -->
                            <div class="flex-1 min-w-0">
                                <div class="flex items-center justify-between gap-2">
                                    <!-- Version ID with full description tooltip -->
                                    <NTooltip
                                        v-if="record.change_description"
                                        trigger="hover"
                                        placement="top"
                                    >
                                        <template #trigger>
                                            <span class="version-id cursor-help">
                                                {{
                                                    record.version_id ||
                                                    formatChangeType(record.change_type)
                                                }}
                                            </span>
                                        </template>
                                        <div class="max-w-xs">
                                            <div class="font-medium text-sm mb-1">
                                                {{ formatChangeType(record.change_type) }}
                                            </div>
                                            <div class="text-xs text-gray-300">
                                                {{ record.change_description }}
                                            </div>
                                        </div>
                                    </NTooltip>
                                    <span v-else class="version-id">
                                        {{
                                            record.version_id ||
                                            formatChangeType(record.change_type)
                                        }}
                                    </span>
                                    <span class="text-xs text-gray-500 flex-shrink-0">
                                        {{ formatDate(record.created_at) }}
                                    </span>
                                </div>

                                <!-- Changes list (up to 3) -->
                                <div v-if="record.change_description" class="mt-1.5 space-y-0.5">
                                    <div
                                        v-for="(change, idx) in getDisplayChanges(
                                            record.change_description
                                        )"
                                        :key="idx"
                                        class="change-item"
                                    >
                                        {{ change }}
                                    </div>
                                    <div
                                        v-if="hasMoreChanges(record.change_description)"
                                        class="change-more"
                                    >
                                        +{{ record.change_description.split(', ').length - 3 }} more
                                    </div>
                                </div>

                                <!-- Snapshot Badge -->
                                <span
                                    v-if="record.is_snapshot"
                                    class="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-500/15 text-amber-400 border border-amber-500/20 mt-1"
                                >
                                    {{ t('history.snapshot') }}
                                </span>
                            </div>

                            <!-- Restore Button -->
                            <NButton
                                size="tiny"
                                quaternary
                                class="rounded-full bg-gray-300"
                                @click="handleRestoreClick(record)"
                            >
                                {{ t('history.restore') }}
                            </NButton>
                        </div>
                    </div>

                    <!-- Load More -->
                    <div v-if="state.pagination.hasNext" class="pt-4">
                        <NButton block :loading="state.isLoading" @click="loadMore">
                            {{ t('history.loadMore') }}
                        </NButton>
                    </div>
                </div>
            </div>

            <!-- Restore Confirmation Modal -->
            <NModal
                v-model:show="state.showRestoreConfirm"
                preset="card"
                style="width: 420px"
                :title="String(t('history.restoreConfirmTitle'))"
                :bordered="false"
                :auto-focus="false"
                :mask-closable="!state.isRestoring"
                :closable="!state.isRestoring"
            >
                <p class="text-gray-300">{{ t('history.restoreConfirmMessage') }}</p>
                <div
                    v-if="state.selectedRecord"
                    class="mt-4 p-4 rounded-xl bg-black/40 border border-amber-500/20 backdrop-blur-sm"
                >
                    <div class="flex items-center gap-2 mb-2">
                        <span class="font-mono text-amber-400 font-medium text-sm">{{
                            state.selectedRecord.version_id
                        }}</span>
                        <span class="text-xs text-gray-500">{{
                            formatDate(state.selectedRecord.created_at)
                        }}</span>
                    </div>
                    <p
                        v-if="state.selectedRecord.change_description"
                        class="text-xs text-gray-400 leading-relaxed"
                    >
                        {{ state.selectedRecord.change_description }}
                    </p>
                </div>
                <div class="flex justify-end mt-5 gap-3">
                    <NButton
                        secondary
                        :disabled="state.isRestoring"
                        @click="state.showRestoreConfirm = false"
                    >
                        {{ t('common.cancel') }}
                    </NButton>
                    <NButton type="primary" :loading="state.isRestoring" @click="handleRestore">
                        {{ t('history.restore') }}
                    </NButton>
                </div>
            </NModal>
        </NDrawerContent>
    </NDrawer>
</template>

<style scoped lang="scss">
.history-panel {
    @apply px-1;
}

.history-item {
    @apply p-3 rounded-xl transition-all duration-200;
    backdrop-filter: blur(12px) saturate(100%);
    -webkit-backdrop-filter: blur(12px) saturate(140%);
    border: 1px solid rgba(255, 255, 255, 0.06);
    transition: all 0.1s ease-in-out;
    box-shadow:
        0 4px 16px rgba(0, 0, 0, 0.4),
        inset 0 1px 0 rgba(255, 255, 255, 0.03);
}

.history-item:hover {
    background: rgba(9, 9, 9, 0.75);
    border-color: rgba(245, 158, 11, 0.15);
    box-shadow:
        0 8px 24px rgba(0, 0, 0, 0.45),
        0 0 0 1px rgba(245, 158, 11, 0.08),
        inset 0 1px 0 rgba(255, 255, 255, 0.05);
    transform: translateY(-1px);
}

.version-id {
    @apply text-sm font-mono font-medium text-amber-400 truncate;
    letter-spacing: 0.02em;
    text-shadow:
        0 1px 3px rgba(0, 0, 0, 0.4),
        0 0 8px rgba(245, 158, 11, 0.15);
}

.version-id:hover {
    @apply text-amber-300;
    text-shadow:
        0 1px 3px rgba(0, 0, 0, 0.4),
        0 0 12px rgba(245, 158, 11, 0.25);
}

.change-item {
    @apply text-xs text-gray-400 pl-0.5;
    line-height: 1.4;
}

.change-item::before {
    content: '•';
    @apply text-amber-500/50 mr-1;
}

.change-more {
    @apply text-xs text-amber-500/60 italic pl-0.5;
}
</style>

<style lang="scss">
/* Global styles for the drawer - needs to be unscoped to affect n-drawer components */
/* Override ALL Naive UI drawer elements with transparent/dark glassmorphism */

/* Root drawer container */
.history-drawer,
.history-drawer .n-drawer {
    background: transparent !important;
    --n-body-color: transparent !important;
    --n-color: rgba(16, 16, 16, 0.7) !important;
}

/* Main content wrapper - this is where we apply the glassmorphism */
.history-drawer .n-drawer-content-wrapper {
    background: rgba(16, 16, 16, 0.5) !important;
    backdrop-filter: blur(20px) saturate(150%) !important;
    -webkit-backdrop-filter: blur(20px) saturate(150%) !important;
    border-left: 1px solid rgba(255, 255, 255, 0.08) !important;

    box-shadow:
        -8px 0 32px rgba(0, 0, 0, 0.5),
        -2px 0 8px rgba(0, 0, 0, 0.3) !important;
}

/* All inner wrappers need to be transparent */
.history-drawer .n-drawer-body-content-wrapper,
.history-drawer-content,
.history-drawer-content .n-drawer-body,
.history-drawer-content .n-scrollbar,
.history-drawer-content .n-scrollbar-container,
.history-drawer-content .n-scrollbar-content {
    padding: 2px !important;
    background: transparent !important;
    background-color: transparent !important;
}

/* Header styling */
.history-drawer-content .n-drawer-header {
    background: rgba(16, 16, 16, 0.5) !important;
    backdrop-filter: blur(20px) saturate(150%) !important;
    -webkit-backdrop-filter: blur(20px) saturate(150%) !important;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08) !important;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.4);
}

.history-drawer-content .n-drawer-header__main {
    color: rgba(255, 255, 255, 0.95) !important;
    font-weight: 600;
    letter-spacing: 0.01em;
}

/* Scrollbar styling */
.history-drawer .n-scrollbar-rail {
    background: rgba(255, 255, 255, 0.02) !important;
}

.history-drawer .n-scrollbar-rail .n-scrollbar {
    background: rgba(245, 158, 11, 0.2) !important;
    border-radius: 4px !important;
}
</style>
