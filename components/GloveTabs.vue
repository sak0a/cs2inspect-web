<script setup lang="ts">
// New type system imports
import type {
  GloveItemData,
  GloveConfiguration
} from '~/types'

// Legacy imports for backward compatibility
import type { IEnhancedItem, IEnhancedGlove } from "~/server/utils/interfaces"

import { NTabs, NTabPane, NCard } from 'naive-ui'

/**
 * Props interface for GloveTabs component
 */
interface Props {
  /** Glove data containing categories and gloves */
  weaponData: {
    weapons: IEnhancedGlove[]
    defaultName: string
    availableTeams: string
    [key: string]: any
  }
}

const props = defineProps<Props>()

/**
 * Events interface with enhanced type safety
 */
const emit = defineEmits<{
  (e: 'weaponClick', glove: IEnhancedGlove): void
  (e: 'error', error: string): void
}>()

const { t } = useI18n()

/**
 * Handle default glove click with enhanced error handling
 *
 * @param team - Team number (1 for Terrorist, 2 for Counter-Terrorist)
 */
const handleDefaultWeaponClick = (team: number): void => {
  try {
    // Validate input
    if (!team || (team !== 1 && team !== 2)) {
      throw new Error('Invalid team number provided')
    }

    // Validate glove data
    if (!props.weaponData?.weapons?.[0]) {
      throw new Error('No glove data available')
    }

    const firstGlove = props.weaponData.weapons[0]

    // Create default glove with proper type safety
    const defaultWeapon: IEnhancedGlove = {
      weapon_name: firstGlove.weapon_name,
      weapon_defindex: firstGlove.weapon_defindex,
      name: props.weaponData.defaultName,
      defaultName: props.weaponData.defaultName,
      image: firstGlove.defaultImage,
      defaultImage: firstGlove.defaultImage,
      category: firstGlove.category,
      minFloat: firstGlove.minFloat || 0,
      maxFloat: firstGlove.maxFloat || 1,
      paintIndex: 0,
      availableTeams: firstGlove.availableTeams || 'both',
      rarity: firstGlove.rarity,
      team: team
    }

    console.log("GloveTabs - default glove clicked for team:", team)
    emit('weaponClick', defaultWeapon)
  } catch (error: any) {
    console.error('Error handling default glove click:', error)
    emit('error', error.message || 'Failed to select default glove')
  }
}

/**
 * Handle skin click with error handling
 *
 * @param weapon - Selected glove data
 */
const handleSkinClick = (weapon: IEnhancedGlove): void => {
  try {
    if (!weapon) {
      throw new Error('Invalid glove data provided')
    }

    console.log("GloveTabs - skin clicked:", weapon.name)
    emit('weaponClick', weapon)
  } catch (error: any) {
    console.error('Error handling glove skin click:', error)
    emit('error', error.message || 'Failed to select glove skin')
  }
}
</script>

