<script setup lang="ts">
import type { KnifeItemData, DBKnife } from '~/types'
import { toSteamId, toLoadoutId, toDefindex, toPaintIndex } from '~/types/core/common'

interface Props {
  weaponData: {
    weapons: KnifeItemData[]
    defaultName: string
    availableTeams?: string
    [key: string]: unknown
  }
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'weaponClick', knife: KnifeItemData): void
  (e: 'error', error: string): void
}>()

const { teamSide, teamNumber } = useTeamToggle()

const isVisible = computed(() => {
  const avail = props.weaponData.availableTeams
  if (!avail || avail === 'both') return true
  if (avail === 'terrorists') return teamSide.value === 't'
  if (avail === 'counter-terrorists') return teamSide.value === 'ct'
  return true
})

const filteredWeapons = computed(() =>
  props.weaponData.weapons.filter((w: KnifeItemData) => w.databaseInfo?.team === teamNumber.value)
)

const hasCurrentTeamSkin = computed(() => filteredWeapons.value.length > 0)

const handleDefaultWeaponClick = (team: number): void => {
  try {
    if (!team || (team !== 1 && team !== 2)) {
      throw new Error('Invalid team number provided')
    }
    if (!props.weaponData?.weapons?.[0]) {
      throw new Error('No knife data available')
    }

    const firstKnife = props.weaponData.weapons[0]

    const defaultWeapon: KnifeItemData = {
      type: 'knife',
      id: `default-${firstKnife.id || 'knife'}`,
      name: props.weaponData.defaultName,
      defaultName: props.weaponData.defaultName,
      image: firstKnife.defaultImage,
      defaultImage: firstKnife.defaultImage,
      itemName: firstKnife.itemName,
      category: firstKnife.category,
      minFloat: firstKnife.minFloat || 0,
      maxFloat: firstKnife.maxFloat || 1,
      availableTeams: firstKnife.availableTeams || 'both',
      rarity: firstKnife.rarity,
      weapon_name: firstKnife.weapon_name,
      weapon_defindex: firstKnife.weapon_defindex || firstKnife.databaseInfo?.defindex || 0,
      databaseInfo: {
        id: `default-db-${firstKnife.id || 'knife'}`,
        steamid: toSteamId(''),
        loadoutid: toLoadoutId(0),
        active: false,
        team: team,
        defindex: firstKnife.databaseInfo?.defindex || toDefindex(0),
        paintindex: toPaintIndex(0),
        paintseed: '0',
        paintwear: '0.01',
        stattrak_enabled: false,
        stattrak_count: 0,
        nametag: '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as DBKnife,
    }

    emit('weaponClick', defaultWeapon)
  } catch (error: unknown) {
    console.error('Error handling default knife click:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to select default knife'
    emit('error', errorMessage)
  }
}

const handleSkinClick = (weapon: KnifeItemData): void => {
  try {
    if (!weapon) {
      throw new Error('Invalid knife data provided')
    }
    emit('weaponClick', weapon)
  } catch (error: unknown) {
    console.error('Error handling knife skin click:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to select knife skin'
    emit('error', errorMessage)
  }
}
</script>

<template>
  <div v-if="isVisible">
    <!-- Default knife if no skin for current team -->
    <div
      v-if="!hasCurrentTeamSkin"
      :style="{
        borderColor: '#313030',
        background: 'linear-gradient(135deg, rgb(16, 16, 16), rgba(49, 49, 49, 0.15))',
      }"
      class="border px-6 py-5 hover:shadow-lg transition-all cursor-pointer rounded-xl bg-[var(--card-bg)] weapon-card"
      @click="handleDefaultWeaponClick(teamNumber)"
    >
      <div class="flex flex-col items-center">
        <img
          :src="weaponData.weapons[0]?.defaultImage"
          :alt="weaponData.defaultName"
          class="w-full h-32 object-contain mb-2"
          loading="lazy"
        />
        <div class="w-full">
          <p class="text-sm text-white truncate">{{ weaponData.defaultName }}</p>
          <div class="h-1 mt-2" :style="{ background: '#313030' }" />
        </div>
      </div>
    </div>
    <!-- Skins for the current team -->
    <div
      v-for="weapon in filteredWeapons"
      :key="`${weapon.id}-${weapon.databaseInfo?.paintindex || 0}`"
      :style="{
        borderColor: weapon.rarity?.color || '#313030',
        background: weapon.rarity?.color
          ? 'linear-gradient(135deg, #101010, ' + hexToRgba(weapon.rarity?.color, '0.15') + ')'
          : 'linear-gradient(135deg, rgb(16, 16, 16), rgba(49, 49, 49, 0.15))',
      }"
      class="border px-6 py-5 hover:shadow-lg transition-all cursor-pointer rounded-xl bg-[var(--card-bg)] knife-card"
      @click="handleSkinClick(weapon)"
    >
      <div class="flex flex-col items-center">
        <img
          :src="weapon.image"
          :alt="weapon.name"
          class="w-full h-32 object-contain mb-2"
          loading="lazy"
        />
        <div class="w-full">
          <p class="text-sm text-white truncate">{{ weapon.name }}</p>
          <div class="h-1 mt-2" :style="{ background: weapon.rarity?.color || '#313030' }" />
        </div>
      </div>
    </div>
  </div>
</template>
