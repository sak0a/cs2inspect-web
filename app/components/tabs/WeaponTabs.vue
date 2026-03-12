<script setup lang="ts">
import type { DBWeapon, WeaponItemData } from '~/types'
import { toSteamId, toLoadoutId, toDefindex, toPaintIndex } from '~/types/core/common'

interface Props {
  weaponData: {
    weapons: WeaponItemData[]
    defaultName: string
    availableTeams?: string
    [key: string]: unknown
  }
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'weaponClick', weapon: WeaponItemData): void
  (e: 'error', error: string): void
}>()

const { teamNumber } = useTeamToggle()

// Filter weapons for the currently selected team
const filteredWeapons = computed(() =>
  props.weaponData.weapons.filter((w: WeaponItemData) => w.databaseInfo?.team === teamNumber.value)
)

// Check if there's any skin for the current team
const hasCurrentTeamSkin = computed(() => filteredWeapons.value.length > 0)

const handleDefaultWeaponClick = (team: number): void => {
  try {
    if (!team || (team !== 1 && team !== 2)) {
      throw new Error('Invalid team number provided')
    }
    if (!props.weaponData?.weapons?.[0]) {
      throw new Error('No weapon data available')
    }

    const firstWeapon = props.weaponData.weapons[0]

    const defaultWeapon: WeaponItemData = {
      type: 'weapon',
      id: `default-${firstWeapon.id || 'weapon'}`,
      name: `${props.weaponData.defaultName} | Default`,
      defaultName: props.weaponData.defaultName,
      image: firstWeapon.defaultImage,
      defaultImage: firstWeapon.defaultImage,
      itemName: firstWeapon.itemName,
      category: firstWeapon.category,
      minFloat: firstWeapon.minFloat || 0,
      maxFloat: firstWeapon.maxFloat || 1,
      availableTeams: firstWeapon.availableTeams || 'both',
      rarity: { id: 'default', name: 'Default', color: '#B0C3D9' },
      weapon_name: firstWeapon.weapon_name,
      weapon_defindex: firstWeapon.weapon_defindex || firstWeapon.databaseInfo?.defindex || 0,
      databaseInfo: {
        id: `default-db-${firstWeapon.id || 'weapon'}`,
        steamid: toSteamId(''),
        loadoutid: toLoadoutId(0),
        active: false,
        team: team,
        defindex: firstWeapon.databaseInfo?.defindex || toDefindex(0),
        paintindex: toPaintIndex(0),
        paintseed: '0',
        paintwear: '0.01',
        stattrak_enabled: false,
        stattrak_count: 0,
        nametag: '',
        sticker_0: '',
        sticker_1: '',
        sticker_2: '',
        sticker_3: '',
        sticker_4: '',
        keychain: '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as DBWeapon,
    }

    emit('weaponClick', defaultWeapon)
  } catch (error: unknown) {
    console.error('Error handling default weapon click:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to select default weapon'
    emit('error', errorMessage)
  }
}

const handleSkinClick = (weapon: WeaponItemData): void => {
  try {
    if (!weapon) {
      throw new Error('Invalid weapon data provided')
    }
    emit('weaponClick', weapon)
  } catch (error: unknown) {
    console.error('Error handling skin click:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to select weapon skin'
    emit('error', errorMessage)
  }
}
</script>

<template>
  <div data-tutorial="weapon-card">
    <!-- Default weapon if no skin for current team -->
    <NCard
      v-if="!hasCurrentTeamSkin"
      :style="{
        borderColor: '#B0C3D9',
        background: 'linear-gradient(135deg, #101010, ' + hexToRgba('#B0C3D9', '0.15') + ')',
      }"
      class="hover:shadow-lg transition-all cursor-pointer rounded-xl bg-[var(--card-bg)] weapon-card"
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
          <p class="text-sm text-white truncate">{{ weaponData.defaultName }} | Default</p>
          <div class="h-1 mt-2" :style="{ background: '#B0C3D9' }" />
        </div>
      </div>
    </NCard>
    <!-- Skins for the current team -->
    <NCard
      v-for="weapon in filteredWeapons"
      :key="weapon.paintindex"
      :style="{
        borderColor: weapon.rarity?.color || '#313030',
        background: weapon.rarity?.color
          ? 'linear-gradient(135deg, #101010, ' + hexToRgba(weapon.rarity?.color, '0.15') + ')'
          : '#242424',
      }"
      class="hover:shadow-lg transition-all cursor-pointer rounded-xl bg-[var(--card-bg)] weapon-card"
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
    </NCard>
  </div>
</template>
