<script setup lang="ts">
import type { SteamUser } from '~/services/steamAuth'
import { steamAuth } from '~/services/steamAuth'
import type { IEnhancedGlove, GloveConfiguration, GloveItemData, UserProfile } from '~/types'
import { toSteamId } from '~/types/core/branded'
import gloveSilhouette from '~/assets/svg/gloves.svg'

const user = ref<SteamUser | null>(null)
const skins = ref<IEnhancedGlove[]>([])
const isLoading = ref<boolean>(true)
const error = ref<string | null>(null)
const showSkinModal = ref<boolean>(false)
const selectedGlove = ref<IEnhancedGlove | null>(null)
const tGloveType = ref<number | null>(null)
const ctGloveType = ref<number | null>(null)
const selectedTeamGloves = ref({
  terrorists: null as IEnhancedGlove | null,
  counterTerrorists: null as IEnhancedGlove | null,
})

const loadoutStore = useLoadoutStore()
const message = useToast()
const { t } = useI18n()
const { teamSide, teamNumber } = useTeamToggle()
const otherTeamHasSkin = useOtherTeamSkin(selectedGlove, skins)
const groupedGloves = useGroupedWeapons(skins)

// Heading micro-label counts, derived from already-loaded grid data:
// a glove counts as configured when it has a DB entry for the active team.
const totalCount = computed(() => Object.keys(groupedGloves.value).length)
const configuredCount = computed(
  () =>
    Object.values(groupedGloves.value).filter((data) =>
      data.weapons.some((w) => w.databaseInfo?.team === teamNumber.value)
    ).length
)

// Single glove type computed that reacts to global team toggle
const currentGloveType = computed({
  get: () => (teamSide.value === 't' ? tGloveType.value : ctGloveType.value),
  set: (val) => {
    if (teamSide.value === 't') tGloveType.value = val
    else ctGloveType.value = val
  },
})

const gloveOptions = computed(() => {
  return [
    { label: 'Player Inventory', value: -1 },
    { label: 'Default', value: 0 },
    ...Object.entries(groupedGloves.value).map(([gloveName, gloveData]) => ({
      label: gloveName,
      value: gloveData.weapons[0]?.weapon_defindex ?? -1,
    })),
  ]
})

const handleGloveTypeChange = async (team: 't' | 'ct', gloveDefindex: number) => {
  if (!loadoutStore.selectedLoadoutId || !loadoutStore.selectedLoadout || !user.value?.steamId) {
    message.error('Please select a loadout first')
    return
  }

  console.log('Glove Type Change', team, gloveDefindex)
  await $fetch(
    `/api/loadouts/select?steamId=${user.value.steamId}&loadoutId=${loadoutStore.selectedLoadoutId}&type=glove`,
    {
      method: 'POST',
      body: {
        team: team === 't' ? 1 : 2,
        defindex: gloveDefindex === -1 ? null : gloveDefindex,
      },
    }
  )
    .then(async () => {
      if (!loadoutStore.selectedLoadout) {
        return
      }
      if (team === 't') {
        loadoutStore.selectedLoadout.selected_glove_t = gloveDefindex === -1 ? null : gloveDefindex
      } else {
        loadoutStore.selectedLoadout.selected_glove_ct = gloveDefindex === -1 ? null : gloveDefindex
      }
      updateSelectedGloves()
    })
    .catch((error) => {
      console.error(error)
      message.error('Failed to update Glove Type')
    })
}

// Display label for the current selection (reka Select won't show a preselected
// option's label until the menu is opened, so derive it from the options list).
const currentGloveLabel = computed(
  () => gloveOptions.value.find((o) => o.value === currentGloveType.value)?.label
)

const onGloveTypeChange = (val: unknown) => {
  const defindex = Number(val)
  currentGloveType.value = defindex
  handleGloveTypeChange(teamSide.value, defindex)
}

const fetchLoadoutGloves = async () => {
  if (!loadoutStore.selectedLoadoutId || !user.value?.steamId) {
    return
  }
  isLoading.value = true
  await loadoutStore
    .fetchLoadoutGloves(toSteamId(user.value.steamId))
    .then(() => {
      skins.value = loadoutStore.loadoutSkins as IEnhancedGlove[]
      updateSelectedGloves()
    })
    .catch(() => {
      message.error('Failed to load gloves')
      error.value = 'Failed to load gloves. Please try again later.'
    })
    .finally(() => (isLoading.value = false))
}

