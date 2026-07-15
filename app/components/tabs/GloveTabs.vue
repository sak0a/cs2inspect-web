<script setup lang="ts">
import type { GloveItemData, DBGlove } from '~/types'
import { toSteamId, toLoadoutId, toDefindex, toPaintIndex } from '~/types/core/common'

interface Props {
  weaponData: {
    weapons: GloveItemData[]
    defaultName: string
    availableTeams?: string
    [key: string]: unknown
  }
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'weaponClick', glove: GloveItemData): void
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
  props.weaponData.weapons.filter((w: GloveItemData) => w.databaseInfo?.team === teamNumber.value)
)

const hasCurrentTeamSkin = computed(() => filteredWeapons.value.length > 0)

const isVanillaSkin = (weapon: GloveItemData): boolean => {
  return weapon.databaseInfo !== undefined && weapon.databaseInfo.paintindex === 0
}

/** Split "★ Gloves | Skin" into ItemCard's name / muted subName pair. */
const getDisplayName = (weapon: GloveItemData): { name: string; sub?: string } => {
  const full = weapon.name || weapon.defaultName
  const idx = full.indexOf(' | ')
  if (idx === -1) return { name: full }
  return { name: full.slice(0, idx), sub: full.slice(idx + 3) }
}

/** Wear readout — only meaningful when a paint is applied (not default). */
const getFloatValue = (weapon: GloveItemData): string | null => {
  if (isVanillaSkin(weapon)) return null
  return weapon.databaseInfo?.paintwear ?? null
}

const handleDefaultWeaponClick = (team: number): void => {
  try {
    if (!team || (team !== 1 && team !== 2)) {
      throw new Error('Invalid team number provided')
    }
    if (!props.weaponData?.weapons?.[0]) {
      throw new Error('No glove data available')
    }

    const firstGlove = props.weaponData.weapons[0]

    const defaultWeapon: GloveItemData = {
      type: 'glove',
      id: `default-${firstGlove.id || 'glove'}`,
      name: props.weaponData.defaultName,
      defaultName: props.weaponData.defaultName,
      image: firstGlove.defaultImage,
      defaultImage: firstGlove.defaultImage,
      itemName: firstGlove.itemName,
      category: firstGlove.category,
      minFloat: firstGlove.minFloat || 0,
      maxFloat: firstGlove.maxFloat || 1,
      availableTeams: firstGlove.availableTeams || 'both',
      rarity: firstGlove.rarity,
      weapon_name: firstGlove.weapon_name,
      weapon_defindex: firstGlove.weapon_defindex || firstGlove.databaseInfo?.defindex || 0,
      databaseInfo: {
        id: `default-db-${firstGlove.id || 'glove'}`,
        steamid: toSteamId(''),
        loadoutid: toLoadoutId(0),
        active: false,
        team: team,
        defindex: firstGlove.databaseInfo?.defindex || toDefindex(0),
        paintindex: toPaintIndex(0),
        paintseed: '0',
        paintwear: '0.01',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as DBGlove,
    }

    emit('weaponClick', defaultWeapon)
  } catch (error: unknown) {
    console.error('Error handling default glove click:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to select default glove'
    emit('error', errorMessage)
  }
}

const handleSkinClick = (weapon: GloveItemData): void => {
  try {
    if (!weapon) {
      throw new Error('Invalid glove data provided')
    }
    emit('weaponClick', weapon)
  } catch (error: unknown) {
    console.error('Error handling glove skin click:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to select glove skin'
    emit('error', errorMessage)
  }
}
</script>

<template>
  <div v-if="isVisible">
    <!-- Default glove if no skin for current team -->
    <ItemCard
      v-if="!hasCurrentTeamSkin"
      class="glove-card"
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
      :key="weapon.paintindex"
      class="glove-card"
      :name="getDisplayName(weapon).name"
      :sub-name="getDisplayName(weapon).sub"
      :image-url="weapon.image"
      :image-alt="weapon.name"
      :rarity-color="weapon.rarity?.color"
      :rarity-label="weapon.rarity?.name"
      :state="weapon.databaseInfo?.active ? 'normal' : 'inactive'"
      :float-value="getFloatValue(weapon)"
      :aria-label="`${weapon.name}${!weapon.databaseInfo?.active ? ', inactive' : ''}`"
      @click="handleSkinClick(weapon)"
    />
  </div>
</template>