<template>
  <!-- For gloves that both teams can use -->
  <div v-if="weaponData.availableTeams === 'both'" >
    <NTabs type="line" animated size="small">
      <NTabPane name="ct" :tab="t('teams.counterTerrorists') as string">
        <!-- Default glove if no skin selected -->
        <NCard
            v-if="!weaponData.weapons.some((w: IEnhancedItem) => w.databaseInfo?.team === 2)"
            :style="{
              borderColor: '#313030',
              background: '#242424'
            }"
            class="hover:shadow-lg transition-all cursor-pointer rounded-xl bg-[#242424] glove-card"
            @click="handleDefaultWeaponClick(2)"
        >
          <div class="flex flex-col items-center">
            <img
                :src="weaponData.weapons[0].defaultImage"
                :alt="weaponData.defaultName"
                class="w-full h-32 object-contain mb-2"
                loading="lazy"
            >
            <div class="w-full">
              <p class="text-sm text-white truncate">{{ weaponData.defaultName }}</p>
              <div class="h-1 mt-2" :style="{ background: '#313030' }" />
            </div>
          </div>
        </NCard>
        <!-- CT skins -->
        <NCard
            v-for="weapon in weaponData.weapons.filter((w: IEnhancedItem) => w.databaseInfo?.team === 2)"
            :key="weapon.paintIndex"
            :style="{
              borderColor: weapon.rarity?.color || '#313030',
              background: weapon.rarity?.color ? 'linear-gradient(135deg, #101010, ' +
                hexToRgba(weapon.rarity?.color, '0.15') + ')': '#242424'
            }"
            class="hover:shadow-lg transition-all cursor-pointer rounded-xl bg-[#242424] glove-card"
            @click="handleSkinClick(weapon)"
        >
          <div class="flex flex-col items-center">
            <img
                :src="weapon.image"
                :alt="weapon.name"
                class="w-full h-32 object-contain mb-2"
                loading="lazy"
            >
            <div class="w-full">
              <p class="text-sm text-white truncate">{{ weapon.name }}</p>
              <div class="h-1 mt-2" :style="{ background: weapon.rarity?.color || '#313030' }" />
            </div>
          </div>
        </NCard>
      </NTabPane>

      <NTabPane name="t" :tab="t('teams.terrorists') as string">
        <!-- Default glove if no skin selected -->
        <NCard
            v-if="!weaponData.weapons.some((w: IEnhancedItem) => w.databaseInfo?.team === 1)"
            :style="{
              borderColor: '#313030',
              background: '#242424'
            }"
            class="hover:shadow-lg transition-all cursor-pointer rounded-xl bg-[#242424] glove-card"
            @click="handleDefaultWeaponClick(1)"
        >
          <div class="flex flex-col items-center">
            <img
                :src="weaponData.weapons[0].defaultImage"
                :alt="weaponData.defaultName"
                class="w-full h-32 object-contain mb-2"
                loading="lazy"
            >
            <div class="w-full">
              <p class="text-sm text-white truncate">{{ weaponData.defaultName }}</p>
              <div class="h-1 mt-2" :style="{ background: '#313030' }" />
            </div>
          </div>
        </NCard>
        <!-- T skins -->
        <NCard
            v-for="weapon in weaponData.weapons.filter((w: IEnhancedItem) => w.databaseInfo?.team === 1)"
            :key="weapon.paintIndex"
            :style="{
              borderColor: weapon.rarity?.color || '#313030',
              background: weapon.rarity?.color ? 'linear-gradient(135deg, #101010, ' +
                hexToRgba(weapon.rarity?.color, '0.15') + ')': '#242424'
            }"
            class="hover:shadow-lg transition-all cursor-pointer rounded-xl bg-[#242424] glove-card"
            @click="handleSkinClick(weapon)"
        >
          <div class="flex flex-col items-center">
            <img
                :src="weapon.image"
                :alt="weapon.name"
                class="w-full h-32 object-contain mb-2"
                loading="lazy"
            >
            <div class="w-full">
              <p class="text-sm text-white truncate">{{ weapon.name }}</p>
              <div class="h-1 mt-2" :style="{ background: weapon.rarity?.color || '#313030' }" />
            </div>
          </div>
        </NCard>
      </NTabPane>
    </NTabs>
  </div>

  <!-- For team-specific gloves -->
  <div v-else>
    <NTabs type="line" animated size="small">
      <NTabPane
          :name="weaponData.availableTeams === 'terrorists' ? 't' : 'ct'"
          :tab="weaponData.availableTeams === 'terrorists' ? t('teams.terrorists') as string : t('teams.counterTerrorists') as string"
      >
        <!-- Default glove if no skin selected -->
        <NCard
            v-if="weaponData.weapons.length === 0"
            :style="{
              borderColor: '#313030',
              background: '#242424'
            }"
            class="hover:shadow-lg transition-all cursor-pointer rounded-xl bg-[#242424] glove-card"
            @click="handleDefaultWeaponClick(
              weaponData.availableTeams === 'terrorists' ? 1 : 2)"
        >
          <div class="flex flex-col items-center">
            <img
                :src="weaponData.weapons[0].defaultImage"
                :alt="weaponData.defaultName"
                class="w-full h-32 object-contain mb-2"
                loading="lazy"
            >
            <div class="w-full">
              <p class="text-sm text-white truncate">{{ weaponData.defaultName }}</p>
              <div class="h-1 mt-2" :style="{ background: '#313030' }" />
            </div>
          </div>
        </NCard>
        <!-- Team-specific skins -->
        <NCard
            v-for="weapon in weaponData.weapons"
            :key="weapon.paintIndex"
            :style="{
              borderColor: weapon.rarity?.color || '#313030',
              background: weapon.rarity?.color ? 'linear-gradient(135deg, #101010, ' +
                hexToRgba(weapon.rarity?.color, '0.15') + ')': '#242424'
            }"
            class="hover:shadow-lg transition-all cursor-pointer rounded-xl bg-[#242424] glove-card"
            @click="handleSkinClick(weapon)"
        >
          <div class="flex flex-col items-center">
            <img
                :src="weapon.image"
                :alt="weapon.name"
                class="w-full h-32 object-contain mb-2"
                loading="lazy"
            >
            <div class="w-full">
              <p class="text-sm text-white truncate">{{ weapon.name }}</p>
              <div class="h-1 mt-2" :style="{ background: weapon.rarity?.color || '#313030' }" />
            </div>
          </div>
        </NCard>
      </NTabPane>
    </NTabs>
  </div>
</template>

<style scoped>
/* No animations */
</style>
