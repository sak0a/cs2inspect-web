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

const isVanillaSkin = (weapon: KnifeItemData): boolean => {
  return weapon.databaseInfo !== undefined && weapon.databaseInfo.paintindex === 0
}

/** Split "★ Knife | Skin" into ItemCard's name / muted subName pair. */
const getDisplayName = (weapon: KnifeItemData): { name: string; sub?: string } => {
  const full = weapon.name || weapon.defaultName
  const idx = full.indexOf(' | ')
  if (idx === -1) return { name: full }
  return { name: full.slice(0, idx), sub: full.slice(idx + 3) }
}

/** Wear readout — only meaningful when a paint is applied (not vanilla). */
const getFloatValue = (weapon: KnifeItemData): string | null => {
  if (isVanillaSkin(weapon)) return null
  return weapon.databaseInfo?.paintwear ?? null
}

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
    <ItemCard
      v-if="!hasCurrentTeamSkin"
      class="weapon-card"
      :name="weaponData.defaultName"
      :image-url="weaponData.weapons[0]?.defaultImage"
      :image-alt="weaponData.defaultName"
      state="unconfigured"
      :aria-label="`${weaponData.defaultName} — not configured, click to configure`"
      @click="handleDefaultWeaponClick(teamNumber)"
    />
    <!-- Skins for the current team -->
    <ItemCard
      v-for="weapon in filteredWeapons"
      :key="`${weapon.id}-${weapon.databaseInfo?.paintindex || 0}`"
      class="knife-card"
      :name="getDisplayName(weapon).name"
      :sub-name="getDisplayName(weapon).sub"
      :image-url="weapon.image"
      :image-alt="weapon.name"
      :rarity-color="weapon.rarity?.color"
      :rarity-label="weapon.rarity?.name"
      :state="weapon.databaseInfo?.active ? 'normal' : 'inactive'"
      :stat-trak="weapon.databaseInfo?.stattrak_enabled === true"
      :float-value="getFloatValue(weapon)"
      :aria-label="`${weapon.name}${!weapon.databaseInfo?.active ? ', inactive' : ''}`"
      @click="handleSkinClick(weapon)"
    />
  </div>
</template>
