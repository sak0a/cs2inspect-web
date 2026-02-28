<script setup lang="ts">
import type { SteamUser } from '~/services/steamAuth'
import { steamAuth } from '~/services/steamAuth'
import type { IEnhancedKnife, IEnhancedItem, KnifeConfiguration, UserProfile } from '~/types'
import { toSteamId } from '~/types/core/common'

const user = ref<SteamUser | null>(null)
const skins = ref<IEnhancedKnife[]>([])
const isLoading = ref<boolean>(true)
const error = ref<string | null>(null)
const showSkinModal = ref<boolean>(false)
const selectedKnife = ref<IEnhancedKnife | null>(null)
const tKnifeType = ref<number | null>(null)
const ctKnifeType = ref<number | null>(null)
const selectedTeamKnives = ref({
    terrorists: null as IEnhancedKnife | null,
    counterTerrorists: null as IEnhancedKnife | null,
})

const loadoutStore = useLoadoutStore()
const message = useMessage()
const { t } = useI18n()
const otherTeamHasSkin = useOtherTeamSkin(selectedKnife, skins)
const groupedKnives = useGroupedWeapons(skins)

const knifeOptions = computed(() => {
    return [
        { label: 'Player Inventory', value: -1 },
        { label: 'Default', value: 0 },
        ...Object.entries(groupedKnives.value).map(([knifeName, knifeData]) => ({
            label: knifeName,
            value: knifeData.weapons[0]?.weapon_defindex ?? -1,
        })),
    ]
})

const handleKnifeTypeChange = async (team: 't' | 'ct', knifeDefindex: number) => {
    if (!loadoutStore.selectedLoadoutId || !loadoutStore.selectedLoadout || !user.value?.steamId) {
        message.error('Please select a loadout first')
        return
    }

    await $fetch(
        `/api/loadouts/select?steamId=${user.value.steamId}&loadoutId=${loadoutStore.selectedLoadoutId}&type=knife`,
        {
            method: 'POST',
            body: {
                team: team === 't' ? 1 : 2,
                defindex: knifeDefindex === -1 ? null : knifeDefindex,
            },
        }
    )
        .then(async () => {
            if (!loadoutStore.selectedLoadout) {
                return
            }
            if (team === 't') {
                loadoutStore.selectedLoadout.selected_knife_t =
                    knifeDefindex === -1 ? null : knifeDefindex
            } else {
                loadoutStore.selectedLoadout.selected_knife_ct =
                    knifeDefindex === -1 ? null : knifeDefindex
            }
            updateSelectedKnives()
        })
        .catch((error) => {
            console.error(error)
            message.error('Failed to update Knife Type')
        })
}

const fetchLoadoutKnives = async () => {
    if (!loadoutStore.selectedLoadoutId || !user.value?.steamId) {
        return
    }
    isLoading.value = true
    await loadoutStore
        .fetchLoadoutKnives(toSteamId(user.value.steamId))
        .then(() => {
            skins.value = loadoutStore.loadoutSkins as IEnhancedKnife[]
            console.log('Fetched loadout knives: ', skins.value)
            updateSelectedKnives()
        })
        .catch(() => {
            message.error('Failed to load knives')
            error.value = 'Failed to load knives. Please try again later.'
        })
        .finally(() => (isLoading.value = false))
}

const findKnifeInGroups = (defindex: number | null) => {
    if (!defindex) return null
    // Flatten the nested arrays and find the matching knife
    return skins.value.flat().find((knife) => knife.weapon_defindex === defindex)
}

/**
 * Set the selected knives for each team at the top
 * Need to search through all weapon groups to find matching knives
 */
const updateSelectedKnives = () => {
    if (!loadoutStore.selectedLoadout) return
    selectedTeamKnives.value.terrorists =
        findKnifeInGroups(loadoutStore.selectedLoadout.selected_knife_t) ?? null
    selectedTeamKnives.value.counterTerrorists =
        findKnifeInGroups(loadoutStore.selectedLoadout.selected_knife_ct) ?? null

    // Set dropdown values: null→-1 (Player Inventory), 0→0 (Default), positive→defindex
    const selectedT = loadoutStore.selectedLoadout.selected_knife_t
    tKnifeType.value = selectedT ?? -1
    const selectedCT = loadoutStore.selectedLoadout.selected_knife_ct
    ctKnifeType.value = selectedCT ?? -1
}

const handleKnifeClick = (knife: IEnhancedKnife) => {
    console.log('Knife clicked: ', knife)
    selectedKnife.value = knife
    showSkinModal.value = true
}

// Convert SteamUser to UserProfile for components that expect branded types
const userAsProfile = computed((): UserProfile | null => {
    if (!user.value) return null
    return {
        steamId: toSteamId(user.value.steamId),
        personaName: user.value.personaName,
        avatar: user.value.avatar,
        profileUrl: user.value.profileUrl,
    }
})