const findGloveInGroups = (defindex: number | null) => {
  if (!defindex) return null
  // Flatten the nested arrays and find the matching glove
  return skins.value.flat().find((glove) => glove.weapon_defindex === defindex)
}

/**
 * Set the selected gloves for each team at the top
 * Need to search through all weapon groups to find matching gloves
 */
const updateSelectedGloves = () => {
  if (!loadoutStore.selectedLoadout) return
  selectedTeamGloves.value.terrorists =
    findGloveInGroups(loadoutStore.selectedLoadout.selected_glove_t) ?? null
  selectedTeamGloves.value.counterTerrorists =
    findGloveInGroups(loadoutStore.selectedLoadout.selected_glove_ct) ?? null

  // Set dropdown values: null→-1 (Player Inventory), 0→0 (Default), positive→defindex
  const selectedT = loadoutStore.selectedLoadout.selected_glove_t
  tGloveType.value = selectedT ?? -1
  const selectedCT = loadoutStore.selectedLoadout.selected_glove_ct
  ctGloveType.value = selectedCT ?? -1
}

const handleGloveClick = (glove: IEnhancedGlove) => {
  selectedGlove.value = glove
  showSkinModal.value = true
}

/**
 * Auto-save handler for automatic saving without closing modal
 */
const handleAutoSave = async (glove: IEnhancedGlove, customization: GloveConfiguration) => {
  if (!loadoutStore.selectedLoadoutId || !user.value?.steamId) {
    throw new Error('No loadout or user selected')
  }
  if (customization.paintindex === null) {
    return // Don't auto-save without a paint selected
  }
  await $fetch<{ success: boolean; message: string }>(
    `/api/items/gloves/save?steamId=${user.value.steamId}&loadoutId=${loadoutStore.selectedLoadoutId}`,
    {
      method: 'POST',
      body: {
        defindex: glove.weapon_defindex,
        active: customization.active,
        paintindex: customization.paintindex,
        paintIndexOverride: customization.paintIndexOverride,
        paintwear: customization.paintwear,
        paintseed: customization.paintseed,
        team: glove.databaseInfo?.team || customization.team,
        reset: customization.reset,
      },
    }
  ).then(async (data) => {
    if (data.success) {
      // Silently refresh data without closing modal
      await fetchLoadoutGloves()
    }
  })
}

const handleSkinSelect = async (glove: IEnhancedGlove, customization: GloveConfiguration) => {
  if (!loadoutStore.selectedLoadoutId || !user.value?.steamId) {
    message.error('Please select a loadout first')
    return
  }
  try {
    const data = await $fetch<{ success: boolean; message: string }>(
      `/api/items/gloves/save?steamId=${user.value.steamId}&loadoutId=${loadoutStore.selectedLoadoutId}`,
      {
        method: 'POST',
        body: {
          defindex: glove.weapon_defindex,
          active: customization.active,
          paintindex: customization.paintindex,
          paintIndexOverride: customization.paintIndexOverride,
          paintwear: customization.paintwear,
          paintseed: customization.paintseed,
          team: glove.databaseInfo?.team || customization.team,
          reset: customization.reset,
        },
      }
    )

    if (data.success) {
      message.success(data.message)
      await fetchLoadoutGloves()
      showSkinModal.value = false
    } else {
      throw new Error(data.message)
    }
  } catch (error) {
    console.error('Error saving glove:', error)
    message.error('Failed to save glove configuration')
  }
}

const handleGloveDuplicate = async (glove: IEnhancedGlove, customization: GloveConfiguration) => {
  if (!loadoutStore.selectedLoadoutId || !user.value?.steamId) {
    message.error('Please select a loadout first')
    return
  }

  try {
    console.log('Duplicating glove: ', glove.databaseInfo?.team, customization.team)
    const result = await $fetch<{ success: boolean; message: string }>(
      `/api/items/gloves/save?steamId=${user.value.steamId}&loadoutId=${loadoutStore.selectedLoadoutId}`,
      {
        method: 'POST',
        body: {
          defindex: glove.weapon_defindex,
          active: true,
          paintindex: customization.paintindex,
          paintwear: customization.paintwear || 0,
          paintseed: customization.paintseed || 0,
          team: customization.team, // This will be the opposite team number
          reset: false,
        },
      }
    )

    if (result.success) {
      message.success('Glove duplicated successfully')
      await fetchLoadoutGloves()
    } else {
      throw new Error(result.message)
    }
  } catch (error) {
    console.error('Error duplicating glove:', error)
    message.error('Failed to duplicate glove')
  }
}

