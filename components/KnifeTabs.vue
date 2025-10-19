<script setup lang="ts">
// New type system imports
import type {
  KnifeItemData,
  KnifeConfiguration
} from '~/types'

// Modern type imports
import type { DBKnife } from "~/types"

import { NTabs, NTabPane, NCard } from 'naive-ui'
import { ref, onMounted, computed } from 'vue'

/**
 * Props interface for KnifeTabs component
 */
interface Props {
  /** Knife data containing categories and knives */
  weaponData: {
    weapons: KnifeItemData[]
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
  (e: 'weaponClick', knife: KnifeItemData): void
  (e: 'error', error: string): void
}>()


// Persist last selected team tab in a cookie (client-side)
const currentTeamTab = ref<'ct' | 't'>('ct')
const cookieName = computed(() => {
  const first = props.weaponData?.weapons?.[0]
  const id = (first?.weapon_defindex ?? first?.weapon_name ?? props.weaponData?.defaultName ?? 'unknown') as string | number
  return `lastTeamTab_knife_${id}`
})

function setCookie(name: string, val: string) {
  try {
    document.cookie = `${name}=${encodeURIComponent(val)}; path=/; max-age=15552000`
  } catch (e) {}
}
function getCookie(name: string): string | null {
  try {
    const part = document.cookie.split('; ').find(row => row.startsWith(name + '='))
    return part ? decodeURIComponent(part.split('=')[1]) : null
  } catch (e) { return null }
}

function setTeamCookie(val: 'ct' | 't') { setCookie(cookieName.value, val) }
function getTeamCookie(): 'ct' | 't' | null {
  const v = getCookie(cookieName.value)
  return v === 'ct' || v === 't' ? v : null
}

onMounted(() => {
  const v = getTeamCookie()
  if (v) currentTeamTab.value = v
})

const { t } = useI18n()

/**
 * Handle default knife click with enhanced error handling
 *
 * @param team - Team number (1 for Terrorist, 2 for Counter-Terrorist)
 */
const handleDefaultWeaponClick = (team: number): void => {
  try {
    // Validate input
    if (!team || (team !== 1 && team !== 2)) {
      throw new Error('Invalid team number provided')
    }

    // Validate knife data
    if (!props.weaponData?.weapons?.[0]) {
      throw new Error('No knife data available')
    }

    const firstKnife = props.weaponData.weapons[0]

    // Create default knife with proper type safety and weapon_name
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
      // Add the missing weapon_name field from the first knife
      weapon_name: firstKnife.weapon_name,
      weapon_defindex: firstKnife.weapon_defindex || firstKnife.databaseInfo?.defindex || 0,
      databaseInfo: {
        id: `default-db-${firstKnife.id || 'knife'}`,
        steamid: '',
        loadoutid: '',
        active: false,
        team: team,
        defindex: firstKnife.databaseInfo?.defindex || 0,
        paintindex: 0,
        paintseed: '0',
        paintwear: '0.01',
        stattrak_enabled: false,
        stattrak_count: 0,
        nametag: '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      } as DBKnife
    }

    console.log("KnifeTabs - default knife clicked for team:", team)
    emit('weaponClick', defaultWeapon)
  } catch (error: any) {
    console.error('Error handling default knife click:', error)
    emit('error', error.message || 'Failed to select default knife')
  }
}

/**
 * Handle skin click with error handling
 *
 * @param weapon - Selected knife data
 */
const handleSkinClick = (weapon: IEnhancedKnife): void => {
  try {
    if (!weapon) {
      throw new Error('Invalid knife data provided')
    }

    console.log("KnifeTabs - skin clicked:", weapon.name)
    emit('weaponClick', weapon)
  } catch (error: any) {
    console.error('Error handling knife skin click:', error)
    emit('error', error.message || 'Failed to select knife skin')
  }
}
</script>

<template>
  <!-- For weapons that both teams can use (like AWP) -->
  <div v-if="weaponData.availableTeams === 'both'" >
    <NTabs v-model:value="currentTeamTab" @update:value="(v) => setTeamCookie(v as 'ct' | 't')" type="line" animated size="small">
      <NTabPane name="ct" :tab="t('teams.counterTerrorists') as string">
        <!-- Default weapon if no skin selected -->
        <NCard
            v-if="!weaponData.weapons.some((w: IEnhancedItem) => w.databaseInfo?.team === 2)"
            :style="{
              borderColor: '#313030',
              background: '#242424'
            }"
            class="hover:shadow-lg transition-all cursor-pointer rounded-xl bg-[#242424] knife-card"
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
            v-for="weapon in weaponData.weapons.filter((w: KnifeItemData) => w.databaseInfo?.team === 2)"
            :key="`${weapon.id}-${weapon.databaseInfo?.paintindex || 0}`"
            :style="{
              borderColor: weapon.rarity?.color || '#313030',
              background: weapon.rarity?.color ? 'linear-gradient(135deg, #101010, ' +
                hexToRgba(weapon.rarity?.color, '0.15') + ')': '#242424'
            }"
            class="hover:shadow-lg transition-all cursor-pointer rounded-xl bg-[#242424] knife-card"
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
        <!-- Default weapon if no skin selected -->
        <NCard
            v-if="!weaponData.weapons.some((w: IEnhancedItem) => w.databaseInfo?.team === 1)"
            :style="{
              borderColor: '#313030',
              background: '#242424'
            }"
            class="hover:shadow-lg transition-all cursor-pointer rounded-xl bg-[#242424] knife-card"
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
            v-for="weapon in weaponData.weapons.filter((w: KnifeItemData) => w.databaseInfo?.team === 1)"
            :key="`${weapon.id}-${weapon.databaseInfo?.paintindex || 0}`"
            :style="{
              borderColor: weapon.rarity?.color || '#313030',
              background: weapon.rarity?.color ? 'linear-gradient(135deg, #101010, ' +
                hexToRgba(weapon.rarity?.color, '0.15') + ')': '#242424'
            }"
            class="hover:shadow-lg transition-all cursor-pointer rounded-xl bg-[#242424] knife-card"
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

  <!-- For team-specific weapons (AK-47, M4A4) -->
  <div v-else>
    <NTabs type="line" animated size="small">
      <NTabPane
          :name="weaponData.availableTeams === 'terrorists' ? 't' : 'ct'"
          :tab="weaponData.availableTeams === 'terrorists' ? t('teams.terrorists') as string : t('teams.counterTerrorists') as string"
      >
        <!-- Default weapon if no skin selected -->
        <NCard
            v-if="weaponData.weapons.length === 0"
            :style="{
              borderColor: '#313030',
              background: '#242424'
            }"
            class="hover:shadow-lg transition-all cursor-pointer rounded-xl bg-[#242424] knife-card"
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
            :key="`${weapon.id}-${weapon.databaseInfo?.paintindex || 0}`"
            :style="{
              borderColor: weapon.rarity?.color || '#313030',
              background: weapon.rarity?.color ? 'linear-gradient(135deg, #101010, ' +
                hexToRgba(weapon.rarity?.color, '0.15') + ')': '#242424'
            }"
            class="hover:shadow-lg transition-all cursor-pointer rounded-xl bg-[#242424] knife-card"
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