// Wrapper handlers that accept IEnhancedItem but cast to IEnhancedKnife
const handleSkinSaveWrapper = async (skin: IEnhancedItem, customization: KnifeConfiguration) => {
    await handleSkinSave(skin as IEnhancedKnife, customization)
}

const handleKnifeDuplicateWrapper = async (
    skin: IEnhancedItem,
    customization: KnifeConfiguration
) => {
    await handleKnifeDuplicate(skin as IEnhancedKnife, customization)
}

/**
 * Auto-save handler for automatic saving without closing modal
 */
const handleAutoSaveWrapper = async (skin: IEnhancedItem, customization: KnifeConfiguration) => {
    await handleAutoSave(skin as IEnhancedKnife, customization)
}

const handleAutoSave = async (knife: IEnhancedKnife, customization: KnifeConfiguration) => {
    if (!loadoutStore.selectedLoadoutId || !user.value?.steamId) {
        throw new Error('No loadout or user selected')
    }
    if (customization.paintindex === null) {
        return // Don't auto-save without a paint selected
    }
    await $fetch<{ success?: boolean; message: string }>(
        `/api/items/knives/save?steamId=${user.value.steamId}&loadoutId=${loadoutStore.selectedLoadoutId}`,
        {
            method: 'POST',
            body: {
                defindex: knife.weapon_defindex,
                team: customization.team,
                paintindex: customization.paintindex,
                paintseed: customization.paintseed,
                paintwear: customization.paintwear,
                stattrak_enabled: customization.stattrak_enabled,
                stattrak_count: customization.stattrak_count,
                nametag: customization.nametag,
                active: customization.active,
                reset: customization.reset,
            },
        }
    ).then(async () => {
        // Silently refresh data without closing modal
        await fetchLoadoutKnives()
    })
}

const handleSkinSave = async (knife: IEnhancedKnife, customization: KnifeConfiguration) => {
    if (!loadoutStore.selectedLoadoutId || !user.value?.steamId) {
        return
    }
    console.log('Saving knife: ', knife, customization)
    await $fetch<{ message: string }>(
        `/api/items/knives/save?steamId=${user.value.steamId}&loadoutId=${loadoutStore.selectedLoadoutId}`,
        {
            method: 'POST',
            body: {
                defindex: knife.weapon_defindex,
                team: customization.team,
                paintindex: customization.paintindex,
                paintseed: customization.paintseed,
                paintwear: customization.paintwear,
                stattrak_enabled: customization.stattrak_enabled,
                stattrak_count: customization.stattrak_count,
                nametag: customization.nametag,
                active: customization.active,
                reset: customization.reset,
            },
        }
    )
        .then(async (data) => {
            message.success(data.message)
            await fetchLoadoutKnives()
            showSkinModal.value = false
        })
        .catch((error) => {
            console.error('Error saving knife:', error)
            message.error('Failed to save knife configuration')
        })
}

const handleKnifeDuplicate = async (knife: IEnhancedKnife, customization: KnifeConfiguration) => {
    if (!loadoutStore.selectedLoadoutId || !user.value?.steamId) {
        return
    }

    try {
        console.log('Duplicating knife: ', knife.databaseInfo?.team, customization.team)

        const result = await $fetch<{ success: boolean; message: string }>(
            `/api/items/knives/save?steamId=${user.value.steamId}&loadoutId=${loadoutStore.selectedLoadoutId}`,
            {
                method: 'POST',
                body: {
                    defindex: knife.weapon_defindex,
                    team: customization.team,
                    paintindex: customization.paintindex,
                    paintseed: customization.paintseed,
                    paintwear: customization.paintwear,
                    stattrak_enabled: customization.stattrak_enabled,
                    stattrak_count: customization.stattrak_count,
                    nametag: customization.nametag,
                    active: customization.active,
                    reset: customization.reset,
                },
            }
        )

        if (result.success) {
            message.success('Knife duplicated successfully')
            await fetchLoadoutKnives()
        } else {
            throw new Error(result.message)
        }
    } catch (error) {
        console.error('Error duplicating knife:', error)
        message.error('Failed to duplicate knife')
    }
}

// No animation code

// Real-time sync: listen for plugin-originated changes
const { connect: connectSync, onSyncEvent } = useSyncEvents()

onSyncEvent((event) => {
    if (event.type !== 'item_changed') return
    if (event.itemType === 'knife' || event.itemType === 'loadout') {
        showSkinModal.value = false
        fetchLoadoutKnives()
    }
})

