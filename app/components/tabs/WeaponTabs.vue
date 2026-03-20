<script setup lang="ts">
import type { DBWeapon, WeaponItemData } from '~/types'
import { toSteamId, toLoadoutId, toDefindex, toPaintIndex } from '~/types/core/common'
import {
  LucideEllipsisVertical,
  LucideLink,
  LucideEye,
  LucideEyeOff,
  LucideRotateCcw,
  LucideImport,
} from 'lucide-vue-next'

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
  (e: 'quick-action', payload: { action: 'generate' | 'import' | 'toggle' | 'reset'; weapon: WeaponItemData }): void
  (e: 'error', error: string): void
}>()

const { teamNumber } = useTeamToggle()

// Filter weapons for the currently selected team
const filteredWeapons = computed(() =>
  props.weaponData.weapons.filter((w: WeaponItemData) => w.databaseInfo?.team === teamNumber.value)
)

// Check if there's any skin for the current team
const hasCurrentTeamSkin = computed(() => filteredWeapons.value.length > 0)

const isVanillaSkin = (weapon: WeaponItemData): boolean => {
  return (
    weapon.databaseInfo !== undefined &&
    (weapon.databaseInfo.paintindex === 0 || weapon.paintindex === 0)
  )
}

const getWeaponLabel = (weapon: WeaponItemData): string => {
  if (isVanillaSkin(weapon)) {
    return `${weapon.defaultName} | Vanilla`
  }
  return weapon.name
}

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

const handleQuickAction = (key: string, weapon: WeaponItemData) => {
  const action = key as 'generate' | 'import' | 'toggle' | 'reset'
  emit('quick-action', { action, weapon })
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
    <!-- State 1: Not configured — no DB entry for this weapon/team -->
    <NCard
      v-if="!hasCurrentTeamSkin"
      class="hover:shadow-lg cursor-pointer rounded-xl weapon-card weapon-card--unconfigured"
      tabindex="0"
      role="button"
      :aria-label="`${weaponData.defaultName} — not configured, click to configure`"
      @click="handleDefaultWeaponClick(teamNumber)"
      @keydown.enter.space.prevent="handleDefaultWeaponClick(teamNumber)"
    >
      <div class="flex flex-col items-center">
        <img
          :src="weaponData.weapons[0]?.defaultImage"
          :alt="weaponData.defaultName"
          class="w-full h-32 object-contain mb-2 opacity-40"
          loading="lazy"
        />
        <div class="w-full">
          <p class="text-sm text-[var(--text-tertiary)] truncate">
            {{ weaponData.defaultName }}
            <span class="text-xs opacity-60">(Not Configured)</span>
          </p>
          <div class="h-1 mt-2 bg-[var(--border-subtle)]" />
        </div>
      </div>
    </NCard>

    <!-- State 2 & 3: DB entry exists — vanilla skin or custom skin, active or inactive -->
    <NCard
      v-for="weapon in filteredWeapons"
      :key="weapon.paintindex"
      :style="{
        borderColor: weapon.rarity?.color || '#313030',
        background: weapon.rarity?.color
          ? 'linear-gradient(135deg, #101010, ' + hexToRgba(weapon.rarity?.color, '0.15') + ')'
          : '#242424',
      }"
      class="hover:shadow-lg cursor-pointer rounded-xl bg-[var(--card-bg)] weapon-card"
      :class="{ 'weapon-card--inactive': !weapon.databaseInfo?.active }"
      tabindex="0"
      role="button"
      :aria-label="`${getWeaponLabel(weapon)}${!weapon.databaseInfo?.active ? ', inactive' : ''}`"
      @click="handleSkinClick(weapon)"
      @keydown.enter.space.prevent="handleSkinClick(weapon)"
    >
      <div class="flex flex-col items-center">
        <div class="relative w-full">
          <img
            :src="weapon.image"
            :alt="weapon.name"
            class="w-full h-32 object-contain mb-2"
            loading="lazy"
          />

          <!-- Three-dots dropdown — only for configured cards -->
          <div
            class="absolute -top-2 -right-2 z-10"
            @click.stop
            @keydown.stop
          >
            <SDropdown
              trigger="click"
              placement="bottom-end"
              size="sm"
              variant="glass"
              @select="(key: string) => handleQuickAction(key, weapon)"
            >
              <template #trigger>
                <button
                  class="dropdown-trigger"
                  tabindex="0"
                  :aria-label="`Actions for ${getWeaponLabel(weapon)}`"
                >
                  <LucideEllipsisVertical :size="16" />
                </button>
              </template>
              <SDropdownItem
                item-key="generate"
                label="Generate Inspect Link"
                :icon="LucideLink"
                :disabled="weapon.databaseInfo?.paintindex === 0"
              />
              <SDropdownItem
                item-key="toggle"
                :label="weapon.databaseInfo?.active ? 'Deactivate' : 'Activate'"
                :icon="weapon.databaseInfo?.active ? LucideEyeOff : LucideEye"
              />
              <SDropdownItem
                item-key="reset"
                label="Reset"
                :icon="LucideRotateCcw"
                danger
              />
              <SDropdownItem
                item-key="import"
                label="Import From Link"
                :icon="LucideImport"
              />
            </SDropdown>
          </div>

          <!-- Vanilla badge — keep, but only show when active -->
          <span
            v-if="isVanillaSkin(weapon) && weapon.databaseInfo?.active"
            class="weapon-badge weapon-badge--vanilla"
            aria-hidden="true"
          >
            Vanilla
          </span>
        </div>

        <div class="w-full">
          <p class="text-sm truncate text-white">
            {{ getWeaponLabel(weapon) }}
          </p>
          <div
            class="h-1 mt-2"
            :style="{ background: weapon.rarity?.color || '#313030' }"
          />
        </div>
      </div>
    </NCard>
  </div>