// Motion: cards stagger in after every load/refetch (initial, SSE, auto-save
// silent refresh — all toggle isLoading). The grid shows both teams, so team
// switches don't remount it and need no wipe here.
const gridRef = ref<HTMLElement | null>(null)
useGridReveal(gridRef, { watch: () => isLoading.value })

// Real-time sync: listen for plugin-originated changes
const { connect: connectSync, onSyncEvent } = useSyncEvents()

onSyncEvent((event) => {
  if (event.type !== 'item_changed') return
  if (event.itemType === 'glove' || event.itemType === 'loadout') {
    showSkinModal.value = false
    fetchLoadoutGloves()
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
          await fetchLoadoutGloves()
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
    if (!isVisible && selectedGlove.value) {
      selectedGlove.value = { ...selectedGlove.value }
    }
  }
)
</script>

<template>
  <div class="p-4">
    <div class="max-w-7xl mx-auto">
      <SkinPageLayout
        :title="t('melee.gloves') as string"
        :user="user"
        :error="error || ''"
        :is-loading="isLoading && (!user || !loadoutStore.selectedLoadoutId)"
        :configured-count="isLoading ? null : configuredCount"
        :total-count="isLoading ? null : totalCount"
      />
      <!-- Glove Type Groups -->
      <div v-if="!error && user && loadoutStore.selectedLoadoutId" class="relative">
        <Transition name="skeleton-fade">
          <!-- Skeleton Loading State -->
          <div
            v-if="isLoading"
            key="skeleton"
            class="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-4"
          >
            <ItemCardSkeleton v-for="i in 8" :key="i" />
          </div>

          <!-- Content when loaded -->
          <div v-else key="content">
            <div class="flex flex-col gap-1.5">
              <span
                id="glove-type-label"
                class="font-mono text-[10px] uppercase tracking-[0.12em] text-text-tertiary"
              >
                {{ t('typeLabel') }}
              </span>
              <Select :model-value="currentGloveType" @update:model-value="onGloveTypeChange">
                <SelectTrigger class="w-72" aria-labelledby="glove-type-label">
                  <span v-if="currentGloveLabel">{{ currentGloveLabel }}</span>
                  <span v-else class="text-muted-foreground">{{ t('selectGloveType') }}</span>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem v-for="opt in gloveOptions" :key="opt.value" :value="opt.value">
                    {{ opt.label }}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <!-- Skins Grid -->
            <div
              ref="gridRef"
              class="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-4 pt-4"
            >
              <GloveTabs
                v-for="(gloveData, gloveName) in groupedGloves"
                :key="gloveName"
                :weapon-data="{
                  weapons: gloveData.weapons as unknown as GloveItemData[],
                  defaultName: gloveData.defaultName,
                  availableTeams: 'both',
                }"
                @weapon-click="
                  (glove: GloveItemData) => handleGloveClick(glove as unknown as IEnhancedGlove)
                "
              />
            </div>
            <!-- No Skins State -->
            <Empty v-if="skins.length === 0" class="mt-4 py-12">
              <EmptyHeader>
                <EmptyMedia>
                  <WeaponSilhouette
                    :src="gloveSilhouette"
                    class="h-16 w-24 text-text-tertiary opacity-60"
                  />
                </EmptyMedia>
                <EmptyTitle class="font-display tracking-[-0.02em]">
                  {{ t('emptyTitle') }}
                </EmptyTitle>
                <EmptyDescription>{{ t('noGloves') }}</EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <Button variant="outline" @click="fetchLoadoutGloves">
                  {{ t('reload') }}
                </Button>
              </EmptyContent>
            </Empty>
          </div>
        </Transition>
      </div>

      <!-- Glove Skin Selection & Customization Modal -->
      <LazyGloveSkinModal
        v-if="user"
        v-model:visible="showSkinModal"
        :user="user as unknown as UserProfile"
        :weapon="selectedGlove"
        :other-team-has-skin="otherTeamHasSkin"
        @select="
          (glove: any, customization: GloveConfiguration) =>
            handleSkinSelect(glove as IEnhancedGlove, customization)
        "
        @auto-save="
          (glove: any, customization: GloveConfiguration) =>
            handleAutoSave(glove as IEnhancedGlove, customization)
        "
        @duplicate="
          (glove: any, customization: GloveConfiguration) =>
            handleGloveDuplicate(glove as IEnhancedGlove, customization)
        "
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
</style>