onMounted(async () => {
    user.value = steamAuth.getSavedUser()
    if (user.value?.steamId) {
        connectSync()
        try {
            await loadoutStore.fetchLoadouts(toSteamId(user.value.steamId))
            if (loadoutStore.selectedLoadoutId) {
                if (skins.value.length === 0) {
                    await fetchLoadoutKnives()
                }
            } else {
                isLoading.value = false
            }
        } catch (e) {
            console.error(e)
            isLoading.value = false
        }
    } else {
        isLoading.value = false
    }
})

watch(
    () => showSkinModal.value,
    (isVisible) => {
        if (!isVisible && selectedKnife.value) {
            console.log('Updating selectedKnife:', selectedKnife.value)
            selectedKnife.value = { ...selectedKnife.value }
        }
    }
)

watch(
    () => loadoutStore.selectedLoadoutId,
    async (newLoadoutId) => {
        if ((newLoadoutId || skins.value.length === 0) && newLoadoutId !== null) {
            console.log('Fetching knives for new loadout:', newLoadoutId)
            await fetchLoadoutKnives()
        }
    },
    { immediate: true }
)
</script>

<template>
    <div class="p-4">
        <div class="max-w-7xl mx-auto">
            <SkinPageLayout
                title="Knives"
                :user="user"
                :error="error || ''"
                :is-loading="isLoading && (!user || !loadoutStore.selectedLoadoutId)"
            />
            <!-- Knife Type Groups -->
            <div v-if="!error && user && loadoutStore.selectedLoadoutId">
                <!-- Skeleton Loading State -->
                <div
                    v-if="isLoading"
                    class="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-4"
                >
                    <div
                        v-for="i in 8"
                        :key="i"
                        class="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-dark)] p-4"
                    >
                        <NSkeleton height="128px" />
                        <div class="mt-3">
                            <NSkeleton text :repeat="1" />
                            <div class="mt-2">
                                <NSkeleton height="4px" />
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Content when loaded -->
                <template v-else>
                    <div class="flex gap-x-10 justify-start">
                        <div class="flex items-center justify-end space-x-2">
                            <span class="font-bold whitespace-nowrap text-white">
                                {{ t('teams.counterTerrorists') }}
                            </span>
                            <NSelect
                                v-model:value="ctKnifeType"
                                :options="knifeOptions"
                                placeholder="Select knife type"
                                class="w-72"
                                @update:value="handleKnifeTypeChange('ct', $event)"
                            />
                        </div>
                        <div class="flex items-center space-x-2">
                            <span class="font-bold text-white">
                                {{ t('teams.terrorists') }}
                            </span>
                            <NSelect
                                v-model:value="tKnifeType"
                                :options="knifeOptions"
                                placeholder="Select knife type"
                                class="w-72"
                                @update:value="handleKnifeTypeChange('t', $event)"
                            />
                        </div>
                    </div>
                    <!-- Skins Grid -->
                    <TransitionGroup
                        name="card-fade"
                        tag="div"
                        class="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-4 pt-4"
                        appear
                    >
                        <KnifeTabs
                            v-for="(knifeData, knifeName, index) in groupedKnives"
                            :key="knifeName"
                            :style="{ '--delay': `${index * 50}ms` }"
                            :weapon-data="{
                                weapons: knifeData.weapons as any,
                                defaultName: knifeData.defaultName,
                                availableTeams: 'both',
                            }"
                            @weapon-click="handleKnifeClick as any"
                        />
                    </TransitionGroup>
                    <!-- No Skins State -->
                    <div v-if="skins.length === 0" class="text-center py-12">
                        <p class="text-gray-400">No skins available for this loadout</p>
                    </div>
                </template>
            </div>

            <!-- Knife Skin Selection & Customization Modal -->
            <LazyKnifeSkinModal
                v-if="userAsProfile"
                v-model:visible="showSkinModal"
                :user="userAsProfile"
                :weapon="selectedKnife"
                :other-team-has-skin="otherTeamHasSkin"
                @save="handleSkinSaveWrapper"
                @auto-save="handleAutoSaveWrapper"
                @duplicate="handleKnifeDuplicateWrapper"
            />
        </div>
    </div>
</template>

<style scoped>
.selected-slot {
    border: 2px dashed #666;
    transition: all 0.2s ease;
}

.selected-slot:hover {
    border-color: #888;
    background-color: rgba(26, 26, 26, 0.5);
}

.n-card {
    background: #242424;
    border: 1px solid #313030;
}

.card-fade-enter-active {
    transition:
        opacity 0.3s ease,
        transform 0.3s ease;
    transition-delay: var(--delay, 0ms);
}

.card-fade-enter-from {
    opacity: 0;
    transform: translateY(10px);
}

.card-fade-leave-active {
    transition: opacity 0.2s ease;
}

.card-fade-leave-to {
    opacity: 0;
}
</style>
