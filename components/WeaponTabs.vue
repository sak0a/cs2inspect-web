<script setup lang="ts">
// New type system imports
import type {
  WeaponItemData,
  WeaponConfiguration,
  UserProfile
} from '~/types'

// Modern type imports
import type { DBWeapon } from "~/types"

import { NTabs, NTabPane, NCard } from 'naive-ui'
import { ref, onMounted, computed } from 'vue'

/**
 * Props interface for WeaponTabs component
 */
interface Props {
  /** Weapon data containing categories and weapons */
  weaponData: {
    weapons: WeaponItemData[]
    defaultName: string
    [key: string]: any
  }
}

const props = defineProps<Props>()

/**
 * Events interface with enhanced type safety
 */
const emit = defineEmits<{
  (e: 'weaponClick', weapon: WeaponItemData): void
  (e: 'error', error: string): void
}>()


// Persist last selected team tab in a cookie (client-side)
const currentTeamTab = ref<'ct' | 't'>('ct')
const cookieName = computed(() => {
  const first = props.weaponData?.weapons?.[0]
  const id = (first?.weapon_defindex ?? first?.weapon_name ?? props.weaponData?.defaultName ?? 'unknown') as string | number
  return `lastTeamTab_weapon_${id}`
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
 * Handle default weapon click with enhanced error handling
 *
 * @param team - Team number (1 for Terrorist, 2 for Counter-Terrorist)
 */
const handleDefaultWeaponClick = (team: number): void => {
  try {
    // Validate input
    if (!team || (team !== 1 && team !== 2)) {
      throw new Error('Invalid team number provided')
    }

    // Validate weapon data
    if (!props.weaponData?.weapons?.[0]) {
      throw new Error('No weapon data available')
    }

    const firstWeapon = props.weaponData.weapons[0]

    // Create default weapon with proper type safety and weapon_name
    const defaultWeapon: WeaponItemData = {
      type: 'weapon',
      id: `default-${firstWeapon.id || 'weapon'}`,
      name: props.weaponData.defaultName,
      defaultName: props.weaponData.defaultName,
      image: firstWeapon.defaultImage,
      defaultImage: firstWeapon.defaultImage,
      itemName: firstWeapon.itemName,
      category: firstWeapon.category,
      minFloat: firstWeapon.minFloat || 0,
      maxFloat: firstWeapon.maxFloat || 1,
      availableTeams: firstWeapon.availableTeams || 'both',
      rarity: firstWeapon.rarity,
      // Add the missing weapon_name field from the first weapon
      weapon_name: firstWeapon.weapon_name,
      weapon_defindex: firstWeapon.weapon_defindex || firstWeapon.databaseInfo?.defindex || 0,
      databaseInfo: {
        id: `default-db-${firstWeapon.id || 'weapon'}`,
        steamid: '',
        loadoutid: '',
        active: false,
        team: team,
        defindex: firstWeapon.databaseInfo?.defindex || 0,
        paintindex: 0,
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
        updated_at: new Date().toISOString()
      } as DBWeapon
    }

    console.log("WeaponTabs - default weapon clicked for team:", team)
    emit('weaponClick', defaultWeapon)
  } catch (error: any) {
    console.error('Error handling default weapon click:', error)
    emit('error', error.message || 'Failed to select default weapon')
  }
}

/**
 * Handle skin click with error handling
 *
 * @param weapon - Selected weapon data
 */
const handleSkinClick = (weapon: IEnhancedWeapon): void => {
  try {
    if (!weapon) {
      throw new Error('Invalid weapon data provided')
    }

    console.log("WeaponTabs - skin clicked:", weapon.name)
    emit('weaponClick', weapon)
  } catch (error: any) {
    console.error('Error handling skin click:', error)
    emit('error', error.message || 'Failed to select weapon skin')
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
            v-if="!weaponData.weapons.some((w: IEnhancedWeapon) => w.databaseInfo?.team === 2)"
            :style="{
              borderColor: '#313030',
              background: '#242424'
            }"
            class="hover:shadow-lg transition-all cursor-pointer rounded-xl bg-[#242424] weapon-card"
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
            v-for="weapon in weaponData.weapons.filter((w: IEnhancedWeapon) => w.databaseInfo?.team === 2)"
            :key="weapon.paintIndex"
            :style="{
              borderColor: weapon.rarity?.color || '#313030',
              background: weapon.rarity?.color ? 'linear-gradient(135deg, #101010, ' +
                hexToRgba(weapon.rarity?.color, '0.15') + ')': '#242424'
            }"
            class="hover:shadow-lg transition-all cursor-pointer rounded-xl bg-[#242424] weapon-card"
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
            v-if="!weaponData.weapons.some((w: IEnhancedWeapon) => w.databaseInfo?.team === 1)"
            :style="{
              borderColor: '#313030',
              background: '#242424'
            }"
            class="hover:shadow-lg transition-all cursor-pointer rounded-xl bg-[#242424] weapon-card"
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
            v-for="weapon in weaponData.weapons.filter((w: IEnhancedWeapon) => w.databaseInfo?.team === 1)"
            :key="weapon.paintIndex"
            :style="{
              borderColor: weapon.rarity?.color || '#313030',
              background: weapon.rarity?.color ? 'linear-gradient(135deg, #101010, ' +
                hexToRgba(weapon.rarity?.color, '0.15') + ')': '#242424'
            }"
            class="hover:shadow-lg transition-all cursor-pointer rounded-xl bg-[#242424] weapon-card"
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
            class="hover:shadow-lg transition-all cursor-pointer rounded-xl bg-[#242424] weapon-card"
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
            class="hover:shadow-lg transition-all cursor-pointer rounded-xl bg-[#242424] weapon-card"
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