</template>

<style scoped>
.weapon-card--unconfigured {
  border: 1px dashed var(--border-subtle) !important;
  background: var(--bg-dark) !important;
  transition:
    border-color 150ms ease,
    box-shadow 150ms ease;
}

.weapon-card--unconfigured:hover {
  border-color: var(--text-tertiary) !important;
}

.weapon-card {
  transition:
    box-shadow 150ms ease,
    transform 150ms ease,
    filter 150ms ease;
}

.weapon-card:hover {
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
}

.weapon-card:active {
  transform: scale(0.98);
}

.weapon-card:focus-visible {
  outline: 2px solid var(--primary-color);
  outline-offset: 2px;
}

/* Inactive: dashed border signals "configured but not active" */
.weapon-card--inactive {
  border-style: dashed !important;
  opacity: 0.65;
}

.weapon-card--inactive:hover {
  opacity: 0.9;
}

/* Vanilla badge */
.weapon-badge {
  position: absolute;
  top: 6px;
  right: 0;
  padding: 2px 8px;
  border-radius: 999px 0 0 999px;
  font-size: 10px;
  font-weight: 600;
  line-height: 1.4;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.weapon-badge--vanilla {
  background: rgba(176, 195, 217, 0.18);
  color: #b0c3d9;
  border: 1px solid rgba(176, 195, 217, 0.25);
  border-right: none;
}

.dropdown-trigger {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.5);
  color: var(--text-tertiary);
  cursor: pointer;
  transition: color 150ms ease, background 150ms ease;
  border: none;
  padding: 0;
}

.dropdown-trigger:hover {
  color: #fff;
  background: rgba(0, 0, 0, 0.7);
}

.dropdown-trigger:focus-visible {
  outline: 2px solid var(--primary-color);
  outline-offset: 2px;
}

@media (prefers-reduced-motion: reduce) {
  .weapon-card,
  .weapon-card--unconfigured {
    transition: none;
  }

  .weapon-card:active {
    transform: none;
  }
}
</style>