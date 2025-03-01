<script setup lang="ts">
import { NTabs, NTabPane, NCard } from 'naive-ui'
import {IEnhancedItem, IMappedDBWeapon} from "~/server/utils/interfaces";

const props = defineProps({
  weaponData: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['weaponClick'])

const handleDefaultWeaponClick = (team: number) => {
  const defaultWeapon = {
    weapon_name: props.weaponData.weapons[0].weapon_name,
    weapon_defindex: props.weaponData.weapons[0].weapon_defindex,
    name: props.weaponData.defaultName,
    defaultName: props.weaponData.defaultName,
    image: props.weaponData.weapons[0].defaultImage,
    defaultImage: props.weaponData.weapons[0].defaultImage,
    category: props.weaponData.weapons[0].category,
    minFloat: props.weaponData.weapons[0].minFloat,
    maxFloat: props.weaponData.weapons[0].maxFloat,
    paintIndex: 0,
    databaseInfo: {
      team: team,
      active: false,
      defindex: 0,
      paintIndex: 0,
      paintWear: 0,
      pattern: 0,
      statTrak: false,
      statTrakCount: 0,
      nameTag: '',
      stickers: [null, null, null, null, null],
      keychain: null,
    } as IMappedDBWeapon
  } as IEnhancedItem
  //console.log("WeaponTabs - default weapon clicked: ", defaultWeapon)
  emit('weaponClick', defaultWeapon)
}

const handleSkinClick = (weapon: IEnhancedItem) => {
  //console.log("WeaponTabs - skin clicked: ", weapon)
  emit('weaponClick', weapon)
}
</script>

<template>
  <!-- For weapons that both teams can use (like AWP) -->
  <div v-if="weaponData.availableTeams === 'both'" >
    <NTabs type="line" animated size="small">
      <NTabPane name="ct" tab="Counter-Terrorists">
        <!-- Default weapon if no skin selected -->
        <NCard
            v-if="!weaponData.weapons.some((w: IEnhancedItem) => w.databaseInfo?.team === 2)"
            :style="{
              borderColor: '#313030',
              background: '#242424'
            }"
            class="hover:shadow-lg transition-all cursor-pointer bg-[#242424]"
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
            class="hover:shadow-lg transition-all cursor-pointer bg-[#242424]"
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

      <NTabPane name="t" tab="Terrorists">
        <!-- Default weapon if no skin selected -->
        <NCard
            v-if="!weaponData.weapons.some((w: IEnhancedItem) => w.databaseInfo?.team === 1)"
            :style="{
              borderColor: '#313030',
              background: '#242424'
            }"
            class="hover:shadow-lg transition-all cursor-pointer bg-[#242424]"
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
            class="hover:shadow-lg transition-all cursor-pointer bg-[#242424]"
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
          :tab="weaponData.availableTeams === 'terrorists' ? 'Terrorists' : 'Counter-Terrorists'"
      >
        <!-- Default weapon if no skin selected -->
        <NCard
            v-if="weaponData.weapons.length === 0"
            :style="{
              borderColor: '#313030',
              background: '#242424'
            }"
            class="hover:shadow-lg transition-all cursor-pointer bg-[#242424] "
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
            class="hover:shadow-lg transition-all cursor-pointer bg-[#242424]"
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